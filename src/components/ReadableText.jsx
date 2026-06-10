import React from 'react';

export default function ReadableText({ value, className = '' }) {
  const blocks = parseReadableBlocks(value);

  return (
    <div className={`space-y-2 break-words ${className}`}>
      {blocks.map((block, index) => (
        <ReadableBlock key={`${block.type}-${block.text}-${index}`} block={block} />
      ))}
    </div>
  );
}

function ReadableBlock({ block }) {
  if (block.type === 'heading2') {
    return (
      <h3 className="mt-3 text-lg font-black leading-7 text-current first:mt-0">
        {renderInlineMarkdown(block.text)}
      </h3>
    );
  }

  if (block.type === 'heading3') {
    return (
      <h4 className="mt-3 text-base font-black leading-7 text-current first:mt-0">
        {renderInlineMarkdown(block.text)}
      </h4>
    );
  }

  if (block.type === 'heading') {
    return (
      <h5 className="mt-2 text-sm font-black leading-6 text-current first:mt-0">
        {renderInlineMarkdown(block.text)}
      </h5>
    );
  }

  if (block.type === 'bullet') {
    return (
      <div className="flex gap-2 leading-7">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
        <p className="min-w-0">{renderInlineMarkdown(block.text)}</p>
      </div>
    );
  }

  if (block.type === 'ordered') {
    return (
      <div className="flex gap-2 leading-7">
        <span className="shrink-0 font-black text-current opacity-70">{block.order}.</span>
        <p className="min-w-0">{renderInlineMarkdown(block.text)}</p>
      </div>
    );
  }

  return <p className="leading-7">{renderInlineMarkdown(block.text)}</p>;
}

function parseReadableBlocks(value) {
  const text = String(value || '').trim();
  if (!text) return [{ type: 'paragraph', text: '-' }];

  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const hasMarkdownShape = lines.some(
    line => /^#{1,6}\s+/.test(line) || /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line),
  );

  if (hasMarkdownShape) {
    return lines.map(parseMarkdownLine);
  }

  return [{ type: 'paragraph', text: text.replace(/\s+/g, ' ') }];
}

function parseMarkdownLine(line) {
  const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const type = level <= 2 ? 'heading2' : level === 3 ? 'heading3' : 'heading';
    return { type, text: headingMatch[2].trim() };
  }

  const bulletMatch = line.match(/^[-*]\s+(.+)$/);
  if (bulletMatch) {
    return { type: 'bullet', text: bulletMatch[1].trim() };
  }

  const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
  if (orderedMatch) {
    return { type: 'ordered', order: orderedMatch[1], text: orderedMatch[2].trim() };
  }

  return { type: 'paragraph', text: line };
}

function renderInlineMarkdown(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*|__[^_]+__)/g)
    .filter(Boolean)
    .map((part, index) => {
      const boldMatch = part.match(/^(\*\*|__)(.+)\1$/);
      if (boldMatch) {
        return <strong key={`${part}-${index}`} className="font-black">{boldMatch[2]}</strong>;
      }

      return part;
    });
}
