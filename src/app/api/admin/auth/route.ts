import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json();
    const correctKey = process.env.ADMIN_SECRET_KEY || 'sinha@admin2026';

    if (passcode !== correctKey) {
      return NextResponse.json({ error: 'Invalid admin passcode' }, { status: 401 });
    }

    // Secure cookie set karo (7 days valid)
    const cookieStore = await cookies();
    cookieStore.set('admin_token', 'authenticated_admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, message: 'Admin authenticated' });
  } catch (error) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}

// Check session
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');

  if (token?.value === 'authenticated_admin') {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

// Logout Admin
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  return NextResponse.json({ success: true });
}