// Comprehensive API type definitions for SmartStoreSaaS
// This file replaces all 'unknown' types with proper interfaces

export interface User {
  id: string;
  email: string;
  name?: string;
  password?: string;
  image?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified?: Date;
  stripeCustomerId?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId?: string;
}

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  plan: 'trial' | 'basic' | 'premium' | 'enterprise';
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  categoryId?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  customerId: string;
  organizationId: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  orderId: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organizationId: string;
  totalSpent: number;
  orders: Order[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reserved: number;
  available: number;
  organizationId: string;
  lastUpdated: Date;
}

export interface Warehouse {
  id: string;
  name: string;
  address: Address;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  transactionId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ChatConversation {
  id: string;
  customerId: string;
  organizationId: string;
  status: 'active' | 'closed' | 'pending';
  assignedTo?: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsData {
  totalSales: number;
  orderCount: number;
  customerCount: number;
  averageOrderValue: number;
  topProducts: Product[];
  monthlyData: Record<string, { total: number; count: number }>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  startedAt: Date;
  completedAt?: Date;
  data: Record<string, unknown>;
  error?: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'payment' | 'shipping' | 'marketing' | 'analytics';
  provider: string;
  config: Record<string, unknown>;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  PAYHERE = 'PAYHERE',
  CASH = 'CASH'
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchFilters {
  query?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Service interfaces
export interface PaymentService {
  createPayment(data: CreatePaymentData): Promise<Payment>;
  processWebhook(payload: unknown, signature: string): Promise<void>;
  refundPayment(paymentId: string, amount?: number): Promise<Payment>;
}

export interface CreatePaymentData {
  orderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  customerId: string;
  metadata?: Record<string, unknown>;
}

export interface EmailService {
  sendEmail(to: string, subject: string, template: string, data: Record<string, unknown>): Promise<void>;
  sendBulkEmail(recipients: string[], subject: string, template: string, data: Record<string, unknown>): Promise<void>;
}

export interface SMSService {
  sendSMS(to: string, message: string): Promise<void>;
  sendBulkSMS(recipients: string[], message: string): Promise<void>;
}

export interface WhatsAppService {
  sendMessage(to: string, message: string): Promise<void>;
  sendTemplate(to: string, templateName: string, variables: Record<string, string>): Promise<void>;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithId<T> = T & { id: string };

export type WithoutId<T> = Omit<T, 'id'>;

export type CreateInput<T> = WithoutId<T>;

export type UpdateInput<T> = DeepPartial<WithoutId<T>>;

