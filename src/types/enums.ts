/**
 * Centralized Enums and Constants
 * 
 * This file serves as the source of truth for enums used across the platform,
 * especially those that are shared between Prisma and business logic.
 */

import { 
  OrderStatus as PrismaOrderStatus, 
  SubscriptionStatus as PrismaSubscriptionStatus,
  ReturnStatus as PrismaReturnStatus,
  PaymentStatus as PrismaPaymentStatus,
  InvoiceStatus as PrismaInvoiceStatus
} from '@prisma/client';

export const OrderStatus = PrismaOrderStatus;
export type OrderStatus = PrismaOrderStatus;

export const SubscriptionStatus = PrismaSubscriptionStatus;
export type SubscriptionStatus = PrismaSubscriptionStatus;

export const ReturnStatus = PrismaReturnStatus;
export type ReturnStatus = PrismaReturnStatus;

export const PaymentStatus = PrismaPaymentStatus;
export type PaymentStatus = PrismaPaymentStatus;

export const InvoiceStatus = PrismaInvoiceStatus;
export type InvoiceStatus = PrismaInvoiceStatus;

/**
 * Workflow-specific enums (not in Prisma)
 */
export enum WorkflowNodeType {
  TRIGGER = 'TRIGGER',
  ACTION = 'ACTION',
  CONDITION = 'CONDITION',
  DELAY = 'DELAY',
  WEBHOOK = 'WEBHOOK',
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

export enum WorkflowExecutionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

/**
 * Social Media specific enums
 */
export enum SocialPlatform {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  TIKTOK = 'TIKTOK',
  LINKEDIN = 'LINKEDIN'
}
