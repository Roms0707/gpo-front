import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GameTheme } from '../../utils/gameThemes';
import KeyTakeawaysCard from './KeyTakeawaysCard';

interface CoachingMessageRendererProps {
  content: string;
  theme: GameTheme;
  animate?: boolean;
}

const CoachingMessageRenderer: React.FC<CoachingMessageRendererProps> = ({
  content,
  theme,
  animate = true
}) => {
  const { mainContent, keyTakeaways } = useMemo(() => {
    const takeawaysRegex = /##\s*Key Takeaways?\s*\n([\s\S]*?)(?=##|$)/i;
    const match = content.match(takeawaysRegex);

    if (match) {
      const beforeTakeaways = content.slice(0, match.index).trim();
      const takeawaysText = match[1].trim();

      const items = takeawaysText
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line.match(/^[-*\d.]\s/))
        .map(line => line.replace(/^[-*\d.]\s*/, '').trim())
        .filter(Boolean);

      return {
        mainContent: beforeTakeaways,
        keyTakeaways: items.length > 0 ? items : null
      };
    }

    return { mainContent: content, keyTakeaways: null };
  }, [content]);

  const components = useMemo(() => ({
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1
        className="text-lg font-bold mb-3 mt-4 first:mt-0"
        style={{ color: theme.colors.primary }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2
        className="text-base font-bold mb-2 mt-3 first:mt-0"
        style={{ color: theme.colors.primary }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-sm font-bold text-white mb-2 mt-3 first:mt-0">
        {children}
      </h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-sm text-gray-200 mb-3 last:mb-0 leading-relaxed">
        {children}
      </p>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong
        className="font-semibold"
        style={{ color: theme.colors.primary }}
      >
        {children}
      </strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-gray-300">{children}</em>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="space-y-1.5 mb-3 last:mb-0">
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="space-y-1.5 mb-3 last:mb-0 list-decimal list-inside">
        {children}
      </ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="text-sm text-gray-200 flex items-start gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <span className="flex-1">{children}</span>
      </li>
    ),
    code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code
            className="px-1.5 py-0.5 rounded text-xs font-mono"
            style={{
              backgroundColor: `${theme.colors.primary}20`,
              color: theme.colors.primary
            }}
          >
            {children}
          </code>
        );
      }
      return (
        <code className="block bg-dark-400 rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto my-2">
          {children}
        </code>
      );
    },
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote
        className="border-l-2 pl-3 my-3 italic text-gray-400"
        style={{ borderColor: theme.colors.primary }}
      >
        {children}
      </blockquote>
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:opacity-80 transition-opacity"
        style={{ color: theme.colors.primary }}
      >
        {children}
      </a>
    ),
    hr: () => (
      <hr
        className="my-4 border-0 h-px"
        style={{ backgroundColor: `${theme.colors.primary}30` }}
      />
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full text-sm border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead
        className="text-left"
        style={{ backgroundColor: `${theme.colors.primary}15` }}
      >
        {children}
      </thead>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th
        className="px-3 py-2 font-semibold border-b"
        style={{
          borderColor: `${theme.colors.primary}30`,
          color: theme.colors.primary
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td
        className="px-3 py-2 border-b text-gray-300"
        style={{ borderColor: `${theme.colors.primary}15` }}
      >
        {children}
      </td>
    ),
  }), [theme]);

  return (
    <div className={animate ? 'animate-fade-in' : ''}>
      <div className="coaching-message-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {mainContent}
        </ReactMarkdown>
      </div>

      {keyTakeaways && keyTakeaways.length > 0 && (
        <KeyTakeawaysCard
          items={keyTakeaways}
          theme={theme}
        />
      )}
    </div>
  );
};

export default CoachingMessageRenderer;
