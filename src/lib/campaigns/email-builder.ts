/**
 * Email Campaign Builder & Manager
 */

import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/emailService';

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  PAUSED = 'PAUSED',
  FAILED = 'FAILED',
}

export enum CampaignType {
  PROMOTIONAL = 'PROMOTIONAL',
  NEWSLETTER = 'NEWSLETTER',
  TRANSACTIONAL = 'TRANSACTIONAL',
  ABANDONED_CART = 'ABANDONED_CART',
  WELCOME = 'WELCOME',
  WIN_BACK = 'WIN_BACK',
}

export interface EmailTemplate {
  subject: string;
  preheader?: string;
  htmlContent: string;
  textContent: string;
  variables?: string[];
}

export interface CampaignData {
  name: string;
  type: CampaignType;
  subject: string;
  template: EmailTemplate;
  segmentId?: string;
  scheduledAt?: Date;
  organizationId: string;
}

/**
 * Create email campaign
 */
export async function createCampaign(
  data: CampaignData
): Promise<{ success: boolean; campaign?: any; error?: string }> {
  try {
    const campaign = await prisma.emailCampaign.create({
      data: {
        ...data,
        status: CampaignStatus.DRAFT,
        totalRecipients: 0,
        sentCount: 0,
        openCount: 0,
        clickCount: 0,
        bounceCount: 0,
        template: data.template as any,
      },
    });

    return { success: true, campaign };
  } catch (error: any) {
    console.error('Create campaign error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Schedule campaign
 */
export async function scheduleCampaign(
  campaignId: string,
  scheduledAt: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SCHEDULED,
        scheduledAt,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Schedule campaign error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send campaign
 */
export async function sendCampaign(
  campaignId: string,
  testMode: boolean = false
): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    // Get recipients
    let recipients;
    if (campaign.segmentId) {
      recipients = await getSegmentRecipients(campaign.segmentId);
    } else {
      recipients = await prisma.customer.findMany({
        where: {
          organizationId: campaign.organizationId,
          email: { not: null },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    }

    if (testMode) {
      recipients = recipients.slice(0, 5); // Only send to 5 in test mode
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENDING,
        totalRecipients: recipients.length,
        sentAt: new Date(),
      },
    });

    const template = campaign.template as any;
    let sentCount = 0;
    let failedCount = 0;

    // Send emails
    for (const recipient of recipients) {
      try {
        const personalizedContent = personalizeTemplate(template.htmlContent, {
          name: recipient.name,
          email: recipient.email,
        });

        await emailService.sendEmail({
          to: recipient.email,
          subject: campaign.subject,
          htmlContent: personalizedContent,
          textContent: template.textContent,
        });

        // Track sent
        await prisma.emailCampaignRecipient.create({
          data: {
            campaignId,
            customerId: recipient.id,
            email: recipient.email,
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
        failedCount++;
      }
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENT,
        sentCount,
        failedCount,
      },
    });

    return {
      success: true,
      stats: {
        total: recipients.length,
        sent: sentCount,
        failed: failedCount,
      },
    };
  } catch (error: any) {
    console.error('Send campaign error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Personalize email template
 */
function personalizeTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

/**
 * Get segment recipients
 */
async function getSegmentRecipients(segmentId: string) {
  const segment = await prisma.customerSegment.findUnique({
    where: { id: segmentId },
    include: {
      customers: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return segment?.customers || [];
}

/**
 * Track email open
 */
export async function trackEmailOpen(
  campaignId: string,
  recipientId: string
): Promise<void> {
  try {
    await prisma.emailCampaignRecipient.update({
      where: { id: recipientId },
      data: {
        opened: true,
        openedAt: new Date(),
      },
    });

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        openCount: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('Track open error:', error);
  }
}

/**
 * Track email click
 */
export async function trackEmailClick(
  campaignId: string,
  recipientId: string,
  url: string
): Promise<void> {
  try {
    await prisma.emailCampaignClick.create({
      data: {
        recipientId,
        url,
        clickedAt: new Date(),
      },
    });

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        clickCount: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('Track click error:', error);
  }
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: string) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: {
      recipients: {
        include: {
          clicks: true,
        },
      },
    },
  });

  if (!campaign) {
    return null;
  }

  const openRate = campaign.totalRecipients > 0 
    ? (campaign.openCount / campaign.totalRecipients) * 100 
    : 0;

  const clickRate = campaign.totalRecipients > 0 
    ? (campaign.clickCount / campaign.totalRecipients) * 100 
    : 0;

  const clickToOpenRate = campaign.openCount > 0 
    ? (campaign.clickCount / campaign.openCount) * 100 
    : 0;

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      sentAt: campaign.sentAt,
    },
    stats: {
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      openCount: campaign.openCount,
      clickCount: campaign.clickCount,
      bounceCount: campaign.bounceCount,
      failedCount: campaign.failedCount,
      openRate,
      clickRate,
      clickToOpenRate,
    },
    topLinks: getTopClickedLinks(campaign.recipients),
  };
}

function getTopClickedLinks(recipients: any[]): Array<{ url: string; clicks: number }> {
  const linkClicks: Record<string, number> = {};

  recipients.forEach(recipient => {
    recipient.clicks?.forEach((click: any) => {
      linkClicks[click.url] = (linkClicks[click.url] || 0) + 1;
    });
  });

  return Object.entries(linkClicks)
    .map(([url, clicks]) => ({ url, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);
}

/**
 * Pre-built email templates
 */
export const EmailTemplates = {
  WELCOME: {
    subject: 'Welcome to {{storeName}}!',
    htmlContent: `
      <h1>Welcome {{name}}!</h1>
      <p>Thank you for joining {{storeName}}. We're excited to have you!</p>
      <p>Get started by exploring our products and enjoy exclusive offers.</p>
      <a href="{{shopUrl}}">Start Shopping</a>
    `,
    textContent: 'Welcome {{name}}! Thank you for joining {{storeName}}.',
  },
  ABANDONED_CART: {
    subject: 'You left something behind!',
    htmlContent: `
      <h1>Don't forget your items!</h1>
      <p>Hi {{name}}, you have items waiting in your cart.</p>
      <p>Complete your purchase now and get 10% off with code: CART10</p>
      <a href="{{cartUrl}}">Complete Purchase</a>
    `,
    textContent: 'Hi {{name}}, you have items waiting in your cart. Complete your purchase now!',
  },
  PROMOTIONAL: {
    subject: 'Special Offer Just for You!',
    htmlContent: `
      <h1>Exclusive Offer!</h1>
      <p>Hi {{name}}, we have a special offer just for you.</p>
      <p>Use code {{couponCode}} for {{discount}}% off your next purchase!</p>
      <a href="{{shopUrl}}">Shop Now</a>
    `,
    textContent: 'Hi {{name}}, use code {{couponCode}} for {{discount}}% off!',
  },
};

