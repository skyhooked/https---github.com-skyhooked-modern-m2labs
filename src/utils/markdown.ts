// Simple markdown to HTML converter
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  return markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-3 mt-6 text-gray-800">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-4 mt-8 text-gray-900">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-8 text-gray-900">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>')
    // Lists - handle properly
    .replace(/^\* (.+)$/gm, '<li class="mb-1">$1</li>')
    .replace(/(<li class="mb-1">.*?<\/li>)(?:\n<li class="mb-1">.*?<\/li>)*/gs, (match) => {
      return `<ul class="list-disc list-inside mb-4 space-y-1 text-gray-700">${match}</ul>`;
    })
    // Line breaks - convert double newlines to paragraphs
    .split('\n\n')
    .map(paragraph => {
      // Skip if it's already a heading or list
      if (paragraph.match(/^<[h123ul]/)) {
        return paragraph;
      }
      // Wrap in paragraph tags
      return `<p class="mb-4 text-gray-700 leading-relaxed">${paragraph.replace(/\n/g, '<br>')}</p>`;
    })
    .join('')
    // Clean up: remove paragraph tags around headings and lists
    .replace(/<p class="mb-4 text-gray-700 leading-relaxed">(<h[1-3].*?<\/h[1-3]>)<\/p>/g, '$1')
    .replace(/<p class="mb-4 text-gray-700 leading-relaxed">(<ul.*?<\/ul>)<\/p>/g, '$1')
    // Remove empty paragraphs
    .replace(/<p class="mb-4 text-gray-700 leading-relaxed"><\/p>/g, '');
}

// Check if content is likely markdown vs HTML
export function isMarkdown(content: string): boolean {
  // Simple heuristics to detect if content is markdown
  const markdownIndicators = [
    /^\s*#{1,3}\s/m,     // Headers
    /\*\*.*?\*\*/,       // Bold
    /\*.*?\*/,           // Italic  
    /^\s*\*\s/m,         // Lists
    /\[.*?\]\(.*?\)/     // Links
  ];
  
  const htmlIndicators = [
    /<[^>]+>/            // HTML tags
  ];
  
  const markdownScore = markdownIndicators.reduce((score, regex) => {
    return score + (regex.test(content) ? 1 : 0);
  }, 0);
  
  const htmlScore = htmlIndicators.reduce((score, regex) => {
    return score + (regex.test(content) ? 1 : 0);
  }, 0);
  
  // If no clear indicators, assume it's plain text (treat as markdown)
  if (markdownScore === 0 && htmlScore === 0) {
    return true;
  }
  
  return markdownScore >= htmlScore;
}
