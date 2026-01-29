'use client';

import React from 'react';

const BULLET_PREFIX = '• ';
const ALT_BULLET_PREFIX = '- ';

const isBulletLine = (line: string) => /^\s*(?:•|-)\s+/.test(line);

const stripBullet = (line: string) => {
  const trimmed = line.trimStart();
  if (trimmed.startsWith(BULLET_PREFIX)) return trimmed.slice(BULLET_PREFIX.length);
  if (trimmed.startsWith(ALT_BULLET_PREFIX)) return trimmed.slice(ALT_BULLET_PREFIX.length);
  return line;
};

interface BulletTextProps {
  text: string;
  className?: string;
}

export default function BulletText({
  text,
  className = '',
}: BulletTextProps) {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    if (isBulletLine(line)) {
      const content = stripBullet(line).trim();
      if (content) {
        blocks.push(
          <div key={`bullet-${index}`} className="flex gap-2">
            <span>•</span>
            <span>{content}</span>
          </div>,
        );
      }
      return;
    }
    if (line.trim()) {
      blocks.push(
        <p key={`line-${index}`} className="whitespace-pre-line">
          {line}
        </p>,
      );
    }
  });

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
}
