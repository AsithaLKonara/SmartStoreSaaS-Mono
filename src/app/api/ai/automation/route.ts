import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/error-handling';
import { withSecurity } from '@/lib/security';

export const GET = withErrorHandling(
  withSecurity(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';

    // AI Automation data
    const automationData = {
      organizationId,
      timestamp: new Date().toISOString(),
      automations: {
        inventory: {
          enabled: true,
          rules: [
            { type: 'low_stock_alert', threshold: 10, action: 'send_notification' },
            { type: 'auto_reorder', threshold: 5, action: 'create_purchase_order' }
          ],
          lastRun: '2024-01-15T14:30:00Z',
          nextRun: '2024-01-15T15:30:00Z'
        },
        customerService: {
          enabled: true,
          chatbots: [
            { name: 'Order Support', status: 'active', conversations: 1250 },
            { name: 'Product Info', status: 'active', conversations: 890 }
          ],
          responseTime: '2.3s',
          satisfaction: 0.92
        },
        marketing: {
          enabled: true,
          campaigns: [
            { name: 'Abandoned Cart Recovery', status: 'active', conversion: 0.15 },
            { name: 'Birthday Offers', status: 'active', conversion: 0.08 }
          ],
          lastRun: '2024-01-15T09:00:00Z'
        }
      },
      performance: {
        totalAutomations: 12,
        activeAutomations: 10,
        successRate: 0.94,
        timeSaved: '45 hours/week'
      }
    };

    return NextResponse.json(automationData);
  })
);

export const POST = withErrorHandling(
  withSecurity(async (request: NextRequest) => {
    const body = await request.json();
    
    // Create new automation rule
    const newAutomation = {
      id: `auto-${Date.now()}`,
      name: body.name,
      type: body.type,
      status: 'active',
      createdAt: new Date().toISOString(),
      ...body
    };

    return NextResponse.json({
      success: true,
      data: newAutomation,
      message: 'Automation rule created successfully'
    });
  })
);
