# SmartStoreSaaS API Documentation

## Overview

This document provides comprehensive API documentation for the SmartStoreSaaS platform. All endpoints support JSON request/response formats and require proper authentication.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

All API endpoints require authentication via JWT tokens or session cookies. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Common Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "error": null
}
```

## Error Response Format

```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

---

## Authentication Endpoints

### POST /api/auth/signin

User sign in endpoint.

**Request Body:**
```json
{
  "email": "admin@demo.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_001",
      "email": "admin@demo.com",
      "name": "Admin Demo",
      "role": "ADMIN",
      "organizationId": "org_demo_store"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Sign in successful"
}
```

### POST /api/auth/signup

User registration endpoint.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "name": "New User",
  "organizationName": "My Store",
  "organizationSubdomain": "mystore"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_002",
      "email": "newuser@example.com",
      "name": "New User",
      "role": "ADMIN"
    },
    "organization": {
      "id": "org_my_store",
      "name": "My Store",
      "subdomain": "mystore"
    }
  },
  "message": "Registration successful"
}
```

---

## Product Management

### GET /api/products

Retrieve products with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search query
- `category` (string): Category filter
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `inStock` (boolean): Stock availability filter

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_wood_watch",
        "name": "Premium Wood Watch",
        "sku": "WW-001",
        "description": "Handcrafted wooden watch...",
        "price": 89.99,
        "stock": 25,
        "images": ["/images/products/wood-watch-1.jpg"],
        "categoryId": "cat_watches",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 6,
      "totalPages": 1
    }
  }
}
```

### GET /api/products/:id

Retrieve a specific product by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod_wood_watch",
    "name": "Premium Wood Watch",
    "sku": "WW-001",
    "description": "Handcrafted wooden watch...",
    "price": 89.99,
    "stock": 25,
    "images": ["/images/products/wood-watch-1.jpg"],
    "categoryId": "cat_watches",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/products

Create a new product (Admin/Manager only).

**Request Body:**
```json
{
  "name": "New Product",
  "sku": "NP-001",
  "description": "Product description",
  "price": 99.99,
  "stock": 50,
  "categoryId": "cat_electronics",
  "images": ["/images/products/new-product.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod_new_product",
    "name": "New Product",
    "sku": "NP-001",
    "description": "Product description",
    "price": 99.99,
    "stock": 50,
    "categoryId": "cat_electronics",
    "images": ["/images/products/new-product.jpg"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Product created successfully"
}
```

---

## Order Management

### GET /api/orders

Retrieve orders with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Order status filter
- `customerId` (string): Customer filter
- `dateFrom` (string): Start date (ISO format)
- `dateTo` (string): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_001",
        "customerId": "cust_john_doe",
        "totalAmount": 239.98,
        "status": "CONFIRMED",
        "paymentStatus": "COMPLETED",
        "shippingAddress": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "country": "USA",
          "zipCode": "10001"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

### POST /api/orders

Create a new order.

**Request Body:**
```json
{
  "customerId": "cust_john_doe",
  "items": [
    {
      "productId": "prod_wood_watch",
      "quantity": 2,
      "price": 89.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "zipCode": "10001"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "zipCode": "10001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_003",
    "customerId": "cust_john_doe",
    "totalAmount": 179.98,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "items": [
      {
        "id": "item_004",
        "productId": "prod_wood_watch",
        "quantity": 2,
        "price": 89.99
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Order created successfully"
}
```

---

## Customer Management

### GET /api/customers

Retrieve customers with pagination and search.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `search` (string): Search by name or email
- `organizationId` (string): Organization filter

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "cust_john_doe",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1-555-0123",
        "totalSpent": 239.98,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

### POST /api/customers

Create a new customer.

**Request Body:**
```json
{
  "name": "New Customer",
  "email": "newcustomer@example.com",
  "phone": "+1-555-0127"
}
```

---

## Analytics Endpoints

### GET /api/analytics/overview

Get overview analytics for the organization.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 1239.97,
    "orderCount": 2,
    "customerCount": 8,
    "averageOrderValue": 619.99,
    "topProducts": [
      {
        "id": "prod_smartphone",
        "name": "SmartPhone Pro Max",
        "totalSold": 1,
        "revenue": 999.99
      }
    ],
    "monthlyData": {
      "2024-01": {
        "total": 1239.97,
        "count": 2
      }
    }
  }
}
```

### GET /api/analytics/enhanced

Get enhanced analytics with detailed insights.

**Response:**
```json
{
  "success": true,
  "data": {
    "salesAnalytics": {
      "totalRevenue": 1239.97,
      "monthlyGrowth": 15.5,
      "topPerformingProducts": [],
      "salesByCategory": {}
    },
    "customerAnalytics": {
      "totalCustomers": 8,
      "newCustomersThisMonth": 3,
      "customerRetentionRate": 75.0,
      "customerSegments": {}
    },
    "inventoryAnalytics": {
      "totalProducts": 6,
      "lowStockItems": 1,
      "inventoryValue": 15499.85
    }
  }
}
```

---

## Chat & Support

### GET /api/chat/conversations

Retrieve chat conversations.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_001",
        "customerId": "cust_john_doe",
        "status": "active",
        "assignedTo": "user_001",
        "lastMessageAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### POST /api/chat/conversations/:id/messages

Send a message in a conversation.

**Request Body:**
```json
{
  "content": "Hello! How can I help you today?",
  "type": "text"
}
```

---

## Payment Processing

### POST /api/payments

Create a new payment.

**Request Body:**
```json
{
  "orderId": "order_003",
  "amount": 179.98,
  "currency": "USD",
  "provider": "STRIPE",
  "metadata": {
    "paymentMethod": "card",
    "last4": "4242"
  }
}
```

### POST /api/webhooks/stripe

Stripe webhook endpoint for payment updates.

**Headers:**
```
Stripe-Signature: t=1234567890,v1=abc123...
```

**Request Body:** Raw Stripe webhook payload

---

## Inventory Management

### GET /api/warehouses/inventory

Get inventory status across warehouses.

**Response:**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "id": "inv_wood_watch",
        "productId": "prod_wood_watch",
        "productName": "Premium Wood Watch",
        "warehouseId": "warehouse_main",
        "quantity": 25,
        "reserved": 0,
        "available": 25,
        "lastUpdated": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **API endpoints**: 100 requests per minute per user
- **File uploads**: 10 requests per minute

---

## Webhook Security

All webhook endpoints verify signatures to ensure authenticity:

- **Stripe**: Uses `Stripe-Signature` header
- **PayPal**: Uses `PAYPAL-SIGNATURE` header
- **WhatsApp**: Uses `X-Hub-Signature-256` header

---

## Testing

Use the provided mock data and seed script for testing:

```bash
# Run database seeding
npm run seed

# Test with mock credentials
# Demo Store: admin@demo.com / password123
# Tech Gadgets: manager@tech.com / password123
# Fashion Boutique: staff@fashion.com / password123
```

---

## Support

For API support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation
