import { NextRequest, NextResponse } from 'next/server';
import { getUsers, initializeDatabase } from '@/libs/database-d1';
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  // Initialize database on first request
  await initializeDatabase();
  try {
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
