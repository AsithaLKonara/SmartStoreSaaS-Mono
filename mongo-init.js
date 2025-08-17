// MongoDB initialization script for SmartStore SaaS
// This script runs when the MongoDB container starts for the first time

// Switch to the smartstore database
db = db.getSiblingDB('smartstore');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('organizations');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('customers');
db.createCollection('categories');
db.createCollection('inventory');
db.createCollection('payments');
db.createCollection('campaigns');
db.createCollection('analytics');
db.createCollection('chat_conversations');
db.createCollection('chat_messages');
db.createCollection('notifications');
db.createCollection('workflows');
db.createCollection('integrations');
db.createCollection('webhooks');
db.createCollection('audit_logs');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "organizationId": 1 });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });

db.organizations.createIndex({ "name": 1 });
db.organizations.createIndex({ "domain": 1 }, { sparse: true });

db.products.createIndex({ "organizationId": 1 });
db.products.createIndex({ "categoryId": 1 });
db.products.createIndex({ "sku": 1 });
db.products.createIndex({ "name": "text", "description": "text" });

db.orders.createIndex({ "organizationId": 1 });
db.orders.createIndex({ "customerId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });

db.customers.createIndex({ "organizationId": 1 });
db.customers.createIndex({ "email": 1 });
db.customers.createIndex({ "phone": 1 });

db.categories.createIndex({ "organizationId": 1 });
db.categories.createIndex({ "parentId": 1 });

db.inventory.createIndex({ "productId": 1 });
db.inventory.createIndex({ "warehouseId": 1 });
db.inventory.createIndex({ "organizationId": 1 });

db.payments.createIndex({ "orderId": 1 });
db.payments.createIndex({ "organizationId": 1 });
db.payments.createIndex({ "status": 1 });

db.campaigns.createIndex({ "organizationId": 1 });
db.campaigns.createIndex({ "status": 1 });
db.campaigns.createIndex({ "startDate": 1 });

db.analytics.createIndex({ "organizationId": 1 });
db.analytics.createIndex({ "date": -1 });
db.analytics.createIndex({ "type": 1 });

db.chat_conversations.createIndex({ "organizationId": 1 });
db.chat_conversations.createIndex({ "customerId": 1 });
db.chat_conversations.createIndex({ "status": 1 });

db.chat_messages.createIndex({ "conversationId": 1 });
db.chat_messages.createIndex({ "createdAt": -1 });

db.notifications.createIndex({ "userId": 1 });
db.notifications.createIndex({ "organizationId": 1 });
db.notifications.createIndex({ "read": 1 });

db.workflows.createIndex({ "organizationId": 1 });
db.workflows.createIndex({ "status": 1 });

db.integrations.createIndex({ "organizationId": 1 });
db.integrations.createIndex({ "type": 1 });

db.webhooks.createIndex({ "organizationId": 1 });
db.webhooks.createIndex({ "url": 1 });

db.audit_logs.createIndex({ "organizationId": 1 });
db.audit_logs.createIndex({ "userId": 1 });
db.audit_logs.createIndex({ "createdAt": -1 });

// Insert default categories
db.categories.insertMany([
  {
    name: "Electronics",
    description: "Electronic devices and accessories",
    slug: "electronics",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Clothing",
    description: "Apparel and fashion items",
    slug: "clothing",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Home & Garden",
    description: "Home improvement and garden supplies",
    slug: "home-garden",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create a default admin user (password should be changed in production)
db.users.insertOne({
  email: "admin@smartstore.com",
  name: "System Administrator",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqQK8e", // "admin123"
  role: "ADMIN",
  isActive: true,
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

print("SmartStore database initialized successfully!");
print("Default categories and admin user created.");
print("Admin credentials: admin@smartstore.com / admin123"); 