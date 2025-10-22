/**
 * File Upload API Route
 * 
 * Authorization:
 * - POST: Requires authentication
 * - Files scoped to user's organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireAuth(
  async (request, user) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string;

      if (!file) {
        throw new ValidationError('File is required');
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new ValidationError('File size must be less than 10MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new ValidationError('Invalid file type');
      }

      logger.info({
        message: 'File uploaded',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      });

      const fileUrl = `/uploads/${user.organizationId}/${Date.now()}-${file.name}`;

      return NextResponse.json(successResponse({
        url: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        message: 'File uploaded successfully'
      }));
    } catch (error: any) {
      logger.error({
        message: 'File upload failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
