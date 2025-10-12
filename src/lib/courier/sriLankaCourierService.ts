import { PrismaClient } from '@prisma/client';
import { realTimeSyncService } from '@/lib/sync/realTimeSyncService';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();

export interface CourierConfig {
  name: string;
  code: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl: string;
  isActive: boolean;
  organizationId: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  courierCode: string;
  status: string;
  location?: string;
  timestamp: Date;
  description: string;
  estimatedDelivery?: Date;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: Date;
  description: string;
}

export interface ShipmentRequest {
  pickupAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  package: {
    weight: number;
    length: number;
    width: number;
    height: number;
    description: string;
    value: number;
  };
  serviceType: string;
  paymentMethod: 'prepaid' | 'cod';
  codAmount?: number;
  instructions?: string;
}

export interface ShipmentResponse {
  trackingNumber: string;
  courierCode: string;
  status: string;
  estimatedDelivery: Date;
  cost: number;
  labelUrl?: string;
  receiptUrl?: string;
}

export interface CourierService {
  name: string;
  code: string;
  baseUrl: string;
  isActive: boolean;
  features: string[];
  coverage: string[];
  pricing: {
    base: number;
    perKg: number;
    codFee: number;
  };
}

class SriLankaCourierService extends EventEmitter {
  private couriers: Map<string, CourierConfig> = new Map();
  private trackingCache: Map<string, TrackingInfo> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super();
    this.loadCouriers();
  }

  private async loadCouriers(): Promise<void> {
    try {
      const couriers = await prisma.courier.findMany({
        where: { isActive: true }
      });

      couriers.forEach(courier => {
        this.couriers.set(courier.code, {
          name: courier.name,
          code: courier.code,
          apiKey: courier.apiKey,
          apiSecret: courier.apiSecret,
          baseUrl: courier.baseUrl,
          isActive: courier.isActive,
          organizationId: courier.organizationId
        });
      });
    } catch (error) {
      console.error('Error loading couriers:', error);
    }
  }

  async createShipment(request: ShipmentRequest, courierCode: string): Promise<ShipmentResponse> {
    const courier = this.couriers.get(courierCode);
    if (!courier) {
      throw new Error(`Courier ${courierCode} not found`);
    }

    try {
      // Simulate API call to courier service
      const response = await this.callCourierAPI(courier, 'create-shipment', request);
      
      const shipmentResponse: ShipmentResponse = {
        trackingNumber: response.trackingNumber,
        courierCode,
        status: 'created',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        cost: response.cost,
        labelUrl: response.labelUrl,
        receiptUrl: response.receiptUrl
      };

      // Store in database
      await prisma.shipment.create({
        data: {
          trackingNumber: shipmentResponse.trackingNumber,
          courierCode,
          status: shipmentResponse.status,
          pickupAddress: request.pickupAddress,
          deliveryAddress: request.deliveryAddress,
          package: request.package,
          cost: shipmentResponse.cost,
          estimatedDelivery: shipmentResponse.estimatedDelivery,
          organizationId: courier.organizationId
        }
      });

      // Emit real-time event
      realTimeSyncService.emit(SyncEvent.SHIPMENT_CREATED, {
        trackingNumber: shipmentResponse.trackingNumber,
        courierCode,
        status: shipmentResponse.status
      });

      return shipmentResponse;
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw new Error('Failed to create shipment');
    }
  }

  async trackShipment(trackingNumber: string, courierCode: string): Promise<TrackingInfo> {
    const cacheKey = `${courierCode}:${trackingNumber}`;
    const cached = this.trackingCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      return cached;
    }

    const courier = this.couriers.get(courierCode);
    if (!courier) {
      throw new Error(`Courier ${courierCode} not found`);
    }

    try {
      // Simulate API call to courier service
      const response = await this.callCourierAPI(courier, 'track-shipment', { trackingNumber });
      
      const trackingInfo: TrackingInfo = {
        trackingNumber,
        courierCode,
        status: response.status,
        location: response.location,
        timestamp: new Date(),
        description: response.description,
        estimatedDelivery: response.estimatedDelivery ? new Date(response.estimatedDelivery) : undefined,
        events: response.events || []
      };

      // Cache the result
      this.trackingCache.set(cacheKey, trackingInfo);

      // Update database
      await prisma.shipment.updateMany({
        where: { trackingNumber, courierCode },
        data: {
          status: trackingInfo.status,
          lastUpdate: trackingInfo.timestamp,
          trackingEvents: trackingInfo.events
        }
      });

      // Emit real-time event
      realTimeSyncService.emit(SyncEvent.SHIPMENT_UPDATED, {
        trackingNumber,
        courierCode,
        status: trackingInfo.status
      });

      return trackingInfo;
    } catch (error) {
      console.error('Error tracking shipment:', error);
      throw new Error('Failed to track shipment');
    }
  }

  async cancelShipment(trackingNumber: string, courierCode: string, reason: string): Promise<boolean> {
    const courier = this.couriers.get(courierCode);
    if (!courier) {
      throw new Error(`Courier ${courierCode} not found`);
    }

    try {
      // Simulate API call to courier service
      await this.callCourierAPI(courier, 'cancel-shipment', { trackingNumber, reason });
      
      // Update database
      await prisma.shipment.updateMany({
        where: { trackingNumber, courierCode },
        data: {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date()
        }
      });

      // Emit real-time event
      realTimeSyncService.emit(SyncEvent.SHIPMENT_CANCELLED, {
        trackingNumber,
        courierCode,
        reason
      });

      return true;
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      return false;
    }
  }

  async getAvailableServices(): Promise<CourierService[]> {
    const services: CourierService[] = [];
    
    for (const [code, courier] of this.couriers) {
      if (courier.isActive) {
        services.push({
          name: courier.name,
          code,
          baseUrl: courier.baseUrl,
          isActive: courier.isActive,
          features: ['tracking', 'cod', 'insurance'],
          coverage: ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle'],
          pricing: {
            base: 300,
            perKg: 50,
            codFee: 100
          }
        });
      }
    }

    return services;
  }

  async calculateCost(request: ShipmentRequest, courierCode: string): Promise<number> {
    const courier = this.couriers.get(courierCode);
    if (!courier) {
      throw new Error(`Courier ${courierCode} not found`);
    }

    try {
      // Simulate API call to courier service
      const response = await this.callCourierAPI(courier, 'calculate-cost', request);
      return response.cost;
    } catch (error) {
      console.error('Error calculating cost:', error);
      throw new Error('Failed to calculate cost');
    }
  }

  private async callCourierAPI(courier: CourierConfig, endpoint: string, data: any): Promise<any> {
    // Simulate API call - in real implementation, this would make actual HTTP requests
    const url = `${courier.baseUrl}/${endpoint}`;
    
    // Mock response based on endpoint
    switch (endpoint) {
      case 'create-shipment':
        return {
          trackingNumber: `SL${Date.now()}`,
          cost: 500,
          labelUrl: 'https://example.com/label.pdf',
          receiptUrl: 'https://example.com/receipt.pdf'
        };
      
      case 'track-shipment':
        return {
          status: 'in_transit',
          location: 'Colombo Hub',
          description: 'Package is in transit',
          estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
          events: [
            {
              status: 'picked_up',
              location: 'Colombo',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              description: 'Package picked up from sender'
            },
            {
              status: 'in_transit',
              location: 'Colombo Hub',
              timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
              description: 'Package is in transit'
            }
          ]
        };
      
      case 'cancel-shipment':
        return { success: true };
      
      case 'calculate-cost':
        return { cost: 500 };
      
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
  }

  async addCourier(config: CourierConfig): Promise<void> {
    await prisma.courier.create({
      data: {
        name: config.name,
        code: config.code,
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
        baseUrl: config.baseUrl,
        isActive: config.isActive,
        organizationId: config.organizationId
      }
    });

    this.couriers.set(config.code, config);
    this.emit('courier_added', config);
  }

  async removeCourier(courierCode: string): Promise<void> {
    await prisma.courier.updateMany({
      where: { code: courierCode },
      data: { isActive: false }
    });

    this.couriers.delete(courierCode);
    this.emit('courier_removed', { courierCode });
  }

  async testCourierConnection(courierCode: string): Promise<boolean> {
    const courier = this.couriers.get(courierCode);
    if (!courier) return false;

    try {
      // Test with a dummy tracking number
      await this.trackShipment('TEST123', courierCode);
      return true;
    } catch (error) {
      return false;
    }
  }

  getAvailableCouriers(): string[] {
    return Array.from(this.couriers.keys());
  }
}

export const sriLankaCourierService = new SriLankaCourierService();
