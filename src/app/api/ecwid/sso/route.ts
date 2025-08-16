import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, generateEcwidSSOToken } from '@/libs/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      // Return empty response for non-authenticated users
      return NextResponse.json({ sso: null });
    }

    // Generate SSO token for Ecwid
    const ssoToken = generateEcwidSSOToken(user);
    
    return NextResponse.json({
      sso: {
        token: ssoToken,
        timestamp: Math.floor(Date.now() / 1000),
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    });
  } catch (error) {
    console.error('Ecwid SSO error:', error);
    return NextResponse.json(
      { error: 'SSO token generation failed' },
      { status: 500 }
    );
  }
}
