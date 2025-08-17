import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getArtists, createArtist, updateArtist, Artist } from '@/libs/database-d1'

export const runtime = 'edge'



// ===== Handlers =====
export async function GET() {
  try {
    await initializeDatabase()
    const artists = await getArtists()
    return NextResponse.json(artists)
  } catch (err: any) {
    console.error('Failed to get artists:', err)
    
    // If D1 is not available, return fallback data
    if (err?.message?.includes('Database not available')) {
      console.warn('D1 database not available, returning fallback data')
      const fallbackArtists = [
        {
          id: 'caro-pohl',
          name: 'Caro Pohl',
          bio: 'Guitarist in Saddiscore since 2011.',
          genre: 'Metal',
          location: 'Cologne, Germany',
          image: '/images/uploads/1755221517314-cp-sc2.jpg',
          website: 'https://saddiscore.de/',
          instagram: '@saddiscore',
          spotify: 'https://open.spotify.com/artist/0XkyklXB3YOwxTuSylThrw',
          gear: ['The Bomber Overdrive'],
          featured: true,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      return NextResponse.json(fallbackArtists)
    }
    
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

/**
 * POST behaviors:
 *  - If body is an array: replaces the entire artists list.
 *  - If body is a single object: appends one artist (id auto if missing).
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Starting artist creation...')
    await initializeDatabase()
    console.log('🔧 Database initialization completed')
    const body = await req.json()
    
    console.log('Received artist data:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    if (!body?.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Handle both new artists and updates
    if (body.id) {
      // Update existing artist
      const existingArtists = await getArtists()
      const exists = existingArtists.find(a => a.id === body.id)
      
      if (exists) {
        // Map frontend fields to D1 fields
        const updateData: Partial<Artist> = {
          name: body.name,
          bio: body.bio,
          genre: body.genre,
          location: body.location,
          image: body.image,
          website: body.website,
          instagram: body.socialMedia?.instagram,
          youtube: body.socialMedia?.youtube,
          spotify: body.socialMedia?.spotify,
          bandcamp: body.socialMedia?.bandcamp,
          tidal: body.socialMedia?.tidal,
          gear: body.gear || [],
          testimonial: body.testimonial,
          featured: body.featured || false,
          showBandsintown: body.showBandsintown || false,
          bandsintown_artist_name: body.bandsintown?.artistName,
          order: body.order || exists.order,
        }
        
        const updatedArtist = await updateArtist(body.id, updateData)
        
        if (!updatedArtist) {
          return NextResponse.json({ error: 'Failed to update artist' }, { status: 500 })
        }
        
        console.log('Updated artist:', updatedArtist.id)
        return NextResponse.json(updatedArtist, { status: 200 })
      }
    }
    
    // Create new artist
    const existingArtists = await getArtists()
    const maxOrder = Math.max(...existingArtists.map(a => a.order), 0)
    
    // Generate ID if not provided
    const artistId = body.id || (body.name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now().toString(36));
    
    // Map frontend form data to D1 Artist interface
    const artistData: Omit<Artist, 'createdAt' | 'updatedAt'> = {
      id: artistId,
      name: body.name,
      bio: body.bio || '',
      genre: body.genre || '',
      location: body.location || '',
      image: body.image || '',
      website: body.website || '',
      instagram: body.socialMedia?.instagram || '',
      youtube: body.socialMedia?.youtube || '',
      spotify: body.socialMedia?.spotify || '',
      bandcamp: body.socialMedia?.bandcamp || '',
      tidal: body.socialMedia?.tidal || '',
      gear: body.gear || [],
      testimonial: body.testimonial || '',
      featured: body.featured || false,
      showBandsintown: body.showBandsintown || false,
      bandsintown_artist_name: body.bandsintown?.artistName || '',
      order: body.order || (maxOrder + 1),
    }
    
    const newArtist = await createArtist(artistData)
    
    console.log('Created artist:', newArtist.id, 'with order:', newArtist.order)
    return NextResponse.json(newArtist, { status: 201 })
  } catch (err: any) {
    console.error('Failed to create/update artist:', err)
    
    // If D1 is not available, provide helpful error message
    if (err?.message?.includes('Database not available')) {
      console.warn('D1 database not available - this may be a preview deployment issue')
      return NextResponse.json({ 
        error: 'Database temporarily unavailable. This may be expected in preview deployments. Artist creation will work in production.' 
      }, { status: 503 })
    }
    
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
