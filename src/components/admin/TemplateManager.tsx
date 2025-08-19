'use client';

import { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  htmlContent: string;
  isDefault: boolean;
  category: string;
  variables?: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_TEMPLATES = [
  {
    name: 'Modern Newsletter',
    description: 'Clean and modern design perfect for tech companies',
    category: 'announcement',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        @media only screen and (max-width: 600px) { .container { margin: 0; } .header, .content { padding: 20px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">{{headerText}}</h1>
        </div>
        <div class="content">
            {{content}}
        </div>
        <div class="footer">
            <p>M2 Labs - Premium Guitar Effects</p>
            <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{websiteUrl}}">Visit Website</a></p>
        </div>
    </div>
</body>
</html>`,
    variables: {
      headerText: 'Newsletter Update',
      content: 'Your content goes here',
      unsubscribeUrl: '{{unsubscribeUrl}}',
      websiteUrl: 'https://m2labs.com'
    }
  },
  {
    name: 'Product Showcase',
    description: 'Perfect for showcasing new products and gear',
    category: 'product',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #000; color: #fff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; }
        .header { background: #FF8A3D; padding: 30px 20px; text-align: center; }
        .product-section { padding: 30px 20px; text-align: center; }
        .product-image { width: 100%; max-width: 400px; border-radius: 8px; }
        .cta-button { background: #FF8A3D; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 20px 0; }
        .footer { background: #333; padding: 20px; text-align: center; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; color: #000;">{{productName}}</h1>
            <p style="margin: 10px 0 0 0; color: #000;">{{productTagline}}</p>
        </div>
        <div class="product-section">
            {{content}}
            <a href="{{shopUrl}}" class="cta-button">Shop Now</a>
        </div>
        <div class="footer">
            <p>M2 Labs - Premium Guitar Effects</p>
            <p><a href="{{unsubscribeUrl}}" style="color: #FF8A3D;">Unsubscribe</a> | <a href="{{websiteUrl}}" style="color: #FF8A3D;">Visit Website</a></p>
        </div>
    </div>
</body>
</html>`,
    variables: {
      productName: 'New Product',
      productTagline: 'The sound you\'ve been searching for',
      content: 'Product description and details go here',
      shopUrl: 'https://m2labs.com/shop',
      unsubscribeUrl: '{{unsubscribeUrl}}',
      websiteUrl: 'https://m2labs.com'
    }
  }
];

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    htmlContent: '',
    variables: {} as any
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/newsletter/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      htmlContent: '',
      variables: {}
    });
    setShowEditor(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      htmlContent: template.htmlContent,
      variables: template.variables || {}
    });
    setShowEditor(true);
  };

  const handleUseDefaultTemplate = (defaultTemplate: any) => {
    setEditingTemplate(null);
    setFormData({
      name: defaultTemplate.name,
      description: defaultTemplate.description,
      category: defaultTemplate.category,
      htmlContent: defaultTemplate.htmlContent,
      variables: defaultTemplate.variables
    });
    setShowEditor(true);
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim() || !formData.htmlContent.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/newsletter/templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        ...(editingTemplate && { id: editingTemplate.id })
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await loadTemplates();
        setShowEditor(false);
        alert(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'default', 'announcement', 'product', 'artist', 'custom'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="p-6 space-y-6">
        {/* Editor Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Design reusable email templates for your campaigns
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowEditor(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>

        {/* Template Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Template Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe this template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="custom">Custom</option>
                    <option value="announcement">Announcement</option>
                    <option value="product">Product</option>
                    <option value="artist">Artist</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Variables Panel */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Template Variables</h3>
              <div className="text-sm text-gray-600">
                <p className="mb-2">Available variables in templates:</p>
                <ul className="space-y-1 text-xs">
                  <li>• {'{{subject}}'} - Email subject</li>
                  <li>• {'{{content}}'} - Main content</li>
                  <li>• {'{{unsubscribeUrl}}'} - Unsubscribe link</li>
                  <li>• {'{{websiteUrl}}'} - Website URL</li>
                  <li>• Add custom variables as needed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* HTML Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">HTML Content</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const preview = window.open('', '_blank');
                      if (preview) {
                        preview.document.write(formData.htmlContent);
                        preview.document.close();
                      }
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Preview
                  </button>
                </div>
              </div>
              
              <textarea
                value={formData.htmlContent}
                onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter your HTML template here..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Email Templates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage reusable email templates
          </p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Template
        </button>
      </div>

      {/* Default Templates Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Start Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_TEMPLATES.map((template, index) => (
            <div key={index} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-2">
                    {template.category}
                  </span>
                </div>
                <button
                  onClick={() => handleUseDefaultTemplate(template)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                  </div>
                  {template.isDefault && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    {template.category}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePreview(template)}
                      className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-6">Create your first email template to get started</p>
            <button
              onClick={handleCreateTemplate}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Template
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-screen overflow-auto m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">Preview: {previewTemplate.name}</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="p-4">
              <iframe
                srcDoc={previewTemplate.htmlContent}
                className="w-full h-96 border rounded"
                title={`Preview of ${previewTemplate.name}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
