import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 4-digit verification code generate karo
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();

    console.log('\n========================================');
    console.log(`[PASSWORD RESET CODE FOR: ${cleanEmail}]`);
    console.log(`CODE: ${generatedCode}`);
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      message: 'Verification code generated successfully.',
      code: generatedCode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process forgot password request' },
      { status: 500 }
    );
  }
}