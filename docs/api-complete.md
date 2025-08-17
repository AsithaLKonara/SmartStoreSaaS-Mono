# SmartStoreSaaS - Complete API Documentation

## Overview

This document provides comprehensive documentation for all implemented API endpoints in the SmartStoreSaaS platform. All endpoints use JWT authentication and include proper validation, error handling, and organization isolation.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Validation errors if applicable
}
```

## Endpoints

### 1. Authentication

#### POST /api/auth/signin
**Description:** User sign in with email and password

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
      "id": "user_id",
      "email": "admin@demo.com",
      "name": "Admin Demo",
      "role": "ADMIN",
      "organizationId": "org_id",
      "organization": {
        "id": "org_id",
        "name": "Demo Store",
        "slug": "demo-store",
        "plan": "PRO"
      }
    },
    "token": "jwt_token_here"
  },
  "message": "Sign in successful"
}
```

#### POST /api/auth/signup
**Description:** User registration with organization creation

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "name": "New User",
  "organizationName": "My Store",
  "organizationSlug": "my-store"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "newuser@example.com",
      "name": "New User",
      "role": "ADMIN",
      "organizationId": "org_id"
    },
    "organization": {
      "id": "org_id",
      "name": "My Store",
      "slug": "my-store",
      "plan": "STARTER"
    },
    "token": "jwt_token_here"
  },
  "message": "Registration successful"
}
```

### 2. Product Management

#### GET /api/products
**Description:** List products with pagination, search, and filters

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name, description, or SKU
- `minStock` (optional): Minimum stock quantity
- `maxStock` (optional): Maximum stock quantity
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_id",
        "name": "Premium Wood Watch",
        "slug": "premium-wood-watch",
        "sku": "WW-001",
        "description": "Handcrafted wooden watch...",
        "price": 89.99,
        "stockQuantity": 25,
        "images": ["/images/products/wood-watch-1.jpg"],
        "isActive": true,
        "createdBy": {
          "id": "user_id",
          "name": "Admin Demo",
          "email": "admin@demo.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### POST /api/products
**Description:** Create new product (Admin/Manager only)

**Request Body:**
```json
{
  "name": "New Product",
  "slug": "new-product",
  "sku": "NP-001",
  "description": "Product description",
  "price": 99.99,
  "stockQuantity": 50,
  "images": ["/images/products/new-product.jpg"],
  "isActive": true
}
```

#### GET /api/products/[id]
**Description:** Get product by ID

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod_id",
      "name": "Product Name",
      "slug": "product-slug",
      "sku": "SKU-001",
      "description": "Product description",
      "price": 99.99,
      "stockQuantity": 50,
      "images": ["/images/products/product.jpg"],
      "isActive": true,
      "createdBy": {
        "id": "user_id",
        "name": "Admin Demo",
        "email": "admin@demo.com"
      },
      "organization": {
        "id": "org_id",
        "name": "Demo Store",
        "slug": "demo-store"
      }
    }
  }
}
```

