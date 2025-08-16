import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, generateEcwidSSOToken } from '@/libs/auth';
import { ensureUserForEmail } from '@/libs/database';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Auth: read from Authorization Bearer or 'auth_token' cookie
    const me = await getUserFromRequest(request);
    if (!me?.email) {
      return NextResponse.json({ error: 'Unauthorized or missing email' }, { status: 401 });
    }

    // Make sure the user exists locally
    const user = await ensureUserForEmail(me.email);

    // Build SSO token payload explicitly with required email
    const ssoToken = generateEcwidSSOToken({
      email: user.email,
      customerId: user.id,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      ttlSeconds: 300,
    });

    return NextResponse.json({
      sso: {
        token: ssoToken,
        email: user.email,
        customerId: user.id,
      },
    });
  } catch (err) {
    console.error('Ecwid SSO error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
