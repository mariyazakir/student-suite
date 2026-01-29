/**
 * KeywordHighlight
 *
 * Renders text with matched terms highlighted.
 */

'use client';

import { useMemo } from 'react';

interface KeywordHighlightProps {
  text: string;
  terms: string[];
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');

export default function KeywordHighlight({ text, terms }: KeywordHighlightProps) {
  const parts = useMemo(() => {
    if (!text.trim() || terms.length === 0) {
      return [{ value: text, highlight: false }];
    }

    const uniqueTerms = Array.from(new Set(terms))
      .filter((term) => term.trim().length > 0)
      .sort((a, b) => b.length - a.length);

    if (!uniqueTerms.length) {
      return [{ value: text, highlight: false }];
    }

    const pattern = uniqueTerms.map(escapeRegex).join('|');
    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

    const result: { value: string; highlight: boolean }[] = [];
    let lastIndex = 0;
    const matches = [...text.matchAll(regex)];

    matches.forEach((match) => {
      const index = match.index ?? 0;
      if (index > lastIndex) {
        result.push({ value: text.slice(lastIndex, index), highlight: false });
      }
      result.push({ value: match[0], highlight: true });
      lastIndex = index + match[0].length;
    });

    if (lastIndex < text.length) {
      result.push({ value: text.slice(lastIndex), highlight: false });
    }

    return result.length ? result : [{ value: text, highlight: false }];
  }, [text, terms]);

  return (
    <span>
      {parts.map((part, index) =>
        part.highlight ? (
          <span key={`${part.value}-${index}`} className="ats-input-highlight">
            {part.value}
          </span>
        ) : (
          <span key={`${part.value}-${index}`}>{part.value}</span>
        )
      )}
    </span>
  );
}
