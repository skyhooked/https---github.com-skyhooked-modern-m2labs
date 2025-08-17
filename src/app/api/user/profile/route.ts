export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { getUserById, updateUser } from '@/libs/database';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const fresh = await getUserById(sessionUser.id);
    if (!fresh) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: fresh.id,
        email: fresh.email,
        firstName: fresh.firstName,
        lastName: fresh.lastName,
        phone: fresh.phone,
        dateOfBirth: fresh.dateOfBirth,
        isVerified: fresh.isVerified,
        role: fresh.role,
        createdAt: fresh.createdAt,
      },
    });
  } catch (err: unknown) {
    console.error('Get profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Support both PUT and POST for profile updates
export async function PUT(request: NextRequest) {
  return handleUpdate(request);
}
export async function POST(request: NextRequest) {
  return handleUpdate(request);
}

async function handleUpdate(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const firstName = typeof body.firstName === 'string' ? body.firstName : undefined;
    const lastName = typeof body.lastName === 'string' ? body.lastName : undefined;
    const phone = typeof body.phone === 'string' ? body.phone : undefined;
    const dateOfBirth = typeof body.dateOfBirth === 'string' ? body.dateOfBirth : undefined;

    const updated = await updateUser(sessionUser.id, {
      ...(firstName !== undefined ? { firstName } : {}),
      ...(lastName !== undefined ? { lastName } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(dateOfBirth !== undefined ? { dateOfBirth } : {}),
    });

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        dateOfBirth: updated.dateOfBirth,
        isVerified: updated.isVerified,
        role: updated.role,
        createdAt: updated.createdAt,
      },
    });
  } catch (err: unknown) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
