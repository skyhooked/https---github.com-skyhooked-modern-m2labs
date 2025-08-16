import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { getWarrantyClaimsByUserId, createWarrantyClaim } from '@/libs/database';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const claims = await getWarrantyClaimsByUserId(user.id);

    return NextResponse.json({
      claims: claims.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      ),
    });
  } catch (error) {
    console.error('Get warranty claims error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, productName, serialNumber, issue } = body;

    // Validate required fields
    if (!orderId || !productName || !serialNumber || !issue) {
      return NextResponse.json(
        { error: 'Order ID, product name, serial number, and issue description are required' },
        { status: 400 }
      );
    }

    // Create warranty claim
    const claim = await createWarrantyClaim({
      userId: user.id,
      orderId,
      productName,
      serialNumber,
      issue,
      status: 'submitted',
    });

    return NextResponse.json(
      {
        message: 'Warranty claim submitted successfully',
        claim,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create warranty claim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
