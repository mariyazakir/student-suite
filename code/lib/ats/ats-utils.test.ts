import {
  extractKeywords,
  extractPhrases,
  getKeywordSetForText,
  getMissingKeywordsForText,
  getSkillClusters,
  normalizeText,
} from './ats-utils';

describe('ATS utilities', () => {
  it('normalizes text', () => {
    expect(normalizeText('Hello, World!  ')).toBe('hello world');
  });

  it('extracts keywords and removes stop words', () => {
    const keywords = extractKeywords('React and TypeScript for the web');
    expect(keywords).toContain('react');
    expect(keywords).toContain('typescript');
    expect(keywords).not.toContain('and');
    expect(keywords).not.toContain('the');
  });

  it('extracts phrases', () => {
    const phrases = extractPhrases('Built scalable web applications');
    expect(phrases).toContain('built scalable');
    expect(phrases).toContain('scalable web');
  });

  it('expands keywords with synonyms', () => {
    const set = getKeywordSetForText('Experience with JavaScript and React');
    expect(set.has('javascript')).toBe(true);
    expect(set.has('js')).toBe(true);
    expect(set.has('react')).toBe(true);
  });

  it('returns missing keywords and phrases', () => {
    const text = 'Skilled in React and Node.js';
    const result = getMissingKeywordsForText(
      text,
      ['react', 'typescript'],
      ['node js']
    );
    expect(result.missingKeywords).toContain('typescript');
  });

  it('builds skill clusters from synonyms', () => {
    const clusters = getSkillClusters(
      ['javascript', 'react'],
      'Worked with JavaScript and React'
    );
    const jsCluster = clusters.find((item) => item.canonical === 'javascript');
    expect(jsCluster?.hasCanonical).toBe(true);
  });
});
