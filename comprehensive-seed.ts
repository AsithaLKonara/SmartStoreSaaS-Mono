import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // Clear existing data
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    console.log('🗑️  Cleared existing data');

    // Create Organizations
    const organizations = await Promise.all([
      prisma.organization.create({
        data: {
          id: 'org-electronics-lk',
          name: 'TechHub Electronics',
          slug: 'techhub-electronics',
          description: 'Leading electronics retailer in Sri Lanka',
          email: 'info@techhub.lk',
          phone: '+94 11 234 5678',
          address: '123 Galle Road, Colombo 03',
          city: 'Colombo',
          state: 'Western Province',
          country: 'Sri Lanka',
          postalCode: '00300',
          timezone: 'Asia/Colombo',
          currency: 'LKR',
          language: 'en',
          logo: '/logos/techhub-logo.png',
          website: 'https://techhub.lk',
          isActive: true,
          settings: {
            theme: 'light',
            notifications: true,
            analytics: true,
            inventoryAlerts: true
          },
          metadata: {
            businessType: 'Electronics Retail',
            establishedYear: 2015,
            employeeCount: 25
          }
        }
      }),
      prisma.organization.create({
        data: {
          id: 'org-fashion-lk',
          name: 'Colombo Fashion House',
          slug: 'colombo-fashion-house',
          description: 'Premium fashion and lifestyle store',
          email: 'hello@colombofashion.lk',
          phone: '+94 11 345 6789',
          address: '456 Kandy Road, Colombo 07',
          city: 'Colombo',
          state: 'Western Province',
          country: 'Sri Lanka',
          postalCode: '00700',
          timezone: 'Asia/Colombo',
          currency: 'LKR',
          language: 'en',
          logo: '/logos/fashion-logo.png',
          website: 'https://colombofashion.lk',
          isActive: true,
          settings: {
            theme: 'light',
            notifications: true,
            analytics: true,
            inventoryAlerts: true
          },
          metadata: {
            businessType: 'Fashion Retail',
            establishedYear: 2018,
            employeeCount: 15
          }
        }
      }),
      prisma.organization.create({
        data: {
          id: 'org-grocery-lk',
          name: 'FreshMart Supermarket',
          slug: 'freshmart-supermarket',
          description: 'Fresh produce and daily essentials',
          email: 'contact@freshmart.lk',
          phone: '+94 11 456 7890',
          address: '789 Negombo Road, Negombo',
          city: 'Negombo',
          state: 'Western Province',
          country: 'Sri Lanka',
          postalCode: '11500',
          timezone: 'Asia/Colombo',
          currency: 'LKR',
          language: 'en',
          logo: '/logos/freshmart-logo.png',
          website: 'https://freshmart.lk',
          isActive: true,
          settings: {
            theme: 'light',
            notifications: true,
            analytics: true,
            inventoryAlerts: true
          },
          metadata: {
            businessType: 'Grocery Retail',
            establishedYear: 2020,
            employeeCount: 30
          }
        }
      })
    ]);

    console.log('🏢 Created organizations');

    // Create Users
    const hashedPassword = await bcrypt.hash('demo123', 12);
    
    const users = await Promise.all([
      // TechHub Electronics Users
      prisma.user.create({
        data: {
          id: 'user-admin-techhub',
          email: 'admin@techhub.lk',
          name: 'Admin User',
          password: hashedPassword,
          role: 'ADMIN',
          organizationId: 'org-electronics-lk',
          isActive: true,
          emailVerified: new Date(),
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true,
            currency: 'LKR'
          },
          metadata: {
            department: 'Management',
            joinDate: '2023-01-15',
            lastLogin: new Date().toISOString()
          }
        }
      }),
      prisma.user.create({
        data: {
          id: 'user-staff-techhub',
          email: 'staff@techhub.lk',
          name: 'Staff Member',
          password: hashedPassword,
          role: 'STAFF',
          organizationId: 'org-electronics-lk',
          isActive: true,
          emailVerified: new Date(),
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true,
            currency: 'LKR'
          },
          metadata: {
            department: 'Sales',
            joinDate: '2023-03-20',
            lastLogin: new Date().toISOString()
          }
        }
      }),
      // Colombo Fashion House Users
      prisma.user.create({
        data: {
          id: 'user-admin-fashion',
          email: 'admin@colombofashion.lk',
          name: 'Fashion Admin',
          password: hashedPassword,
          role: 'ADMIN',
          organizationId: 'org-fashion-lk',
          isActive: true,
          emailVerified: new Date(),
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true,
            currency: 'LKR'
          },
          metadata: {
            department: 'Management',
            joinDate: '2023-02-10',
            lastLogin: new Date().toISOString()
          }
        }
      }),
      // FreshMart Supermarket Users
      prisma.user.create({
        data: {
          id: 'user-admin-grocery',
          email: 'admin@freshmart.lk',
          name: 'Grocery Admin',
          password: hashedPassword,
          role: 'ADMIN',
          organizationId: 'org-grocery-lk',
          isActive: true,
          emailVerified: new Date(),
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true,
            currency: 'LKR'
          },
          metadata: {
            department: 'Management',
            joinDate: '2023-04-05',
            lastLogin: new Date().toISOString()
          }
        }
      })
    ]);

    console.log('👥 Created users');

    // Create Categories
    const categories = await Promise.all([
      // Electronics Categories
      prisma.category.create({
        data: {
          id: 'cat-smartphones',
          name: 'Smartphones',
          slug: 'smartphones',
          description: 'Latest smartphones and accessories',
          organizationId: 'org-electronics-lk',
          isActive: true,
          metadata: {
            icon: 'smartphone',
            color: '#3B82F6',
            sortOrder: 1
          }
        }
      }),
      prisma.category.create({
        data: {
          id: 'cat-laptops',
          name: 'Laptops',
          slug: 'laptops',
          description: 'Laptops and computers',
          organizationId: 'org-electronics-lk',
          isActive: true,
          metadata: {
            icon: 'laptop',
            color: '#10B981',
            sortOrder: 2
          }
        }
      }),
      prisma.category.create({
        data: {
          id: 'cat-accessories',
          name: 'Accessories',
          slug: 'accessories',
          description: 'Phone cases, chargers, and more',
          organizationId: 'org-electronics-lk',
          isActive: true,
          metadata: {
            icon: 'headphones',
            color: '#F59E0B',
            sortOrder: 3
          }
        }
      }),
      // Fashion Categories
      prisma.category.create({
        data: {
          id: 'cat-men-clothing',
          name: 'Men\'s Clothing',
          slug: 'mens-clothing',
          description: 'Men\'s fashion and apparel',
          organizationId: 'org-fashion-lk',
          isActive: true,
          metadata: {
            icon: 'shirt',
            color: '#8B5CF6',
            sortOrder: 1
          }
        }
      }),
      prisma.category.create({
        data: {
          id: 'cat-women-clothing',
          name: 'Women\'s Clothing',
          slug: 'womens-clothing',
          description: 'Women\'s fashion and apparel',
          organizationId: 'org-fashion-lk',
          isActive: true,
          metadata: {
            icon: 'dress',
            color: '#EC4899',
            sortOrder: 2
          }
        }
      }),
      // Grocery Categories
      prisma.category.create({
        data: {
          id: 'cat-fresh-produce',
          name: 'Fresh Produce',
          slug: 'fresh-produce',
          description: 'Fresh fruits and vegetables',
          organizationId: 'org-grocery-lk',
          isActive: true,
          metadata: {
            icon: 'apple',
            color: '#22C55E',
            sortOrder: 1
          }
        }
      }),
      prisma.category.create({
        data: {
          id: 'cat-dairy',
          name: 'Dairy Products',
          slug: 'dairy-products',
          description: 'Milk, cheese, and dairy items',
          organizationId: 'org-grocery-lk',
          isActive: true,
          metadata: {
            icon: 'milk',
            color: '#F97316',
            sortOrder: 2
          }
        }
      })
    ]);

    console.log('📂 Created categories');

    // Create Products
    const products = await Promise.all([
      // Electronics Products
      prisma.product.create({
        data: {
          id: 'prod-iphone-15',
          name: 'iPhone 15 Pro Max',
          slug: 'iphone-15-pro-max',
          description: 'Latest iPhone with advanced camera system',
          sku: 'IPH15PM-256-TIT',
          price: 450000,
          costPrice: 380000,
          currency: 'LKR',
          categoryId: 'cat-smartphones',
          organizationId: 'org-electronics-lk',
          stock: 15,
          minStock: 5,
          maxStock: 50,
          isActive: true,
          images: ['/products/iphone-15-pro-max.jpg'],
          metadata: {
            brand: 'Apple',
            model: 'iPhone 15 Pro Max',
            storage: '256GB',
            color: 'Titanium',
            warranty: '1 Year',
            specifications: {
              display: '6.7-inch Super Retina XDR',
              processor: 'A17 Pro',
              camera: '48MP Main Camera',
              battery: 'Up to 29 hours video playback'
            }
          }
        }
      }),
      prisma.product.create({
        data: {
          id: 'prod-macbook-air',
          name: 'MacBook Air M2',
          slug: 'macbook-air-m2',
          description: 'Ultra-thin laptop with M2 chip',
          sku: 'MBA-M2-512-SIL',
          price: 850000,
          costPrice: 720000,
          currency: 'LKR',
          categoryId: 'cat-laptops',
          organizationId: 'org-electronics-lk',
          stock: 8,
          minStock: 3,
          maxStock: 20,
          isActive: true,
          images: ['/products/macbook-air-m2.jpg'],
          metadata: {
            brand: 'Apple',
            model: 'MacBook Air',
            storage: '512GB',
            color: 'Silver',
            warranty: '1 Year',
            specifications: {
              display: '13.6-inch Liquid Retina',
              processor: 'M2 chip',
              memory: '8GB Unified Memory',
              battery: 'Up to 18 hours'
            }
          }
        }
      }),
      prisma.product.create({
        data: {
          id: 'prod-airpods-pro',
          name: 'AirPods Pro (2nd Gen)',
          slug: 'airpods-pro-2nd-gen',
          description: 'Wireless earbuds with active noise cancellation',
          sku: 'APP2-WHT',
          price: 85000,
          costPrice: 65000,
          currency: 'LKR',
          categoryId: 'cat-accessories',
          organizationId: 'org-electronics-lk',
          stock: 25,
          minStock: 10,
          maxStock: 100,
          isActive: true,
          images: ['/products/airpods-pro-2.jpg'],
          metadata: {
            brand: 'Apple',
            model: 'AirPods Pro',
            color: 'White',
            warranty: '1 Year',
            specifications: {
              battery: 'Up to 6 hours listening time',
              features: 'Active Noise Cancellation, Spatial Audio',
              connectivity: 'Bluetooth 5.3'
            }
          }
        }
      }),
      // Fashion Products
      prisma.product.create({
        data: {
          id: 'prod-mens-shirt',
          name: 'Men\'s Cotton Shirt',
          slug: 'mens-cotton-shirt',
          description: 'Premium cotton dress shirt',
          sku: 'MSH-COT-BLU-L',
          price: 8500,
          costPrice: 4500,
          currency: 'LKR',
          categoryId: 'cat-men-clothing',
          organizationId: 'org-fashion-lk',
          stock: 30,
          minStock: 10,
          maxStock: 100,
          isActive: true,
          images: ['/products/mens-cotton-shirt.jpg'],
          metadata: {
            brand: 'Colombo Fashion',
            material: '100% Cotton',
            color: 'Blue',
            size: 'Large',
            care: 'Machine washable',
            specifications: {
              fit: 'Regular Fit',
              collar: 'Classic Collar',
              sleeves: 'Long Sleeves'
            }
          }
        }
      }),
      prisma.product.create({
        data: {
          id: 'prod-womens-dress',
          name: 'Women\'s Summer Dress',
          slug: 'womens-summer-dress',
          description: 'Elegant summer dress for any occasion',
          sku: 'WDR-SUM-FLO-M',
          price: 12000,
          costPrice: 6500,
          currency: 'LKR',
          categoryId: 'cat-women-clothing',
          organizationId: 'org-fashion-lk',
          stock: 20,
          minStock: 5,
          maxStock: 50,
          isActive: true,
          images: ['/products/womens-summer-dress.jpg'],
          metadata: {
            brand: 'Colombo Fashion',
            material: 'Cotton Blend',
            color: 'Floral Print',
            size: 'Medium',
            care: 'Hand wash recommended',
            specifications: {
              length: 'Knee Length',
              sleeves: 'Short Sleeves',
              style: 'A-Line'
            }
          }
        }
      }),
      // Grocery Products
      prisma.product.create({
        data: {
          id: 'prod-apples',
          name: 'Fresh Red Apples',
          slug: 'fresh-red-apples',
          description: 'Fresh, crisp red apples from local farms',
          sku: 'APP-RED-1KG',
          price: 450,
          costPrice: 280,
          currency: 'LKR',
          categoryId: 'cat-fresh-produce',
          organizationId: 'org-grocery-lk',
          stock: 100,
          minStock: 20,
          maxStock: 500,
          isActive: true,
          images: ['/products/fresh-red-apples.jpg'],
          metadata: {
            brand: 'Local Farm',
            origin: 'Sri Lanka',
            weight: '1kg',
            shelfLife: '7-10 days',
            specifications: {
              variety: 'Red Delicious',
              grade: 'Premium',
              packaging: 'Plastic bag'
            }
          }
        }
      }),
      prisma.product.create({
        data: {
          id: 'prod-milk',
          name: 'Fresh Milk 1L',
          slug: 'fresh-milk-1l',
          description: 'Fresh cow milk from local dairy farms',
          sku: 'MLK-FRS-1L',
          price: 180,
          costPrice: 120,
          currency: 'LKR',
          categoryId: 'cat-dairy',
          organizationId: 'org-grocery-lk',
          stock: 200,
          minStock: 50,
          maxStock: 1000,
          isActive: true,
          images: ['/products/fresh-milk-1l.jpg'],
          metadata: {
            brand: 'Local Dairy',
            origin: 'Sri Lanka',
            volume: '1 Liter',
            shelfLife: '3-5 days',
            specifications: {
              fat: '3.5%',
              grade: 'Premium',
              packaging: 'Plastic bottle'
            }
          }
        }
      })
    ]);

    console.log('📦 Created products');

    // Create Customers
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          id: 'cust-tech-enthusiast',
          name: 'Rajesh Perera',
          email: 'rajesh.perera@gmail.com',
          phone: '+94 77 123 4567',
          address: '45/2, Galle Road, Colombo 03',
          city: 'Colombo',
          state: 'Western Province',
          country: 'Sri Lanka',
          postalCode: '00300',
          organizationId: 'org-electronics-lk',
          isActive: true,
          preferences: {
            currency: 'LKR',
            language: 'en',
            notifications: true,
            marketing: true
          },
          metadata: {
            customerType: 'Premium',
            joinDate: '2023-01-15',
            totalOrders: 5,
            totalSpent: 1250000,
            lastOrderDate: '2023-12-01',
            tags: ['Tech Enthusiast', 'Early Adopter', 'High Value']
          }
        }
      }),
      prisma.customer.create({
        data: {
          id: 'cust-fashion-lover',
          name: 'Priya Fernando',
          email: 'priya.fernando@yahoo.com',
          phone: '+94 76 234 5678',
          address: '78/5, Kandy Road, Colombo 07',
          city: 'Colombo',
          state: 'Western Province',
          country: 'Sri Lanka',
          postalCode: '00700',
          organizationId: 'org-fashion-lk',
          isActive: true,
          preferences: {
            currency: 'LKR',
            language: 'en',
            notifications: true,
            marketing: true
          },
          metadata: {
            customerType: 'Regular',
            joinDate: '2023-03-20',
            totalOrders: 8,
            totalSpent: 45000,
            lastOrderDate: '2023-12-05',
            tags: ['Fashion Lover', 'Frequent Buyer', 'Style Conscious']
          }
        }
      }),
      prisma.customer.create({
        data: {
          id: 'cust-family-shopper',
          name: 'Kamal Silva',
          email: 'kamal.silva@hotmail.com',
          phone: '+94 75 345 6789',
          address: '123/4, Negombo Road, Negombo',
          city: 'Negombo',
          state: 'Western Province',
          country: 'Sri Lanka',
          postalCode: '11500',
          organizationId: 'org-grocery-lk',
          isActive: true,
          preferences: {
            currency: 'LKR',
            language: 'en',
            notifications: true,
            marketing: false
          },
          metadata: {
            customerType: 'Family',
            joinDate: '2023-02-10',
            totalOrders: 25,
            totalSpent: 12500,
            lastOrderDate: '2023-12-10',
            tags: ['Family Shopper', 'Regular Customer', 'Bulk Buyer']
          }
        }
      }),
      prisma.customer.create({
        data: {
          id: 'cust-business-customer',
          name: 'Tech Solutions Ltd',
          email: 'orders@techsolutions.lk',
          phone: '+94 11 456 7890',
          address: '456 Business Park, Colombo 05',
          city: 'Colombo',
          state: 'Western Province',
          country: 'Sri Lanka',
          postalCode: '00500',
          organizationId: 'org-electronics-lk',
          isActive: true,
          preferences: {
            currency: 'LKR',
            language: 'en',
            notifications: true,
            marketing: false
          },
          metadata: {
            customerType: 'Business',
            joinDate: '2023-01-05',
            totalOrders: 12,
            totalSpent: 2500000,
            lastOrderDate: '2023-11-28',
            tags: ['Business Customer', 'Bulk Orders', 'Corporate Account']
          }
        }
      }),
      prisma.customer.create({
        data: {
          id: 'cust-new-customer',
          name: 'Samantha Jayawardena',
          email: 'samantha.j@outlook.com',
          phone: '+94 74 567 8901',
          address: '89/3, Matara Road, Matara',
          city: 'Matara',
          state: 'Southern Province',
          country: 'Sri Lanka',
          postalCode: '81000',
          organizationId: 'org-fashion-lk',
          isActive: true,
          preferences: {
            currency: 'LKR',
            language: 'en',
            notifications: true,
            marketing: true
          },
          metadata: {
            customerType: 'New',
            joinDate: '2023-12-01',
            totalOrders: 1,
            totalSpent: 3500,
            lastOrderDate: '2023-12-01',
            tags: ['New Customer', 'First Purchase', 'Potential Regular']
          }
        }
      })
    ]);

    console.log('👥 Created customers');

    // Create Orders
    const orders = await Promise.all([
      prisma.order.create({
        data: {
          id: 'ord-techhub-001',
          orderNumber: 'TH-2023-001',
          customerId: 'cust-tech-enthusiast',
          organizationId: 'org-electronics-lk',
          status: 'COMPLETED',
          totalAmount: 450000,
          currency: 'LKR',
          shippingAddress: '45/2, Galle Road, Colombo 03',
          billingAddress: '45/2, Galle Road, Colombo 03',
          notes: 'Customer requested express delivery',
          metadata: {
            paymentMethod: 'CREDIT_CARD',
            shippingMethod: 'EXPRESS',
            orderSource: 'WEBSITE',
            customerNotes: 'Please call before delivery'
          }
        }
      }),
      prisma.order.create({
        data: {
          id: 'ord-fashion-001',
          orderNumber: 'CF-2023-001',
          customerId: 'cust-fashion-lover',
          organizationId: 'org-fashion-lk',
          status: 'COMPLETED',
          totalAmount: 25000,
          currency: 'LKR',
          shippingAddress: '78/5, Kandy Road, Colombo 07',
          billingAddress: '78/5, Kandy Road, Colombo 07',
          notes: 'Regular order',
          metadata: {
            paymentMethod: 'BANK_TRANSFER',
            shippingMethod: 'STANDARD',
            orderSource: 'MOBILE_APP',
            customerNotes: 'Leave at gate if no answer'
          }
        }
      }),
      prisma.order.create({
        data: {
          id: 'ord-grocery-001',
          orderNumber: 'FM-2023-001',
          customerId: 'cust-family-shopper',
          organizationId: 'org-grocery-lk',
          status: 'COMPLETED',
          totalAmount: 1800,
          currency: 'LKR',
          shippingAddress: '123/4, Negombo Road, Negombo',
          billingAddress: '123/4, Negombo Road, Negombo',
          notes: 'Weekly grocery order',
          metadata: {
            paymentMethod: 'CASH',
            shippingMethod: 'SAME_DAY',
            orderSource: 'WEBSITE',
            customerNotes: 'Fresh produce only'
          }
        }
      }),
      prisma.order.create({
        data: {
          id: 'ord-business-001',
          orderNumber: 'TH-2023-002',
          customerId: 'cust-business-customer',
          organizationId: 'org-electronics-lk',
          status: 'PROCESSING',
          totalAmount: 850000,
          currency: 'LKR',
          shippingAddress: '456 Business Park, Colombo 05',
          billingAddress: '456 Business Park, Colombo 05',
          notes: 'Corporate order for office equipment',
          metadata: {
            paymentMethod: 'INVOICE',
            shippingMethod: 'BUSINESS',
            orderSource: 'SALES_REP',
            customerNotes: 'Delivery to reception desk'
          }
        }
      }),
      prisma.order.create({
        data: {
          id: 'ord-new-customer-001',
          orderNumber: 'CF-2023-002',
          customerId: 'cust-new-customer',
          organizationId: 'org-fashion-lk',
          status: 'PENDING',
          totalAmount: 3500,
          currency: 'LKR',
          shippingAddress: '89/3, Matara Road, Matara',
          billingAddress: '89/3, Matara Road, Matara',
          notes: 'First order from new customer',
          metadata: {
            paymentMethod: 'CREDIT_CARD',
            shippingMethod: 'STANDARD',
            orderSource: 'WEBSITE',
            customerNotes: 'Welcome package included'
          }
        }
      })
    ]);

    console.log('📋 Created orders');

    // Create Order Items
    const orderItems = await Promise.all([
      // TechHub Order Items
      prisma.orderItem.create({
        data: {
          id: 'item-techhub-001',
          orderId: 'ord-techhub-001',
          productId: 'prod-iphone-15',
          quantity: 1,
          unitPrice: 450000,
          totalPrice: 450000,
          currency: 'LKR',
          metadata: {
            productName: 'iPhone 15 Pro Max',
            productSku: 'IPH15PM-256-TIT',
            specifications: {
              storage: '256GB',
              color: 'Titanium'
            }
          }
        }
      }),
      // Fashion Order Items
      prisma.orderItem.create({
        data: {
          id: 'item-fashion-001',
          orderId: 'ord-fashion-001',
          productId: 'prod-mens-shirt',
          quantity: 2,
          unitPrice: 8500,
          totalPrice: 17000,
          currency: 'LKR',
          metadata: {
            productName: 'Men\'s Cotton Shirt',
            productSku: 'MSH-COT-BLU-L',
            specifications: {
              size: 'Large',
              color: 'Blue'
            }
          }
        }
      }),
      prisma.orderItem.create({
        data: {
          id: 'item-fashion-002',
          orderId: 'ord-fashion-001',
          productId: 'prod-womens-dress',
          quantity: 1,
          unitPrice: 12000,
          totalPrice: 12000,
          currency: 'LKR',
          metadata: {
            productName: 'Women\'s Summer Dress',
            productSku: 'WDR-SUM-FLO-M',
            specifications: {
              size: 'Medium',
              color: 'Floral Print'
            }
          }
        }
      }),
      // Grocery Order Items
      prisma.orderItem.create({
        data: {
          id: 'item-grocery-001',
          orderId: 'ord-grocery-001',
          productId: 'prod-apples',
          quantity: 2,
          unitPrice: 450,
          totalPrice: 900,
          currency: 'LKR',
          metadata: {
            productName: 'Fresh Red Apples',
            productSku: 'APP-RED-1KG',
            specifications: {
              weight: '1kg each',
              variety: 'Red Delicious'
            }
          }
        }
      }),
      prisma.orderItem.create({
        data: {
          id: 'item-grocery-002',
          orderId: 'ord-grocery-001',
          productId: 'prod-milk',
          quantity: 5,
          unitPrice: 180,
          totalPrice: 900,
          currency: 'LKR',
          metadata: {
            productName: 'Fresh Milk 1L',
            productSku: 'MLK-FRS-1L',
            specifications: {
              volume: '1 Liter each',
              fat: '3.5%'
            }
          }
        }
      }),
      // Business Order Items
      prisma.orderItem.create({
        data: {
          id: 'item-business-001',
          orderId: 'ord-business-001',
          productId: 'prod-macbook-air',
          quantity: 1,
          unitPrice: 850000,
          totalPrice: 850000,
          currency: 'LKR',
          metadata: {
            productName: 'MacBook Air M2',
            productSku: 'MBA-M2-512-SIL',
            specifications: {
              storage: '512GB',
              color: 'Silver'
            }
          }
        }
      }),
      // New Customer Order Items
      prisma.orderItem.create({
        data: {
          id: 'item-new-customer-001',
          orderId: 'ord-new-customer-001',
          productId: 'prod-womens-dress',
          quantity: 1,
          unitPrice: 3500,
          totalPrice: 3500,
          currency: 'LKR',
          metadata: {
            productName: 'Women\'s Summer Dress',
            productSku: 'WDR-SUM-FLO-S',
            specifications: {
              size: 'Small',
              color: 'Floral Print'
            }
          }
        }
      })
    ]);

    console.log('📦 Created order items');

    // Create Payments
    const payments = await Promise.all([
      prisma.payment.create({
        data: {
          id: 'pay-techhub-001',
          amount: 450000,
          currency: 'LKR',
          status: 'COMPLETED',
          method: 'CREDIT_CARD',
          transactionId: 'stripe_txn_001',
          orderId: 'ord-techhub-001',
          customerId: 'cust-tech-enthusiast',
          organizationId: 'org-electronics-lk',
          gateway: 'STRIPE',
          metadata: {
            gatewayResponse: 'Payment processed successfully',
            processedAt: new Date().toISOString(),
            cardLast4: '4242',
            cardBrand: 'Visa'
          }
        }
      }),
      prisma.payment.create({
        data: {
          id: 'pay-fashion-001',
          amount: 25000,
          currency: 'LKR',
          status: 'COMPLETED',
          method: 'BANK_TRANSFER',
          transactionId: 'payhere_txn_002',
          orderId: 'ord-fashion-001',
          customerId: 'cust-fashion-lover',
          organizationId: 'org-fashion-lk',
          gateway: 'PAYHERE',
          metadata: {
            gatewayResponse: 'PayHere payment successful',
            processedAt: new Date().toISOString(),
            bankReference: 'BANK_REF_001'
          }
        }
      }),
      prisma.payment.create({
        data: {
          id: 'pay-grocery-001',
          amount: 1800,
          currency: 'LKR',
          status: 'COMPLETED',
          method: 'CASH',
          transactionId: 'cash_txn_003',
          orderId: 'ord-grocery-001',
          customerId: 'cust-family-shopper',
          organizationId: 'org-grocery-lk',
          gateway: 'CASH',
          metadata: {
            gatewayResponse: 'Cash payment received',
            processedAt: new Date().toISOString(),
            receivedBy: 'Delivery Driver'
          }
        }
      }),
      prisma.payment.create({
        data: {
          id: 'pay-business-001',
          amount: 850000,
          currency: 'LKR',
          status: 'PENDING',
          method: 'INVOICE',
          transactionId: 'invoice_001',
          orderId: 'ord-business-001',
          customerId: 'cust-business-customer',
          organizationId: 'org-electronics-lk',
          gateway: 'INVOICE',
          metadata: {
            gatewayResponse: 'Invoice generated',
            processedAt: new Date().toISOString(),
            invoiceNumber: 'INV-2023-001',
            dueDate: '2024-01-15'
          }
        }
      }),
      prisma.payment.create({
        data: {
          id: 'pay-new-customer-001',
          amount: 3500,
          currency: 'LKR',
          status: 'PENDING',
          method: 'CREDIT_CARD',
          transactionId: 'stripe_txn_004',
          orderId: 'ord-new-customer-001',
          customerId: 'cust-new-customer',
          organizationId: 'org-fashion-lk',
          gateway: 'STRIPE',
          metadata: {
            gatewayResponse: 'Payment processing',
            processedAt: new Date().toISOString(),
            cardLast4: '1234',
            cardBrand: 'Mastercard'
          }
        }
      })
    ]);

    console.log('💳 Created payments');

    console.log('\n🎉 Comprehensive database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`🏢 Organizations: ${organizations.length}`);
    console.log(`👥 Users: ${users.length}`);
    console.log(`📂 Categories: ${categories.length}`);
    console.log(`📦 Products: ${products.length}`);
    console.log(`👤 Customers: ${customers.length}`);
    console.log(`📋 Orders: ${orders.length}`);
    console.log(`📦 Order Items: ${orderItems.length}`);
    console.log(`💳 Payments: ${payments.length}`);

    console.log('\n🔐 Login Credentials:');
    console.log('Email: admin@techhub.lk');
    console.log('Password: demo123');
    console.log('Role: ADMIN');
    console.log('Organization: TechHub Electronics');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
