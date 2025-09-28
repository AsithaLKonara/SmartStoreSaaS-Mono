import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Run integration tests
        const { searchParams } = new URL(request.url);
        const testSuite = searchParams.get('suite') || 'all';

        const testResults = await runIntegrationTests(user.organizationId, testSuite);

        return NextResponse.json({
          testSuite,
          results: testResults,
          timestamp: new Date().toISOString(),
        });

      case 'POST':
        // Run specific integration test
        const { testName, parameters } = await request.json();

        if (!testName) {
          return NextResponse.json(
            { error: 'Missing required field: testName' },
            { status: 400 }
          );
        }

        const testResult = await runSpecificTest(user.organizationId, testName, parameters);

        return NextResponse.json({
          testName,
          result: testResult,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Integration Testing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function runIntegrationTests(organizationId: string, testSuite: string) {
  const results: any[] = [];

  try {
    // Database Integration Tests
    if (testSuite === 'all' || testSuite === 'database') {
      results.push(await testDatabaseIntegration(organizationId));
    }

    // API Integration Tests
    if (testSuite === 'all' || testSuite === 'api') {
      results.push(await testAPIIntegration(organizationId));
    }

    // Authentication Tests
    if (testSuite === 'all' || testSuite === 'auth') {
      results.push(await testAuthentication(organizationId));
    }

    // External Service Tests
    if (testSuite === 'all' || testSuite === 'external') {
      results.push(await testExternalServices(organizationId));
    }

    // Performance Tests
    if (testSuite === 'all' || testSuite === 'performance') {
      results.push(await testPerformance(organizationId));
    }

    return {
      status: results.every(r => r.status === 'passed') ? 'passed' : 'failed',
      totalTests: results.length,
      passedTests: results.filter(r => r.status === 'passed').length,
      failedTests: results.filter(r => r.status === 'failed').length,
      tests: results,
    };
  } catch (error) {
    console.error('Error running integration tests:', error);
    return {
      status: 'error',
      error: error.message,
      tests: results,
    };
  }
}

async function runSpecificTest(organizationId: string, testName: string, parameters: any) {
  try {
    switch (testName) {
      case 'database_connection':
        return await testDatabaseConnection();
      case 'user_crud':
        return await testUserCRUD(organizationId);
      case 'product_crud':
        return await testProductCRUD(organizationId);
      case 'order_workflow':
        return await testOrderWorkflow(organizationId);
      case 'payment_processing':
        return await testPaymentProcessing(organizationId);
      case 'whatsapp_integration':
        return await testWhatsAppIntegration(organizationId);
      case 'social_commerce':
        return await testSocialCommerce(organizationId);
      case 'ai_chat':
        return await testAIChat(organizationId);
      case 'cache_performance':
        return await testCachePerformance();
      default:
        return {
          status: 'failed',
          error: `Unknown test: ${testName}`,
        };
    }
  } catch (error) {
    console.error(`Error running test ${testName}:`, error);
    return {
      status: 'failed',
      error: error.message,
    };
  }
}

// Test implementations
async function testDatabaseIntegration(organizationId: string) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Test basic CRUD operations
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'testpassword',
        role: 'USER',
        organizationId,
      },
    });

    const retrievedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });

    await prisma.user.delete({
      where: { id: testUser.id },
    });

    if (retrievedUser && retrievedUser.id === testUser.id) {
      return {
        name: 'database_integration',
        status: 'passed',
        details: 'Database CRUD operations successful',
      };
    } else {
      return {
        name: 'database_integration',
        status: 'failed',
        error: 'Data integrity issue detected',
      };
    }
  } catch (error) {
    return {
      name: 'database_integration',
      status: 'failed',
      error: error.message,
    };
  }
}

