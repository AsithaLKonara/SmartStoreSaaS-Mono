import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Currency formatting utilities
export function formatCurrency(amount: number, currency: string = 'LKR'): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Phone number formatting utilities
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Return original if not a standard format
  return phone;
}

// Number formatting utilities
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// Percentage formatting utilities
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// File size formatting utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
// Relative time formatting utilities
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateObj);
  }
}

// Time formatting utilities
export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// SKU generation utilities
export function generateSKU(prefix: string = 'SKU'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

// String generation utilities
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Formats a structured address object into a single string.
 * Handles both JSON objects and potentially stringified JSON.
 */
export function formatAddress(address: any): string {
  if (!address) return 'Not Provided';

  let addrObj = address;
  if (typeof address === 'string') {
    try {
      addrObj = JSON.parse(address);
    } catch {
      return address;
    }
  }

  if (typeof addrObj !== 'object') return String(addrObj);

  const parts = [];
  if (addrObj.street) parts.push(addrObj.street);
  if (addrObj.city) parts.push(addrObj.city);
  if (addrObj.state) parts.push(addrObj.state);
  if (addrObj.zipCode) parts.push(addrObj.zipCode);
  if (addrObj.country) parts.push(addrObj.country);

  return parts.length > 0 ? parts.join(', ') : 'Empty Address';
}

