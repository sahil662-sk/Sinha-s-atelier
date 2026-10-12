import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

// 1. GET: Single Product details for /product/[id]
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await context.params;
    const productId = params?.id;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    if (!prisma?.product) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err: any) {
    console.error('Error fetching single product:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. PATCH: Admin direct update for Price & Stock
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await context.params;
    const productId = params?.id;
    const body = await request.json();
    const { price, stock } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    if (!prisma?.product) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const updateData: any = {};
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    console.error('Product update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}