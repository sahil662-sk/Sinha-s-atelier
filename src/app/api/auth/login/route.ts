import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, passcode } = body;

    const inputPass = (password || passcode || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !inputPass) {
      return NextResponse.json(
        { error: 'Email and passcode are required' },
        { status: 400 }
      );
    }

    if (!prisma?.user) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 500 }
      );
    }

    // 1. Fetch user from Neon DB
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found in registered records.' },
        { status: 404 }
      );
    }

    // 2. Strict Password Validation: Sirf exact password chalega
    if (user.password !== inputPass) {
      return NextResponse.json(
        { error: 'Incorrect passcode entered' },
        { status: 401 }
      );
    }

    // 3. Role strictly from Database
    const role = (user.role || 'USER').toUpperCase();

    const userPayload = {
      id: user.id,
      name: user.name || cleanEmail.split('@')[0].toUpperCase(),
      email: user.email,
      phone: user.phone || '',
      role: role,
    };

    const token = 'session_' + Buffer.from(cleanEmail).toString('base64') + '_' + Date.now();

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: userPayload,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal authentication error' },
      { status: 500 }
    );
  }
}