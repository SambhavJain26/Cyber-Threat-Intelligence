import { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return "";
    
    let html = content;
    
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-4 mb-2 text-foreground">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-4 mb-3 text-foreground">$1</h1>');
    
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold italic">$1</strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li class="ml-4 list-disc list-inside text-foreground/90">$1</li>');
    html = html.replace(/(<li.*<\/li>\n?)+/g, (match) => `<ul class="my-2 space-y-1">${match}</ul>`);
    
    html = html.replace(/^\s*(\d+)\.\s+(.*)$/gim, '<li class="ml-4 list-decimal list-inside text-foreground/90">$2</li>');
    
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:opacity-80">$1</a>');
    
    html = html.replace(/^---$/gim, '<hr class="my-4 border-border" />');
    
    const paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<hr')) {
        return trimmed;
      }
      return `<p class="mb-2 text-foreground/90 leading-relaxed">${trimmed}</p>`;
    }).join('\n');
    
    html = html.replace(/\n(?!<)/g, '<br />');
    
    return html;
  }, [content]);

  return (
    <div 
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
