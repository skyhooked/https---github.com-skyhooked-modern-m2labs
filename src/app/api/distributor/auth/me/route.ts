import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getDistributorById } from '@/libs/database-ecommerce';

export const runtime = 'edge';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('distributor-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'distributor') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 401 }
      );
    }

    // Get current distributor data
    const distributor = await getDistributorById(payload.distributorId as string);

    if (!distributor) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    if (distributor.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 401 }
      );
    }

    // Remove sensitive data
    const { passwordHash, ...safeDistributor } = distributor;

    return NextResponse.json({
      success: true,
      distributor: safeDistributor
    });
  } catch (error) {
    console.error('Distributor auth verification error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
