'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Artist, CustomSection, GalleryConfig } from '@/data/artistData';
import { getImageStyleOptions, getRecommendedDimensions, type ImageStyle } from '@/utils/imageStyles';

type Props = {
  artist?: Artist;
  onSubmit: (data: Omit<Artist, 'id' | 'order'> | (Omit<Artist, 'id' | 'order'> & { order: number })) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

type FormValues = Omit<Artist, 'id' | 'order'>;

const emptyValues: FormValues = {
  name: '',
  image: '',
  imageStyle: 'square' as ImageStyle,
  genre: '',
  featured: false,
  location: '',
  bio: '',
  gear: [],
  website: '',
  socialMedia: {
    instagram: '',
    spotify: '',
    bandcamp: '',
    tidal: '', // NEW
  },
  testimonial: '',
  showBandsintown: false,
  bandsintown_artist_name: '',
  useCustomTemplate: false,
  customTemplatePath: '',
  customSections: [],
};

// allow local, remote, and temporary refs
const isAllowedImageRef = (s: string) => {
  if (!s) return false;
  const v = s.trim();
  return (
    v.startsWith('/images/') ||
    v.startsWith('images/') ||
    v.startsWith('./images/') ||
    v.startsWith('../images/') ||
    v.startsWith('public/images/') ||
    v.startsWith('/public/images/') ||
    v.startsWith('./public/images/') ||
    v.startsWith('../public/images/') ||
    v.startsWith('p/images/') ||
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('blob:') ||
    v.startsWith('data:image/') ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(v)
  );
};

// normalize into something the app can render
const normalizeImageRef = (s: string) => {
  let t = (s || '').trim();

  // remote, API endpoints, or temporary stay as-is
  if (t.startsWith('http') || t.startsWith('blob:') || t.startsWith('data:') || t.startsWith('/api/')) return t;

  // Convert Windows backslashes to forward slashes
  t = t.replace(/\\/g, '/');

  // strip leading ./ or ../
  t = t.replace(/^(\.\/)+/, '').replace(/^(\.\.\/)+/, '');

  // map public paths to /images/...
  t = t.replace(/^\/?public\/images\//, '/images/');
  // fix common slip p/images -> /images
  t = t.replace(/^p\/images\//, '/images/');

  // ensure leading slash for local paths
  if (t.startsWith('images/')) t = `/${t}`;
  
  // if it doesn't start with / and looks like an image file, assume it's in /images/
  if (!t.startsWith('/') && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(t)) {
    t = `/images/${t}`;
  }
  
  // final fallback - ensure leading slash
  if (!t.startsWith('/') && !t.includes('.')) t = `/${t}`;

  return t;
};

export default function ArtistForm({ artist, onSubmit, onCancel, isLoading }: Props) {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [imageFileName, setImageFileName] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (artist) {
      setValues({
        name: artist.name || '',
        image: artist.image || '',
        genre: artist.genre || '',
        featured: !!artist.featured,
        location: artist.location || '',
        bio: artist.bio || '',
        gear: Array.isArray(artist.gear) ? artist.gear : [],
        website: artist.website || '',
        socialMedia: {
          instagram: artist.socialMedia?.instagram || '',
          spotify: artist.socialMedia?.spotify || '',
          bandcamp: artist.socialMedia?.bandcamp || '',
          tidal: artist.socialMedia?.tidal || '', // NEW
        },
        testimonial: artist.testimonial || '',
        showBandsintown: artist.showBandsintown || false,
        bandsintown_artist_name: artist.bandsintown_artist_name || '',
        useCustomTemplate: artist.useCustomTemplate || false,
        customTemplatePath: artist.customTemplatePath || '',
        customSections: artist.customSections || [],
      });
    } else {
      setValues(emptyValues);
    }
    setPreviewError(false);
  }, [artist]);

  const handleChange =
    <K extends keyof FormValues>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val =
        e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setValues((v) => ({ ...v, [key]: val as FormValues[K] }));
      if (key === 'image') setPreviewError(false);
    };

  const handleSocialChange =
    (key: keyof NonNullable<Artist['socialMedia']>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setValues((v) => ({
        ...v,
        socialMedia: { ...(v.socialMedia || {}), [key]: val },
      }));
    };

  const [gearInputValue, setGearInputValue] = useState('');
  const [genreInputValue, setGenreInputValue] = useState('');

  // Initialize gear and genre input values when artist data changes
  useEffect(() => {
    if (artist) {
      setGearInputValue((artist.gear || []).join(', '));
      setGenreInputValue(artist.genre || '');
    } else {
      setGearInputValue('');
      setGenreInputValue('');
    }
  }, [artist]);

  const handleGearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGearInputValue(e.target.value);
  };

  const handleGearBlur = () => {
    const arr = gearInputValue.split(',').map((s) => s.trim()).filter(Boolean);
    setValues((v) => ({ ...v, gear: arr }));
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGenreInputValue(e.target.value);
  };

  const handleGenreBlur = () => {
    setValues((v) => ({ ...v, genre: genreInputValue.trim() }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!values.name.trim()) next.name = 'Name is required';
    if (!isAllowedImageRef(values.image)) next.image = 'Use /images/filename.jpg, /api/images/filename.jpg, or a valid image URL';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImage) {
      alert('Please wait for image upload to complete before submitting.');
      return;
    }
    const gearArray = gearInputValue.split(',').map((s) => s.trim()).filter(Boolean);
    const processedGenre = genreInputValue.trim();
    const updatedValues = { ...values, gear: gearArray, genre: processedGenre };
    setValues(updatedValues);
    if (!validate()) return;

    const payload = {
      ...updatedValues,
      image: normalizeImageRef(updatedValues.image),
      socialMedia: {
        instagram: updatedValues.socialMedia?.instagram || '',
        spotify: updatedValues.socialMedia?.spotify || '',
        bandcamp: updatedValues.socialMedia?.bandcamp || '',
        tidal: updatedValues.socialMedia?.tidal || '', // NEW
      },
      gear: gearArray,
      genre: processedGenre,
      // customSections (with bgColor/textColor) are included as-is
      ...(artist ? { order: artist.order } : {}),
    } as any;

    onSubmit(payload);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      alert('Upload failed: Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed.');
      return;
    }

    setUploadingImage(true);
    const previewUrl = URL.createObjectURL(file);
    setImageFileName(file.name);
    setValues((v) => ({ ...v, image: previewUrl }));
    setPreviewError(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      setValues((v) => ({ ...v, image: result.path }));
      setImageFileName(`✅ ${file.name} (uploaded)`);
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setValues((v) => ({ ...v, image: previewUrl }));
      setImageFileName(`❌ ${file.name} (upload failed - using temporary preview)`);
    } finally {
      setUploadingImage(false);
    }
  };

  const previewSrc = values.image ? normalizeImageRef(values.image) : '';

  // Helper function to update gallery configuration
  const updateGalleryConfig = (sectionIndex: number, configUpdate: Partial<GalleryConfig>) => {
    const newSections = [...(values.customSections || [])];
    const section = newSections[sectionIndex];
    const defaultConfig: GalleryConfig = {
      gridColumns: { mobile: 1, tablet: 2, desktop: 3 },
      aspectRatio: 'square',
      gap: 'md',
      borderRadius: 'md',
      hoverEffect: 'scale',
      lightbox: true,
      captions: false
    };
    
    newSections[sectionIndex] = {
      ...section,
      galleryConfig: {
        ...defaultConfig,
        ...section.galleryConfig,
        ...configUpdate
      }
    };
    setValues(v => ({ ...v, customSections: newSections }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {artist ? 'Edit Artist' : 'Add Artist'}
        </h1>
        <p className="text-gray-600">
          Files under <code>/public/images</code> are referenced as <code>/images/filename.jpg</code>. Remote URLs also work.
        </p>
      </div>

      {/* noValidate prevents native URL-only checks */}
      <form noValidate onSubmit={submit} className="space-y-6 bg-white rounded-lg border p-6 shadow-sm">
        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={values.name}
              onChange={handleChange('name')}
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-700">Genre (comma separated)</label>
            <input
              id="genre"
              name="genre"
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={genreInputValue}
              onChange={handleGenreChange}
              onBlur={handleGenreBlur}
              placeholder="Post-Rock, Ambient, Progressive"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={values.location}
              onChange={handleChange('location')}
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={values.featured}
              onChange={handleChange('featured')}
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured</label>
          </div>
        </div>

        {/* Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Image path or URL *
            </label>
            <input
              id="image"
              name="image"
              type="text"
              inputMode="url"
              placeholder="/images/filename.jpg or https://example.com/image.jpg"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={values.image}
              onChange={handleChange('image')}
            />
            {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Upload Photo</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={onPickFile}
                disabled={uploadingImage}
                className={`mt-1 block w-full text-sm text-black
                file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2
                ${uploadingImage 
                  ? 'file:bg-gray-400 file:text-gray-600 file:cursor-not-allowed' 
                  : 'file:bg-[#FF8A3D] file:text-black hover:file:bg-[#F5F5F5]/80 file:cursor-pointer'
                }`}
              />
              {uploadingImage && (
                <p className="mt-1 text-xs text-blue-600">🔄 Uploading image...</p>
              )}
              {imageFileName && !uploadingImage && (
                <p className="mt-1 text-xs text-black">Selected: {imageFileName}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                JPEG, PNG, WebP, or SVG. To persist in the repo, move the file into <code>/public/images</code> and set <code>/images/your-file.ext</code>.
              </p>
            </div>

            {/* Image Style Selector */}
            <div className="mt-4">
              <label htmlFor="imageStyle" className="block text-sm font-medium text-gray-700">
                Image Style
              </label>
              <select
                id="imageStyle"
                name="imageStyle"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={values.imageStyle || 'square'}
                onChange={handleChange('imageStyle')}
              >
                {getImageStyleOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Recommended size: {(() => {
                  const dims = getRecommendedDimensions(values.imageStyle as ImageStyle || 'square');
                  return `${dims.width}×${dims.height}px (${dims.ratio})`;
                })()}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="border rounded-md p-2">
              <div className="text-sm text-gray-700 mb-2">Preview</div>
              {previewSrc ? (
                <div className={`w-32 h-32 ${values.imageStyle === 'circle' ? 'rounded-full' : 'rounded-lg'} overflow-hidden bg-gray-100`}>
                  <img
                    src={previewSrc}
                    alt="Preview image"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewError(true)}
                  />
                </div>
              ) : (
                <div className={`w-32 h-32 ${values.imageStyle === 'circle' ? 'rounded-full' : 'rounded-lg'} bg-gray-100 flex items-center justify-center text-xs text-gray-500`}>
                  No preview
                </div>
              )}
              {previewError && (
                <div className="mt-2 text-xs text-red-600">Could not load the image. Check the path or URL.</div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={values.bio}
            onChange={handleChange('bio')}
          />
        </div>

        {/* Gear */}
        <div>
          <label htmlFor="gear" className="block text-sm font-medium text-gray-700">Gear (comma separated)</label>
          <input
            id="gear"
            name="gear"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={gearInputValue}
            onChange={handleGearChange}
            onBlur={handleGearBlur}
            placeholder="SM7B, Apollo Twin, Ableton Live"
          />
        </div>

        {/* Socials and website */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              inputMode="url"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={values.website}
              onChange={handleChange('website')}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">Instagram</label>
            <input
              id="instagram"
              name="instagram"
              type="text"
              inputMode="url"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={values.socialMedia?.instagram || ''}
              onChange={handleSocialChange('instagram')}
              placeholder="@yourhandle or https://instagram.com/yourhandle"
            />
            <p className="mt-1 text-xs text-gray-500">Enter @handle or full URL. Will display as @handle on artist pages.</p>
          </div>

          <div>
            <label htmlFor="spotify" className="block text-sm font-medium text-gray-700">Spotify</label>
            <input
              id="spotify"
              name="spotify"
              type="text"
              inputMode="url"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={values.socialMedia?.spotify || ''}
              onChange={handleSocialChange('spotify')}
              placeholder="Artist Name or https://open.spotify.com/artist/..."
            />
            <p className="mt-1 text-xs text-gray-500">Enter artist name for search or full Spotify URL.</p>
          </div>

          {/* NEW: TIDAL */}
          <div>
            <label htmlFor="tidal" className="block text-sm font-medium text-gray-700">TIDAL</label>
            <input
              id="tidal"
              name="tidal"
              type="text"
              inputMode="url"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={values.socialMedia?.tidal || ''}
              onChange={handleSocialChange('tidal')}
              placeholder="Artist Name or https://tidal.com/artist/..."
            />
            <p className="mt-1 text-xs text-gray-500">Enter artist name for search or full TIDAL URL.</p>
          </div>

          <div>
            <label htmlFor="bandcamp" className="block text-sm font-medium text-gray-700">Bandcamp</label>
            <input
              id="bandcamp"
              name="bandcamp"
              type="text"
              inputMode="url"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={values.socialMedia?.bandcamp || ''}
              onChange={handleSocialChange('bandcamp')}
              placeholder="yourname or https://yourname.bandcamp.com"
            />
            <p className="mt-1 text-xs text-gray-500">Enter subdomain name or full Bandcamp URL.</p>
          </div>
        </div>

        {/* Testimonial */}
        <div>
          <label htmlFor="testimonial" className="block text-sm font-medium text-gray-700">Testimonial</label>
          <textarea
            id="testimonial"
            name="testimonial"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={values.testimonial || ''}
            onChange={handleChange('testimonial')}
            placeholder="What they say about M2 Labs..."
          />
        </div>

        {/* Bandsintown Integration */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bandsintown Integration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={values.showBandsintown || false}
                  onChange={(e) => setValues(v => ({ 
                    ...v, 
                    showBandsintown: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-[#FF8A3D] focus:ring-[#FF8A3D]"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Show Tour Dates</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Display upcoming shows from Bandsintown on the artist page
              </p>
            </div>

            {values.showBandsintown && (
              <div>
                <label htmlFor="bandsintown-name" className="block text-sm font-medium text-gray-700">
                  Bandsintown Artist Name (Optional)
                </label>
                <input
                  id="bandsintown-name"
                  type="text"
                  value={values.bandsintown_artist_name || ''}
                  onChange={(e) => setValues(v => ({ 
                    ...v, 
                    bandsintown_artist_name: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder={`Leave blank to use "${values.name || 'artist name'}" or enter custom name...`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Only needed if the artist name on Bandsintown is different from "{values.name || 'the artist name'}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Customization Options */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Page Customization</h3>
          
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={values.useCustomTemplate || false}
                onChange={(e) => setValues(v => ({ ...v, useCustomTemplate: e.target.checked }))}
                className="rounded border-gray-300 text-[#FF8A3D] focus:ring-[#FF8A3D]"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Use Custom Template</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Advanced: Override the default page template with a custom design
            </p>
            
            {values.useCustomTemplate && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Custom template path (e.g., artists/brandon-custom)"
                  value={values.customTemplatePath || ''}
                  onChange={(e) => setValues(v => ({ ...v, customTemplatePath: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Custom Sections</label>
              <button
                type="button"
                onClick={() => {
                  const newSection: CustomSection = {
                    id: Date.now().toString(),
                    type: 'text',
                    title: 'New Section',
                    content: '',
                    enabled: true,
                    order: (values.customSections?.length || 0) + 1,
                    // Defaults so new sections are readable and show color immediately
                    bgColor: '#ffffff',
                    textColor: '#111111',
                  } as CustomSection;
                  setValues(v => ({ 
                    ...v, 
                    customSections: [...(v.customSections || []), newSection] 
                  }));
                }}
                className="px-3 py-1 bg-[#FF8A3D] text-black rounded text-sm hover:bg-[#FF8A3D]/80"
              >
                Add Section
              </button>
            </div>
            
            {values.customSections?.map((section, index) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => {
                        const newSections = [...(values.customSections || [])];
                        newSections[index] = { ...section, title: e.target.value };
                        setValues(v => ({ ...v, customSections: newSections }));
                      }}
                      className="block w-full rounded border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={section.type}
                      onChange={(e) => {
                        const newSections = [...(values.customSections || [])];
                        newSections[index] = { 
                          ...section, 
                          type: e.target.value as CustomSection['type'],
                          content: '' 
                        };
                        setValues(v => ({ ...v, customSections: newSections }));
                      }}
                      className="block w-full rounded border-gray-300 text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="gallery">Gallery</option>
                      <option value="video">Video</option>
                      <option value="bandsintown">Bandsintown</option>
                      <option value="custom_html">Custom HTML</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={(e) => {
                          const newSections = [...(values.customSections || [])];
                          newSections[index] = { ...section, enabled: e.target.checked };
                          setValues(v => ({ ...v, customSections: newSections }));
                        }}
                        className="rounded border-gray-300 text-[#FF8A3D]"
                      />
                      <span className="ml-1 text-xs text-gray-700">Enabled</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newSections = values.customSections?.filter((_, i) => i !== index) || [];
                        setValues(v => ({ ...v, customSections: newSections }));
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* NEW: Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Section Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(section as any).bgColor ?? '#ffffff'}
                        onChange={(e) => {
                          const bgColor = e.target.value;
                          const newSections = [...(values.customSections || [])];
                          newSections[index] = { ...section, bgColor } as any;
                          setValues(v => ({ ...v, customSections: newSections }));
                        }}
                        className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                        aria-label="Pick background color"
                      />
                      <input
                        type="text"
                        value={(section as any).bgColor ?? ''}
                        onChange={(e) => {
                          const bgColor = e.target.value;
                          const newSections = [...(values.customSections || [])];
                          newSections[index] = { ...section, bgColor } as any;
                          setValues(v => ({ ...v, customSections: newSections }));
                        }}
                        placeholder="#ffffff"
                        className="flex-1 rounded border-gray-300 text-sm"
                        aria-label="Background color hex"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSections = [...(values.customSections || [])];
                          const { bgColor, ...rest } = newSections[index] as any;
                          newSections[index] = { ...rest } as any;
                          setValues(v => ({ ...v, customSections: newSections }));
                        }}
                        className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                        title="Clear background color"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">Hex or CSS color. Inline applied on the page.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Section Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(section as any).textColor ?? '#111111'}
                        onChange={(e) => {
                          const textColor = e.target.value;
                          const newSections = [...(values.customSections || [])];
                          newSections[index] = { ...section, textColor } as any;
                          setValues(v => ({ ...v, customSections: newSections }));
                        }}
                        className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                        aria-label="Pick text color"
                      />
                      <input
                        type="text"
                        value={(section as any).textColor ?? ''}
                        onChange={(e) => {
                          const textColor = e.target.value;
                          const newSections = [...(values.customSections || [])];
                          newSections[index] = { ...section, textColor } as any;
                          setValues(v => ({ ...v, customSections: newSections }));
                        }}
                        placeholder="#111111"
                        className="flex-1 rounded border-gray-300 text-sm"
                        aria-label="Text color hex"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSections = [...(values.customSections || [])];
                          const { textColor, ...rest } = newSections[index] as any;
                          newSections[index] = { ...rest } as any;
                          setValues(v => ({ ...v, customSections: newSections }));
                        }}
                        className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                        title="Clear text color"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">Pick a contrasting color so headings/body are readable.</p>
                  </div>
                </div>
                
                {/* Content field based on type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                  {section.type === 'text' && (
                    <textarea
                      value={section.content || ''}
                      onChange={(e) => {
                        const newSections = [...(values.customSections || [])];
                        newSections[index] = { ...section, content: e.target.value };
                        setValues(v => ({ ...v, customSections: newSections }));
                      }}
                      rows={3}
                      className="block w-full rounded border-gray-300 text-sm"
                      placeholder="Enter text content..."
                    />
                  )}
                  {section.type === 'video' && (
                    <input
                      type="url"
                      value={section.content || ''}
                      onChange={(e) => {
                        const newSections = [...(values.customSections || [])];
                        newSections[index] = { ...section, content: e.target.value };
                        setValues(v => ({ ...v, customSections: newSections }));
                      }}
                      className="block w-full rounded border-gray-300 text-sm"
                      placeholder="YouTube/Vimeo embed URL..."
                    />
                  )}
                  {section.type === 'gallery' && (
                    <div className="space-y-4">
                      {/* Image URLs */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Image URLs</label>
                        <textarea
                          value={Array.isArray(section.content) ? section.content.join('\n') : (section.content || '')}
                          onChange={(e) => {
                            const newSections = [...(values.customSections || [])];
                            newSections[index] = { 
                              ...section, 
                              content: e.target.value.split('\n')
                            };
                            setValues(v => ({ ...v, customSections: newSections }));
                          }}
                          onBlur={(e) => {
                            const newSections = [...(values.customSections || [])];
                            newSections[index] = { 
                              ...section, 
                              content: e.target.value.split('\n').filter(url => url.trim()) 
                            };
                            setValues(v => ({ ...v, customSections: newSections }));
                          }}
                          rows={4}
                          className="block w-full rounded border-gray-300 text-sm font-mono"
                          placeholder="Enter image URLs, one per line:&#10;/images/photo1.jpg&#10;/images/photo2.jpg&#10;https://example.com/photo3.jpg"
                          style={{ resize: 'vertical', whiteSpace: 'pre' }}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Supports: <code>/images/file.jpg</code>, <code>public/images/file.jpg</code>, or full URLs. Press Enter for new lines.
                        </p>
                      </div>

                      {/* Gallery Configuration */}
                      <div className="border-t pt-3">
                        <h4 className="text-xs font-medium text-gray-700 mb-3">Gallery Layout Settings</h4>
                        
                        {/* Grid Columns */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Mobile Columns</label>
                            <select
                              value={section.galleryConfig?.gridColumns?.mobile || 1}
                              onChange={(e) => {
                                updateGalleryConfig(index, {
                                  gridColumns: {
                                    mobile: parseInt(e.target.value),
                                    tablet: section.galleryConfig?.gridColumns?.tablet || 2,
                                    desktop: section.galleryConfig?.gridColumns?.desktop || 3
                                  }
                                });
                              }}
                              className="block w-full rounded border-gray-300 text-xs"
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Tablet Columns</label>
                            <select
                              value={section.galleryConfig?.gridColumns?.tablet || 2}
                              onChange={(e) => {
                                updateGalleryConfig(index, {
                                  gridColumns: {
                                    mobile: section.galleryConfig?.gridColumns?.mobile || 1,
                                    tablet: parseInt(e.target.value),
                                    desktop: section.galleryConfig?.gridColumns?.desktop || 3
                                  }
                                });
                              }}
                              className="block w-full rounded border-gray-300 text-xs"
                            >
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Desktop Columns</label>
                            <select
                              value={section.galleryConfig?.gridColumns?.desktop || 3}
                              onChange={(e) => {
                                updateGalleryConfig(index, {
                                  gridColumns: {
                                    mobile: section.galleryConfig?.gridColumns?.mobile || 1,
                                    tablet: section.galleryConfig?.gridColumns?.tablet || 2,
                                    desktop: parseInt(e.target.value)
                                  }
                                });
                              }}
                              className="block w-full rounded border-gray-300 text-xs"
                            >
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                              <option value={6}>6</option>
                              <option value={7}>7</option>
                              <option value={8}>8</option>
                            </select>
                          </div>
                        </div>

                        {/* Style Options */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Aspect Ratio</label>
                            <select
                              value={section.galleryConfig?.aspectRatio || 'square'}
                              onChange={(e) => {
                                updateGalleryConfig(index, {
                                  aspectRatio: e.target.value as GalleryConfig['aspectRatio']
                                });
                              }}
                              className="block w-full rounded border-gray-300 text-xs"
                            >
                              <option value="square">Square (1:1)</option>
                              <option value="portrait">Portrait (3:4)</option>
                              <option value="landscape">Landscape (4:3)</option>
                              <option value="auto">Auto (original)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Gap Size</label>
                            <select
                              value={section.galleryConfig?.gap || 'md'}
                              onChange={(e) => {
                                updateGalleryConfig(index, {
                                  gap: e.target.value as GalleryConfig['gap']
                                });
                              }}
                              className="block w-full rounded border-gray-300 text-xs"
                            >
                              <option value="sm">Small (0.5rem)</option>
                              <option value="md">Medium (1rem)</option>
                              <option value="lg">Large (1.5rem)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Border Radius</label>
                            <select
                              value={section.galleryConfig?.borderRadius || 'md'}
                              onChange={(e) => {
                                updateGalleryConfig(index, {
                                  borderRadius: e.target.value as GalleryConfig['borderRadius']
                                });
                              }}
                              className="block w-full rounded border-gray-300 text-xs"
                            >
                              <option value="none">None</option>
                              <option value="sm">Small</option>
                              <option value="md">Medium</option>
                              <option value="lg">Large</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Hover Effect</label>
                            <select
                              value={section.galleryConfig?.hoverEffect || 'scale'}
                              onChange={(e) => {
                                updateGalleryConfig(index, {
                                  hoverEffect: e.target.value as GalleryConfig['hoverEffect']
                                });
                              }}
                              className="block w-full rounded border-gray-300 text-xs"
                            >
                              <option value="none">None</option>
                              <option value="scale">Scale Up</option>
                              <option value="fade">Fade</option>
                              <option value="lift">Lift (Shadow)</option>
                            </select>
                          </div>
                        </div>

                        {/* Feature Toggles */}
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={section.galleryConfig?.lightbox !== false}
                              onChange={(e) => {
                                updateGalleryConfig(index, {
                                  lightbox: e.target.checked
                                });
                              }}
                              className="rounded border-gray-300 text-[#FF8A3D] text-xs"
                            />
                            <span className="ml-1 text-xs text-gray-700">Lightbox</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={section.galleryConfig?.captions || false}
                              onChange={(e) => {
                                updateGalleryConfig(index, {
                                  captions: e.target.checked
                                });
                              }}
                              className="rounded border-gray-300 text-[#FF8A3D] text-xs"
                            />
                            <span className="ml-1 text-xs text-gray-700">Captions</span>
                          </label>
                        </div>

                        {/* Preview */}
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <strong>Preview:</strong> {section.galleryConfig?.gridColumns?.mobile || 1} column{(section.galleryConfig?.gridColumns?.mobile || 1) > 1 ? 's' : ''} on mobile, {section.galleryConfig?.gridColumns?.tablet || 2} on tablet, {section.galleryConfig?.gridColumns?.desktop || 3} on desktop • {section.galleryConfig?.aspectRatio || 'square'} aspect • {section.galleryConfig?.gap || 'medium'} gap • {section.galleryConfig?.hoverEffect || 'scale'} hover
                        </div>
                      </div>
                    </div>
                  )}
                  {section.type === 'bandsintown' && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">
                        This will automatically display upcoming shows using the Bandsintown API.
                        No configuration needed - just enable this section.
                      </p>
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
                        ✨ <strong>Auto-configured:</strong> Shows will be fetched live from Bandsintown using the artist name "{values.name || 'Artist Name'}"
                      </div>
                    </div>
                  )}
                  {section.type === 'custom_html' && (
                    <div>
                      <textarea
                        value={section.content || ''}
                        onChange={(e) => {
                          const newSections = [...(values.customSections || [])];
                          newSections[index] = { ...section, content: e.target.value };
                          setValues(v => ({ ...v, customSections: newSections }));
                        }}
                        rows={8}
                        className="block w-full rounded border-gray-300 text-sm font-mono"
                        placeholder="Enter custom HTML...&#10;<div class=&quot;my-custom-section&quot;>&#10;  <h3>Custom Content</h3>&#10;  <p>Your content here</p>&#10;</div>"
                        style={{ resize: 'vertical', whiteSpace: 'pre' }}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Full HTML support. Use for embed codes, custom layouts, etc.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {(!values.customSections || values.customSections.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded">
                No custom sections added. Click "Add Section" to customize this artist's page.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading || uploadingImage}
            className="px-6 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium disabled:opacity-60"
          >
            {uploadingImage ? 'Uploading Image...' : (artist ? 'Save Changes' : 'Create Artist')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#F5F5F5] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
