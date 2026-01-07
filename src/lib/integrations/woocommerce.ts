import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { logger } from '../logger';

interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export class WooCommerceService {
  private api: any;
  private isConfigured: boolean = false;

  constructor(config?: WooCommerceConfig) {
    const url = config?.url || process.env.WOOCOMMERCE_URL;
    const consumerKey = config?.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY;
    const consumerSecret = config?.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (url && consumerKey && consumerSecret) {
      this.api = new WooCommerceRestApi({
        url,
        consumerKey,
        consumerSecret,
        version: 'wc/v3',
      });
      this.isConfigured = true;
    } else {
      logger.warn({
        message: 'WooCommerce not configured. Set environment variables.',
        context: { service: 'WooCommerceIntegration', operation: 'constructor' }
      });
      this.isConfigured = false;
    }
  }

  /**
   * Sync products from WooCommerce to SmartStore
   */
  async syncProducts(organizationId: string) {
    if (!this.isConfigured) {
      throw new Error('WooCommerce not configured');
    }

    try {
      const response = await this.api.get('products', {
        per_page: 100,
      });

      const products = response.data;
      return {
        success: true,
        count: products.length,
        products: products.map((p: any) => ({
          externalId: p.id.toString(),
          name: p.name,
          description: p.description,
          sku: p.sku || `WC-${p.id}`,
          price: parseFloat(p.price),
          stock: p.stock_quantity || 0,
          images: p.images.map((img: any) => img.src),
          categories: p.categories.map((cat: any) => cat.name),
          organizationId,
        })),
      };
    } catch (error: any) {
      logger.error({
        message: 'WooCommerce product sync error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'WooCommerceIntegration', operation: 'syncProducts' }
      });
      throw new Error(`Failed to sync products: ${error.message}`);
    }
  }

  /**
   * Sync orders from WooCommerce to SmartStore
   */
  async syncOrders(organizationId: string) {
    if (!this.isConfigured) {
      throw new Error('WooCommerce not configured');
    }

    try {
      const response = await this.api.get('orders', {
        per_page: 100,
        status: 'any',
      });

      const orders = response.data;
      return {
        success: true,
        count: orders.length,
        orders: orders.map((o: any) => ({
          externalId: o.id.toString(),
          orderNumber: o.number,
          status: this.mapWooCommerceStatus(o.status),
          total: parseFloat(o.total),
          subtotal: parseFloat(o.subtotal),
          tax: parseFloat(o.total_tax),
          shipping: parseFloat(o.shipping_total),
          customer: {
            email: o.billing.email,
            name: `${o.billing.first_name} ${o.billing.last_name}`,
            phone: o.billing.phone,
          },
          items: o.line_items.map((item: any) => ({
            productId: item.product_id.toString(),
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price),
            total: parseFloat(item.total),
          })),
          organizationId,
        })),
      };
    } catch (error: any) {
      logger.error({
        message: 'WooCommerce order sync error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'WooCommerceIntegration', operation: 'syncOrders' }
      });
      throw new Error(`Failed to sync orders: ${error.message}`);
    }
  }

  /**
   * Export product to WooCommerce
   */
  async exportProduct(product: any) {
    if (!this.isConfigured) {
      throw new Error('WooCommerce not configured');
    }

    try {
      const data = {
        name: product.name,
        type: 'simple',
        regular_price: product.price.toString(),
        description: product.description || '',
        short_description: product.description || '',
        sku: product.sku,
        manage_stock: true,
        stock_quantity: product.stock || 0,
        images: product.images?.map((url: string) => ({ src: url })) || [],
      };

      const response = await this.api.post('products', data);
      return {
        success: true,
        externalId: response.data.id,
        permalink: response.data.permalink,
      };
    } catch (error: any) {
      logger.error({
        message: 'WooCommerce product export error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'WooCommerceIntegration', operation: 'exportProduct', productId }
      });
      throw new Error(`Failed to export product: ${error.message}`);
    }
  }

  /**
   * Update inventory in WooCommerce
   */
  async updateInventory(productId: string, quantity: number) {
    if (!this.isConfigured) {
      throw new Error('WooCommerce not configured');
    }

    try {
      const response = await this.api.put(`products/${productId}`, {
        stock_quantity: quantity,
      });

      return {
        success: true,
        updated: response.data.stock_quantity,
      };
    } catch (error: any) {
      logger.error({
        message: 'WooCommerce inventory update error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { service: 'WooCommerceIntegration', operation: 'updateInventory', productId, quantity }
      });
      throw new Error(`Failed to update inventory: ${error.message}`);
    }
  }

  /**
   * Map WooCommerce status to SmartStore status
   */
  private mapWooCommerceStatus(wcStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'PENDING',
      'processing': 'PROCESSING',
      'on-hold': 'ON_HOLD',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'failed': 'FAILED',
    };
    return statusMap[wcStatus] || 'PENDING';
  }

  /**
   * Verify WooCommerce connection
   */
  async verifyConnection() {
    if (!this.isConfigured) {
      return { success: false, error: 'Not configured' };
    }

    try {
      const response = await this.api.get('system_status');
      return {
        success: true,
        version: response.data.environment.wp_version,
        wcVersion: response.data.environment.version,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const wooCommerceService = new WooCommerceService();

