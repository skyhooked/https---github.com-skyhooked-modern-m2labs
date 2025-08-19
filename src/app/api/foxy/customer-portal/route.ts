export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, initializeDatabase } from '@/libs/database-d1';

export async function GET(request: NextRequest) {
  await initializeDatabase();
  
  try {
    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user?.email) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get Foxy subdomain from environment or config
    const foxySubdomain = process.env.FOXY_SUBDOMAIN || 'YOUR_SUBDOMAIN';
    
    // Redirect to Foxy customer portal with pre-auth
    const foxyPortalUrl = `https://${foxySubdomain}.foxycart.com/customer-portal?email=${encodeURIComponent(user.email)}`;
    
    return NextResponse.redirect(foxyPortalUrl);
  } catch (err) {
    console.error('Foxy customer portal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle Foxy customer portal callbacks
export async function POST(request: NextRequest) {
  await initializeDatabase();
  
  try {
    const data = await request.json();
    console.log('Foxy customer portal callback:', data);
    
    // Handle any customer data updates from Foxy
    // This could include subscription changes, address updates, etc.
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Foxy customer portal callback error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
