import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

// GET: User wishlist items
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: true, wishlist: [] });
    }

    if (!prisma?.user) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        wishlist: {
          include: { product: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: true, wishlist: [] });
    }

    const items = (user.wishlist || []).map((w: any) => ({
      id: w.product.id,
      title: w.product.title,
      description: w.product.description || '',
      price: Number(w.product.price),
      image: w.product.image || '',
      stock: w.product.stock,
    }));

    return NextResponse.json({ success: true, wishlist: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add or Toggle
export async function POST(request: Request) {
  try {
    const { email, productId } = await request.json();

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !productId) {
      return NextResponse.json({ error: 'Authentication and product ID required' }, { status: 400 });
    }

    if (!prisma?.user) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, inWishlist: false, message: 'Removed from wishlist' });
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          productId: productId,
        },
      });
      return NextResponse.json({ success: true, inWishlist: true, message: 'Saved to wishlist' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Strictly Remove (Zero Toggle Confusion)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const productId = searchParams.get('productId');

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !productId) {
      return NextResponse.json({ error: 'Email and product ID required' }, { status: 400 });
    }

    if (!prisma?.user) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ success: true, message: 'User not found' });
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: user.id,
        productId: productId,
      },
    });

    return NextResponse.json({ success: true, message: 'Item permanently deleted from wishlist' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}