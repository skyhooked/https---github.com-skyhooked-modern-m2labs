import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getInventoryRequests, createInventoryRequest } from '@/libs/database-ecommerce';

export const runtime = 'edge';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

async function getDistributorFromRequest(request: NextRequest) {
  const token = request.cookies.get('distributor-token')?.value;
  
  if (!token) {
    throw new Error('No authentication token');
  }

  const { payload } = await jwtVerify(token, JWT_SECRET);
  
  if (payload.type !== 'distributor') {
    throw new Error('Invalid token type');
  }

  return payload;
}

// GET /api/distributor/inventory-requests - Get distributor's inventory requests
export async function GET(request: NextRequest) {
  try {
    const distributor = await getDistributorFromRequest(request);
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;

    const requests = await getInventoryRequests({
      distributorId: distributor.distributorId as string,
      status,
      priority
    });

    return NextResponse.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching inventory requests:', error);
    
    if (error instanceof Error && (error.message.includes('No authentication token') || error.message.includes('Invalid token'))) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch inventory requests' },
      { status: 500 }
    );
  }
}

// POST /api/distributor/inventory-requests - Create new inventory request
export async function POST(request: NextRequest) {
  try {
    const distributor = await getDistributorFromRequest(request);
    const body = await request.json();
    
    const {
      productId,
      variantId,
      requestedQuantity,
      priority = 'normal',
      requestNotes
    } = body;

    // Validate required fields
    if (!productId || !requestedQuantity || requestedQuantity <= 0) {
      return NextResponse.json(
        { error: 'Product ID and valid quantity are required' },
        { status: 400 }
      );
    }

    const inventoryRequest = await createInventoryRequest({
      distributorId: distributor.distributorId as string,
      productId,
      variantId: variantId || undefined,
      requestedQuantity: parseInt(requestedQuantity),
      approvedQuantity: 0,
      status: 'pending',
      priority,
      requestNotes: requestNotes || undefined,
      adminNotes: undefined,
      approvedDate: undefined,
      fulfilledDate: undefined,
      approvedBy: undefined,
      rejectionReason: undefined
    });

    return NextResponse.json({
      success: true,
      request: inventoryRequest
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory request:', error);
    
    if (error instanceof Error && (error.message.includes('No authentication token') || error.message.includes('Invalid token'))) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create inventory request' },
      { status: 500 }
    );
  }
}
