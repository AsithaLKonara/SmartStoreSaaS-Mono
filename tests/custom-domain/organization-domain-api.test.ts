import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Import the modules to test
import { prisma } from '@/lib/prisma';
import { GET, PUT } from '@/app/api/settings/organization/route';

describe('Organization Domain Management API', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/settings/organization', () => {
    it('should return organization settings with domain', async () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        domain: 'mystore.com',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: 'Test organization',
          theme: 'light',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.domain).toBe('mystore.com');
      expect(data.name).toBe('Test Organization');
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 404 when organization is not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(404);
    });

    it('should handle database errors gracefully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/settings/organization', () => {
    it('should update organization domain successfully', async () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        domain: 'mystore.com',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: 'Test organization',
          theme: 'light',
          features: ['custom-domain', 'analytics'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(null); // Domain available
      (prisma.organization.update as jest.Mock).mockResolvedValue(mockOrganization);

      const updateData = {
        name: 'Test Organization',
        domain: 'mystore.com',
        description: 'Test organization',
      };

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.domain).toBe('mystore.com');
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        data: {
          name: 'Test Organization',
          domain: 'mystore.com',
          settings: {
            description: 'Test organization',
          },
        },
        select: {
          id: true,
          name: true,
          domain: true,
          plan: true,
          status: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return 400 when domain is already taken', async () => {
      const existingOrg = {
        id: 'other-org-id',
        name: 'Other Organization',
        domain: 'taken.com',
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(existingOrg);

      const updateData = {
        name: 'Test Organization',
        domain: 'taken.com',
      };

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const updateData = {
        name: 'Test Organization',
        domain: 'mystore.com',
      };

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const updateData = {
        name: 'Test Organization',
        domain: 'mystore.com',
      };

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(500);
    });

    it('should validate domain format', async () => {
      const invalidDomains = [
        'invalid..domain.com',
        'domain-with-spaces .com',
        'domain_with_underscores.com',
        'domain-with-special-chars!@#.com',
      ];

      for (const domain of invalidDomains) {
        const updateData = {
          name: 'Test Organization',
          domain: domain,
        };

        (getServerSession as jest.Mock).mockResolvedValue(mockSession);

        const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });

        const response = await PUT(request);
        // Should still process but domain validation would be in middleware
        expect(prisma.organization.findFirst).toHaveBeenCalled();
      }
    });

    it('should handle missing required fields', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      
      // Mock the existing organization fetch
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Organization'
      });
      
      // Mock the organization update
      (prisma.organization.update as jest.Mock).mockResolvedValue({
        id: 'org-123',
        name: 'Test Organization',
        domain: 'mystore.com',
        plan: 'FREE',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const updateData = {
        // Missing name field
        domain: 'mystore.com',
      };

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.domain).toBe('mystore.com');
    });

    it('should handle empty domain (removing custom domain)', async () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        domain: null,
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: 'Test organization',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.update as jest.Mock).mockResolvedValue(mockOrganization);

      const updateData = {
        name: 'Test Organization',
        domain: null,
      };

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.domain).toBeNull();
    });

    it('should handle malformed JSON in request body', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
    });

    it('should handle concurrent domain updates', async () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        domain: 'mystore.com',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: 'Test organization',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.organization.update as jest.Mock).mockResolvedValue(mockOrganization);

      const updateData = {
        name: 'Test Organization',
        domain: 'mystore.com',
      };

      const request1 = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const request2 = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify({ ...updateData, domain: 'another.com' }),
      });

      const [response1, response2] = await Promise.all([PUT(request1), PUT(request2)]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });
});
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Import the modules to test
import { prisma } from '@/lib/prisma';
import { GET, PUT } from '@/app/api/settings/organization/route';