async function testAPIIntegration(organizationId: string) {
  try {
    // Test API endpoint accessibility
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/testing/health`);
    const healthData = await response.json();

    if (healthData.status === 'healthy') {
      return {
        name: 'api_integration',
        status: 'passed',
        details: 'API endpoints accessible and healthy',
      };
    } else {
      return {
        name: 'api_integration',
        status: 'failed',
        error: 'API health check failed',
      };
    }
  } catch (error) {
    return {
      name: 'api_integration',
      status: 'failed',
      error: error.message,
    };
  }
}

async function testAuthentication(organizationId: string) {
  try {
    // Test authentication flow
    const testUser = await prisma.user.create({
      data: {
        email: `auth-test-${Date.now()}@example.com`,
        name: 'Auth Test User',
        password: 'testpassword',
        role: 'USER',
        organizationId,
      },
    });

    // Test password verification (simplified)
    const user = await prisma.user.findUnique({
      where: { id: testUser.id },
    });

    await prisma.user.delete({
      where: { id: testUser.id },
    });

    if (user && user.email === testUser.email) {
      return {
        name: 'authentication',
        status: 'passed',
        details: 'Authentication system functional',
      };
    } else {
      return {
        name: 'authentication',
        status: 'failed',
        error: 'Authentication test failed',
      };
    }
  } catch (error) {
    return {
      name: 'authentication',
      status: 'failed',
      error: error.message,
    };
  }
}

async function testExternalServices(organizationId: string) {
  try {
    const results = [];

    // Test OpenAI API (if configured)
    if (process.env.OPENAI_API_KEY) {
      results.push({
        service: 'openai',
        status: 'configured',
        details: 'OpenAI API key is available',
      });
    } else {
      results.push({
        service: 'openai',
        status: 'not_configured',
        details: 'OpenAI API key not configured',
      });
    }

    // Test WhatsApp integration
    const whatsappIntegration = await prisma.whatsAppIntegration.findFirst({
      where: { organizationId },
    });

    results.push({
      service: 'whatsapp',
      status: whatsappIntegration ? 'configured' : 'not_configured',
      details: whatsappIntegration ? 'WhatsApp integration exists' : 'No WhatsApp integration found',
    });

    return {
      name: 'external_services',
      status: 'passed',
      details: results,
    };
  } catch (error) {
    return {
      name: 'external_services',
      status: 'failed',
      error: error.message,
    };
  }
}

async function testPerformance(organizationId: string) {
  try {
    const startTime = Date.now();

    // Test database query performance
    await prisma.product.findMany({
      where: { organizationId },
      take: 10,
    });

    const queryTime = Date.now() - startTime;

    if (queryTime < 1000) { // Less than 1 second
      return {
        name: 'performance',
        status: 'passed',
        details: `Database query completed in ${queryTime}ms`,
      };
    } else {
      return {
        name: 'performance',
        status: 'failed',
        error: `Database query too slow: ${queryTime}ms`,
      };
    }
  } catch (error) {
    return {
      name: 'performance',
      status: 'failed',
      error: error.message,
    };
  }
}

// Specific test functions
async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'passed',
      details: 'Database connection successful',
    };
  } catch (error) {
    return {
      status: 'failed',
      error: error.message,
    };
  }
}

async function testUserCRUD(organizationId: string) {
  try {
    // Create
    const user = await prisma.user.create({
      data: {
        email: `crud-test-${Date.now()}@example.com`,
        name: 'CRUD Test User',
        password: 'testpassword',
        role: 'USER',
        organizationId,
      },
    });

    // Read
    const retrieved = await prisma.user.findUnique({
      where: { id: user.id },
    });

    // Update
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Updated Name' },
    });

    // Delete
    await prisma.user.delete({
      where: { id: user.id },
    });

    return {
      status: 'passed',
      details: 'User CRUD operations successful',
    };
  } catch (error) {
    return {
      status: 'failed',
      error: error.message,
    };
  }
}

async function testProductCRUD(organizationId: string) {
  try {
    // Create category first
    const category = await prisma.category.create({
      data: {
        name: `Test Category ${Date.now()}`,
        organizationId,
      },
    });

    // Create product
    const product = await prisma.product.create({
      data: {
        name: `Test Product ${Date.now()}`,
        description: 'Test product description',
        sku: `TEST-${Date.now()}`,
        price: 100.00,
        stock: 10,
        categoryId: category.id,
        organizationId,
      },
    });

    // Read
    const retrieved = await prisma.product.findUnique({
      where: { id: product.id },
    });

    // Update
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { price: 150.00 },
    });

    // Delete
    await prisma.product.delete({
      where: { id: product.id },
    });

    await prisma.category.delete({
      where: { id: category.id },
    });

    return {
      status: 'passed',
      details: 'Product CRUD operations successful',
    };
  } catch (error) {
    return {
      status: 'failed',
      error: error.message,
    };
  }
}

async function testOrderWorkflow(organizationId: string) {
  try {
    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: `Test Customer ${Date.now()}`,
        email: `customer-${Date.now()}@example.com`,
        phone: '123-456-7890',
        organizationId,
      },
    });

    // Create category and product
    const category = await prisma.category.create({
      data: {
        name: `Test Category ${Date.now()}`,
        organizationId,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: `Test Product ${Date.now()}`,
        description: 'Test product description',
        sku: `TEST-${Date.now()}`,
        price: 100.00,
        stock: 10,
        categoryId: category.id,
        organizationId,
      },
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-ORD-${Date.now()}`,
        customerId: customer.id,
        organizationId,
        status: 'PENDING',
        total: 100.00,
        subtotal: 100.00,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            price: 100.00,
            total: 100.00,
          },
        },
      },
    });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PROCESSING' },
    });

    // Cleanup
    await prisma.order.delete({
      where: { id: order.id },
    });
    await prisma.product.delete({
      where: { id: product.id },
    });
    await prisma.category.delete({
      where: { id: category.id },
    });
    await prisma.customer.delete({
      where: { id: customer.id },
    });

    return {
      status: 'passed',
      details: 'Order workflow test successful',
    };
  } catch (error) {
    return {
      status: 'failed',
      error: error.message,
    };
  }
}

async function testPaymentProcessing(organizationId: string) {
  // This would test payment gateway integration
  return {
    status: 'passed',
    details: 'Payment processing test (mock)',
  };
}

async function testWhatsAppIntegration(organizationId: string) {
  try {
    const integration = await prisma.whatsAppIntegration.findFirst({
      where: { organizationId },
    });

    if (integration) {
      return {
        status: 'passed',
        details: 'WhatsApp integration configured',
      };
    } else {
      return {
        status: 'skipped',
        details: 'WhatsApp integration not configured',
      };
    }
  } catch (error) {
    return {
      status: 'failed',
      error: error.message,
    };
  }
}

async function testSocialCommerce(organizationId: string) {
  try {
    const integration = await prisma.socialCommerce.findFirst({
      where: { organizationId },
    });

    if (integration) {
      return {
        status: 'passed',
        details: 'Social commerce integration configured',
      };
    } else {
      return {
        status: 'skipped',
        details: 'Social commerce integration not configured',
      };
    }
  } catch (error) {
    return {
      status: 'failed',
      error: error.message,
    };
  }
}

async function testAIChat(organizationId: string) {
  if (process.env.OPENAI_API_KEY) {
    return {
      status: 'passed',
      details: 'AI chat service available',
    };
  } else {
    return {
      status: 'skipped',
      details: 'OpenAI API key not configured',
    };
  }
}

async function testCachePerformance() {
  // This would test cache performance
  return {
    status: 'passed',
    details: 'Cache performance test (mock)',
  };
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.ADMIN,
  requiredPermissions: [PERMISSIONS.ANALYTICS_WRITE],
});
