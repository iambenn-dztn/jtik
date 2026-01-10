// MongoDB initialization script
db = db.getSiblingDB("jtik");

// Create collections
db.createCollection("customers");
db.createCollection("accounts");

// Create indexes
db.customers.createIndex({ id: 1 }, { unique: true });
db.customers.createIndex({ phone: 1 });
db.customers.createIndex({ status: 1 });

db.accounts.createIndex({ id: 1 }, { unique: true });
db.accounts.createIndex({ username: 1 }, { unique: true });

print("✅ MongoDB initialized successfully!");
