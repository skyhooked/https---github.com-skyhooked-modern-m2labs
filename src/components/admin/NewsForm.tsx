'use client';

import { useState, useRef } from 'react';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import Image from 'next/image';
import type { NewsPost } from '@/libs/database-d1';

type NewsFormData = Omit<NewsPost, 'id' | 'createdAt' | 'updatedAt'>;

interface NewsFormProps {
  post?: NewsPost;
  onSubmit: (post: NewsFormData | (NewsFormData & { id: string })) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function NewsForm({ post, onSubmit, onCancel, isLoading }: NewsFormProps) {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    fullContent: post?.fullContent || '',
    coverImage: post?.coverImage || '',
    author: post?.author || 'Jonathan',
    publishDate: post?.publishDate || new Date().toISOString().split('T')[0],
    readTime: post?.readTime || '',
    category: post?.category || '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(post?.coverImage || '');
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      alert('Upload failed: Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed.');
      return;
    }

    // Validate file size (5MB limit for news images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Upload failed: File too large. Maximum size is 5MB.');
      return;
    }

    setUploadingImage(true);
    setSelectedFileName(file.name);
    console.log('Starting news image upload:', file.name, file.type, file.size);
    
    try {
      const fileFormData = new FormData();
      fileFormData.append('file', file);

      console.log('Sending upload request to /api/upload');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: fileFormData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Upload API error:', error);
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      setFormData(prev => ({ ...prev, coverImage: result.path }));
      setPreviewImage(result.path);
      setSelectedFileName(`✅ ${file.name} (uploaded)`);
      
      console.log('Image upload completed successfully');
    } catch (error) {
      console.error('Upload error:', error);
      setSelectedFileName(`❌ ${file.name} (upload failed)`);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!formData.excerpt.trim()) {
      alert('Please enter an excerpt');
      return;
    }
    if (!formData.fullContent.trim()) {
      alert('Please enter the full content');
      return;
    }
    if (!formData.coverImage.trim()) {
      alert('Please upload a cover image');
      return;
    }

    const submitData = post 
      ? { ...formData, id: post.id }
      : formData;

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {post ? 'Edit News Post' : 'Create New News Post'}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                placeholder="Enter post title"
                required
              />
            </div>

            {/* Excerpt */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt *
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                placeholder="Enter a brief excerpt (first 1-2 sentences)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">This will appear on the homepage and as a preview</p>
            </div>

            {/* Author and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Publish Date
                </label>
                <input
                  type="date"
                  id="publishDate"
                  name="publishDate"
                  value={formData.publishDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                />
              </div>
            </div>

            {/* Read Time and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="readTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Read Time
                </label>
                <input
                  type="text"
                  id="readTime"
                  name="readTime"
                  value={formData.readTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                  placeholder="e.g., 2 min read"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                >
                  <option value="">No Category</option>
                  <option value="Spotlight">Spotlight</option>
                  <option value="Interview">Interview</option>
                  <option value="News">News</option>
                  <option value="Product">Product</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image *
              </label>
              
              {previewImage && (
                <div className="mb-4">
                  <Image
                    src={previewImage}
                    alt="Cover preview"
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded-md border"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Upload button clicked');
                    fileInputRef.current?.click();
                  }}
                  disabled={uploadingImage}
                  className="px-4 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 transition-colors disabled:opacity-50"
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {uploadingImage && (
                <p className="mt-2 text-xs text-blue-600">🔄 Uploading image...</p>
              )}
              {selectedFileName && !uploadingImage && (
                <p className="mt-2 text-xs text-black">Selected: {selectedFileName}</p>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Upload a cover image (JPEG, PNG, or WebP, max 5MB)
              </p>
            </div>

            {/* Manual Image URL */}
            <div>
              <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
                Or enter image URL
              </label>
              <input
                type="text"
                id="coverImage"
                name="coverImage"
                value={formData.coverImage}
                onChange={(e) => {
                  handleInputChange(e);
                  setPreviewImage(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                placeholder="/images/your-image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Full Content */}
        <div className="mt-6">
          <label htmlFor="fullContent" className="block text-sm font-medium text-gray-700 mb-2">
            Full Content *
          </label>
          {/* Replaced Wysiwyg with MarkdownEditor for clean formatting */}
          <MarkdownEditor
            value={formData.fullContent}
            onChange={(content) => setFormData(prev => ({ ...prev, fullContent: content }))}
            minHeight={320}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || uploadingImage}
            className="px-6 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
