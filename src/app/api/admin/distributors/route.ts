import { NextRequest, NextResponse } from 'next/server';
import { getAllDistributors, createDistributor } from '@/libs/database-ecommerce';
import { hash } from 'bcryptjs';

export const runtime = 'edge';

// GET /api/admin/distributors - Get all distributors
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const tier = searchParams.get('tier') || undefined;
    const territory = searchParams.get('territory') || undefined;

    const distributors = await getAllDistributors({
      status,
      tier,
      territory
    });

    // Remove passwordHash from response (if it exists)
    const safeDistributors = distributors.map((dist: any) => {
      const { passwordHash, ...distributor } = dist;
      return distributor;
    });

    return NextResponse.json({
      success: true,
      distributors: safeDistributors
    });
  } catch (error) {
    console.error('Error fetching distributors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch distributors' },
      { status: 500 }
    );
  }
}

// POST /api/admin/distributors - Create new distributor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyName,
      contactName,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
      username,
      password,
      territory,
      discountRate = 0,
      creditLimit = 0,
      currentBalance = 0,
      status = 'active',
      tier = 'standard',
      notes,
      createdBy,
      isVerified = false
    } = body;

    // Validate required fields
    if (!companyName || !contactName || !email || !username || !password) {
      return NextResponse.json(
        { error: 'Company name, contact name, email, username, and password are required' },
        { status: 400 }
      );
    }

    // Validate credit limit maximum
    if (creditLimit > 30000) {
      return NextResponse.json(
        { error: 'Credit limit cannot exceed $30,000' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await hash(password, 12);

    const distributor = await createDistributor({
      companyName,
      contactName,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
      country: country || 'US',
      username,
      passwordHash,
      territory,
      discountRate: parseFloat(discountRate) || 0,
      creditLimit: parseFloat(creditLimit) || 0,
      currentBalance: parseFloat(currentBalance) || 0,
      status,
      tier,
      notes,
      createdBy,
      isVerified: Boolean(isVerified)
    });

    // Remove passwordHash from response (if it exists)
    const { passwordHash: _, ...safeDistributor } = distributor as any;

    return NextResponse.json({
      success: true,
      distributor: safeDistributor
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating distributor:', error);
    
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Email or username already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create distributor' },
      { status: 500 }
    );
  }
}
