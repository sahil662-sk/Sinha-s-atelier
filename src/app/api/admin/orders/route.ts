import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

// 1. GET ALL ORDERS FOR ADMIN FEED
export async function GET() {
  try {
    if (!prisma?.order) {
      return NextResponse.json({ orders: [] }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedOrders = orders.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber || o.id,
      customerName: o.customerName || 'Valued Client',
      email: o.email || o.customerEmail || '',
      phone: o.customerPhone || o.phone || '',
      city: o.city || '',
      state: o.state || '',
      address: o.address || '',
      postalCode: o.postalCode || '',
      total: Number(o.total ?? o.totalAmount ?? 0),
      status: o.status || 'CONFIRMED',
      createdAt: o.createdAt,
      items: (o.items || []).map((it: any) => ({
        id: it.id,
        title: it.title,
        price: Number(it.price),
        quantity: Number(it.quantity || 1),
        image: it.image || '',
      })),
    }));

    return NextResponse.json(
      { success: true, orders: formattedOrders },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    console.error('Admin orders fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. PATCH: UPDATE STATUS (PROCESSING, SHIPPED, DELIVERED, CANCELLED)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, orderNumber, status } = body;

    if ((!orderId && !orderNumber) || !status) {
      return NextResponse.json({ error: 'Order reference and status required' }, { status: 400 });
    }

    if (!prisma?.order) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(orderNumber ? [{ orderNumber: orderNumber }] : []),
        ],
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: existingOrder.id },
      data: { status: status.toUpperCase() },
      include: { items: true },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error('Admin status update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}