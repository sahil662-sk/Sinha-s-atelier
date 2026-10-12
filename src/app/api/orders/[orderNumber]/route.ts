import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

export async function GET(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> | { orderNumber: string } }
) {
  try {
    const params = await context.params;
    const rawOrderNumber = params?.orderNumber;

    if (!rawOrderNumber) {
      return NextResponse.json({ error: 'Order reference is required' }, { status: 400 });
    }

    const orderNumber = decodeURIComponent(rawOrderNumber).trim();

    if (!prisma?.order) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    // Database lookup using exact Prisma schema columns
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: orderNumber },
          { id: orderNumber },
        ],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: `Order ${orderNumber} not found in database` }, { status: 404 });
    }

    const formattedAddress = [order.address, order.city, order.state, order.postalCode]
      .filter(Boolean)
      .join(', ');

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderNumber || order.id,
        customerName: order.customerName,
        customerEmail: order.email,
        customerPhone: order.customerPhone || '',
        shippingAddress: formattedAddress || order.address,
        subtotal: Number(order.subtotal || 0),
        shipping: Number(order.shipping || 0),
        totalAmount: Number(order.total || 0),
        orderDate: order.createdAt,
        status: order.status,
        items: (order.items || []).map((item: any) => ({
          id: item.id || item.productId,
          title: item.title,
          price: Number(item.price),
          quantity: Number(item.quantity) || 1,
          image: item.image || '',
        })),
      },
    });
  } catch (err: any) {
    console.error('API /api/orders/[orderNumber] error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}