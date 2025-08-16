'use client';

import { useEffect, useRef } from 'react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number; // px
};

export default function Wysiwyg({
  value,
  onChange,
  placeholder = 'Write the full article here…',
  minHeight = 260,
}: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Keep DOM in sync when value prop changes outside the editor
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  const focusEditor = () => editorRef.current?.focus();

  const exec = (cmd: string, val?: string) => {
    focusEditor();
    document.execCommand(cmd, false, val);
    // Trigger onChange
    const html = editorRef.current?.innerHTML || '';
    onChange(html);
  };

  const getSelectedHtml = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return '';
    const range = sel.getRangeAt(0).cloneRange();
    const div = document.createElement('div');
    div.appendChild(range.cloneContents());
    return div.innerHTML;
  };

  const insertHtml = (html: string) => {
    focusEditor();
    document.execCommand('insertHTML', false, html);
    onChange(editorRef.current?.innerHTML || '');
  };

  const wrapSelectionWithSpanStyle = (style: string) => {
    const selected = getSelectedHtml();
    if (!selected) {
      // no selection: insert a styled span placeholder
      insertHtml(`<span style="${style}">Text</span>`);
      return;
    }
    insertHtml(`<span style="${style}">${selected}</span>`);
  };

  const onInput = () => {
    onChange(editorRef.current?.innerHTML || '');
  };

  // Toolbar actions
  const actions = {
    bold: () => exec('bold'),
    italic: () => exec('italic'),
    left: () => exec('justifyLeft'),
    center: () => exec('justifyCenter'),
    right: () => exec('justifyRight'),
    hr: () => exec('insertHorizontalRule'),
    link: () => {
      const url = prompt('Link URL (https://...)');
      if (!url) return;
      const label = getSelectedHtml() || 'link';
      insertHtml(
        `<a href="${url.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${label}</a>`
      );
    },
    img: () => {
      const src = prompt('Image URL (/images/... or https://...)');
      if (!src) return;
      const alt = prompt('Alt text (optional)') || '';
      const caption = prompt('Caption (optional)') || '';
      const figCaption = caption
        ? `<figcaption style="font-size:0.9rem;text-align:center;opacity:.8;">${caption.replace(
            /</g,
            '&lt;'
          )}</figcaption>`
        : '';
      insertHtml(
        `<figure style="margin:1rem 0;">
           <img src="${src.replace(/"/g, '&quot;')}" alt="${alt.replace(/"/g, '&quot;')}"
                style="max-width:100%;height:auto;display:block;margin:0 auto;" />
           ${figCaption}
         </figure>`
      );
    },
    size: (px: number) => wrapSelectionWithSpanStyle(`font-size:${px}px;`),
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={actions.bold} className="px-2 py-1 border rounded text-sm">B</button>
          <button type="button" onClick={actions.italic} className="px-2 py-1 border rounded text-sm italic">I</button>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={actions.left} className="px-2 py-1 border rounded text-sm">Left</button>
          <button type="button" onClick={actions.center} className="px-2 py-1 border rounded text-sm">Center</button>
          <button type="button" onClick={actions.right} className="px-2 py-1 border rounded text-sm">Right</button>
        </div>

        <div className="flex items-center gap-1">
          <select
            onChange={(e) => actions.size(Number(e.target.value))}
            className="px-2 py-1 border rounded text-sm"
            defaultValue="18"
            title="Font size"
          >
            <option value="14">14 px</option>
            <option value="16">16 px</option>
            <option value="18">18 px</option>
            <option value="20">20 px</option>
            <option value="24">24 px</option>
            <option value="28">28 px</option>
            <option value="32">32 px</option>
          </select>
          <button type="button" onClick={() => actions.size(18)} className="px-2 py-1 border rounded text-sm">
            Apply size
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={actions.hr} className="px-2 py-1 border rounded text-sm">HR</button>
          <button type="button" onClick={actions.img} className="px-2 py-1 border rounded text-sm">Image</button>
          <button type="button" onClick={actions.link} className="px-2 py-1 border rounded text-sm">Link</button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        className="w-full border rounded px-3 py-2 bg-white focus:outline-none"
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        onBlur={onInput}
        style={{ minHeight }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af; /* gray-400 */
        }
      `}</style>
    </div>
  );
}
