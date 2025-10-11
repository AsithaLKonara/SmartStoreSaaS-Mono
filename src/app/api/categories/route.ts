/**
 * Categories API
 * Manages product categories with tree structure support
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext, addTenantFilter } from '@/lib/tenant/isolation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/categories - Get all categories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get('includeChildren') === 'true';
    const parentId = searchParams.get('parentId');

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Filter by parent if specified
    if (parentId) {
      where.parentId = parentId;
    } else if (!includeChildren) {
      // Get root categories only
      where.parentId = null;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
            other_categories: true, // Child categories
          }
        },
        ...(includeChildren && {
          other_categories: {
            where: { isActive: true },
            include: {
              _count: {
                select: {
                  products: true,
                }
              }
            }
          }
        })
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        parentId: cat.parentId,
        productCount: cat._count.products,
        childCount: cat._count.other_categories,
        children: includeChildren ? cat.other_categories : undefined,
      })),
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories - Create new category
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Verify parent exists if specified
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent category not found' },
          { status: 404 }
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        id: `cat-${Date.now()}`,
        name,
        description,
        parentId,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories - Update category
 */
export async function PUT(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, description, parentId, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent setting self as parent
    if (parentId === id) {
      return NextResponse.json(
        { success: false, error: 'Category cannot be its own parent' },
        { status: 400 }
      );
    }

    // Verify parent exists if changing
    if (parentId && parentId !== existing.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent category not found' },
          { status: 404 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories - Delete category
 */
export async function DELETE(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category has products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            other_categories: true,
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${category._count.products} products. Please reassign or delete products first.`,
        },
        { status: 400 }
      );
    }

    if (category._count.other_categories > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${category._count.other_categories} subcategories. Please delete or reassign subcategories first.`,
        },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.category.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}

