'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AuthWrapper from '@/components/admin/AuthWrapper';
import ArtistForm from '@/components/admin/ArtistForm';
import Image from 'next/image';
import { Artist } from '@/libs/artists';
export const runtime = 'edge'

export default function ArtistManagement() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load artists via API on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/artists');
        const data = await response.json();
        
        if (data.success) {
          setArtists(data.artists);
        } else {
          console.error('Failed to load artists:', data.error);
        }
      } catch (error) {
        console.error('Failed to load artists:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);



  const handleSubmitArtist = async (artistData: any) => {
    setSubmitting(true);
    try {
      // Prepare artist data for API
      const artistToSend = editingArtist 
        ? { ...artistData, id: editingArtist.id } 
        : { ...artistData };
      
      console.log('Sending artist data:', JSON.stringify(artistToSend, null, 2));
      
      const response = await fetch('/api/admin/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(artistToSend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        throw new Error(`Failed to save to server: ${response.status} ${errorText}`);
      }

      // Reload artists from database
      const reloadResponse = await fetch('/api/artists');
      const reloadData = await reloadResponse.json();
      if (reloadData.success) {
        setArtists(reloadData.artists);
      }
      setShowForm(false);
      setEditingArtist(null);
      alert(editingArtist ? 'Artist updated successfully!' : 'Artist added successfully!');
    } catch (error) {
      console.error('Error submitting artist:', error);
      alert('An error occurred while saving the artist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditArtist = (artist: Artist) => {
    setEditingArtist(artist);
    setShowForm(true);
  };

  const handleDeleteArtist = async (artistId: string) => {
    if (!confirm('Are you sure you want to delete this artist?')) return;

    try {
      console.log('🗑️ Frontend: Attempting to delete artist:', artistId);
      
      const response = await fetch(`/api/admin/artists/${artistId}`, {
        method: 'DELETE',
      });

      console.log('🔍 Frontend: Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Frontend: Delete failed with error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete artist`);
      }

      const result = await response.json();
      console.log('✅ Frontend: Delete successful:', result);

      // Reload artists from database
      const reloadResponse = await fetch('/api/artists');
      const reloadData = await reloadResponse.json();
      if (reloadData.success) {
        setArtists(reloadData.artists);
      }
      alert('Artist deleted successfully!');
    } catch (error) {
      console.error('❌ Frontend: Error deleting artist:', error);
      alert(`Failed to delete artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingArtist(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    try {
      const reorderedArtists = [...artists];
      const draggedArtist = reorderedArtists[draggedIndex];
      
      // Remove the dragged item and insert it at the new position
      reorderedArtists.splice(draggedIndex, 1);
      reorderedArtists.splice(dropIndex, 0, draggedArtist);
      
      // Update the order field for all artists
      reorderedArtists.forEach((artist, index) => {
        artist.order = index + 1;
      });
      
      // Persist to server (bulk update)
      const response = await fetch('/api/admin/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderedArtists),
      });

      if (!response.ok) {
        throw new Error('Failed to save reordered artists');
      }

      // Reload from database to ensure consistency
      const reloadResponse = await fetch('/api/artists');
      const reloadData = await reloadResponse.json();
      if (reloadData.success) {
        setArtists(reloadData.artists);
      }
    } catch (error) {
      console.error('Error reordering artists:', error);
      alert('Failed to reorder artists');
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // normalize saved image paths
  const normalizeSrc = (raw?: string) => {
    if (!raw) return '';
    let s = raw.trim();

    // remote or temporary: leave as-is
    if (s.startsWith('http') || s.startsWith('blob:') || s.startsWith('data:')) return s;

    // strip leading ./ or ../
    s = s.replace(/^(\.\/)+/, '').replace(/^(\.\.\/)+/, '');

    // map public paths to /images
    s = s.replace(/^\/?public\/images\//, '/images/');
    // fix common slip p/images -> /images
    s = s.replace(/^p\/images\//, '/images/');

    // ensure leading slash for local
    if (s.startsWith('images/')) s = `/${s}`;
    if (!s.startsWith('/')) s = `/${s}`;

    return s;
  };

  if (loading) {
    return (
      <AuthWrapper>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600 dark:text-gray-300">Loading artists...</div>
          </div>
        </AdminLayout>
      </AuthWrapper>
    );
  }

  if (showForm) {
    return (
      <AuthWrapper>
        <AdminLayout>
          <ArtistForm
            artist={editingArtist || undefined}
            onSubmit={handleSubmitArtist}
            onCancel={handleCancelForm}
            isLoading={submitting}
          />
        </AdminLayout>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Artist Management</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage artist profiles and endorsements</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium"
            >
              + Add New Artist
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Artists</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{artists.length}</p>
                </div>
                <div className="text-2xl">🎤</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Homepage (Top 3)</p>
                  <p className="text-3xl font-bold text-green-600">{Math.min(artists.length, 3)}</p>
                </div>
                <div className="text-2xl">🏠</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Genres</p>
                  <p className="text-3xl font-bold text-blue-600">{new Set(artists.map(a => a.genre)).size}</p>
                </div>
                <div className="text-2xl">🎵</div>
              </div>
            </div>
          </div>

          {/* Artists List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Current Artists</h2>
            </div>
            
            <div className="divide-y">
              {artists.map((artist, index) => {
                const src = normalizeSrc(artist.image);
                const isBlobOrData = src.startsWith('blob:') || src.startsWith('data:');
                const isSvg = src.toLowerCase().endsWith('.svg');
                const isDragging = draggedIndex === index;
                const isDropTarget = dragOverIndex === index;

                return (
                  <div 
                    key={artist.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-6 transition-all duration-200 cursor-move ${
                      isDragging 
                        ? 'opacity-50 scale-95 bg-blue-50' 
                        : isDropTarget 
                        ? 'bg-blue-100 border-t-2 border-blue-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Drag Handle & Position */}
                      <div className="flex-shrink-0 flex flex-col items-center space-y-1">
                        <div className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-mono">
                          #{artist.order}
                        </div>
                        <div className="text-gray-400 cursor-move" title="Drag to reorder">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <circle cx="7" cy="7" r="1"/>
                            <circle cx="13" cy="7" r="1"/>
                            <circle cx="7" cy="13" r="1"/>
                            <circle cx="13" cy="13" r="1"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Artist Image */}
                      <div className="flex-shrink-0">
                        {(isBlobOrData || isSvg) ? (
                          <img
                            src={src}
                            alt={artist.name}
                            width={80}
                            height={60}
                            className="w-20 h-15 object-cover rounded-md border"
                          />
                        ) : (
                          <Image
                            src={src}
                            alt={artist.name}
                            width={80}
                            height={60}
                            className="w-20 h-15 object-cover rounded-md border"
                          />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {artist.name}
                              </h3>
                              <span className="bg-[#FF8A3D] text-black px-2 py-1 rounded text-xs font-medium">
                                {artist.genre}
                              </span>
                              {artist.order <= 3 && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                  🏠 Homepage
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">📍 {artist.location}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                              {artist.bio}
                            </p>
                            
                            {/* Gear */}
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Gear:</p>
                              <div className="flex flex-wrap gap-1">
                                {(artist.gear || []).slice(0, 3).map((item, index) => (
                                  <span key={index} className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                                    {item}
                                  </span>
                                ))}
                                {(artist.gear || []).length > 3 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">+{(artist.gear || []).length - 3} more</span>
                                )}
                              </div>
                            </div>

                            {/* Social Media */}
                            <div className="flex space-x-4 text-xs text-gray-500 dark:text-gray-400">
                              {artist.website && <span>🌐 Website</span>}
                              {artist.socialMedia?.instagram && <span>📸 Instagram</span>}
                              {artist.socialMedia?.spotify && <span>🎵 Spotify</span>}
                              {artist.socialMedia?.bandcamp && <span>🎧 Bandcamp</span>}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEditArtist(artist)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteArtist(artist.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Testimonial */}
                    {artist.testimonial && (
                      <div className="mt-4 ml-24">
                        <blockquote className="text-sm italic text-gray-600 dark:text-gray-300 border-l-4 border-[#FF8A3D] pl-3">
                          "{artist.testimonial}"
                        </blockquote>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Usage Guide */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">✅ Artist Management Features</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Available Now</h4>
                <ul className="space-y-1">
                  <li>✅ Add/edit artist profiles</li>
                  <li>✅ Upload artist photos</li>
                  <li>✅ Drag & drop reordering</li>
                  <li>✅ Social media integration</li>
                  <li>✅ Gear listings</li>
                  <li>✅ Testimonials</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">How to Use</h4>
                <ul className="space-y-1">
                  <li>• Drag artists by the ⠿ handle to reorder</li>
                  <li>• Top 3 artists appear on homepage</li>
                  <li>• Order affects all public displays</li>
                  <li>• Click "Edit" to modify artist info</li>
                  <li>• "Add New Artist" for new profiles</li>
                  <li>• Changes appear instantly on site</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}
