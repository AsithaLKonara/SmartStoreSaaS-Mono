import { pricingService } from './pricing.service';
import { prisma } from '../prisma';

// Mock Prisma
jest.mock('../prisma', () => ({
  prisma: {
    coupon: {
      findFirst: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  },
}));

describe('PricingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateOrderPricing', () => {
    it('should calculate base total correctly', async () => {
      const items = [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 1 },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'p1', price: 100 },
        { id: 'p2', price: 50 },
      ]);

      const result = await pricingService.calculateOrderPricing({
        organizationId: 'org1',
        items,
      });

      expect(result.subtotal).toBe(250);
      expect(result.total).toBe(250); // No tax/shipping for now
    });

    it('should apply percentage discount coupon correctly', async () => {
      const items = [{ productId: 'p1', quantity: 1 }];
      
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'p1', price: 100 },
      ]);

      (prisma.coupon.findFirst as jest.Mock).mockResolvedValue({
        id: 'c1',
        code: 'SAVE10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isActive: true,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
      });

      const result = await pricingService.calculateOrderPricing({
        organizationId: 'org1',
        items,
        couponCode: 'SAVE10',
      });

      expect(result.discount).toBe(10);
      expect(result.total).toBe(90);
    });

    it('should apply fixed discount coupon correctly', async () => {
        const items = [{ productId: 'p1', quantity: 1 }];
        
        (prisma.product.findMany as jest.Mock).mockResolvedValue([
          { id: 'p1', price: 100 },
        ]);
  
        (prisma.coupon.findFirst as jest.Mock).mockResolvedValue({
          id: 'c2',
          code: 'FLAT20',
          discountType: 'FIXED',
          discountValue: 20,
          isActive: true,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
        });
  
        const result = await pricingService.calculateOrderPricing({
          organizationId: 'org1',
          items,
          couponCode: 'FLAT20',
        });
  
        expect(result.discount).toBe(20);
        expect(result.total).toBe(80);
      });
  });
});
