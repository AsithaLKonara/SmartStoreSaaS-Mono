import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import slugify from 'slugify';

export class ShopInitializationService {
  /**
   * Initializes a storefront for a new tenant after subscription.
   */
  async initializeShop(organizationId: string) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        throw new Error(`Organization ${organizationId} not found`);
      }

      // 1. Generate a domain if it doesn't exist
      if (!organization.domain) {
        let baseDomain = slugify(organization.name, { lower: true, strict: true });
        let finalDomain = baseDomain;
        let counter = 1;

        // Ensure uniqueness
        while (await prisma.organization.findUnique({ where: { domain: finalDomain } })) {
          finalDomain = `${baseDomain}-${counter}`;
          counter++;
        }

        await prisma.organization.update({
          where: { id: organizationId },
          data: { 
            domain: finalDomain,
            status: 'ACTIVE' // Activate organization if it was pending
          }
        });

        logger.info({
          message: 'Shop initialized with new domain',
          context: { organizationId, domain: finalDomain }
        });
      } else {
        // Just ensure it's active
        await prisma.organization.update({
          where: { id: organizationId },
          data: { status: 'ACTIVE' }
        });
      }

      // 2. Add default storefront settings in metadata if needed
      // (e.g., theme, welcome message)
      const currentMetadata = (organization.metadata as Record<string, any>) || {};
      if (!currentMetadata.storefront) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            metadata: {
              ...currentMetadata,
              storefront: {
                theme: 'dark',
                welcomeMessage: `Welcome to ${organization.name}`,
                isActive: true
              }
            }
          }
        });
      }

      return true;
    } catch (error) {
      logger.error({
        message: 'Failed to initialize shop',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { organizationId }
      });
      throw error;
    }
  }
}

export const shopInitializationService = new ShopInitializationService();
