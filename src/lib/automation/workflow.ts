/**
 * Automation & Workflow Engine
 */

import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/service';
import { emailService } from '@/lib/email/emailService';
import { logger } from '@/lib/logger';

export enum TriggerEvent {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_PAID = 'ORDER_PAID',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  PRODUCT_LOW_STOCK = 'PRODUCT_LOW_STOCK',
  PRODUCT_OUT_OF_STOCK = 'PRODUCT_OUT_OF_STOCK',
  CUSTOMER_REGISTERED = 'CUSTOMER_REGISTERED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum ActionType {
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_SMS = 'SEND_SMS',
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  UPDATE_STATUS = 'UPDATE_STATUS',
  CREATE_TASK = 'CREATE_TASK',
  WEBHOOK = 'WEBHOOK',
}

export interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  trigger: TriggerEvent;
  conditions?: any[];
  actions: WorkflowAction[];
  isActive: boolean;
}

export interface WorkflowAction {
  type: ActionType;
  config: any;
}

/**
 * Execute workflow when trigger event occurs
 */
export async function executeWorkflow(
  trigger: TriggerEvent,
  data: any,
  organizationId: string
): Promise<void> {
  try {
    // Find active workflows for this trigger
    const workflows = await prisma.workflow.findMany({
      where: {
        organizationId,
        trigger,
        isActive: true,
      },
    });

    for (const workflow of workflows) {
      // Check conditions
      if (workflow.conditions && !evaluateConditions(workflow.conditions, data)) {
        continue;
      }

      // Execute actions
      for (const action of workflow.actions as WorkflowAction[]) {
        await executeAction(action, data, organizationId);
      }
    }
  } catch (error) {
    logger.error({
      message: 'Workflow execution error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'AutomationWorkflow', operation: 'executeWorkflow', workflowId: workflow.id }
    });
  }
}

/**
 * Evaluate workflow conditions
 */
function evaluateConditions(conditions: any[], data: any): boolean {
  // Simple condition evaluation
  return conditions.every(condition => {
    const { field, operator, value } = condition;
    const fieldValue = data[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      case 'contains':
        return String(fieldValue).includes(value);
      default:
        return true;
    }
  });
}

/**
 * Execute individual action
 */
async function executeAction(
  action: WorkflowAction,
  data: any,
  organizationId: string
): Promise<void> {
  try {
    switch (action.type) {
      case ActionType.SEND_EMAIL:
        await sendEmailAction(action.config, data);
        break;

      case ActionType.SEND_NOTIFICATION:
        await sendNotificationAction(action.config, data, organizationId);
        break;

      case ActionType.UPDATE_STATUS:
        await updateStatusAction(action.config, data);
        break;

      // Add more action types as needed
    }
  } catch (error) {
    logger.error({
      message: 'Action execution error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { service: 'AutomationWorkflow', operation: 'executeAction', actionType: action.type }
    });
  }
}

async function sendEmailAction(config: any, data: any) {
  const { to, subject, template } = config;
  const emailTo = to || data.customer?.email;

  if (!emailTo) return;

  await emailService.sendEmail({
    to: emailTo,
    subject: subject || 'Notification',
    htmlContent: renderTemplate(template, data),
    textContent: renderTemplate(template, data),
  });
}

async function sendNotificationAction(config: any, data: any, organizationId: string) {
  const { userId, message } = config;

  if (!userId) return;

  await notificationService.send({
    userId,
    organizationId,
    title: 'Workflow Notification',
    message: renderTemplate(message, data),
    type: 'INFO',
    channel: 'IN_APP',
  });
}

async function updateStatusAction(config: any, data: any) {
  const { entityType, entityId, newStatus } = config;

  if (entityType === 'order') {
    await prisma.order.update({
      where: { id: entityId || data.orderId },
      data: { status: newStatus },
    });
  }
}

/**
 * Simple template rendering
 */
function renderTemplate(template: string, data: any): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}

/**
 * Pre-defined workflow templates
 */
export const WorkflowTemplates = {
  ORDER_CONFIRMATION: {
    name: 'Order Confirmation',
    trigger: TriggerEvent.ORDER_CREATED,
    actions: [
      {
        type: ActionType.SEND_EMAIL,
        config: {
          subject: 'Order Confirmation - #{{orderNumber}}',
          template: 'Thank you for your order! Your order #{{orderNumber}} has been received.',
        },
      },
    ],
  },
  LOW_STOCK_ALERT: {
    name: 'Low Stock Alert',
    trigger: TriggerEvent.PRODUCT_LOW_STOCK,
    actions: [
      {
        type: ActionType.SEND_NOTIFICATION,
        config: {
          message: 'Product {{productName}} is low on stock. Current: {{stock}}, Minimum: {{minStock}}',
        },
      },
    ],
  },
  PAYMENT_RECEIVED: {
    name: 'Payment Received',
    trigger: TriggerEvent.PAYMENT_RECEIVED,
    actions: [
      {
        type: ActionType.SEND_EMAIL,
        config: {
          subject: 'Payment Received - {{amount}}',
          template: 'We have received your payment of {{amount}}. Thank you!',
        },
      },
      {
        type: ActionType.UPDATE_STATUS,
        config: {
          entityType: 'order',
          newStatus: 'PAID',
        },
      },
    ],
  },
};

