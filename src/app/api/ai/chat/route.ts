import { NextResponse } from 'next/server';
import { createAuthHandler, PERMISSIONS, ROLES, AuthRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handler(request: AuthRequest) {
  try {
    const user = request.user!;

    switch (request.method) {
      case 'GET':
        // Get chat sessions (simplified for now)
        return NextResponse.json({
          sessions: [],
          message: 'AI chat endpoint is available'
        });

      case 'POST':
        // AI Chat endpoint
        const { message, context, sessionId } = await request.json();

        if (!message) {
          return NextResponse.json(
            { error: 'Missing required field: message' },
            { status: 400 }
          );
        }

        // Get organization settings
        const organization = await prisma.organization.findUnique({
          where: { id: user.organizationId },
          select: {
            name: true,
            settings: true,
          },
        });

        if (!organization) {
          return NextResponse.json(
            { error: 'Organization not found' },
            { status: 404 }
          );
        }

        const orgSettings = organization.settings ? JSON.parse(organization.settings) : {};
        const aiSettings = orgSettings.ai || {};

        // Prepare context for AI
        let systemPrompt = `You are an AI assistant for ${organization.name}, an e-commerce business. 
        You help customers with product information, order status, and general inquiries. 
        Be helpful, friendly, and professional.`;

        if (context?.productId) {
          // Get product information for context
          const product = await prisma.product.findFirst({
            where: {
              id: context.productId,
              organizationId: user.organizationId,
            },
            include: {
              category: true,
              variants: true,
            },
          });

          if (product) {
            systemPrompt += `\n\nProduct Context:
            Name: ${product.name}
            Description: ${product.description}
            Price: $${product.price}
            Stock: ${product.stock}
            Category: ${product.category?.name || 'N/A'}
            SKU: ${product.sku}`;
          }
        }

        if (context?.orderId) {
          // Get order information for context
          const order = await prisma.order.findFirst({
            where: {
              id: context.orderId,
              organizationId: user.organizationId,
            },
            include: {
              customer: true,
              items: {
                include: {
                  product: true,
                },
              },
            },
          });

          if (order) {
            systemPrompt += `\n\nOrder Context:
            Order Number: ${order.orderNumber}
            Status: ${order.status}
            Total: $${order.total}
            Customer: ${order.customer?.name || 'N/A'}
            Items: ${order.items.map(item => `${item.product.name} x${item.quantity}`).join(', ')}`;
          }
        }

        // Add business-specific context
        if (aiSettings.businessType) {
          systemPrompt += `\n\nBusiness Type: ${aiSettings.businessType}`;
        }

        if (aiSettings.specializations) {
          systemPrompt += `\n\nSpecializations: ${aiSettings.specializations.join(', ')}`;
        }

            // Check if OpenAI API key is configured
            let aiResponse = 'I apologize, but the AI service is not currently configured. Please contact your administrator to set up the OpenAI API key.';
            
            if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
              try {
                // Call OpenAI API
                const completion = await openai.chat.completions.create({
                  model: aiSettings.model || 'gpt-3.5-turbo',
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message },
                  ],
                  max_tokens: aiSettings.maxTokens || 500,
                  temperature: aiSettings.temperature || 0.7,
                });

                aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
              } catch (openaiError) {
                console.error('OpenAI API error:', openaiError);
                aiResponse = 'I apologize, but I encountered an error while processing your request. Please try again later.';
              }
            }

        // Save conversation to database (simplified for now)
        // Note: AI conversation saving disabled due to model complexity

        return NextResponse.json({
          response: aiResponse,
          sessionId: sessionId || generateSessionId(),
        });

      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getExistingMessages(sessionId: string) {
  try {
    const conversation = await prisma.aiConversation.findUnique({
      where: { id: sessionId },
      select: { messages: true },
    });

    if (conversation?.messages) {
      return JSON.parse(conversation.messages);
    }
    return [];
  } catch (error) {
    console.error('Error fetching existing messages:', error);
    return [];
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export handlers with appropriate authentication
export const GET = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});

export const POST = createAuthHandler(handler, {
  requiredRole: ROLES.USER,
  requiredPermissions: [PERMISSIONS.ANALYTICS_READ],
});
