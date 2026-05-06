import { OrderStatus } from '@prisma/client';
import { ValidationError } from '@/lib/middleware/withErrorHandler';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.REFUNDED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.REFUNDED, OrderStatus.RETURNED],
  DELIVERED: [OrderStatus.REFUNDED, OrderStatus.RETURNED],
  CANCELLED: [],
  REFUNDED: [],
  RETURNED: [],
  DRAFT: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  PARTIALLY_SHIPPED: [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.REFUNDED]
};

export class OrderStateService {
  /**
   * Validate that an order can transition from currentStatus to targetStatus.
   * Throws a ValidationError if the transition is illegal.
   */
  static validateTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): void {
    if (currentStatus === targetStatus) {
      return; // No-op, allowed for idempotence
    }

    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new ValidationError(`Illegal order status transition from ${currentStatus} to ${targetStatus}`);
    }
  }
}
