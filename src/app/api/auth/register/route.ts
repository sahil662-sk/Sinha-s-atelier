import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();

    if (!cleanEmail || !cleanPass) {
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

    // Check if user already exists in DB
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // Check if registering admin email configured in .env
    const adminEmail = (process.env.ADMIN_EMAIL || 'skforfreelance0@gmail.com').trim().toLowerCase();
    const role = cleanEmail === adminEmail ? 'ADMIN' : 'USER';

    // Create user in Neon PostgreSQL database
    const newUser = await prisma.user.create({
      data: {
        name: cleanName || cleanEmail.split('@')[0].toUpperCase(),
        email: cleanEmail,
        phone: cleanPhone,
        password: cleanPass,
        role: role,
      },
    });

    const token = 'session_' + Buffer.from(cleanEmail).toString('base64') + '_' + Date.now();

    return NextResponse.json({
      success: true,
      message: 'Account successfully registered',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal registration error' },
      { status: 500 }
    );
  }
}