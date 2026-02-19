import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

async function migrateLegacyData() {
    logger.info({ message: 'Starting legacy data migration...' });

    try {
        // 1. Migrate POS Transactions
        logger.info({ message: 'Migrating POS Transaction Items...' });
        const posTransactions = await (prisma as any).posTransaction.findMany({
            where: {
                transactionItems: {
                    none: {}
                },
                itemsJson: {
                    not: null
                }
            }
        });

        logger.info({ message: `Found ${posTransactions.length} POS transactions to migrate.` });

        for (const tx of posTransactions) {
            const items = tx.itemsJson as any[];
            if (Array.isArray(items)) {
                await (prisma as any).posTransactionItem.createMany({
                    data: items.map(item => ({
                        transactionId: tx.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        unitPrice: item.price || item.unitPrice || 0,
                        totalPrice: (item.price || item.unitPrice || 0) * (item.quantity || 0),
                        metadata: item.metadata || {}
                    }))
                });
                logger.info({ message: `Migrated ${items.length} items for POS Transaction ${tx.id}` });
            }
        }

        // 2. Migrate RFQs
        logger.info({ message: 'Migrating RFQ Items...' });
        const rfqs = await (prisma as any).rFQ.findMany({
            where: {
                rfqItems: {
                    none: {}
                },
                itemsJson: {
                    not: null
                }
            }
        });

        logger.info({ message: `Found ${rfqs.length} RFQs to migrate.` });

        for (const rfq of rfqs) {
            const items = rfq.itemsJson as any[];
            if (Array.isArray(items)) {
                await (prisma as any).rFQItem.createMany({
                    data: items.map(item => ({
                        rfqId: rfq.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        specifications: item.specifications || '',
                        targetPrice: item.targetPrice
                    }))
                });
                logger.info({ message: `Migrated ${items.length} items for RFQ ${rfq.id}` });
            }
        }

        logger.info({ message: 'Legacy data migration completed successfully.' });
    } catch (error) {
        logger.error({
            message: 'Migration failed',
            error: error instanceof Error ? error : new Error(String(error))
        });
    } finally {
        await prisma.$disconnect();
    }
}

migrateLegacyData()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
