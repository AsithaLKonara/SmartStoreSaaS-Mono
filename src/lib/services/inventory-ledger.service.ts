import { prisma } from '@/lib/prisma';
import { InventoryMovementType, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export class InventoryLedgerService {
  /**
   * Atomic stock adjustment with mandatory audit trailing
   */
  static async adjustStock(tx: Prisma.TransactionClient, data: {
    organizationId: string;
    productId: string;
    variantId?: string;
    type: InventoryMovementType;
    quantity: number; // Positive for additions, negative for deductions
    reason?: string;
    referenceId?: string;
    referenceType?: 'ORDER' | 'POS_TRANSACTION' | 'RETURN' | 'ADJUSTMENT' | 'PURCHASE';
  }) {
    try {
      const { 
        organizationId, 
        productId, 
        variantId, 
        type, 
        quantity, 
        reason, 
        referenceId, 
        referenceType 
      } = data;

      // 1. Update the Product or Variant stock
      if (variantId) {
        await tx.productVariant.update({
          where: { id: variantId, organizationId },
          data: { stock: { increment: quantity } }
        });
      } else {
        await tx.product.update({
          where: { id: productId, organizationId },
          data: { stock: { increment: quantity } }
        });
      }

      // 2. Create the immutable audit record
      const movement = await tx.inventoryMovement.create({
        data: {
          organizationId,
          productId,
          variantId,
          type,
          quantity,
          reason,
          referenceId,
          referenceType
        }
      });

      return movement;
    } catch (error) {
      logger.error('Inventory ledger update failed:', { error, data });
      throw new Error('Critical inventory failure: Stock drift prevented by atomic rollback.');
    }
  }
}
