import { prisma } from '../prisma';
import { realTimeSyncService } from '../sync/realTimeSyncService';
import { logger } from '../logger';

// SpeechRecognition type definitions - using unknown to avoid conflicts
declare global {
  interface Window {
    SpeechRecognition: unknown;
    webkitSpeechRecognition: unknown;
  }
}

export interface VoiceCommand {
  id: string;
  command: string;
  action: string;
  customerId: string | null; // Changed from userId to match Prisma model
  intent: string | null;
  entities: Record<string, unknown> | null;
  confidence: number | null;
  response: string | null;
  createdAt: Date; // Changed from timestamp to match Prisma model
  processed: boolean | null;
  organizationId: string | null;
}

export interface VoiceIntent {
  name: string;
  patterns: string[];
  entities: string[];
  handler: string;
  examples: string[];
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
}

export interface VoiceResponse {
  text: string;
  ssml?: string;
  actions?: Array<{
    type: string;
    data: unknown;
  }>;
  suggestions?: string[];
}

export class VoiceCommerceService {
  private recognition: unknown | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private intents: VoiceIntent[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSpeechRecognition();
      this.initializeSpeechSynthesis();
      this.loadIntents();
    }
  }

  /**
   * Initialize speech recognition
   */
  private initializeSpeechRecognition(): void {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        logger.warn({
          message: 'Speech recognition not supported',
          context: { service: 'VoiceCommerceService', operation: 'initializeSpeechRecognition' }
        });
        return;
      }

      (this.recognition as any) = new SpeechRecognition();
      (this.recognition as any).continuous = true;
      (this.recognition as any).interimResults = true;
      (this.recognition as any).lang = 'en-US';

      (this.recognition as any).onstart = () => {
        logger.info({
          message: 'Voice recognition started',
          context: { service: 'VoiceCommerceService', operation: 'initializeSpeechRecognition' }
        });
        this.isListening = true;
      };

      (this.recognition as any).onend = () => {
        logger.info({
          message: 'Voice recognition ended',
          context: { service: 'VoiceCommerceService', operation: 'initializeSpeechRecognition' }
        });
        this.isListening = false;
      };

      (this.recognition as any).onerror = (event: any) => {
        logger.error({
          message: 'Speech recognition error',
          error: (event as { error: string }).error ? new Error((event as { error: string }).error) : new Error('Unknown error'),
          context: { service: 'VoiceCommerceService', operation: 'initializeSpeechRecognition' }
        });
        this.isListening = false;
      };

      (this.recognition as any).onresult = (event: any) => {
        this.handleSpeechResult(event);
      };

    } catch (error) {
      logger.error({
        message: 'Error initializing speech recognition',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'VoiceCommerceService', operation: 'initializeSpeechRecognition' }
      });
    }
  }

  /**
   * Initialize speech synthesis
   */
  private initializeSpeechSynthesis(): void {
    try {
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        logger.info({
          message: 'Speech synthesis initialized',
          context: { service: 'VoiceCommerceService', operation: 'initializeSpeechSynthesis' }
        });
      } else {
        logger.warn({
          message: 'Speech synthesis not supported',
          context: { service: 'VoiceCommerceService', operation: 'initializeSpeechSynthesis' }
        });
      }
    } catch (error) {
      logger.error({
        message: 'Error initializing speech synthesis',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'VoiceCommerceService', operation: 'initializeSpeechSynthesis' }
      });
    }
  }

  /**
   * Load voice intents
   */
  private loadIntents(): void {
    this.intents = [
      {
        name: 'search_products',
        patterns: [
          'search for *',
          'find *',
          'show me *',
          'look for *',
        ],
        entities: ['product_name', 'category'],
        handler: 'handleProductSearch',
        examples: [
          'search for laptops',
          'find red shoes',
          'show me electronics',
        ],
      },
      {
        name: 'add_to_cart',
        patterns: [
          'add * to cart',
          'add * to my cart',
          'put * in cart',
          'buy *',
        ],
        entities: ['product_name', 'quantity'],
        handler: 'handleAddToCart',
        examples: [
          'add iPhone to cart',
          'add 2 laptops to my cart',
          'buy wireless headphones',
        ],
      },
      {
        name: 'check_order_status',
        patterns: [
          'check order status',
          'where is my order',
          'order status for *',
          'track order *',
        ],
        entities: ['order_id'],
        handler: 'handleOrderStatus',
        examples: [
          'check order status',
          'where is my order 12345',
          'track order ABC123',
        ],
      },
      {
        name: 'view_cart',
        patterns: [
          'show my cart',
          'view cart',
          'what\'s in my cart',
          'cart contents',
        ],
        entities: [],
        handler: 'handleViewCart',
        examples: [
          'show my cart',
          'what\'s in my cart',
        ],
      },
      {
        name: 'checkout',
        patterns: [
          'checkout',
          'place order',
          'complete purchase',
          'buy now',
        ],
        entities: [],
        handler: 'handleCheckout',
        examples: [
          'checkout',
          'place order',
          'complete purchase',
        ],
      },
      {
        name: 'get_recommendations',
        patterns: [
          'recommend *',
          'suggest *',
          'what do you recommend',
          'show recommendations',
        ],
        entities: ['category', 'price_range'],
        handler: 'handleRecommendations',
        examples: [
          'recommend laptops under $1000',
          'suggest gift ideas',
          'what do you recommend',
        ],
      },
      {
        name: 'help',
        patterns: [
          'help',
          'what can you do',
          'commands',
          'how to use',
        ],
        entities: [],
        handler: 'handleHelp',
        examples: [
          'help',
          'what can you do',
          'show commands',
        ],
      },
    ];
  }

  /**
   * Start voice recognition
   */
  startListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }

      if (this.isListening) {
        resolve();
        return;
      }

      try {
        (this.recognition as any).start();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop voice recognition
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      (this.recognition as any).stop();
    }
  }

  /**
   * Process voice command
   */
  async processVoiceCommand(
    transcript: string,
    customerId: string,
    organizationId: string
  ): Promise<VoiceResponse> {
    try {
      // Clean and normalize transcript
      const cleanTranscript = transcript.toLowerCase().trim();

      // Extract intent and entities
      const { intent, entities, confidence } = await this.extractIntent(cleanTranscript);

      // Store command
      const command: VoiceCommand = {
        id: '',
        customerId,
        command: transcript,
        action: 'voice_command',
        intent: intent,
        entities: entities,
        confidence: confidence,
        response: '',
        createdAt: new Date(),
        processed: false,
        organizationId: organizationId,
      };

      const storedCommand = await this.storeVoiceCommand(command);
      await this.updateCommandStatus(storedCommand.id, true);

      // Process command based on intent
      const response = await this.handleIntent(intent, entities, customerId, organizationId);

      // Update command as processed
      await this.updateCommandStatus(storedCommand.id, true, response.text);

      // Broadcast event
      await realTimeSyncService.broadcastEvent({
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'voice_command_processed',
        action: 'create',
        entityId: storedCommand.id,
        organizationId: storedCommand.organizationId || 'system', // Provide default value for null case
        data: { command, response },
        timestamp: new Date(),
        source: 'voice-commerce'
      });

      return response;
    } catch (error) {
      logger.error({
        message: 'Error processing voice command',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'VoiceCommerceService', operation: 'processVoiceCommand', command: transcript } // Fix: Use transcript instead of command
      });
      return {
        text: 'Sorry, I couldn\'t understand that command. Please try again.',
        suggestions: ['Try saying "help" to see available commands'],
      };
    }
  }

  /**
   * Speak response
   */
  speak(text: string, options?: SpeechSynthesisUtterance): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      if (options) {
        Object.assign(utterance, options);
      } else {
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  /**
   * Handle speech recognition results
   */
  private handleSpeechResult(event: any): void {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      // Emit event for final transcript
      window.dispatchEvent(new CustomEvent('voiceCommand', {
        detail: {
          transcript: finalTranscript,
          confidence: event.results[event.resultIndex][0].confidence,
          isFinal: true,
        },
      }));
    }

    if (interimTranscript) {
      // Emit event for interim transcript
      window.dispatchEvent(new CustomEvent('voiceTranscript', {
        detail: {
          transcript: interimTranscript,
          isFinal: false,
        },
      }));
    }
  }

  /**
   * Extract intent from transcript
   */
  private async extractIntent(transcript: string): Promise<{
    intent: string;
    entities: Record<string, unknown>;
    confidence: number;
  }> {
    let bestMatch = {
      intent: 'unknown',
      entities: {},
      confidence: 0,
    };

    // Simple pattern matching (in production, use NLU service like Dialogflow)
    for (const intentConfig of this.intents) {
      for (const pattern of intentConfig.patterns) {
        const confidence = this.matchPattern(transcript, pattern);

        if (confidence > bestMatch.confidence) {
          const entities = this.extractEntities(transcript, pattern, intentConfig.entities);

          bestMatch = {
            intent: intentConfig.name,
            entities,
            confidence,
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Match pattern against transcript
   */
  private matchPattern(transcript: string, pattern: string): number {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '(.*?)')
      .replace(/\s+/g, '\\s+');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    const match = transcript.match(regex);

    if (match) {
      // Calculate confidence based on pattern specificity
      const wildcards = (pattern.match(/\*/g) || []).length;
      const baseConfidence = 0.8;
      const wildcardPenalty = wildcards * 0.1;

      return Math.max(baseConfidence - wildcardPenalty, 0.3);
    }

    return 0;
  }

  /**
   * Extract entities from transcript
   */
  private extractEntities(
    transcript: string,
    pattern: string,
    entityTypes: string[]
  ): Record<string, unknown> {
    const entities: Record<string, unknown> = {};

    const regexPattern = pattern.replace(/\*/g, '(.*?)');
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    const match = transcript.match(regex);

    if (match && match.length > 1) {
      // Map captured groups to entity types
      for (let i = 1; i < match.length && i - 1 < entityTypes.length; i++) {
        const entityType = entityTypes[i - 1];
        const entityValue = match[i]?.trim();

        if (entityValue && entityType) {
          entities[entityType] = this.parseEntityValue(entityType, entityValue);
        }
      }
    }

    return entities;
  }

  /**
   * Parse entity value based on type
   */
  private parseEntityValue(entityType: string, value: string): unknown {
    switch (entityType) {
      case 'quantity':
        // Extract numbers from text
        const numberMatch = value.match(/\d+/);
        return numberMatch ? parseInt(numberMatch[0]) : 1;

      case 'price_range':
        // Extract price range
        const priceMatch = value.match(/under\s+\$?(\d+)|below\s+\$?(\d+)|less\s+than\s+\$?(\d+)/i);
        if (priceMatch) {
          const matchStr = priceMatch[1] || priceMatch[2] || priceMatch[3];
          const amount = parseInt(matchStr || '0');
          return { max: amount };
        }
        return { max: 1000 }; // Default

      default:
        return value;
    }
  }

  /**
   * Handle different intents
   */
  private async handleIntent(
    intent: string,
    entities: Record<string, unknown>,
    customerId: string,
    organizationId: string
  ): Promise<VoiceResponse> {
    switch (intent) {
      case 'search_products':
        return await this.handleProductSearch(entities, organizationId);

      case 'add_to_cart':
        return await this.handleAddToCart(entities, customerId, organizationId);

      case 'check_order_status':
        return await this.handleOrderStatus(entities, customerId);

      case 'view_cart':
        return await this.handleViewCart(customerId);

      case 'checkout':
        return await this.handleCheckout(customerId);

      case 'get_recommendations':
        return await this.handleRecommendations(entities, customerId, organizationId);

      case 'help':
        return this.handleHelp();

      default:
        return {
          text: 'I didn\'t understand that command. Try saying "help" to see what I can do.',
          suggestions: ['help', 'search for products', 'show my cart'],
        };
    }
  }

  /**
   * Intent handlers
   */
  private async handleProductSearch(entities: Record<string, unknown>, organizationId: string): Promise<VoiceResponse> {
    const searchTerm = (entities.product_name || entities.category) as string | undefined;

    if (!searchTerm) {
      return {
        text: 'What would you like to search for?',
        suggestions: ['search for laptops', 'find shoes', 'show electronics'],
      };
    }

    try {
      const products = await prisma.product.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        include: { category: true },
      });

      if (products.length === 0) {
        return {
          text: `I couldn't find any products matching "${searchTerm}". Try a different search term.`,
          suggestions: ['search for electronics', 'find clothing', 'show all products'],
        };
      }

      const productNames = products.map((p: any) => p.name).join(', ');

      return {
        text: `I found ${products.length} products for "${searchTerm}": ${productNames}. Would you like to add unknown to your cart?`,
        actions: [
          {
            type: 'show_products',
            data: { products },
          },
        ],
        suggestions: products.slice(0, 3).map((p: any) => `add ${p.name} to cart`),
      };
    } catch (error) {
      logger.error({
        message: 'Error searching products',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'VoiceCommerceService', operation: 'searchProducts', query: searchTerm, organizationId }
      });
      return {
        text: 'Sorry, I had trouble searching for products. Please try again.',
      };
    }
  }

  private async handleAddToCart(
    entities: Record<string, unknown>,
    customerId: string,
    organizationId: string
  ): Promise<VoiceResponse> {
    const productName = entities.product_name;
    const quantity = entities.quantity || 1;

    if (!productName) {
      return {
        text: 'What product would you like to add to your cart?',
        suggestions: ['add iPhone to cart', 'add laptop to cart'],
      };
    }

    try {
      // Find product
      const product = await prisma.product.findFirst({
        where: {
          organizationId,
          name: { contains: productName as string, mode: 'insensitive' }, // Fix: Cast to string
        },
      });

      if (!product) {
        return {
          text: `I couldn't find a product called "${productName}". Try searching for it first.`,
          suggestions: [`search for ${productName}`],
        };
      }

      // Add to cart (simplified - you'd implement actual cart logic)
      const qty = Number(quantity);
      const price = (product.price as any) ? Number(product.price) : 0;
      return {
        text: `Added ${qty} ${product.name} to your cart. The total is $${(price * qty).toFixed(2)}.`,
        actions: [
          {
            type: 'add_to_cart',
            data: { productId: product.id, quantity },
          },
        ],
        suggestions: ['view cart', 'checkout', 'continue shopping'],
      };
    } catch (error) {
      logger.error({
        message: 'Error adding to cart',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'VoiceCommerceService', operation: 'addToCart', productId: entities.product_name, quantity, customerId }
      });
      return {
        text: 'Sorry, I had trouble adding that to your cart. Please try again.',
      };
    }
  }

  private async handleOrderStatus(entities: Record<string, unknown>, customerId: string): Promise<VoiceResponse> {
    const orderId = entities.order_id as string | undefined;

    try {
      const orders = await prisma.order.findMany({
        where: {
          customerId: customerId,
          ...(orderId ? { id: orderId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: orderId ? 1 : 3,
      });

      if (orders.length === 0) {
        return {
          text: orderId
            ? `I couldn't find order ${orderId}. Please check the order number.`
            : 'You don\'t have unknown recent orders.',
        };
      }

      if (orderId) {
        const order = orders[0];
        if (!order) {
          return { text: 'Order not found.' };
        }
        const orderTotal = (order as any).total ? Number((order as any).total) : 0;
        return {
          text: `Order ${order.id} is ${(order.status as string).toLowerCase()}. The total was $${orderTotal}.`,
          actions: [
            {
              type: 'show_order',
              data: { orderId: order.id },
            },
          ],
        };
      } else {
        const statusText = orders.map((order: any) =>
          `Order ${order.id} is ${order.status.toLowerCase()}`
        ).join(', ');

        return {
          text: `Here are your recent orders: ${statusText}.`,
          actions: [
            {
              type: 'show_orders',
              data: { orders },
            },
          ],
        };
      }
    } catch (error) {
      logger.error({
        message: 'Error checking order status',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'VoiceCommerceService', operation: 'checkOrderStatus', orderId, customerId }
      });
      return {
        text: 'Sorry, I had trouble checking your order status. Please try again.',
      };
    }
  }

  private async handleViewCart(customerId: string): Promise<VoiceResponse> {
    // Simplified cart view - you'd implement actual cart logic
    return {
      text: 'Your cart contains 3 items with a total of $299.99. Would you like to checkout?',
      actions: [
        {
          type: 'show_cart',
          data: {},
        },
      ],
      suggestions: ['checkout', 'remove item from cart', 'continue shopping'],
    };
  }

  private async handleCheckout(customerId: string): Promise<VoiceResponse> {
    return {
      text: 'I\'ll help you checkout. Please review your order and confirm your shipping address.',
      actions: [
        {
          type: 'start_checkout',
          data: {},
        },
      ],
      suggestions: ['confirm order', 'change shipping address', 'cancel'],
    };
  }

  private async handleRecommendations(
    entities: Record<string, unknown>,
    customerId: string,
    organizationId: string
  ): Promise<VoiceResponse> {
    const category = entities.category as string | undefined;
    const priceRange = entities.price_range as { max?: number } | undefined;

    try {
      const products = await prisma.product.findMany({
        where: {
          organizationId,
          ...(category ? {
            category: { name: { contains: category, mode: 'insensitive' } }
          } : {}),
          ...(priceRange?.max ? { price: { lte: priceRange.max } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      if (products.length === 0) {
        return {
          text: 'I don\'t have unknown recommendations matching your criteria right now.',
          suggestions: ['show popular products', 'search for electronics'],
        };
      }

      const recommendations = products.map((p: any) => `${p.name} for $${p.price}`).join(', ');

      return {
        text: `I recommend: ${recommendations}. Would you like to add unknown to your cart?`,
        actions: [
          {
            type: 'show_recommendations',
            data: { products },
          },
        ],
        suggestions: products.map((p: any) => `add ${p.name} to cart`),
      };
    } catch (error) {
      logger.error({
        message: 'Error getting recommendations',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'VoiceCommerceService', operation: 'getRecommendations', customerId, organizationId }
      });
      return {
        text: 'Sorry, I had trouble getting recommendations. Please try again.',
      };
    }
  }

  private handleHelp(): VoiceResponse {
    return {
      text: `I can help you with shopping! Here's what you can say: 
      "Search for products", "Add item to cart", "Check order status", 
      "Show my cart", "Checkout", or "Get recommendations". 
      What would you like to do?`,
      suggestions: [
        'search for laptops',
        'show my cart',
        'check order status',
        'get recommendations',
      ],
    };
  }

  /**
   * Store voice command
   */
  private async storeVoiceCommand(commandData: Omit<VoiceCommand, 'id' | 'response'>): Promise<VoiceCommand> {
    const voiceCommand = await prisma.voiceCommand.create({
      data: {
        customerId: commandData.customerId,
        command: commandData.command,
        intent: commandData.intent,
        entities: commandData.entities as any || undefined, // Use undefined for null/empty
        confidence: commandData.confidence,
        // Remove timestamp as it's not in the model, use createdAt
        processed: commandData.processed || undefined,
        response: '',
        action: commandData.action,
        organizationId: commandData.organizationId || 'system'
      }
    });

    return {
      id: voiceCommand.id,
      customerId: voiceCommand.customerId,
      command: voiceCommand.command,
      intent: voiceCommand.intent,
      entities: voiceCommand.entities as Record<string, unknown> | null,
      confidence: voiceCommand.confidence,
      response: voiceCommand.response,
      createdAt: voiceCommand.createdAt, // Changed from timestamp
      processed: voiceCommand.processed,
      organizationId: voiceCommand.organizationId,
      action: voiceCommand.action || '',
    };
  }

  /**
   * Update command status
   */
  private async updateCommandStatus(commandId: string, processed: boolean, response: string = ''): Promise<void> {
    await prisma.voiceCommand.update({
      where: { id: commandId },
      data: { processed, response },
    });
  }

  /**
   * Get voice command history
   */
  async getCommandHistory(customerId: string, limit: number = 50): Promise<VoiceCommand[]> {
    const commands = await prisma.voiceCommand.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' }, // Changed from timestamp
      take: limit,
    });

    return commands.map((cmd: any) => ({
      id: cmd.id,
      customerId: cmd.customerId,
      command: cmd.command,
      intent: cmd.intent,
      entities: cmd.entities as Record<string, unknown> | null,
      confidence: cmd.confidence,
      response: cmd.response,
      createdAt: cmd.createdAt, // Changed from timestamp
      processed: cmd.processed,
      organizationId: cmd.organizationId,
      action: cmd.action || '',
    }));
  }

  /**
   * Check if voice features are supported
   */
  isVoiceSupported(): {
    speechRecognition: boolean;
    speechSynthesis: boolean;
    voiceCommands: boolean;
  } {
    return {
      speechRecognition: !!this.recognition,
      speechSynthesis: !!this.synthesis,
      voiceCommands: !!(this.recognition && this.synthesis),
    };
  }
}

export const voiceCommerceService = new VoiceCommerceService();
