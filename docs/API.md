# SmartStore SaaS API Documentation

## Overview

The SmartStore SaaS API provides a comprehensive REST API for managing e-commerce operations including products, orders, customers, and analytics.

**Base URL:** `https://smart-store-saas-demo.vercel.app/api`  
**Local Development:** `http://localhost:3000/api`

## Authentication

All API endpoints require authentication using NextAuth.js with JWT tokens.

### Login
```bash
POST /api/auth/signin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

### Response
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "email": "admin@example.com",
    "name": "Admin User"
  },
  "token": "jwt-token-here"
}
```

## Products API

### Get Products
```bash
GET /api/products?page=1&limit=10&search=keyword&category=categoryId&sortBy=name&sortOrder=asc
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `search` (string, optional): Search term for name, description, or SKU
- `category` (string, optional): Filter by category ID
- `sortBy` (string, optional): Sort field (name, price, createdAt)
- `sortOrder` (string, optional): Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-123",
      "name": "Sample Product",
      "description": "Product description",
      "sku": "SKU-001",
      "price": 29.99,
      "cost": 15.00,
      "stock": 100,
      "isActive": true,
      "categoryId": "cat-123",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "message": "Products fetched successfully"
}
```

### Create Product
```bash
POST /api/products
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "New Product",
  "description": "Product description",
  "sku": "SKU-002",
  "price": 39.99,
  "cost": 20.00,
  "categoryId": "cat-123",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product-124",
    "name": "New Product",
    "description": "Product description",
    "sku": "SKU-002",
    "price": 39.99,
    "cost": 20.00,
    "stock": 0,
    "isActive": true,
    "categoryId": "cat-123",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Product created successfully"
}
```

### Update Product
```bash
PUT /api/products
Content-Type: application/json
Authorization: Bearer <token>

{
  "id": "product-123",
  "name": "Updated Product Name",
  "price": 49.99
}
```

### Delete Product
```bash
DELETE /api/products
Content-Type: application/json
Authorization: Bearer <token>

{
  "id": "product-123"
}
```

## Orders API

### Get Orders
```bash
GET /api/orders?page=1&limit=10&status=pending&customerId=customer-123
```

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `status` (string, optional): Order status (pending, processing, shipped, delivered, cancelled)
- `customerId` (string, optional): Filter by customer ID
- `dateFrom` (string, optional): Start date (ISO format)
- `dateTo` (string, optional): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-123",
      "orderNumber": "ORD-001",
      "status": "pending",
      "total": 99.98,
      "customerId": "customer-123",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "customer": {
        "id": "customer-123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "orderItems": [
        {
          "id": "item-123",
          "quantity": 2,
          "price": 29.99,
          "product": {
            "name": "Sample Product",
            "sku": "SKU-001"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Create Order
```bash
POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "customerId": "customer-123",
  "items": [
    {
      "productId": "product-123",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "country": "US"
  }
}
```

### Update Order Status
```bash
PUT /api/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "id": "order-123",
  "status": "processing"
}
```

## Customers API

### Get Customers
```bash
GET /api/customers?page=1&limit=10&search=john&segment=premium
```

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `search` (string, optional): Search term for name, email, or phone
- `segment` (string, optional): Customer segment

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "customer-123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zipCode": "12345"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "_count": {
        "orders": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Create Customer
```bash
POST /api/customers
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567891",
  "address": {
    "street": "456 Oak Ave",
    "city": "Another City",
    "state": "NY",
    "zipCode": "67890"
  }
}
```

## Analytics API

### Get Dashboard Statistics
```bash
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": 150,
    "orders": 500,
    "customers": 102,
    "revenue": 25000.50,
    "recentOrders": [
      {
        "id": "order-123",
        "orderNumber": "ORD-001",
        "total": 99.98,
        "status": "completed",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "topProducts": [
      {
        "id": "product-123",
        "name": "Best Seller",
        "sales": 50,
        "revenue": 1499.50
      }
    ]
  }
}
```

### Get Sales Analytics
```bash
GET /api/analytics/sales?period=30d&groupBy=day
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (string, optional): Time period (7d, 30d, 90d, 1y)
- `groupBy` (string, optional): Grouping (day, week, month)

## Monitoring API

### Health Check
```bash
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "responseTime": "15ms",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 12,
      "error": null
    },
    "memory": {
      "status": "ok",
      "usage": {
        "rss": 150,
        "heapTotal": 100,
        "heapUsed": 80,
        "external": 50
      },
      "error": null
    }
  },
  "version": "1.2.0",
  "environment": "production"
}
```

### Database Check
```bash
GET /api/db-check
```

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "responseTime": "25ms",
  "counts": {
    "users": 51,
    "products": 203,
    "orders": 500,
    "customers": 102
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Performance Dashboard
```bash
GET /api/performance/dashboard?timeRange=24h
Authorization: Bearer <token>
```

**Query Parameters:**
- `timeRange` (string, optional): Time range (1h, 24h, 7d)

### Security Audit
```bash
GET /api/security/audit
Authorization: Bearer <token>
```

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/endpoint",
  "requestId": "req_1234567890_abcdef"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

### Validation Errors

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "required"
    },
    {
      "field": "price",
      "message": "Price must be positive",
      "code": "too_small"
    }
  ]
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 10 requests per minute
- **CRUD operations**: 100 requests per 15 minutes
- **Analytics endpoints**: 50 requests per 15 minutes
- **Monitoring endpoints**: 200 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

The API supports webhooks for real-time notifications:

### Order Status Updates
```json
{
  "event": "order.status_changed",
  "data": {
    "orderId": "order-123",
    "status": "shipped",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Product Stock Updates
```json
{
  "event": "product.stock_updated",
  "data": {
    "productId": "product-123",
    "stock": 50,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const SmartStoreAPI = require('@smartstore/saas-sdk');

const client = new SmartStoreAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://smart-store-saas-demo.vercel.app/api'
});

// Get products
const products = await client.products.list({
  page: 1,
  limit: 10,
  search: 'keyword'
});

// Create order
const order = await client.orders.create({
  customerId: 'customer-123',
  items: [
    {
      productId: 'product-123',
      quantity: 2,
      price: 29.99
    }
  ]
});
```

### Python
```python
from smartstore_saas import SmartStoreClient

client = SmartStoreClient(
    api_key='your-api-key',
    base_url='https://smart-store-saas-demo.vercel.app/api'
)

# Get products
products = client.products.list(page=1, limit=10, search='keyword')

# Create order
order = client.orders.create(
    customer_id='customer-123',
    items=[
        {
            'product_id': 'product-123',
            'quantity': 2,
            'price': 29.99
        }
    ]
)
```

## Support

For API support and questions:
- **Documentation**: [https://docs.smartstore-saas.com](https://docs.smartstore-saas.com)
- **Support Email**: support@smartstore-saas.com
- **Status Page**: [https://status.smartstore-saas.com](https://status.smartstore-saas.com)

## Changelog

### Version 1.2.0
- Added comprehensive validation with detailed error messages
- Implemented Redis caching for improved performance
- Added security headers and audit endpoints
- Enhanced error tracking and monitoring
- Added database query optimization

### Version 1.1.0
- Added analytics and reporting endpoints
- Implemented webhook support
- Added customer segmentation
- Enhanced order management

### Version 1.0.0
- Initial API release
- Basic CRUD operations for products, orders, customers
- Authentication and authorization
- Basic monitoring and health checks




