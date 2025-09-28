import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get social media posts
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const platformFilter = searchParams.get('platform');
        const statusFilter = searchParams.get('status');

        const where: any = {
          organizationId: user.organizationId,
        };

        if (platformFilter) {
          where.platform = platformFilter.toUpperCase();
        }

        if (statusFilter) {
          where.status = statusFilter.toUpperCase();
        }

        const [posts, total] = await Promise.all([
          prisma.socialPost.findMany({
            where,
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.socialPost.count({ where }),
        ]);

        return NextResponse.json({
          posts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });

      case 'POST':
        // Create social media post
        const { 
          platform, 
          content, 
          productId, 
          mediaUrls, 
          scheduledAt, 
          hashtags,
          settings 
        } = await request.json();

        if (!platform || !content) {
          return NextResponse.json(
            { error: 'Missing required fields: platform, content' },
            { status: 400 }
          );
        }

        // Validate platform
        const validPlatforms = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER'];
        if (!validPlatforms.includes(platform.toUpperCase())) {
          return NextResponse.json(
            { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
            { status: 400 }
          );
        }

        // Verify product exists if provided
        if (productId) {
          const product = await prisma.product.findFirst({
            where: {
              id: productId,
              organizationId: user.organizationId,
            },
          });

          if (!product) {
            return NextResponse.json(
              { error: 'Product not found' },
              { status: 404 }
            );
          }
        }

        // Check if social commerce integration is active
        const integration = await prisma.socialCommerce.findFirst({
          where: {
            organizationId: user.organizationId,
            platform: platform.toUpperCase(),
            isActive: true,
          },
        });

        if (!integration) {
          return NextResponse.json(
            { error: `${platform} integration is not configured or inactive` },
            { status: 400 }
          );
        }

        // Determine post status
        const now = new Date();
        const scheduledTime = scheduledAt ? new Date(scheduledAt) : null;
        const postStatus = scheduledTime && scheduledTime > now ? 'SCHEDULED' : 'PENDING';

        // Create post
        const newPost = await prisma.socialPost.create({
          data: {
            organizationId: user.organizationId,
            platform: platform.toUpperCase(),
            content,
            productId: productId || null,
            mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
            hashtags: hashtags ? JSON.stringify(hashtags) : null,
            scheduledAt: scheduledTime,
            status: postStatus,
            settings: settings ? JSON.stringify(settings) : null,
          },
        });

        // If post is not scheduled, try to publish immediately
        if (postStatus === 'PENDING') {
          try {
            // TODO: Implement actual social media API calls here
            // For now, we'll simulate success
            await prisma.socialPost.update({
              where: { id: newPost.id },
              data: { 
                status: 'PUBLISHED',
                publishedAt: new Date(),
              },
            });

            return NextResponse.json(
              {
                message: 'Social media post published successfully',
                post: {
                  ...newPost,
                  status: 'PUBLISHED',
                  publishedAt: new Date(),
                },
              },
              { status: 201 }
            );
          } catch (error) {
            // If publishing fails, mark as failed
            await prisma.socialPost.update({
              where: { id: newPost.id },
              data: { status: 'FAILED' },
            });

            return NextResponse.json(
              { error: 'Failed to publish social media post' },
              { status: 500 }
            );
          }
        }

        return NextResponse.json(
          {
            message: 'Social media post scheduled successfully',
            post: newPost,
          },
          { status: 201 }
        );

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Social Media Posts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.PRODUCT_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.MANAGER,
  requiredPermissions: [PERMISSIONS.PRODUCT_WRITE],
});
