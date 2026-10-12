import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return token?.value === 'authenticated_admin';
}

// 1. GET: Fetch all products with category and stock info
export async function GET() {
  try {
    const isAuthorized = await verifyAdmin();
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const products = await (prisma as any).product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Admin Products Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalog.' },
      { status: 500 }
    );
  }
}

// 2. PATCH: Update Stock AND / OR Price
export async function PATCH(req: Request) {
  try {
    const isAuthorized = await verifyAdmin();
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, newStock, newPrice } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required.' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (typeof newStock === 'number') {
      updateData.stock = Math.max(0, Math.floor(newStock));
    }

    if (typeof newPrice === 'number' && newPrice >= 0) {
      updateData.price = newPrice;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Provide at least one valid field to update (stock or price).' },
        { status: 400 }
      );
    }

    const updatedProduct = await (prisma as any).product.update({
      where: { id: productId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully.',
    });
  } catch (error: any) {
    console.error('Admin Product Update Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product.' },
      { status: 500 }
    );
  }
}