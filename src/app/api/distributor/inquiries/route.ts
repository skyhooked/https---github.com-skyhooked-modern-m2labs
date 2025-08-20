import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getDistributorInquiries, createDistributorInquiry } from '@/libs/database-ecommerce';

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

// GET /api/distributor/inquiries - Get distributor's inquiries
export async function GET(request: NextRequest) {
  try {
    const distributor = await getDistributorFromRequest(request);
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;

    const inquiries = await getDistributorInquiries({
      distributorId: distributor.distributorId as string,
      status,
      category
    });

    return NextResponse.json({
      success: true,
      inquiries
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    
    if (error instanceof Error && (error.message.includes('No authentication token') || error.message.includes('Invalid token'))) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}

// POST /api/distributor/inquiries - Create new inquiry
export async function POST(request: NextRequest) {
  try {
    const distributor = await getDistributorFromRequest(request);
    const body = await request.json();
    
    const {
      subject,
      category = 'general',
      priority = 'normal',
      message
    } = body;

    // Validate required fields
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    const inquiry = await createDistributorInquiry({
      distributorId: distributor.distributorId as string,
      subject,
      category,
      priority,
      status: 'open',
      message,
      distributorResponse: undefined,
      adminResponse: undefined,
      resolvedAt: undefined,
      resolvedBy: undefined
    });

    return NextResponse.json({
      success: true,
      inquiry
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    
    if (error instanceof Error && (error.message.includes('No authentication token') || error.message.includes('Invalid token'))) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    );
  }
}
