import { NextRequest, NextResponse } from 'next/server';
import { getDistributorById, updateDistributor, deleteDistributor } from '@/libs/database-ecommerce';
import { hash } from 'bcryptjs';

export const runtime = 'edge';

// GET /api/admin/distributors/[id] - Get distributor by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const distributor = await getDistributorById(id);

    if (!distributor) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    // Remove passwordHash from response
    const { passwordHash, ...safeDistributor } = distributor;

    return NextResponse.json({
      success: true,
      distributor: safeDistributor
    });
  } catch (error) {
    console.error('Error fetching distributor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch distributor' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/distributors/[id] - Update distributor
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    
    // If password is being updated, hash it
    if (body.password) {
      body.passwordHash = await hash(body.password, 12);
      delete body.password;
    }

    // Convert numeric fields
    if (body.discountRate !== undefined) {
      body.discountRate = parseFloat(body.discountRate) || 0;
    }
    if (body.creditLimit !== undefined) {
      body.creditLimit = parseFloat(body.creditLimit) || 0;
    }
    if (body.currentBalance !== undefined) {
      body.currentBalance = parseFloat(body.currentBalance) || 0;
    }
    if (body.isVerified !== undefined) {
      body.isVerified = Boolean(body.isVerified);
    }

    const updatedDistributor = await updateDistributor(id, body);

    if (!updatedDistributor) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    // Remove passwordHash from response
    const { passwordHash, ...safeDistributor } = updatedDistributor;

    return NextResponse.json({
      success: true,
      distributor: safeDistributor
    });
  } catch (error) {
    console.error('Error updating distributor:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Email or username already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update distributor' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/distributors/[id] - Delete distributor
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const success = await deleteDistributor(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Distributor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting distributor:', error);
    return NextResponse.json(
      { error: 'Failed to delete distributor' },
      { status: 500 }
    );
  }
}
