import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, generateEcwidSSOToken } from '@/libs/auth';
import { getUserById } from '@/libs/database';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure we have a non-null email for Ecwid SSO
    let email = authUser.email;
    if (!email) {
      const fullUser = await getUserById(authUser.id);
      email = fullUser?.email;
    }
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const ssoToken = await generateEcwidSSOToken({
      email,
      customerId: authUser.id,
      name: undefined, // optionally pass `${fullUser?.firstName} ${fullUser?.lastName}` if desired
      ttlSeconds: 300,
    });

    return NextResponse.json({ sso: { token: ssoToken } });
  } catch (error) {
    console.error('Ecwid SSO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
