import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get('artist');
  // Try different app_id formats that are more likely to work with public API
  const appId = searchParams.get('app_id') || 'squarespace-sample-event-calendar';

  if (!artistName) {
    return NextResponse.json({ error: 'Artist name is required' }, { status: 400 });
  }

  try {
    // Encode artist name for URL - use the exact format from the docs
    const encodedArtistName = encodeURIComponent(artistName);
    
    // Try the exact URL format from Bandsintown docs with trailing slash
    const bandsinTownUrl = `https://rest.bandsintown.com/artists/${encodedArtistName}/events/?app_id=${appId}`;
    
    console.log('Fetching from Bandsintown:', bandsinTownUrl);
    
    const response = await fetch(bandsinTownUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; M2Labs/1.0)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Add cache control to avoid rate limiting
      cache: 'no-cache',
    });

    console.log('Bandsintown response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      if (response.status === 404) {
        // Artist not found or no events - return empty array
        console.log('Artist not found, returning empty array');
        return NextResponse.json([]);
      }
      
      if (response.status === 403) {
        console.log('403 Forbidden - trying alternative approach');
        // Try without date parameter as fallback
        const fallbackUrl = `https://rest.bandsintown.com/artists/${encodedArtistName}/events/?app_id=squarespace-sample-event-calendar`;
        console.log('Trying fallback URL:', fallbackUrl);
        
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; M2Labs/1.0)',
            'Accept': 'application/json',
          },
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const events = Array.isArray(fallbackData) ? fallbackData : [];
          // Filter to upcoming events manually since we couldn't use date param
          const now = new Date();
          const upcomingEvents = events.filter(event => new Date(event.datetime) > now);
          return NextResponse.json(upcomingEvents);
        }
      }
      
      const errorText = await response.text();
      console.error('Bandsintown API error:', response.status, errorText);
      
      // Return empty array instead of error to gracefully handle API issues
      return NextResponse.json([]);
    }

    const data = await response.json();
    console.log('Bandsintown data received:', Array.isArray(data) ? `${data.length} events` : 'Invalid data format', data);
    
    // Ensure we return an array and filter to upcoming events
    let events = Array.isArray(data) ? data : [];
    
    // Filter to upcoming events if we got all events
    const now = new Date();
    events = events.filter(event => {
      if (!event.datetime) return false;
      return new Date(event.datetime) > now;
    });
    
    return NextResponse.json(events);

  } catch (error) {
    console.error('Bandsintown proxy error:', error);
    // Return empty array instead of error to gracefully handle network issues
    return NextResponse.json([]);
  }
}
