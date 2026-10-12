import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      email,
      phone,
      customerPhone,
      address,
      city,
      state,
      postalCode,
      pincode,
      shippingAddress,
      subtotal,
      shipping,
      total,
      totalAmount,
      items,
    } = body;

    const targetEmail = (customerEmail || email || '').trim().toLowerCase();
    const targetAddress = address || shippingAddress || 'Standard Delivery Address';
    const targetCity = city || 'Delhi NCR';
    const targetState = state || 'Delhi';
    const targetPostalCode = postalCode || pincode || '110001';
    const targetSubtotal = Number(subtotal) || 0;
    const targetShipping = Number(shipping) || 0;
    const targetTotal = Number(total || totalAmount) || (targetSubtotal + targetShipping);
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    if (!prisma?.order) {
      return NextResponse.json({ error: 'Database client not connected' }, { status: 500 });
    }

    // 1. HARD DATABASE STOCK CHECK BEFORE PURCHASE
    for (const item of items || []) {
      const targetId = item.id || item.productId;
      if (prisma?.product && targetId) {
        const dbProd = await prisma.product.findUnique({
          where: { id: targetId },
          select: { id: true, title: true, stock: true },
        });

        const requestedQty = Number(item.quantity) || 1;
        const availableStock = Number(dbProd?.stock ?? 0);

        // Reject if out of stock
        if (dbProd && availableStock <= 0) {
          return NextResponse.json(
            { error: `"${dbProd.title}" is out of stock. Cannot proceed with order.` },
            { status: 400 }
          );
        }

        // Reject if requested quantity is more than stock
        if (dbProd && availableStock < requestedQty) {
          return NextResponse.json(
            { error: `Insufficient stock for "${dbProd.title}". Available: ${availableStock}, Requested: ${requestedQty}.` },
            { status: 400 }
          );
        }
      }
    }

    // 2. Real Database Order Creation
    const createdOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerName: customerName || 'Valued Client',
        email: targetEmail,
        address: targetAddress,
        city: targetCity,
        state: targetState,
        postalCode: targetPostalCode,
        subtotal: targetSubtotal,
        shipping: targetShipping,
        total: targetTotal,
        status: 'CONFIRMED',
        items: {
          create: (items || []).map((item: any) => ({
            productId: String(item.id || item.productId || 'item-' + Date.now()),
            title: item.title,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image: item.image || '',
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 3. Atomically Deduct Stock from Database
    if (prisma?.product) {
      for (const item of items || []) {
        const targetId = item.id || item.productId;
        const qty = Number(item.quantity) || 1;
        try {
          await prisma.product.update({
            where: { id: targetId },
            data: {
              stock: {
                decrement: qty,
              },
            },
          });
        } catch (e) {
          console.warn(`Could not decrement stock for product ID: ${targetId}`);
        }
      }
    }

    // 4. Nodemailer Dispatch Trigger
    try {
      if (process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER || 'skforfreelance0@gmail.com',
            pass: process.env.EMAIL_PASS,
          },
        });

        const itemsListHtml = (items || [])
          .map(
            (i: any) => `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${i.title} (x${i.quantity})</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">₹${((Number(i.price) || 0) * (Number(i.quantity) || 1)).toLocaleString('en-IN')}</td>
            </tr>`
          )
          .join('');

        await transporter.sendMail({
          from: `"Sinha's Atelier" <${process.env.EMAIL_USER || 'skforfreelance0@gmail.com'}>`,
          to: targetEmail,
          subject: `[Acquisition Confirmed] ${orderNumber} - Official Tax Invoice`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #faf8f5;">
              <h2>SINHA'S ATELIER</h2>
              <p>Acquisition Reference: <strong>${orderNumber}</strong></p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                ${itemsListHtml}
                <tr>
                  <td style="padding-top: 12px; font-weight: bold;">Grand Total</td>
                  <td style="padding-top: 12px; text-align: right; font-weight: bold; font-family: monospace;">₹${targetTotal.toLocaleString('en-IN')}</td>
                </tr>
              </table>
              <p style="margin-top: 20px;">
                <a href="http://localhost:3000/order-success/${orderNumber}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:20px;">
                  Download Official Tax Invoice
                </a>
              </p>
            </div>
          `,
        });
      }
    } catch (e) {
      console.warn('Mail send failed:', e);
    }

    return NextResponse.json({
      success: true,
      orderId: createdOrder.orderNumber,
      order: createdOrder,
    });
  } catch (err: any) {
    console.error('Order creation DB error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// User / Specific Orders Fetch from DB
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const orderId = searchParams.get('orderId');

    if (!email && !orderId) {
      return NextResponse.json({ orders: [] });
    }

    if (!prisma?.order) {
      return NextResponse.json({ orders: [] });
    }

    const whereClause: any = {};
    if (email) whereClause.email = email.trim().toLowerCase();
    if (orderId) {
      whereClause.OR = [
        { orderNumber: orderId.trim() },
        { id: orderId.trim() },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}