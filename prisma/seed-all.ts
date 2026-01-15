import { PrismaClient, UserRole, PlanType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive seeding...');

    // 1. Create Organizations (Tenant)
    const orgs = [];
    for (let i = 0; i < 2; i++) {
        const org = await prisma.organization.create({
            data: {
                name: faker.company.name(),
                domain: faker.internet.domainName() + '_' + faker.string.alpha(5),
                status: 'ACTIVE',
                plan: 'ENTERPRISE', // Ensure this matches PlanType enum or string
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
        orgs.push(org);
        console.log(`Created Organization: ${org.name}`);
    }

    for (const org of orgs) {
        // --- USERS ---
        console.log(`  - Seeding Users...`);
        const users = [];
        for (let i = 0; i < 10; i++) {
            const user = await prisma.user.create({
                data: {
                    email: faker.internet.email({ provider: org.domain }),
                    name: faker.person.fullName(),
                    role: i === 0 ? 'TENANT_ADMIN' : 'STAFF', // Strings usually work if matched to Enum
                    organizationId: org.id,
                    isActive: true,
                    createdAt: faker.date.past(),
                }
            });
            users.push(user);
        }

        // --- CUSTOMERS ---
        console.log(`  - Seeding Customers...`);
        const customers = [];
        for (let i = 0; i < 15; i++) {
            const cust = await prisma.customer.create({
                data: {
                    name: faker.person.fullName(),
                    email: faker.internet.email(),
                    phone: faker.phone.number(),
                    organizationId: org.id,
                    address: faker.location.streetAddress(),
                }
            });
            customers.push(cust);
        }

        // --- CATEGORIES ---
        console.log(`  - Seeding Categories...`);
        const categories = [];
        for (let i = 0; i < 5; i++) {
            const cat = await prisma.category.create({
                data: {
                    name: faker.commerce.department() + ' ' + faker.string.alpha(3),
                    isActive: true,
                }
            });
            categories.push(cat);
        }

        // --- PRODUCTS ---
        console.log(`  - Seeding Products...`);
        const products = [];
        for (let i = 0; i < 15; i++) {
            const prod = await prisma.product.create({
                data: {
                    name: faker.commerce.productName(),
                    sku: faker.string.alphanumeric(8).toUpperCase(),
                    price: parseFloat(faker.commerce.price()),
                    stock: faker.number.int({ min: 10, max: 100 }),
                    organizationId: org.id,
                    categoryId: categories[i % categories.length].id,
                    isActive: true,
                    variants: {
                        create: [
                            {
                                name: 'Default',
                                sku: faker.string.alphanumeric(10).toUpperCase(),
                                price: parseFloat(faker.commerce.price()),
                                stock: 50,
                                organizationId: org.id
                            }
                        ]
                    }
                }
            });
            products.push(prod);
        }

        // --- WAREHOUSE & SUPPLIERS ---
        console.log(`  - Seeding Warehouse & Suppliers...`);
        const warehouse = await prisma.warehouse.create({
            data: {
                name: 'Main Warehouse',
                address: faker.location.streetAddress(),
                organizationId: org.id
            }
        });

        // Supplier
        const supplier = await prisma.supplier.create({
            data: {
                name: faker.company.name(),
                code: faker.string.alphanumeric(6).toUpperCase(),
                email: faker.internet.email(),
                phone: faker.phone.number(),
                organizationId: org.id,
                status: 'ACTIVE',
                address: { street: faker.location.streetAddress() }
            }
        });

        // --- PURCHASE ORDERS ---
        console.log(`  - Seeding Purchase Orders...`);
        for (let i = 0; i < 5; i++) {
            await prisma.purchaseOrder.create({
                data: {
                    orderNumber: 'PO-' + faker.string.alphanumeric(8).toUpperCase(),
                    organizationId: org.id,
                    supplierId: supplier.id,
                    status: 'SUBMITTED',
                    subtotal: 500,
                    total: 550,
                    createdById: users[0].id,
                    items: {
                        create: [
                            {
                                productId: products[0].id,
                                quantity: 10,
                                unitPrice: 50,
                                total: 500
                            }
                        ]
                    }
                }
            });
        }

        // --- SALES ORDERS ---
        console.log(`  - Seeding Sales Orders...`);
        for (let i = 0; i < 20; i++) {
            const customer = customers[i % customers.length];

            await prisma.order.create({
                data: {
                    orderNumber: 'ORD-' + faker.string.alphanumeric(8).toUpperCase(),
                    customerId: customer.id,
                    organizationId: org.id,
                    status: faker.helpers.arrayElement(['PENDING', 'COMPLETED', 'SHIPPED']),
                    total: 100,
                    subtotal: 90,
                    tax: 10,
                    orderItems: {
                        create: [
                            { productId: products[0].id, quantity: 1, price: 50, total: 50 },
                            { productId: products[1].id, quantity: 1, price: 50, total: 50 }
                        ]
                    },
                    payments: {
                        create: {
                            organizationId: org.id,
                            amount: 100,
                            method: 'CREDIT_CARD',
                            status: 'COMPLETED'
                        }
                    },
                    deliveries: {
                        create: {
                            organizationId: org.id,
                            status: 'PENDING',
                            address: customer.address
                        }
                    }
                }
            });
        }

        // --- IOT ---
        console.log(`  - Seeding IoT...`);
        for (let i = 0; i < 5; i++) {
            const dev = await prisma.iot_devices.create({
                data: {
                    id: faker.string.uuid(),
                    name: 'Sensor-' + i,
                    type: 'TEMP',
                    macAddress: faker.internet.mac(),
                    firmwareVersion: '1.0',
                    organizationId: org.id,
                    updatedAt: new Date(),
                    warehouseId: warehouse.id,
                    location: 'Zone A'
                }
            });

            await prisma.sensor_readings.create({
                data: {
                    id: faker.string.uuid(),
                    deviceId: dev.id,
                    type: 'TEMP',
                    value: 20 + i,
                    unit: 'C',
                    location: 'Zone A'
                }
            });
        }

        // --- POS ---
        console.log(`  - Seeding POS...`);
        const terminal = await prisma.posTerminal.create({
            data: {
                name: 'POS-' + faker.string.alpha(3),
                organizationId: org.id
            }
        });

        for (let i = 0; i < 10; i++) {
            await prisma.posTransaction.create({
                data: {
                    organizationId: org.id,
                    terminalId: terminal.id,
                    items: JSON.stringify([{ sku: 'ITEM', qty: 1 }]),
                    total: 50,
                    cashierId: users[0].id,
                    status: 'COMPLETED'
                }
            });
        }
    }

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
