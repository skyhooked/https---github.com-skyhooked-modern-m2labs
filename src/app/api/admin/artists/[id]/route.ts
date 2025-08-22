import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, deleteArtist } from '@/libs/database-d1'

export const runtime = 'edge'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ Starting artist deletion...')
    await initializeDatabase()
    
    const { id: artistId } = await params
    
    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 })
    }
    
    console.log('Deleting artist with ID:', artistId)
    
    const success = await deleteArtist(artistId)
    
    if (!success) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
    }
    
    console.log('✅ Artist deleted successfully:', artistId)
    return NextResponse.json({ success: true, message: 'Artist deleted successfully' })
    
  } catch (err: any) {
    console.error('❌ Failed to delete artist:', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
