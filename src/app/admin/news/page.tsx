'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AuthWrapper from '@/components/admin/AuthWrapper';
import NewsForm from '@/components/admin/NewsForm';
import Image from 'next/image';
import { NewsPost } from '@/data/newsData';

type CustomSectionType = 'text' | 'gallery' | 'video' | 'html';

type AdminCustomSection = {
  id: string;
  title: string;
  type: CustomSectionType;
  content: string; // text, newline-separated image paths for gallery, video URL, or raw HTML
  enabled: boolean;
};

export default function NewsManagement() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Custom Sections state (per-post, shown only when showForm is true)
  const [useCustomTemplateDraft, setUseCustomTemplateDraft] = useState(false);
  const [useCustomTemplateSaved, setUseCustomTemplateSaved] = useState(false);
  const [sectionsDraft, setSectionsDraft] = useState<AdminCustomSection[]>([]);
  const [sectionsSaved, setSectionsSaved] = useState<AdminCustomSection[]>([]);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // When opening the form, seed Custom Sections from the post being edited (if present)
  useEffect(() => {
    if (!showForm) return;
    const fromPost = (editingPost as any) || {};
    const seededSections: AdminCustomSection[] = Array.isArray(fromPost.customSections)
      ? fromPost.customSections
      : [];
    const seededUseCustom = !!fromPost.useCustomTemplate;

    setSectionsDraft(seededSections);
    setSectionsSaved(seededSections);
    setUseCustomTemplateDraft(seededUseCustom);
    setUseCustomTemplateSaved(seededUseCustom);
  }, [showForm, editingPost]);

  // Handle create/update post
  const handleSubmitPost = async (postData: Omit<NewsPost, 'id'> | NewsPost) => {
    setSubmitting(true);
    try {
      const method = editingPost ? 'PUT' : 'POST';

      // Merge the Custom Sections saved in the panel into the post payload
      const payload: any = {
        ...(postData as any),
        customSections: sectionsSaved,
        useCustomTemplate: useCustomTemplateSaved,
      };

      const response = await fetch('/api/news', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchPosts();
        setShowForm(false);
        setEditingPost(null);
        alert(editingPost ? 'Post updated successfully!' : 'Post created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      alert('An error occurred while saving the post');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete post
  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/news?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPosts();
        alert('Post deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting the post');
    }
  };

  // Handle edit post
  const handleEditPost = (post: NewsPost) => {
    setEditingPost(post);
    setShowForm(true);
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  // Helpers for Custom Sections editor
  const newId = () => {
    try {
      // @ts-ignore
      if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch {}
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const addSection = () => {
    const next: AdminCustomSection = {
      id: newId(),
      title: '',
      type: 'text',
      content: '',
      enabled: true,
    };
    setSectionsDraft((s) => [...s, next]);
  };

  const updateSection = (idx: number, patch: Partial<AdminCustomSection>) => {
    setSectionsDraft((s) => {
      const copy = [...s];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const deleteSection = (idx: number) => {
    setSectionsDraft((s) => s.filter((_, i) => i !== idx));
  };

  const saveSectionsPanel = () => {
    setSectionsSaved(sectionsDraft);
    setUseCustomTemplateSaved(useCustomTemplateDraft);
    alert('Custom Sections saved to this post. Submit the post to persist.');
  };

  const cancelSectionsPanel = () => {
    setSectionsDraft(sectionsSaved);
    setUseCustomTemplateDraft(useCustomTemplateSaved);
  };

  if (loading) {
    return (
      <AuthWrapper>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading posts...</div>
          </div>
        </AdminLayout>
      </AuthWrapper>
    );
  }

  if (showForm) {
    // New Post / Edit Post screen with Custom Sections editor stacked under the form
    return (
      <AuthWrapper>
        <AdminLayout>
          <div className="space-y-6">
            {/* Your existing form */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <NewsForm
                post={editingPost || undefined}
                onSubmit={handleSubmitPost}
                onCancel={handleCancelForm}
                isLoading={submitting}
              />
            </div>

            {/* Custom Sections editor (now at the bottom) */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Page Customization</h2>
                <button
                  onClick={addSection}
                  className="px-4 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 transition-colors text-sm font-medium"
                >
                  Add Section
                </button>
              </div>

              {/* Use Custom Template */}
              <div className="px-6 pt-4">
                <label className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={useCustomTemplateDraft}
                    onChange={(e) => setUseCustomTemplateDraft(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Use Custom Template</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Advanced: Override the default page template with a custom design
                </p>
              </div>

              <div className="p-6 space-y-6">
                {sectionsDraft.length === 0 ? (
                  <div className="text-gray-600">No custom sections yet</div>
                ) : (
                  sectionsDraft.map((sec, idx) => (
                    <div key={sec.id} className="border rounded-md p-4">
                      <div className="grid md:grid-cols-12 gap-4">
                        {/* Title */}
                        <div className="md:col-span-5">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => updateSection(idx, { title: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Section title"
                          />
                        </div>

                        {/* Type */}
                        <div className="md:col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={sec.type}
                            onChange={(e) => updateSection(idx, { type: e.target.value as CustomSectionType })}
                            className="w-full border rounded px-3 py-2 bg-white"
                          >
                            <option value="text">Text</option>
                            <option value="gallery">Gallery</option>
                            <option value="video">Video</option>
                            <option value="html">Custom HTML</option>
                          </select>
                        </div>

                        {/* Enabled + Delete */}
                        <div className="md:col-span-3 flex items-end justify-between">
                          <label className="inline-flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={sec.enabled}
                              onChange={(e) => updateSection(idx, { enabled: e.target.checked })}
                            />
                            <span className="text-sm text-gray-700">Enabled</span>
                          </label>

                          <button
                            onClick={() => deleteSection(idx)}
                            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            title="Delete section"
                          >
                            Delete
                          </button>
                        </div>

                        {/* Content */}
                        <div className="md:col-span-12">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                          <textarea
                            value={sec.content}
                            onChange={(e) => updateSection(idx, { content: e.target.value })}
                            className="w-full border rounded px-3 py-2 h-28"
                            placeholder={
                              sec.type === 'gallery'
                                ? 'One image path or URL per line'
                                : sec.type === 'video'
                                ? 'Video URL'
                                : sec.type === 'html'
                                ? 'Custom HTML'
                                : 'Text content'
                            }
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Supports: /images/file.jpg, public/images/file.jpg, or full URLs. Press Enter for new lines.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Save / Cancel (panel-local) */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={saveSectionsPanel}
                    className="px-6 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={cancelSectionsPanel}
                    className="px-6 py-2 border rounded-md hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Tip: Click Save Changes here, then submit the post to persist on the server.
                </p>
              </div>
            </div>
          </div>
        </AdminLayout>
      </AuthWrapper>
    );
  }

  // List screen (unchanged)
  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">News Management</h1>
              <p className="text-gray-600">Manage your blog posts and articles</p>
            </div>
            <button
              onClick={() => {
                setEditingPost(null);
                setShowForm(true);
              }}
              className="px-6 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium"
            >
              + Create New Post
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Posts</p>
                  <p className="text-3xl font-bold text-gray-900">{posts.length}</p>
                </div>
                <div className="text-2xl">📰</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-3xl font-bold text-green-600">{posts.length}</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {posts.filter(post => {
                      const postDate = new Date(post.publishDate);
                      const now = new Date();
                      return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <div className="text-2xl">📅</div>
              </div>
            </div>
          </div>

          {/* Posts List */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">All Posts</h2>
            </div>
            
            {posts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first news post</p>
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setShowForm(true);
                  }}
                  className="px-6 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {posts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      {/* Cover Image */}
                      <div className="flex-shrink-0">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          width={80}
                          height={60}
                          className="w-20 h-15 object-cover rounded-md border"
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {post.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>By {post.author}</span>
                              <span>•</span>
                              <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{post.readTime}</span>
                              {post.category && (
                                <>
                                  <span>•</span>
                                  <span className="bg-[#FF8A3D] text-black px-2 py-1 rounded text-xs">
                                    {post.category}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEditPost(post)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}
