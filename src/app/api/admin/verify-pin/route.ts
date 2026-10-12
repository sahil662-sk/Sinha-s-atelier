import { NextResponse } from 'next/server';
import * as prismaModule from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const prisma: any = (prismaModule as any).prisma || (prismaModule as any).default || prismaModule;

export async function POST(request: Request) {
  try {
    const { email, secretKey } = await request.json();

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanKey = (secretKey || '').trim();

    const adminEmail = (process.env.ADMIN_EMAIL || 'skforfreelance0@gmail.com').trim().toLowerCase();
    const adminSecret = (process.env.ADMIN_SECRET_KEY || 'skforfreelance0').trim();

    // Check 1: Must match configured Admin Email or DB role
    if (cleanEmail !== adminEmail) {
      if (prisma?.user) {
        const dbUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (dbUser?.role !== 'ADMIN') {
          return NextResponse.json({ success: false, error: 'Unauthorized user context' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized user context' }, { status: 403 });
      }
    }

    // Check 2: Must match Environment Secret Key
    if (cleanKey === adminSecret) {
      return NextResponse.json({
        success: true,
        message: 'Root Clearance Granted',
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid Administrative Secret Key' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}