export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, initializeDatabase, ensureUserForEmail } from '@/libs/database-d1';

export async function GET(request: NextRequest) {
  // Initialize database on first request
  await initializeDatabase();
  
  try {
    // Auth: read from Authorization Bearer or 'auth_token' cookie
    const me = await getUserFromRequest(request);
    if (!me?.email) {
      return NextResponse.json({ error: 'Unauthorized or missing email' }, { status: 401 });
    }

    // Make sure the user exists locally
    const user = await ensureUserForEmail(me.email);

    // For Foxy, we'll return customer data that can be used to pre-populate the checkout
    // Foxy doesn't have the same SSO token system as Ecwid, but we can provide customer info
    return NextResponse.json({
      customer: {
        email: user.email,
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        phone: user.phone || '',
        customer_id: user.id,
      },
      success: true
    });
  } catch (err) {
    console.error('Foxy SSO error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST method for receiving Foxy SSO requests (if needed)
export async function POST(request: NextRequest) {
  await initializeDatabase();
  
  try {
    const data = await request.json();
    console.log('Foxy SSO POST request:', data);
    
    // Handle Foxy's SSO callback if you implement full SSO
    // For now, just return success
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Foxy SSO POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
