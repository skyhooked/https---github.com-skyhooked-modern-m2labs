// src/app/api/ecwid/sso/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getUserFromRequest, generateEcwidSSOToken } from '@/libs/auth';
import { getUserById } from '@/libs/database';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load full user to get a name (optional)
    const full = await getUserById(authUser.id);
    const email = authUser.email || full?.email;
    if (!email) {
      return NextResponse.json({ error: 'User email is required for Ecwid SSO' }, { status: 400 });
    }

    const name =
      (full?.firstName || '') + (full?.lastName ? ` ${full.lastName}` : '');

    const ssoToken = generateEcwidSSOToken({
      email,
      customerId: authUser.id,
      name: name.trim() || undefined,
      ttlSeconds: 10 * 60,
    });

    return NextResponse.json({ sso: { token: ssoToken } });
  } catch (err) {
    console.error('Ecwid SSO error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