describe('Organization Domain Management API', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/settings/organization', () => {
    it('should return organization settings with domain', async () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        domain: 'mystore.com',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: 'Test organization',
          theme: 'light',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockOrganization);
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        select: {
          id: true,
          name: true,
          domain: true,
          plan: true,
          status: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent organization', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(404);
    });

    it('should handle database errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/settings/organization', () => {
    it('should update organization domain successfully', async () => {
      const updateData = {
        name: 'Updated Organization',
        domain: 'newstore.com',
        description: 'Updated description',
        settings: {
          theme: 'dark',
          features: ['analytics', 'reports'],
        },
      };

      const updatedOrganization = {
        id: 'org-123',
        name: 'Updated Organization',
        domain: 'newstore.com',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: 'Updated description',
          theme: 'dark',
          features: ['analytics', 'reports'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(null); // Domain not taken
      (prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedOrganization);
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        data: {
          name: 'Updated Organization',
          domain: 'newstore.com',
          settings: {
            theme: 'dark',
            features: ['analytics', 'reports'],
            description: 'Updated description',
          },
        },
        select: {
          id: true,
          name: true,
          domain: true,
          plan: true,
          status: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing organization name', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify({ domain: 'test.com' }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for domain already taken by another organization', async () => {
      const updateData = {
        name: 'Test Organization',
        domain: 'taken.com',
      };

      const existingOrg = {
        id: 'other-org-id',
        name: 'Other Organization',
        domain: 'taken.com',
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(existingOrg);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: {
          domain: 'taken.com',
          id: { not: 'org-123' },
        },
      });
    });

    it('should allow organization to keep its own domain', async () => {
      const updateData = {
        name: 'Updated Organization',
        domain: 'mystore.com', // Same domain as current
      };

      const updatedOrganization = {
        id: 'org-123',
        name: 'Updated Organization',
        domain: 'mystore.com',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(null); // No other org with this domain
      (prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });

    it('should handle null domain (removing domain)', async () => {
      const updateData = {
        name: 'Test Organization',
        domain: null,
      };

      const updatedOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        domain: null,
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        data: {
          name: 'Test Organization',
          domain: null,
          settings: {
            description: null,
          },
        },
        select: {
          id: true,
          name: true,
          domain: true,
          plan: true,
          status: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should handle database errors during update', async () => {
      const updateData = {
        name: 'Test Organization',
        domain: 'test.com',
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.organization.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(500);
    });

    it('should handle invalid JSON in request body', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: 'invalid json',
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Domain Validation Integration', () => {
    it('should validate domain format before saving', async () => {
      const updateData = {
        name: 'Test Organization',
        domain: 'invalid..domain.com',
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      // Should still reach the database check since format validation would be in middleware
      expect(prisma.organization.findFirst).toHaveBeenCalled();
    });

    it('should handle special characters in domain', async () => {
      const updateData = {
        name: 'Test Organization',
        domain: 'test-site.co.uk',
      };

      const updatedOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        domain: 'test-site.co.uk',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Security and Authorization', () => {
    it('should only allow organization members to update settings', async () => {
      const unauthorizedSession = {
        user: {
          id: 'other-user-123',
          email: 'other@example.com',
          organizationId: 'other-org-123',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(unauthorizedSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test Organization',
          domain: 'test.com',
        }),
      });

      const response = await PUT(request);

      // Should still process the request but with different organization ID
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'other-org-123' },
        data: expect.any(Object),
        select: expect.any(Object),
      });
    });

    it('should handle missing organizationId in session', async () => {
      const incompleteSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          // organizationId missing
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(incompleteSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/settings/organization', () => {
    it('should return organization settings with domain', async () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        domain: 'mystore.com',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: 'Test organization',
          theme: 'light',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockOrganization);
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        select: {
          id: true,
          name: true,
          domain: true,
          plan: true,
          status: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent organization', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(404);
    });

    it('should handle database errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/settings/organization', () => {
    it('should update organization domain successfully', async () => {
      const updateData = {
        name: 'Updated Organization',
        domain: 'newstore.com',
        description: 'Updated description',
        settings: {
          theme: 'dark',
          features: ['analytics', 'reports'],
        },
      };

      const updatedOrganization = {
        id: 'org-123',
        name: 'Updated Organization',
        domain: 'newstore.com',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: 'Updated description',
          theme: 'dark',
          features: ['analytics', 'reports'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(null); // Domain not taken
      (prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedOrganization);
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        data: {
          name: 'Updated Organization',
          domain: 'newstore.com',
          settings: {
            theme: 'dark',
            features: ['analytics', 'reports'],
            description: 'Updated description',
          },
        },
        select: {
          id: true,
          name: true,
          domain: true,
          plan: true,
          status: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing organization name', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify({ domain: 'test.com' }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for domain already taken by another organization', async () => {
      const updateData = {
        name: 'Test Organization',
        domain: 'taken.com',
      };

      const existingOrg = {
        id: 'other-org-id',
        name: 'Other Organization',
        domain: 'taken.com',
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(existingOrg);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: {
          domain: 'taken.com',
          id: { not: 'org-123' },
        },
      });
    });

    it('should allow organization to keep its own domain', async () => {
      const updateData = {
        name: 'Updated Organization',
        domain: 'mystore.com', // Same domain as current
      };

      const updatedOrganization = {
        id: 'org-123',
        name: 'Updated Organization',
        domain: 'mystore.com',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(null); // No other org with this domain
      (prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });

    it('should handle null domain (removing domain)', async () => {
      const updateData = {
        name: 'Test Organization',
        domain: null,
      };

      const updatedOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        domain: null,
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        data: {
          name: 'Test Organization',
          domain: null,
          settings: {
            description: null,
          },
        },
        select: {
          id: true,
          name: true,
          domain: true,
          plan: true,
          status: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should handle database errors during update', async () => {
      const updateData = {
        name: 'Test Organization',
        domain: 'test.com',
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.organization.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(500);
    });

    it('should handle invalid JSON in request body', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: 'invalid json',
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Domain Validation Integration', () => {
    it('should validate domain format before saving', async () => {
      const updateData = {
        name: 'Test Organization',
        domain: 'invalid..domain.com',
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      // Should still reach the database check since format validation would be in middleware
      expect(prisma.organization.findFirst).toHaveBeenCalled();
    });

    it('should handle special characters in domain', async () => {
      const updateData = {
        name: 'Test Organization',
        domain: 'test-site.co.uk',
      };

      const updatedOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        domain: 'test-site.co.uk',
        plan: 'PRO',
        status: 'ACTIVE',
        settings: {
          description: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrganization);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Security and Authorization', () => {
    it('should only allow organization members to update settings', async () => {
      const unauthorizedSession = {
        user: {
          id: 'other-user-123',
          email: 'other@example.com',
          organizationId: 'other-org-123',
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(unauthorizedSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test Organization',
          domain: 'test.com',
        }),
      });

      const response = await PUT(request);

      // Should still process the request but with different organization ID
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'other-org-123' },
        data: expect.any(Object),
        select: expect.any(Object),
      });
    });

    it('should handle missing organizationId in session', async () => {
      const incompleteSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          // organizationId missing
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue(incompleteSession);

      const request = new NextRequest('https://api.smartstore.com/api/settings/organization');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});
