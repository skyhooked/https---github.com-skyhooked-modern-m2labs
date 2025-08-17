import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { getUsers } from '@/libs/database';
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const users = await getUsers();
    
    // Remove password field from response
    const sanitizedUsers = users.map(({ password, ...user }: any) => user);

    return NextResponse.json({
      users: sanitizedUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
