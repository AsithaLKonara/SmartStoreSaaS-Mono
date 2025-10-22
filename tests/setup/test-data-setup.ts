import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function setupTestData() {
  console.log('🔧 Setting up test data for E2E tests...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@smartstore.lk' },
      update: {},
      create: {
        email: 'admin@smartstore.lk',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
      },
    });

    // Create test organization
    let testOrg = await prisma.organization.findFirst({
      where: { name: 'Sample Business Ltd' }
    });

    if (!testOrg) {
      testOrg = await prisma.organization.create({
        data: {
          name: 'Sample Business Ltd',
          plan: 'PROFESSIONAL',
          status: 'ACTIVE',
          address: {
            street: '123 Business Street',
            city: 'Colombo',
            district: 'Colombo',
            postalCode: '00100'
          },
          phone: '+94 77 123 4567',
          email: 'info@samplebusiness.lk',
          website: 'https://samplebusiness.lk',
          description: 'A sample business for testing',
          settings: {
            currency: 'LKR',
            timezone: 'Asia/Colombo',
            language: 'en'
          }
        },
      });
    }

    // Create business owner user
    const ownerPassword = await bcrypt.hash('password123', 12);
    const ownerUser = await prisma.user.upsert({
      where: { email: 'owner@samplebusiness.lk' },
      update: {},
      create: {
        email: 'owner@samplebusiness.lk',
        name: 'Business Owner',
        password: ownerPassword,
        role: 'ADMIN',
        organizationId: testOrg.id,
        isActive: true,
        emailVerified: new Date(),
      },
    });

    // Create staff user
    const staffPassword = await bcrypt.hash('password123', 12);
    const staffUser = await prisma.user.upsert({
      where: { email: 'staff@samplebusiness.lk' },
      update: {},
      create: {
        email: 'staff@samplebusiness.lk',
        name: 'Staff Member',
        password: staffPassword,
        role: 'USER',
        organizationId: testOrg.id,
        isActive: true,
        emailVerified: new Date(),
      },
    });

    // Get or create packages
    let starterPackage = await prisma.package.findFirst({
      where: { name: 'Starter' }
    });

    if (!starterPackage) {
      starterPackage = await prisma.package.create({
        data: {
          name: 'Starter',
          description: 'Perfect for small businesses',
          price: 2500,
          currency: 'LKR',
          billingCycle: 'MONTHLY',
          features: {
            max_products: 50,
            inventory_management: true,
            order_management: true,
            basic_analytics: true,
            email_support: true
          },
          isActive: true,
          isTrial: false,
          trialDays: 7,
          maxUsers: 2,
          maxOrders: 25,
          maxStorage: 100
        },
      });
    }

    let professionalPackage = await prisma.package.findFirst({
      where: { name: 'Professional' }
    });

    if (!professionalPackage) {
      professionalPackage = await prisma.package.create({
        data: {
          name: 'Professional',
          description: 'Ideal for growing businesses',
          price: 5000,
          currency: 'LKR',
          billingCycle: 'MONTHLY',
          features: {
            max_products: 200,
            inventory_management: true,
            order_management: true,
            advanced_analytics: true,
            whatsapp_api: true,
            courier_integration: true,
            priority_support: true
          },
          isActive: true,
          isTrial: false,
          trialDays: 14,
          maxUsers: 5,
          maxOrders: 100,
          maxStorage: 500
        },
      });
    }

    // Create active subscription for test organization
    let subscription = await prisma.subscription.findFirst({
      where: { 
        organizationId: testOrg.id,
        packageId: professionalPackage.id
      }
    });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          organizationId: testOrg.id,
          packageId: professionalPackage.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          isTrial: false,
          autoRenew: true
        },
      });
    }

    // Create some test products
    let product1 = await prisma.product.findFirst({
      where: { 
        name: 'Test Product 1',
        organizationId: testOrg.id
      }
    });

    if (!product1) {
      product1 = await prisma.product.create({
        data: {
          name: 'Test Product 1',
          description: 'A test product for E2E testing',
          price: 1000,
          organizationId: testOrg.id,
          createdById: ownerUser.id,
          status: 'ACTIVE',
          inventoryQuantity: 50,
          sku: 'TEST-001'
        },
      });
    }

    let product2 = await prisma.product.findFirst({
      where: { 
        name: 'Test Product 2',
        organizationId: testOrg.id
      }
    });

    if (!product2) {
      product2 = await prisma.product.create({
        data: {
          name: 'Test Product 2',
          description: 'Another test product',
          price: 2000,
          organizationId: testOrg.id,
          createdById: ownerUser.id,
          status: 'ACTIVE',
          inventoryQuantity: 25,
          sku: 'TEST-002'
        },
      });
    }

    const products = [product1, product2];

    // Create test warehouse
    let warehouse = await prisma.warehouse.findFirst({
      where: { 
        name: 'Main Warehouse',
        organizationId: testOrg.id
      }
    });

    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: {
          name: 'Main Warehouse',
          organizationId: testOrg.id,
          address: {
            street: '123 Warehouse Street',
            city: 'Colombo',
            district: 'Colombo',
            postalCode: '00100'
          },
          capacity: 1000,
          isActive: true
        },
      });
    }

    // Create some test orders
    let order1 = await prisma.order.findFirst({
      where: { orderNumber: 'ORD001' }
    });

    if (!order1) {
      order1 = await prisma.order.create({
        data: {
          orderNumber: 'ORD001',
          organizationId: testOrg.id,
          customerId: null, // Guest order
          status: 'CONFIRMED',
          totalAmount: 1000,
          total: 1000,
          currency: 'LKR',
          paymentStatus: 'PENDING',
          shippingAddress: {
            street: '123 Customer Street',
            city: 'Colombo',
            district: 'Colombo',
            postalCode: '00100'
          },
          items: [
            {
              productId: products[0].id,
              quantity: 1,
              price: 1000,
              total: 1000
            }
          ]
        },
      });
    }

    let order2 = await prisma.order.findFirst({
      where: { orderNumber: 'ORD002' }
    });

    if (!order2) {
      order2 = await prisma.order.create({
        data: {
          orderNumber: 'ORD002',
          organizationId: testOrg.id,
          customerId: null,
          status: 'DELIVERED',
          totalAmount: 2000,
          total: 2000,
          currency: 'LKR',
          paymentStatus: 'PAID',
          shippingAddress: {
            street: '456 Customer Avenue',
            city: 'Kandy',
            district: 'Kandy',
            postalCode: '20000'
          },
          items: [
            {
              productId: products[1].id,
              quantity: 1,
              price: 2000,
              total: 2000
            }
          ]
        },
      });
    }

    const orders = [order1, order2];

    // Create test registration requests
    let regRequest1 = await prisma.registrationRequest.findFirst({
      where: { email: 'test1@business.lk' }
    });

    if (!regRequest1) {
      regRequest1 = await prisma.registrationRequest.create({
        data: {
          businessName: 'Test Business 1',
          contactName: 'Test Contact 1',
          email: 'test1@business.lk',
          phone: '+94 77 111 1111',
          address: {
            street: '111 Test Street',
            city: 'Colombo',
            district: 'Colombo',
            postalCode: '00100'
          },
          requestedPlan: 'TRIAL',
          status: 'PENDING',
          packageId: starterPackage.id
        },
      });
    }

    let regRequest2 = await prisma.registrationRequest.findFirst({
      where: { email: 'test2@business.lk' }
    });

    if (!regRequest2) {
      regRequest2 = await prisma.registrationRequest.create({
        data: {
          businessName: 'Test Business 2',
          contactName: 'Test Contact 2',
          email: 'test2@business.lk',
          phone: '+94 77 222 2222',
          address: {
            street: '222 Test Avenue',
            city: 'Kandy',
            district: 'Kandy',
            postalCode: '20000'
          },
          requestedPlan: 'PAID',
          status: 'PENDING',
          packageId: professionalPackage.id
        },
      });
    }

    const registrationRequests = [regRequest1, regRequest2];

    console.log('✅ Test data setup completed successfully!');
    console.log('📊 Created:');
    console.log(`  - Admin user: ${adminUser.email}`);
    console.log(`  - Test organization: ${testOrg.name}`);
    console.log(`  - Business owner: ${ownerUser.email}`);
    console.log(`  - Staff user: ${staffUser.email}`);
    console.log(`  - Packages: ${starterPackage.name}, ${professionalPackage.name}`);
    console.log(`  - Subscription: ${subscription.id}`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Orders: ${orders.length}`);
    console.log(`  - Registration requests: ${registrationRequests.length}`);

    return {
      adminUser,
      testOrg,
      ownerUser,
      staffUser,
      starterPackage,
      professionalPackage,
      subscription,
      products,
      orders,
      registrationRequests
    };

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupTestData()
    .then(() => {
      console.log('🎉 Test data setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test data setup failed:', error);
      process.exit(1);
    });
}


