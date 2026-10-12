import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (newPassword || '').trim();

    if (!cleanEmail || !cleanPass) {
      return NextResponse.json(
        { error: 'Email and new passcode are required' },
        { status: 400 }
      );
    }

    if (!prisma?.user) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 500 }
      );
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found in client registry.' },
        { status: 404 }
      );
    }

    // Update password in Neon database
    await prisma.user.update({
      where: { email: cleanEmail },
      data: {
        password: cleanPass,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Passcode successfully updated in database.',
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update passcode' },
      { status: 500 }
    );
  }
}