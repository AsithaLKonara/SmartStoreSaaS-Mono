import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/docs/swaggerConfig';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Retrieve the OpenAPI specification
 *     description: Returns the complete OpenAPI 3.0.0 JSON specification for the SmartStore SaaS API.
 *     responses:
 *       200:
 *         description: Successfully retrieved the specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  try {
    return NextResponse.json(swaggerSpec);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate API documentation' }, { status: 500 });
  }
}