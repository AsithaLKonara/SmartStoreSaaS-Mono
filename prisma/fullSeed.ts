import {
    PrismaClient,
    UserRole,
    PlanType,
    OrganizationStatus,
    OrderStatus,
    ReturnStatus,
    PurchaseOrderStatus,
    PaymentStatus,
    DeliveryStatus,
    IoTStatus,
    SupportStatus,
    SupportPriority
} from "@prisma/client"
import { faker } from "@faker-js/faker"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

const ROWS = 12

const DEFAULT_PASSWORD = "Customer123!" // Global for tests

async function seedOrganizations() {
    console.log("🏢 Seeding Organizations...")
    const orgs = []
    for (let i = 0; i < ROWS; i++) {
        const org = await prisma.organization.create({
            data: {
                name: faker.company.name(),
                domain: faker.internet.domainName(),
                description: faker.company.catchPhrase(),
                logo: faker.image.url(),
                status: "ACTIVE" as OrganizationStatus,
                plan: "PRO" as PlanType,
                settings: { currency: "LKR", timezone: "Asia/Colombo" }
            }
        })
        orgs.push(org)
    }
    return orgs
}

async function seedUsers(orgs: any[]) {
    console.log("👤 Seeding Users...")
    const users = []
    
    // 1. Super Admin
    const superAdminHash = await hash("SuperAdmin123!", 12);
    const superAdmin = await prisma.user.upsert({
        where: { email: "superadmin@smartstore.com" },
        update: { password: superAdminHash, organizationId: orgs[0].id },
        create: {
            email: "superadmin@smartstore.com",
            name: "Super Admin",
            password: superAdminHash,
            role: "SUPER_ADMIN",
            isActive: true,
            organizationId: orgs[0].id
        }
    })
    users.push(superAdmin)

    const adminHash = await hash("Admin123!", 12);
    // 2. Tenant Admin (for org-1)
    const testAdmin = await prisma.user.create({
        data: {
            email: "admin@demo.com",
            name: "Demo Admin",
            password: adminHash,
            role: "TENANT_ADMIN",
            organizationId: orgs[0].id,
            isActive: true
        }
    })
    users.push(testAdmin)

    const salesHash = await hash("Sales123!", 12);
    // 3. Staff Member (for org-1)
    const testStaff = await prisma.user.create({
        data: {
            email: "sales@demo.com",
            name: "Demo Sales",
            password: salesHash,
            role: "STAFF",
            roleTag: "sales_executive",
            organizationId: orgs[0].id,
            isActive: true
        }
    })
    users.push(testStaff)

    const customerHash = await hash("Customer123!", 12);
    // 4. Customer (for org-1)
    const testCustomerUser = await prisma.user.create({
        data: {
            email: "customer@demo.com",
            name: "Demo Customer",
            password: customerHash,
            role: "CUSTOMER",
            organizationId: orgs[0].id,
            isActive: true
        }
    })
    users.push(testCustomerUser)

    const genericHash = await hash("Hashed123!", 12);
    for (let i = 0; i < ROWS * 2; i++) {
        const role: any = i === 0 ? "SUPER_ADMIN" : "TENANT_ADMIN"
        const user = await prisma.user.create({
            data: {
                email: faker.internet.email(),
                name: faker.person.fullName(),
                password: genericHash,
                role: role,
                organizationId: role === "SUPER_ADMIN" ? null : orgs[i % orgs.length].id,
                isActive: true
            }
        })
        users.push(user)
    }
    return users
}

async function seedCustomers(orgs: any[]) {
    console.log("👥 Seeding Customers...")
    const customers = []
    for (let i = 0; i < ROWS * 2; i++) {
        const customer = await prisma.customer.create({
            data: {
                name: faker.person.fullName(),
                email: faker.internet.email(),
                phone: faker.phone.number(),
                organizationId: orgs[i % orgs.length].id,
            }
        })
        customers.push(customer)
    }
    return customers
}

async function seedCategories(orgs: any[]) {
    console.log("📁 Seeding Categories...")
    const categories = []
    for (let i = 0; i < ROWS; i++) {
        const category = await prisma.category.create({
            data: {
                name: faker.commerce.department(),
                organizationId: orgs[i % orgs.length].id,
            }
        })
        categories.push(category)
    }
    return categories
}

