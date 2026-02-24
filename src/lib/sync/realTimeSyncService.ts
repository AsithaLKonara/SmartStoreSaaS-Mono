import { prisma } from '../prisma';
import { EventEmitter } from 'events';
import type { WebSocket } from 'ws';
import { logger } from '../logger';

// Conditional imports for server-side only
let WebSocketServer: any;
let Redis: any;

if (typeof window === 'undefined') {
  try {
    const ws = require('ws');
    WebSocketServer = ws.WebSocketServer;
    const ioredis = require('ioredis');
    Redis = ioredis.Redis || ioredis.default;
  } catch (e) {
    // Fallback if modules not available
    logger.warn({
      message: 'WebSocket or Redis not available',
      error: e instanceof Error ? e : new Error(String(e)),
      context: { service: 'RealTimeSyncService', operation: 'conditionalImport' }
    });
  }
}

export interface SyncEvent {
  id: string;
  type: 'product' | 'order' | 'customer' | 'inventory' | 'message' | 'conflict' | 'voice_command_processed' | 'whatsapp_message_sent' | 'whatsapp_template_sent' | 'whatsapp_media_sent' | 'whatsapp_interactive_sent' | 'whatsapp_message_received' | 'whatsapp_message_status';
  action: 'create' | 'update' | 'delete' | 'sync' | 'conflict';
  entityId: string;
  organizationId: string;
  data?: unknown;
  timestamp: Date;
  source: string;
}

