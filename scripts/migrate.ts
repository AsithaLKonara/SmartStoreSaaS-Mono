#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface Migration {
  id: string;
  name: string;
  executed: boolean;
  executedAt?: Date;
}

class DatabaseMigrator {
  private migrations: Migration[] = [];

  constructor() {
    this.loadMigrations();
  }

  private loadMigrations() {
    try {
      const migrationsFile = join(process.cwd(), 'migrations.json');
      const content = readFileSync(migrationsFile, 'utf-8');
      this.migrations = JSON.parse(content);
    } catch (error) {
      console.log('No migrations file found, starting fresh');
      this.migrations = [];
    }
  }

  private saveMigrations() {
    const migrationsFile = join(process.cwd(), 'migrations.json');
    writeFileSync(migrationsFile, JSON.stringify(this.migrations, null, 2));
  }

  async runPendingMigrations() {
    console.log('🔍 Checking for pending migrations...');

    const pendingMigrations = this.migrations.filter(m => !m.executed);
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations found');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`🔄 Running migration: ${migration.name}`);
        await this.executeMigration(migration);
        
        // Mark as executed
        migration.executed = true;
        migration.executedAt = new Date();
        
        console.log(`✅ Migration completed: ${migration.name}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migration.name}`, error);
        throw error;
      }
    }

    this.saveMigrations();
    console.log('🎉 All migrations completed successfully');
  }

  private async executeMigration(migration: Migration) {
    switch (migration.id) {
      case '001-create-indexes':
        await this.createIndexes();
        break;
      case '002-add-constraints':
        await this.addConstraints();
        break;
      case '003-seed-data':
        await this.seedData();
        break;
      default:
        throw new Error(`Unknown migration: ${migration.id}`);
    }
  }

  private async createIndexes() {
    console.log('📊 Creating database indexes...');
    
    // Create indexes for better performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_products_organization ON products(organization_id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_orders_organization ON orders(organization_id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_customers_organization ON customers(organization_id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
    `;

    console.log('✅ Indexes created successfully');
  }

  private async addConstraints() {
    console.log('🔒 Adding database constraints...');
    
    // Add check constraints for data integrity
    await prisma.$executeRaw`
      ALTER TABLE products ADD CONSTRAINT check_positive_price 
      CHECK (price > 0);
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE products ADD CONSTRAINT check_positive_cost 
      CHECK (cost IS NULL OR cost > 0);
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE orders ADD CONSTRAINT check_positive_total 
      CHECK (total >= 0);
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE order_items ADD CONSTRAINT check_positive_quantity 
      CHECK (quantity > 0);
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE order_items ADD CONSTRAINT check_positive_price 
      CHECK (price >= 0);
    `;

    console.log('✅ Constraints added successfully');
  }

  private async seedData() {
    console.log('🌱 Seeding initial data...');
    
    // Check if data already exists
    const existingOrgs = await prisma.organizations.count();
    if (existingOrgs > 0) {
      console.log('📋 Data already exists, skipping seed');
      return;
    }

    // Create default organization
    const organization = await prisma.organizations.create({
      data: {
        id: 'default-org',
        name: 'Default Organization',
        status: 'ACTIVE',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Created organization: ${organization.name}`);

    // Create default categories
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Books', description: 'Books and educational materials' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
      { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' }
    ];

    for (const categoryData of categories) {
      const category = await prisma.categories.create({
        data: {
          id: `cat-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: categoryData.name,
          description: categoryData.description,
          organizationId: organization.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created category: ${category.name}`);
    }

    console.log('✅ Initial data seeded successfully');
  }

  async backup() {
    console.log('💾 Creating database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.sql`;
    
    try {
      // This would require pg_dump in production
      console.log(`📁 Backup would be saved as: ${backupFile}`);
      console.log('⚠️  In production, implement actual backup using pg_dump');
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  async restore(backupFile: string) {
    console.log(`🔄 Restoring from backup: ${backupFile}`);
    
    try {
      // This would require psql in production
      console.log('⚠️  In production, implement actual restore using psql');
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }

  async status() {
    console.log('📊 Migration Status:');
    console.log('==================');
    
    for (const migration of this.migrations) {
      const status = migration.executed ? '✅' : '⏳';
      const executedAt = migration.executedAt ? ` (${migration.executedAt.toISOString()})` : '';
      console.log(`${status} ${migration.name}${executedAt}`);
    }
    
    const pending = this.migrations.filter(m => !m.executed).length;
    const completed = this.migrations.filter(m => m.executed).length;
    
    console.log(`\n📈 Summary: ${completed} completed, ${pending} pending`);
  }
}

// CLI interface
async function main() {
  const migrator = new DatabaseMigrator();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'migrate':
        await migrator.runPendingMigrations();
        break;
      case 'status':
        await migrator.status();
        break;
      case 'backup':
        await migrator.backup();
        break;
      case 'restore':
        const backupFile = process.argv[3];
        if (!backupFile) {
          console.error('❌ Please provide backup file path');
          process.exit(1);
        }
        await migrator.restore(backupFile);
        break;
      default:
        console.log('Usage: npm run migrate [migrate|status|backup|restore]');
        console.log('  migrate - Run pending migrations');
        console.log('  status  - Show migration status');
        console.log('  backup  - Create database backup');
        console.log('  restore - Restore from backup file');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { DatabaseMigrator };
