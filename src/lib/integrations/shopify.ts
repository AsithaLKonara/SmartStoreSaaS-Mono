import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';

const shopifyConfig = {
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: ['read_products', 'write_products', 'read_orders', 'write_orders', 'read_inventory', 'write_inventory'],
  hostName: process.env.SHOPIFY_HOST_NAME || 'localhost',
  isEmbeddedApp: false,
  apiVersion: ApiVersion.October23,
};

let shopify: any = null;

if (shopifyConfig.apiKey && shopifyConfig.apiSecretKey) {
  try {
    shopify = shopifyApi(shopifyConfig);
  } catch (error) {
    console.warn('Shopify API initialization failed:', error);
  }
}

export interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at: string;
  tags: string;
  status: string;
  variants: any[];
  images: any[];
}

export class ShopifyService {
  private shopName: string;
  private accessToken: string;

  constructor(shopName?: string, accessToken?: string) {
    this.shopName = shopName || process.env.SHOPIFY_SHOP_NAME || '';
    this.accessToken = accessToken || process.env.SHOPIFY_ACCESS_TOKEN || '';
  }

  /**
   * Verify Shopify connection
   */
  async verifyConnection() {
    if (!this.shopName || !this.accessToken) {
      return {
        success: false,
        error: 'Shopify credentials not configured',
      };
    }

    try {
      // Test connection by fetching shop info
      const response = await fetch(
        `https://${this.shopName}.myshopify.com/admin/api/2023-10/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          shop: data.shop,
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get products from Shopify
   */
  async getProducts(limit: number = 50) {
    if (!this.shopName || !this.accessToken) {
      throw new Error('Shopify credentials not configured');
    }

    try {
      const response = await fetch(
        `https://${this.shopName}.myshopify.com/admin/api/2023-10/products.json?limit=${limit}`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        products: data.products,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Create product in Shopify
   */
  async createProduct(product: any) {
    if (!this.shopName || !this.accessToken) {
      throw new Error('Shopify credentials not configured');
    }

    try {
      const shopifyProduct = {
        product: {
          title: product.name,
          body_html: product.description,
          vendor: 'SmartStore',
          product_type: product.category || 'General',
          variants: [
            {
              price: product.price.toString(),
              sku: product.sku,
              inventory_quantity: product.stock || 0,
              inventory_management: 'shopify',
            },
          ],
        },
      };

      const response = await fetch(
        `https://${this.shopName}.myshopify.com/admin/api/2023-10/products.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shopifyProduct),
        }
      );

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        product: data.product,
      };
    } catch (error: any) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Update product inventory in Shopify
   */
  async updateInventory(variantId: string, quantity: number) {
    if (!this.shopName || !this.accessToken) {
      throw new Error('Shopify credentials not configured');
    }

    try {
      // First, get inventory item ID
      const variantResponse = await fetch(
        `https://${this.shopName}.myshopify.com/admin/api/2023-10/variants/${variantId}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const variantData = await variantResponse.json();
      const inventoryItemId = variantData.variant.inventory_item_id;

      // Get inventory levels
      const levelsResponse = await fetch(
        `https://${this.shopName}.myshopify.com/admin/api/2023-10/inventory_levels.json?inventory_item_ids=${inventoryItemId}`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const levelsData = await levelsResponse.json();
      const locationId = levelsData.inventory_levels[0]?.location_id;

      if (!locationId) {
        throw new Error('No location found for inventory');
      }

      // Set inventory level
      const setResponse = await fetch(
        `https://${this.shopName}.myshopify.com/admin/api/2023-10/inventory_levels/set.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location_id: locationId,
            inventory_item_id: inventoryItemId,
            available: quantity,
          }),
        }
      );

      const setData = await setResponse.json();
      return {
        success: true,
        quantity: setData.inventory_level.available,
      };
    } catch (error: any) {
      throw new Error(`Failed to update inventory: ${error.message}`);
    }
  }

  /**
   * Get orders from Shopify
   */
  async getOrders(limit: number = 50) {
    if (!this.shopName || !this.accessToken) {
      throw new Error('Shopify credentials not configured');
    }

    try {
      const response = await fetch(
        `https://${this.shopName}.myshopify.com/admin/api/2023-10/orders.json?limit=${limit}&status=any`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        orders: data.orders,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }
}

export const shopifyService = new ShopifyService();

