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
    await initializeDatabase()
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
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