async function seedProducts(users: any[], orgs: any[], categories: any[]) {
    console.log("📦 Seeding Products...")
    const products = []
    for (let i = 0; i < ROWS * 3; i++) {
        const product = await prisma.product.create({
            data: {
                name: faker.commerce.productName(),
                sku: faker.string.alphanumeric(10).toUpperCase(),
                description: faker.commerce.productDescription(),
                price: Number(faker.commerce.price()),
                organizationId: orgs[i % orgs.length].id,
                createdById: users[i % users.length].id,
                categoryId: categories[i % categories.length].id,
            }
        })
        products.push(product)
    }
    return products
}

async function seedOrders(users: any[], orgs: any[], customers: any[]) {
    console.log("🛒 Seeding Orders...")
    const orders = []
    for (let i = 0; i < ROWS * 3; i++) {
        const total = faker.number.int({ min: 500, max: 20000 })
        const order = await prisma.order.create({
            data: {
                orderNumber: `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
                total: total,
                subtotal: total * 0.9,
                status: "DELIVERED" as OrderStatus,
                organizationId: orgs[i % orgs.length].id,
                createdById: users[i % users.length].id,
                customerId: customers[i % customers.length].id,
            }
        })
        orders.push(order)
    }
    return orders
}

async function seedOrderItems(orders: any[], products: any[]) {
    console.log("📦 Seeding Order Items...")
    for (const order of orders) {
        const itemCount = faker.number.int({ min: 1, max: 5 })
        for (let i = 0; i < itemCount; i++) {
            const product = products[faker.number.int({ min: 0, max: products.length - 1 })]
            await prisma.orderItem.create({
                data: {
                    orderId: order.id,
                    productId: product.id,
                    quantity: faker.number.int({ min: 1, max: 10 }),
                    price: product.price,
                    total: product.price.mul(faker.number.int({ min: 1, max: 10 }))
                }
            })
        }
    }
}

async function seedPayments(orders: any[], orgs: any[]) {
    console.log("💳 Seeding Payments...")
    for (const order of orders) {
        await prisma.payment.create({
            data: {
                orderId: order.id,
                organizationId: order.organizationId,
                amount: order.total,
                method: faker.helpers.arrayElement(["CREDIT_CARD", "CASH", "BANK_TRANSFER"]),
                status: "PAID" as PaymentStatus,
                transactionId: faker.string.uuid(),
                gateway: "STRIPE"
            }
        })
    }
}

async function seedWarehouse(orgs: any[]) {
    console.log("🏠 Seeding Warehouses...")
    const warehouses = []
    for (const org of orgs) {
        const wh = await prisma.warehouse.create({
            data: {
                name: "Central Warehouse - " + org.name,
                organizationId: org.id,
                address: { city: faker.location.city(), country: "Sri Lanka" }
            }
        })
        warehouses.push(wh)
    }
    return warehouses
}

async function seedIoT(orgs: any[], warehouses: any[]) {
    console.log("📡 Seeding IoT Devices...")
    for (let i = 0; i < ROWS; i++) {
        const org = orgs[i % orgs.length]
        const wh = warehouses[i % warehouses.length]
        const device = await prisma.iotDevice.create({
            data: {
                id: faker.string.uuid(),
                name: "Sensor-" + faker.string.alphanumeric(4),
                type: "TEMPERATURE",
                location: "Zone A",
                macAddress: faker.internet.mac(),
                firmwareVersion: "1.0.4",
                status: "ONLINE" as IoTStatus,
                organizationId: org.id,
                warehouseId: wh.id,
                updatedAt: new Date()
            }
        })

        await prisma.sensorReading.create({
            data: {
                id: faker.string.uuid(),
                deviceId: device.id,
                type: "TEMP",
                value: faker.number.float({ min: 18, max: 25 }),
                unit: "C",
                location: "Zone A"
            }
        })
    }
}

async function seedFinance(orgs: any[]) {
    console.log("💰 Seeding Finance (CoA)...")
    for (const org of orgs) {
        await prisma.chartOfAccount.create({
            data: {
                id: faker.string.uuid(),
                code: "1000",
                name: "Cash in Hand",
                accountType: "ASSET",
                accountSubType: "CASH",
                organizationId: org.id,
                balance: 50000,
                updatedAt: new Date()
            }
        })
    }
}

async function seedCRM(orgs: any[], customers: any[]) {
    console.log("💎 Seeding CRM (Loyalty)...")
    for (const customer of customers) {
        await prisma.customerLoyalty.create({
            data: {
                customerId: customer.id,
                points: faker.number.int({ min: 0, max: 1000 }),
                tier: "SILVER",
                totalSpent: customer.totalSpent === undefined ? 0 : Number(customer.totalSpent)
            }
        })
    }
}

async function seedSupport(orgs: any[], users: any[], customers: any[]) {
    console.log("🎫 Seeding Support Tickets...")
    for (let i = 0; i < ROWS; i++) {
        const org = orgs[i % orgs.length]
        const customer = customers[i % customers.length]
        await prisma.supportTicket.create({
            data: {
                id: faker.string.uuid(),
                title: "Issue with order " + i,
                description: faker.lorem.paragraph(),
                status: "OPEN" as SupportStatus,
                priority: "MEDIUM" as SupportPriority,
                organizationId: org.id,
                email: customer.email,
                phone: customer.phone,
                updatedAt: new Date()
            }
        })
    }
}

async function seedSuppliers(orgs: any[]) {
    console.log("🚚 Seeding Suppliers...")
    const suppliers = []
    for (let i = 0; i < ROWS; i++) {
        const supplier = await prisma.supplier.create({
            data: {
                name: faker.company.name(),
                code: `SUP-${faker.string.alphanumeric(4).toUpperCase()}`,
                organizationId: orgs[i % orgs.length].id,
            }
        })
        suppliers.push(supplier)
    }
    return suppliers
}

async function seedPurchaseOrders(users: any[], orgs: any[], suppliers: any[]) {
    console.log("📝 Seeding Purchase Orders...")
    for (let i = 0; i < ROWS; i++) {
        const amount = faker.number.int({ min: 1000, max: 50000 })
        await prisma.purchaseOrder.create({
            data: {
                orderNumber: `PO-${faker.number.int({ min: 1000, max: 9999 })}`,
                status: "APPROVED" as PurchaseOrderStatus,
                createdById: users[i % users.length].id,
                organizationId: orgs[i % orgs.length].id,
                supplierId: suppliers[i % suppliers.length].id,
                subtotal: amount,
                total: amount,
            }
        })
    }
}

async function seedReturns(orgs: any[], orders: any[], customers: any[]) {
    console.log("🔄 Seeding Returns...")
    for (let i = 0; i < ROWS; i++) {
        const order = orders[i % orders.length]
        await prisma.return.create({
            data: {
                returnNumber: `RET-${faker.string.alphanumeric(6).toUpperCase()}`,
                reason: faker.lorem.sentence(),
                status: "APPROVED" as ReturnStatus,
                organizationId: orgs[i % orgs.length].id,
                orderId: order.id,
                customerId: customers[i % customers.length].id,
            }
        })
    }
}

async function seedApiKeys(users: any[], orgs: any[]) {
    console.log("🔑 Seeding API Keys...")
    for (let i = 0; i < ROWS; i++) {
        await prisma.apiKey.create({
            data: {
                name: "API Key " + i,
                key: faker.string.alphanumeric(40),
                userId: users[i % users.length].id,
                organizationId: orgs[i % orgs.length].id,
            }
        })
    }
}

async function seedAuditLogs(users: any[], orgs: any[]) {
    console.log("📋 Seeding Audit Logs...")
    for (let i = 0; i < ROWS * 3; i++) {
        await prisma.auditLog.create({
            data: {
                action: "LOGIN",
                resource: "AUTH",
                userId: users[i % users.length].id,
                organizationId: orgs[i % orgs.length].id,
                details: { ip: faker.internet.ip() }
            }
        })
    }
}

async function seedSearchHistory(users: any[]) {
    console.log("🔍 Seeding Search History...")
    for (let i = 0; i < ROWS * 2; i++) {
        await prisma.searchHistory.create({
            data: {
                query: faker.commerce.product(),
                userId: users[i % users.length].id
            }
        })
    }
}

async function seedErrorEvents(users: any[], orgs: any[]) {
    console.log("⚠️ Seeding Error Events...")
    for (let i = 0; i < ROWS; i++) {
        await prisma.errorEvent.create({
            data: {
                type: "RUNTIME_ERROR",
                message: faker.lorem.sentence(),
                stack: faker.lorem.paragraph(),
                userId: users[i % users.length].id,
                organizationId: orgs[i % orgs.length].id,
            }
        })
    }
}

async function seedBrowsingHistory(users: any[], products: any[]) {
    console.log("🌐 Seeding Browsing History...")
    for (let i = 0; i < ROWS * 2; i++) {
        await prisma.browsingHistory.create({
            data: {
                productId: products[i % products.length].id,
                userId: users[i % users.length].id
            }
        })
    }
}

async function main() {
    console.log("🌱 Seeding database with Massive Dataset...")

    // Clean up existing data to avoid unique constraint violations
    console.log("🧹 Cleaning up old seed data (exhaustive)...")

    // 2. Support & Communication
    await prisma.supportReply.deleteMany();
    await prisma.supportTicket.deleteMany();
    await prisma.conversationMessage.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.whatsAppMessage.deleteMany();
    await prisma.whatsAppIntegration.deleteMany();
    await prisma.smsLog.deleteMany();
    await prisma.emailCampaign.deleteMany();
    await prisma.notification.deleteMany();

    // 9. Returns & Finance (Depends on Orders/Products)
    await prisma.returnItem.deleteMany();
    await prisma.return.deleteMany();
    await prisma.giftCardTransaction.deleteMany();
    await prisma.giftCard.deleteMany();
    await prisma.affiliateCommission.deleteMany();
    await prisma.affiliate.deleteMany();
    await prisma.journalEntryLine.deleteMany();
    await prisma.journalEntry.deleteMany();
    await prisma.ledger.deleteMany();
    await prisma.chartOfAccount.deleteMany();
    await prisma.taxRate.deleteMany();

    // 4. Fulfillment & Shipping (Depends on Orders)
    await prisma.fulfillmentItem.deleteMany({});
    await prisma.fulfillment.deleteMany({});
    await prisma.shipment.deleteMany({});
    await prisma.deliveryStatusHistory.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.courier.deleteMany();

    // 5. Sales & Orders & POS
    await prisma.posTransactionItem.deleteMany({});
    await prisma.posTransaction.deleteMany({});
    await prisma.posTerminal.deleteMany({});
    await prisma.orderStatusHistory.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();

    // 1. Logs & Metrics
    await prisma.auditLog.deleteMany();
    await prisma.integrationLog.deleteMany();
    await prisma.analytics.deleteMany();
    await prisma.performanceMetric.deleteMany();
    await prisma.errorEvent.deleteMany();
    await prisma.searchHistory.deleteMany();
    await prisma.browsingHistory.deleteMany();
    await prisma.activityLog.deleteMany();

    // 3. IoT & Warehouse
    await prisma.iotAlert.deleteMany();
    await prisma.sensorReading.deleteMany();
    await prisma.iotDevice.deleteMany();
    await prisma.warehouseInventory.deleteMany();
    await prisma.warehouse.deleteMany();

    // 6. CRM & Loyalty
    await prisma.referral.deleteMany();
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.customerLoyalty.deleteMany();
    await prisma.customerSegmentCustomer.deleteMany();
    await prisma.customerSegment.deleteMany();
    await prisma.customer.deleteMany();

    // 7. Product Catalog
    await prisma.productActivity.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.socialProduct.deleteMany();
    await prisma.socialPost.deleteMany();
    await prisma.socialCommerce.deleteMany();
    await prisma.wishlistItem.deleteMany({});
    await prisma.wishlist.deleteMany({});
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // 8. Procurement
    await prisma.supplierProduct.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.procurementInvoice.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.rFQItem.deleteMany();
    await prisma.rFQ.deleteMany();
    await prisma.supplier.deleteMany();

    await prisma.apiKey.deleteMany();

    // 10. Core
    await prisma.user.deleteMany({ where: { role: { not: "SUPER_ADMIN" } } })
    await prisma.organization.deleteMany({})

    const orgs = await seedOrganizations()
    const users = await seedUsers(orgs)
    const customers = await seedCustomers(orgs)
    const categories = await seedCategories(orgs)
    const products = await seedProducts(users, orgs, categories)
    const orders = await seedOrders(users, orgs, customers)
    const suppliers = await seedSuppliers(orgs)
    await seedPurchaseOrders(users, orgs, suppliers)
    await seedReturns(orgs, orders, customers)
    await seedApiKeys(users, orgs)
    await seedAuditLogs(users, orgs)
    await seedSearchHistory(users)
    await seedErrorEvents(users, orgs)
    await seedBrowsingHistory(users, products)

    // NEW Massive Core Blocks
    await seedOrderItems(orders, products)
    await seedPayments(orders, orgs)
    const warehouses = await seedWarehouse(orgs)
    await seedIoT(orgs, warehouses)
    await seedFinance(orgs)
    await seedCRM(orgs, customers)
    await seedSupport(orgs, users, customers)

    console.log("✅ Database seeded successfully with relational data!")
}

main()
    .catch(e => {
        console.error("❌ Seed failed:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
