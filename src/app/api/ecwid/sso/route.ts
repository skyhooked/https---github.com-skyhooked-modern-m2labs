import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, generateEcwidSSOToken } from '@/libs/auth';

export const runtime = 'edge';

// Support both GET and POST in case your frontend calls either
export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ssoToken = await generateEcwidSSOToken({
      email: user.email,          // required by the helper
      customerId: user.id,        // optional, but useful for mapping
      // name: you can add a name string here if you have it on hand
      ttlSeconds: 300,            // 5 minutes
    });

    return NextResponse.json({
      sso: {
        token: ssoToken,
        email: user.email,
        customerId: user.id,
        expiresIn: 300,
      },
    });
  } catch (err) {
    console.error('Ecwid SSO error:', err);
    return NextResponse.json({ error: 'Failed to generate SSO token' }, { status: 500 });
  }
}