#### PUT /api/products/[id]
**Description:** Update product (Admin/Manager only)

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "price": 89.99,
  "stockQuantity": 45
}
```

#### DELETE /api/products/[id]
**Description:** Delete product (Admin only)

### 3. Order Management

#### GET /api/orders
**Description:** List orders with pagination and filters

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by order status
- `paymentStatus` (optional): Filter by payment status
- `customerId` (optional): Filter by customer
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `search` (optional): Search by order number, customer name, or email

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_id",
        "orderNumber": "ORD-001",
        "customer": {
          "id": "customer_id",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+1-555-0123"
        },
        "totalAmount": 239.98,
        "status": "CONFIRMED",
        "paymentStatus": "COMPLETED",
        "createdAt": "2024-01-15T10:30:00Z",
        "items": [
          {
            "id": "item_id",
            "quantity": 1,
            "price": 89.99,
            "total": 89.99,
            "product": {
              "id": "prod_id",
              "name": "Premium Wood Watch",
              "sku": "WW-001",
              "images": ["/images/products/wood-watch-1.jpg"]
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### POST /api/orders
**Description:** Create new order (Admin/Manager/Staff only)

**Request Body:**
```json
{
  "customerId": "customer_id",
  "items": [
    {
      "productId": "prod_id",
      "quantity": 2,
      "price": 89.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "shippingMethod": "standard",
  "paymentMethod": "stripe",
  "notes": "Customer requested gift wrapping",
  "taxRate": 8.5,
  "shippingCost": 9.99
}
```

#### GET /api/orders/[id]
**Description:** Get order by ID

#### PUT /api/orders/[id]
**Description:** Update order (Admin/Manager/Staff only)

#### PATCH /api/orders/[id]
**Description:** Update order status specifically

**Request Body:**
```json
{
  "status": "PACKED",
  "notes": "Order packed and ready for shipping"
}
```

### 4. Customer Management

#### GET /api/customers
**Description:** List customers with pagination and filters

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name, email, or phone
- `isActive` (optional): Filter by active status
- `source` (optional): Filter by customer source
- `tags` (optional): Filter by tags (comma-separated)

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "customer_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1-555-0123",
        "isActive": true,
        "tags": ["vip", "returning"],
        "orders": [
          {
            "id": "order_id",
            "orderNumber": "ORD-001",
            "totalAmount": 239.98,
            "status": "COMPLETED",
            "createdAt": "2024-01-15T10:30:00Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### POST /api/customers
**Description:** Create new customer (Admin/Manager/Staff only)

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-0124",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zipCode": "90210",
    "country": "USA"
  },
  "tags": ["new", "potential"],
  "source": "website",
  "notes": "Found through Google Ads"
}
```

#### GET /api/customers/[id]
**Description:** Get customer by ID with order history and statistics

#### PUT /api/customers/[id]
**Description:** Update customer (Admin/Manager/Staff only)

#### DELETE /api/customers/[id]
**Description:** Delete customer (Admin only)

### 5. Analytics

#### GET /api/analytics
**Description:** Get comprehensive analytics data

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y, default: 30d)
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 15420.50,
      "totalOrders": 125,
      "averageOrderValue": 123.36,
      "totalCustomers": 89,
      "growthRate": 15.2,
      "period": "30d"
    },
    "sales": {
      "revenue": 15420.50,
      "orders": 125,
      "averageOrderValue": 123.36,
      "dailyTrend": [
        {
          "date": "2024-01-15T00:00:00Z",
          "revenue": 450.25,
          "orders": 3
        }
      ]
    },
    "orders": {
      "statusDistribution": [
        { "status": "COMPLETED", "count": 98 },
        { "status": "PENDING", "count": 15 },
        { "status": "PROCESSING", "count": 12 }
      ],
      "paymentStatusDistribution": [
        { "status": "COMPLETED", "count": 98 },
        { "status": "PENDING", "count": 27 }
      ]
    },
    "products": {
      "topSellers": [
        {
          "productId": "prod_id",
          "product": {
            "id": "prod_id",
            "name": "Premium Wood Watch",
            "sku": "WW-001",
            "images": ["/images/products/wood-watch-1.jpg"]
          },
          "revenue": 3599.60,
          "unitsSold": 40,
          "orderCount": 35
        }
      ],
      "lowStock": [
        {
          "id": "prod_id",
          "name": "LED Name Board",
          "sku": "LED-NB-001",
          "stockQuantity": 5,
          "price": 149.99
        }
      ]
    },
    "customers": {
      "total": 89,
      "new": 23,
      "returning": 66,
      "retentionRate": 74.16
    },
    "insights": {
      "bestPerformingProduct": {
        "productId": "prod_id",
        "product": {
          "id": "prod_id",
          "name": "Premium Wood Watch",
          "sku": "WW-001"
        },
        "revenue": 3599.60,
        "unitsSold": 40
      },
      "revenuePerCustomer": 173.26,
      "orderFrequency": 1.40
    }
  }
}
```

### 6. Payment Processing

#### GET /api/payments
**Description:** List payments with pagination and filters

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by payment status
- `method` (optional): Filter by payment method
- `gateway` (optional): Filter by payment gateway
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `orderId` (optional): Filter by order ID

#### POST /api/payments
**Description:** Create new payment (Admin/Manager/Staff only)

**Request Body:**
```json
{
  "orderId": "order_id",
  "amount": 239.98,
  "currency": "USD",
  "method": "STRIPE",
  "gateway": "stripe",
  "metadata": {
    "paymentMethod": "card",
    "last4": "4242"
  },
  "notes": "Payment processed successfully"
}
```

## Error Codes

- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Missing or invalid token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `409` - Conflict (Resource already exists)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

All endpoints are protected by rate limiting:
- **Authentication endpoints**: 5 requests per minute
- **Other endpoints**: 100 requests per minute

## Organization Isolation

All data is automatically filtered by the user's organization. Users can only access data belonging to their organization.

## Activity Logging

All significant operations are automatically logged with:
- User ID
- Operation type
- Description
- Metadata
- Timestamp

## Testing

### Test Credentials
```
Demo Store: admin@demo.com / password123
Tech Gadgets: manager@tech.com / password123
Fashion Boutique: staff@fashion.com / password123
```

### Testing Tools
- Use Postman or similar API testing tool
- Include JWT token in Authorization header
- Test with different user roles to verify permissions

## Security Features

- JWT-based authentication
- Role-based access control
- Organization isolation
- Input validation with Zod
- Rate limiting
- Activity logging
- Secure cookie handling
- CSRF protection

## Next Steps

1. **Database Connection**: Resolve Docker/MongoDB connection issues
2. **Frontend Integration**: Connect frontend components to these APIs
3. **Testing**: Implement comprehensive test suites
4. **Production**: Deploy with proper environment variables and SSL
5. **Monitoring**: Add logging and monitoring solutions
