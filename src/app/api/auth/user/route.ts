import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: 'Email address is required.' };
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: 'Please enter a well-formatted email address.' };
  }

  const [username, domain] = clean.split('@');
  const dummyUsernames = ['xyz', 'abc', 'test', 'admin', 'fake', 'demo', 'asdf'];
  if (dummyUsernames.includes(username)) {
    return { valid: false, error: `"${username}" is a placeholder. Please enter a genuine email.` };
  }

  return { valid: true };
}

function validatePhone(phone?: string | null): { valid: boolean; formatted?: string; error?: string } {
  if (!phone || !phone.trim()) return { valid: false, error: 'Mobile number is required.' };
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+91')) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = cleaned.slice(2);
  else if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = cleaned.slice(1);

  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }
  return { valid: true, formatted: `+91 ${cleaned}` };
}

// 1. GET: Session check with DB-level Verification
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('customer_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const session = JSON.parse(sessionCookie.value);

    // Auto-Expiry: Check 30 minutes inactivity timeout
    const now = Date.now();
    const maxInactivity = 30 * 60 * 1000; // 30 minutes
    if (session.lastActive && now - session.lastActive > maxInactivity) {
      cookieStore.delete('customer_session');
      return NextResponse.json({ authenticated: false, user: null, expired: true });
    }

    // Refresh last active timestamp
    session.lastActive = now;
    cookieStore.set('customer_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 60, // 30 mins
    });

    // Real-time role check from Database
    const dbUser = await (prisma as any).user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    if (!dbUser) {
      cookieStore.delete('customer_session');
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({ authenticated: true, user: dbUser });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

// 2. POST: Register or Login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, name, email, password, phone } = body;
    const cleanEmail = email?.trim().toLowerCase();

    const emailCheck = validateEmail(cleanEmail);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    // SIGN UP / REGISTER
    if (mode === 'register') {
      if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
      }

      const phoneCheck = validatePhone(phone);
      if (!phoneCheck.valid) {
        return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
      }

      const existingUser = await (prisma as any).user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Account already exists. Please Sign In.' }, { status: 400 });
      }

      const newUser = await (prisma as any).user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          phone: phoneCheck.formatted,
          role: 'CUSTOMER', // Default role
        },
      });

      const sessionData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        lastActive: Date.now(),
      };

      const cookieStore = await cookies();
      cookieStore.set('customer_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 60, // 30 minutes auto-expiry
      });

      return NextResponse.json({ success: true, user: sessionData });
    }

    // SIGN IN / LOGIN
    if (mode === 'login') {
      const user = await (prisma as any).user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        return NextResponse.json({ error: 'No account found. Please Register first.' }, { status: 404 });
      }

      if (user.password !== hashedPassword) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
      }

      const sessionData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'CUSTOMER',
        lastActive: Date.now(),
      };

      const cookieStore = await cookies();
      cookieStore.set('customer_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 60, // 30 minutes auto-expiry
      });

      return NextResponse.json({ success: true, user: sessionData });
    }

    return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
  }
}

// 3. DELETE: Sign Out
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('customer_session');
  cookieStore.delete('admin_token');
  return NextResponse.json({ success: true, message: 'Logged out.' });
}