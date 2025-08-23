import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, deleteArtist } from '@/libs/database-d1'

export const runtime = 'edge'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ Starting artist deletion...')
    
    const { id: artistId } = await params
    console.log('🔍 Artist ID from params:', artistId)
    
    if (!artistId) {
      console.error('❌ No artist ID provided')
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 })
    }
    
    console.log('🔗 Deleting artist with ID:', artistId)
    
    const success = await deleteArtist(artistId)
    console.log('🎯 Delete operation result:', success)
    
    if (!success) {
      console.error('❌ Artist not found or delete failed')
      return NextResponse.json({ error: 'Artist not found or delete failed' }, { status: 404 })
    }
    
    console.log('✅ Artist deleted successfully:', artistId)
    return NextResponse.json({ success: true, message: 'Artist deleted successfully' })
    
  } catch (err: any) {
    console.error('❌ Failed to delete artist:', err)
    console.error('Error stack:', err.stack)
    return NextResponse.json({ 
      error: `Delete failed: ${err?.message || err}`,
      details: String(err)
    }, { status: 500 })
  }
}
