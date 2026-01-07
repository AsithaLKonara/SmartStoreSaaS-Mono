// Notifications service exports
import { logger } from '@/lib/logger';

export const createNotification = async (data: {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
}) => {
  // Simple notification creation
  logger.debug({
    message: 'Notification created',
    context: { service: 'NotificationService', operation: 'createNotification', userId: data.userId, type: data.type, title: data.title }
  });
  return { id: Date.now().toString(), ...data };
};

export type NotificationData = {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
};

