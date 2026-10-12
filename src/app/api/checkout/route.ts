import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function generateOrderNumber(): string {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  const suffix = Math.floor(100 + Math.random() * 900);
  return `ORD-${randomPart}-${suffix}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, email, phone, address, city, state, postalCode, items } = body;

    if (!customerName || !email || !address || !city || !state || !postalCode) {
      return NextResponse.json(
        { error: 'All delivery and client contact fields are mandatory.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Your shopping bag is empty.' },
        { status: 400 }
      );
    }

    const calculatedSubtotal = items.reduce(
      (acc: number, item: any) => acc + Number(item.price) * Number(item.quantity || 1),
      0
    );
    const calculatedShipping = calculatedSubtotal > 50000 || calculatedSubtotal === 0 ? 0 : 2500;
    const calculatedTotal = calculatedSubtotal + calculatedShipping;
    const orderNumber = generateOrderNumber();

    // Step 1: Bulk fetch products to verify stock
    const productIds = items.map((i: any) => i.id);
    const dbProducts = await (prisma as any).product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map<string, any>(dbProducts.map((p: any) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.id);

      if (!product) {
        return NextResponse.json(
          { error: `Product "${item.title}" is no longer available in our collection.` },
          { status: 400 }
        );
      }

      if (product.stock < Number(item.quantity || 1)) {
        return NextResponse.json(
          { error: `Insufficient stock for "${item.title}". Only ${product.stock} left in inventory.` },
          { status: 400 }
        );
      }
    }

    // Step 2: Create the Order
    const createdOrder = await (prisma as any).order.create({
      data: {
        orderNumber,
        customerName: customerName.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        subtotal: calculatedSubtotal,
        shipping: calculatedShipping,
        total: calculatedTotal,
        status: 'CONFIRMED',
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            title: item.title,
            price: Number(item.price),
            quantity: Number(item.quantity || 1),
            image: item.image || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Step 3: Decrement stock for each purchased product
    for (const item of items) {
      await (prisma as any).product.update({
        where: { id: item.id },
        data: {
          stock: {
            decrement: Number(item.quantity || 1),
          },
        },
      });
    }

    // Step 4: Trigger Automated Confirmation Email in background (non-blocking)
    sendOrderConfirmationEmail({
      to: email.trim().toLowerCase(),
      customerName: customerName.trim(),
      orderNumber,
      items: items.map((i: any) => ({
        title: i.title,
        price: Number(i.price),
        quantity: Number(i.quantity || 1),
      })),
      subtotal: calculatedSubtotal,
      shipping: calculatedShipping,
      total: calculatedTotal,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
    }).catch((err) => console.error('Background email failed:', err));

    return NextResponse.json({
      success: true,
      order: createdOrder,
      message: 'Acquisition confirmed successfully.',
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Transaction could not be completed.' },
      { status: 500 }
    );
  }
}