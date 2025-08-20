import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';
import { getDistributorByUsername, updateDistributor } from '@/libs/database-ecommerce';

export const runtime = 'edge';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find distributor by username
    const distributor = await getDistributorByUsername(username);

    if (!distributor) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if distributor is active
    if (distributor.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active. Please contact support.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, (distributor as any).passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login time
    await updateDistributor(distributor.id, {
      lastLoginAt: new Date().toISOString()
    });

    // Create JWT token
    const token = await new SignJWT({ 
      distributorId: distributor.id,
      username: distributor.username,
      companyName: distributor.companyName,
      tier: distributor.tier,
      type: 'distributor'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Remove sensitive data from response (if it exists)
    const { passwordHash, ...safeDistributor } = distributor as any;

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      distributor: safeDistributor,
      token
    });

    response.cookies.set('distributor-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Distributor login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