export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  conflictType: string;
  localData: any;
  remoteData: any;
  resolution?: string;
  isResolved: boolean;
  organizationId: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export class RealTimeSyncService extends EventEmitter {
  private redis: any = null;
  private wss: any = null;
  private connections: Map<string, any> = new Map();
  private syncQueue: SyncEvent[] = [];
  private isProcessing = false;
  private isInitialized = false;

  constructor() {
    super();
    // Don't initialize WebSocket immediately - defer until needed
    // Don't initialize Redis immediately - defer until needed
    this.startSyncProcessor();
  }

  private getRedis(): any {
    if (!this.redis && Redis) {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    }
    return this.redis;
  }

  private async initializeWebSocket(): Promise<void> {
    if (this.wss || this.isInitialized) return;

    try {
      this.wss = new WebSocketServer({ port: 3001 });
      this.isInitialized = true;

      this.wss.on('connection', (ws: any, request: any) => {
        const url = new URL(request.url || '', `http://localhost`);
        const organizationId = url.searchParams.get('organizationId');

        if (!organizationId) {
          ws.close(1008, 'Organization ID required');
          return;
        }

        const connectionId = `${organizationId}-${Date.now()}`;
        this.connections.set(connectionId, ws);

        logger.info({
          message: 'WebSocket connected',
          context: { service: 'RealTimeSyncService', operation: 'initialize', connectionId }
        });

        // Send initial state
        this.sendInitialState(organizationId, ws);

        ws.on('close', () => {
          this.connections.delete(connectionId);
          logger.info({
            message: 'WebSocket disconnected',
            context: { service: 'RealTimeSyncService', operation: 'close', connectionId }
          });
        });

        ws.on('error', (error: any) => {
          logger.error({
            message: 'WebSocket error',
            error: error instanceof Error ? error : new Error(String(error)),
            context: { service: 'RealTimeSyncService', operation: 'error', connectionId }
          });
          this.connections.delete(connectionId);
        });
      });

      logger.info({
        message: 'WebSocket server initialized',
        context: { service: 'RealTimeSyncService', operation: 'initialize', port: 3001 }
      });
    } catch (error) {
      logger.error({
        message: 'Failed to initialize WebSocket server',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'RealTimeSyncService', operation: 'initialize' }
      });
      this.isInitialized = false;
    }
  }

  private async ensureWebSocketInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeWebSocket();
    }
  }

  private extractOrganizationId(request: any): string | null {
    const url = new URL(request.url, 'http://localhost');
    return url.searchParams.get('organizationId');
  }

  private async sendInitialState(organizationId: string, ws: any): Promise<void> {
    try {
      const lastSync = await this.getRedis().get(`last_sync:${organizationId}`);
      const pendingEvents = await this.getPendingEvents(organizationId);

      ws.send(JSON.stringify({
        type: 'initial_state',
        lastSync: lastSync ? new Date(lastSync) : null,
        pendingEvents: pendingEvents.length
      }));
    } catch (error) {
      logger.error({
        message: 'Error sending initial state',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'RealTimeSyncService', operation: 'sendInitialState', organizationId }
      });
    }
  }

  private async handleIncomingEvent(event: SyncEvent): Promise<void> {
    try {
      // Validate event
      if (!this.validateEvent(event)) {
        throw new Error('Invalid sync event');
      }

      // Check for conflicts
      const conflicts = await this.detectConflicts(event);
      if (conflicts.length > 0) {
        await this.handleConflicts(event, conflicts);
        return;
      }

      // Process event
      await this.processEvent(event);

      // Broadcast to other connections
      await this.broadcastEvent(event);

      // Update last sync timestamp
      await this.getRedis().set(`last_sync:${event.organizationId}`, new Date().toISOString());

      this.emit('event_processed', event);
    } catch (error) {
      logger.error({
        message: 'Error handling sync event',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'RealTimeSyncService', operation: 'handleIncomingEvent', eventType: event.type, eventId: event.id, organizationId: event.organizationId }
      });
      this.emit('event_error', { event, error });
    }
  }

  private validateEvent(event: SyncEvent): boolean {
    return !!(
      event.id &&
      event.type &&
      event.action &&
      event.data &&
      event.source &&
      event.organizationId
    );
  }

  private async detectConflicts(event: SyncEvent): Promise<unknown[]> {
    const conflicts: unknown[] = [];

    try {
      const lastModified = await this.getLastModified(event);
      if (lastModified && lastModified > event.timestamp) {
        // Potential conflict - data was modified after this event
        const currentData = await this.getCurrentData(event);
        const differences = this.compareData(event.data, currentData);

        if (differences.length > 0) {
          conflicts.push({
            field: differences,
            localValue: currentData,
            remoteValue: event.data,
            timestamp: lastModified
          });
        }
      }
    } catch (error) {
      logger.error({
        message: 'Error detecting conflicts',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'RealTimeSyncService', operation: 'detectConflicts', eventType: event.type, eventId: event.id }
      });
    }

    return conflicts;
  }

  private async handleConflicts(event: SyncEvent, conflicts: unknown[]): Promise<void> {
    const dataAny = (event.data as any);
    const conflictId = `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conflictRecord: SyncConflict = {
      id: conflictId,
      entityType: event.type,
      entityId: dataAny.id || dataAny._id,
      conflictType: 'FIELD_MISMATCH',
      localData: (conflicts[0] as any)?.localValue || {},
      remoteData: (conflicts[0] as any)?.remoteValue || {},
      isResolved: false,
      organizationId: event.organizationId,
      createdAt: new Date()
    };

    await prisma.syncConflict.create({
      data: {
        id: conflictId,
        entityType: conflictRecord.entityType,
        entityId: conflictRecord.entityId,
        conflictType: 'FIELD_MISMATCH',
        localData: conflictRecord.localData,
        remoteData: conflictRecord.remoteData,
        organizationId: event.organizationId,
        createdAt: conflictRecord.createdAt
      }
    });

    // Notify about conflict
    this.emit('conflict_detected', conflictRecord);
    await this.broadcastEvent({
      ...event,
      type: 'conflict',
      data: conflictRecord
    });
  }

  private async processEvent(event: SyncEvent): Promise<void> {
    switch (event.type) {
      case 'product':
        await this.processProductEvent(event);
        break;
      case 'order':
        await this.processOrderEvent(event);
        break;
      case 'customer':
        await this.processCustomerEvent(event);
        break;
      case 'inventory':
        await this.processInventoryEvent(event);
        break;
      case 'message':
        await this.processMessageEvent(event);
        break;
      default:
        throw new Error(`Unknown event type: ${event.type}`);
    }
  }

  private async processProductEvent(event: SyncEvent): Promise<void> {
    const { action, data, organizationId } = event;

    const dataAny = data as any;
    switch (action) {
      case 'create':
        await prisma.product.create({
          data: {
            ...dataAny,
            organizationId
          }
        });
        break;
      case 'update':
        await prisma.product.update({
          where: { id: dataAny.id, organizationId },
          data: {
            ...dataAny
          }
        });
        break;
      case 'delete':
        await prisma.product.delete({
          where: { id: dataAny.id, organizationId }
        });
        break;
    }
  }

  private async processOrderEvent(event: SyncEvent): Promise<void> {
    const { action, data, organizationId } = event;

    const dataAny = data as any;
    switch (action) {
      case 'create':
        await prisma.order.create({
          data: {
            ...dataAny,
            organizationId
          }
        });
        break;
      case 'update':
        await prisma.order.update({
          where: { id: dataAny.id, organizationId },
          data: {
            ...dataAny
          }
        });
        break;
      case 'delete':
        await prisma.order.delete({
          where: { id: dataAny.id, organizationId }
        });
        break;
    }
  }

  private async processCustomerEvent(event: SyncEvent): Promise<void> {
    const { action, data, organizationId } = event;

    const dataAny = data as any;
    switch (action) {
      case 'create':
        await prisma.customer.create({
          data: {
            ...dataAny,
            organizationId
          }
        });
        break;
      case 'update':
        await prisma.customer.update({
          where: { id: dataAny.id, organizationId },
          data: {
            ...dataAny
          }
        });
        break;
      case 'delete':
        await prisma.customer.delete({
          where: { id: dataAny.id, organizationId }
        });
        break;
    }
  }

  private async processInventoryEvent(event: SyncEvent): Promise<void> {
    const { action, data, organizationId } = event;

    const dataAny = data as any;
    switch (action) {
      case 'update':
        await prisma.product.update({
          where: { id: dataAny.productId, organizationId },
          data: {
            stock: dataAny.quantity,
            updatedAt: new Date()
          }
        });
        break;
    }
  }

  private async processMessageEvent(event: SyncEvent): Promise<void> {
    const { action, data, organizationId } = event;

    switch (action) {
      case 'create':
        if ('conversation' in prisma) {
          await (prisma as any).conversation.create({
            data: {
              ...data as any,
              organizationId
            }
          });
        }
        break;
    }
  }

  public async broadcastEvent(event: SyncEvent): Promise<void> {
    await this.ensureWebSocketInitialized();

    const message = JSON.stringify(event);

    this.connections.forEach((ws, connectionId) => {
      if (connectionId.startsWith(event.organizationId) && ws.readyState === 1) { // 1 is OPEN for WebSocket
        ws.send(message);
      }
    });
  }

  private async getLastModified(event: SyncEvent): Promise<Date | null> {
    try {
      const entity = await this.getEntity(event);
      return entity?.updatedAt || null;
    } catch (error) {
      return null;
    }
  }

  private async getCurrentData(event: SyncEvent): Promise<any> {
    try {
      const entity = await this.getEntity(event);
      return entity || null;
    } catch (error) {
      return null;
    }
  }

  private async getEntity(event: SyncEvent): Promise<any> {
    const { type, data, organizationId } = event;
    const dataAny = data as any;
    const entityId = dataAny.id || dataAny._id;

    switch (type) {
      case 'product':
        return await prisma.product.findUnique({
          where: { id: entityId, organizationId }
        });
      case 'order':
        return await prisma.order.findUnique({
          where: { id: entityId, organizationId }
        });
      case 'customer':
        return await prisma.customer.findUnique({
          where: { id: entityId, organizationId }
        });
      default:
        return null;
    }
  }

  private compareData(newData: unknown, currentData: any): string[] {
    const differences: string[] = [];

    if (!currentData) return differences;

    const newDataAny = newData as any;
    Object.keys(newDataAny).forEach(key => {
      if (key === 'id' || key === '_id' || key === 'createdAt' || key === 'updatedAt') return;

      if (JSON.stringify(newDataAny[key]) !== JSON.stringify(currentData[key])) {
        differences.push(key);
      }
    });

    return differences;
  }

  private async getPendingEvents(organizationId: string): Promise<SyncEvent[]> {
    try {
      const pending = await this.getRedis().lrange(`sync_queue:${organizationId}`, 0, -1);
      return pending?.map((p: any) => JSON.parse(p)) || [];
    } catch (error) {
      return [];
    }
  }

  private startSyncProcessor(): void {
    setInterval(async () => {
      if (this.isProcessing || this.syncQueue.length === 0) return;

      this.isProcessing = true;

      try {
        const event = this.syncQueue.shift();
        if (event) {
          await this.handleIncomingEvent(event);
        }
      } catch (error) {
        logger.error({
          message: 'Error processing sync queue',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { service: 'RealTimeSyncService', operation: 'processSyncQueue' }
        });
      } finally {
        this.isProcessing = false;
      }
    }, 100); // Process every 100ms
  }

  // Public methods
  public async queueEvent(event: SyncEvent): Promise<void> {
    this.syncQueue.push(event);
  }

  public async resolveConflict(conflictId: string, resolution: any): Promise<void> {
    const conflict = await prisma.syncConflict.findUnique({
      where: { id: conflictId }
    });

    if (!conflict) throw new Error('Conflict not found');

    await prisma.syncConflict.update({
      where: { id: conflictId },
      data: {
        resolution: resolution.resolution,
        resolvedAt: new Date(),
      }
    });

    // Process the resolved event
    if (resolution.event) {
      await this.processEvent(resolution.event);
    }
  }

  public async getSyncStatus(organizationId: string): Promise<any> {
    const lastSync = await this.getRedis().get(`last_sync:${organizationId}`);
    const pendingCount = await this.getRedis().llen(`sync_queue:${organizationId}`);
    const activeConnections = Array.from(this.connections.keys()).filter(id => id === organizationId).length;

    return {
      lastSync: lastSync ? new Date(lastSync) : null,
      pendingEvents: pendingCount,
      activeConnections,
      isOnline: activeConnections > 0
    };
  }

  public async forceSync(organizationId: string): Promise<void> {
    const pendingEvents = await this.getPendingEvents(organizationId);

    for (const event of pendingEvents) {
      await this.handleIncomingEvent(event);
    }
  }

  public disconnect(): void {
    this.wss?.close();
    this.getRedis().disconnect();
  }
}

// Singleton instance
export const realTimeSyncService = new RealTimeSyncService(); 