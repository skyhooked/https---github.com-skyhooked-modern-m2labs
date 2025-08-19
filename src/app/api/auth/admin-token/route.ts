import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/libs/auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Simple password check - same as AuthWrapper
    const ADMIN_PASSWORD = 'admin123'; // TODO: Move to environment variables
    
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    // Generate JWT token with admin role
    const token = await signToken({
      sub: 'admin', // Simple admin ID
      role: 'admin',
      email: 'admin@m2labs.com',
    });

    return NextResponse.json({
      message: 'Admin token generated successfully',
      token
    });
  } catch (error) {
    console.error('Admin token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
