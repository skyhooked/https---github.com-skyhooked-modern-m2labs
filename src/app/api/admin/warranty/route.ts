import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { getWarrantyClaims, updateWarrantyClaim } from '@/libs/database';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const claims = await getWarrantyClaims();

    return NextResponse.json({
      claims: claims.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    });
  } catch (error) {
    console.error('Get warranty claims error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { claimId, status, notes } = body;

    if (!claimId || !status) {
      return NextResponse.json(
        { error: 'Claim ID and status are required' },
        { status: 400 }
      );
    }

    const updatedClaim = await updateWarrantyClaim(claimId, { status, notes });

    if (!updatedClaim) {
      return NextResponse.json(
        { error: 'Warranty claim not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Warranty claim updated successfully',
      claim: updatedClaim
    });
  } catch (error) {
    console.error('Update warranty claim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
