'use client';

import { useState } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

export default function MarkdownEditor({ value, onChange, minHeight = 320 }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  // Convert markdown to HTML for preview
  const markdownToHtml = (markdown: string): string => {
    return markdown
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-3 mt-6">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-4 mt-8">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-8">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      // Wrap in paragraphs
      .replace(/^(.+)$/gm, '<p class="mb-4">$1</p>')
      // Remove empty paragraphs
      .replace(/<p class="mb-4"><\/p>/g, '')
      // Lists
      .replace(/^\* (.+)$/gm, '<li class="ml-4">• $1</li>')
      .replace(/(<li class="ml-4">.*<\/li>)/gs, '<ul class="mb-4 space-y-1">$1</ul>')
      // Clean up extra tags
      .replace(/<p class="mb-4">(<h[1-3])/g, '$1')
      .replace(/(<\/h[1-3]>)<\/p>/g, '$1');
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const formatButtons = [
    { label: 'Bold', action: () => insertMarkdown('**', '**'), icon: 'B' },
    { label: 'Italic', action: () => insertMarkdown('*', '*'), icon: 'I' },
    { label: 'Heading 2', action: () => insertMarkdown('## ', ''), icon: 'H2' },
    { label: 'Heading 3', action: () => insertMarkdown('### ', ''), icon: 'H3' },
    { label: 'Link', action: () => insertMarkdown('[', '](https://)'), icon: '🔗' },
    { label: 'List', action: () => insertMarkdown('* ', ''), icon: '•' },
  ];

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'write'
              ? 'bg-white border-b-2 border-[#FF8A3D] text-[#FF8A3D]'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('write')}
        >
          Write
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview'
              ? 'bg-white border-b-2 border-[#FF8A3D] text-[#FF8A3D]'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      {activeTab === 'write' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
            {formatButtons.map((button) => (
              <button
                key={button.label}
                type="button"
                onClick={button.action}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title={button.label}
              >
                <span className="font-mono font-bold">{button.icon}</span>
              </button>
            ))}
          </div>

          {/* Editor */}
          <textarea
            id="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-4 focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] resize-none"
            style={{ minHeight: `${minHeight}px` }}
            placeholder="Write your content here using Markdown formatting..."
          />
        </>
      )}

      {activeTab === 'preview' && (
        <div
          className="p-4 prose max-w-none"
          style={{ minHeight: `${minHeight}px` }}
          dangerouslySetInnerHTML={{ __html: markdownToHtml(value) || '<p class="text-gray-500">Nothing to preview yet...</p>' }}
        />
      )}

      {/* Help text */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <strong>Quick tips:</strong> **bold**, *italic*, ## Heading, [link](url), * list item
      </div>
    </div>
  );
}
