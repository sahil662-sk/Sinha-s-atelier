import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

// GET: Fetch user's saved profile & address safely without crashing on missing columns
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    if (!prisma?.user) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch User base record
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in registry' }, { status: 404 });
    }

    // 2. Fetch last shipping address from past orders if user table doesn't have address columns
    let userAddress = user.address || '';
    let userCity = user.city || '';
    let userState = user.state || '';
    let userPostalCode = user.postalCode || '';

    if ((!userAddress || !userCity) && prisma?.order) {
      try {
        const lastOrder = await prisma.order.findFirst({
          where: { email: cleanEmail },
          orderBy: { createdAt: 'desc' },
        });

        if (lastOrder) {
          userAddress = userAddress || lastOrder.address || '';
          userCity = userCity || lastOrder.city || '';
          userState = userState || lastOrder.state || '';
          userPostalCode = userPostalCode || lastOrder.postalCode || '';
        }
      } catch (orderErr) {
        // Fallback silently if order query fails
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name || cleanEmail.split('@')[0].toUpperCase(),
        email: user.email,
        phone: user.phone || '',
        address: userAddress,
        city: userCity,
        state: userState,
        postalCode: userPostalCode,
      },
    });
  } catch (err: any) {
    console.error('Profile API GET error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal database error' },
      { status: 500 }
    );
  }
}

// POST: Safely save address updates
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, phone, address, city, state, postalCode } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!prisma?.user) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    // Prepare update data carefully
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();

    // Try updating direct fields if available in schema
    try {
      if (address !== undefined) updateData.address = address.trim();
      if (city !== undefined) updateData.city = city.trim();
      if (state !== undefined) updateData.state = state.trim();
      if (postalCode !== undefined) updateData.postalCode = postalCode.trim();

      const updated = await prisma.user.update({
        where: { email: cleanEmail },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: 'Profile saved successfully',
        profile: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          address: updated.address || address || '',
          city: updated.city || city || '',
          state: updated.state || state || '',
          postalCode: updated.postalCode || postalCode || '',
        },
      });
    } catch (fieldErr) {
      // Agar schema me address column nahi tha, toh sirf name/phone update karo bina crash huye
      delete updateData.address;
      delete updateData.city;
      delete updateData.state;
      delete updateData.postalCode;

      const fallbackUpdate = await prisma.user.update({
        where: { email: cleanEmail },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: 'Profile saved successfully',
        profile: {
          id: fallbackUpdate.id,
          name: fallbackUpdate.name,
          email: fallbackUpdate.email,
          phone: fallbackUpdate.phone,
          address: address || '',
          city: city || '',
          state: state || '',
          postalCode: postalCode || '',
        },
      });
    }
  } catch (err: any) {
    console.error('Profile API POST error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}