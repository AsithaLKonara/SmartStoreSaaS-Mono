// MongoDB Replica Set Initialization Script
// This script initializes a replica set for Prisma compatibility

print('Starting MongoDB replica set initialization...');

// Wait for MongoDB to be ready
sleep(5000);

try {
  // Initialize the replica set
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "localhost:27017" }
    ]
  });
  
  print('Replica set initialized successfully');
  
  // Wait for the replica set to be ready
  while (rs.status().ok !== 1) {
    print('Waiting for replica set to be ready...');
    sleep(1000);
  }
  
  print('Replica set is ready!');
  
  // Create the smartstore database and collections
  db = db.getSiblingDB('smartstore');
  
  // Create collections that Prisma expects
  db.createCollection('organizations');
  db.createCollection('users');
  db.createCollection('products');
  db.createCollection('customers');
  db.createCollection('orders');
  db.createCollection('orderItems');
  db.createCollection('payments');
  db.createCollection('customerConversations');
  db.createCollection('chatMessages');
  db.createCollection('campaigns');
  db.createCollection('bulkOperations');
  db.createCollection('reports');
  db.createCollection('integrations');
  db.createCollection('couriers');
  db.createCollection('warehouses');
  db.createCollection('analytics');
  db.createCollection('notifications');
  db.createCollection('workflows');
  db.createCollection('webhooks');
  db.createCollection('auditLogs');
  db.createCollection('categories');
  db.createCollection('inventory');
  db.createCollection('templates');
  db.createCollection('activities');
  
  print('Collections created successfully');
  
} catch (error) {
  print('Error during replica set initialization: ' + error.message);
}
