/**
 * ATS utilities for keyword and phrase matching.
 */

export const ATS_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'are',
  'but', 'not', 'was', 'were', 'has', 'have', 'had', 'will', 'would', 'can',
  'could', 'should', 'may', 'might', 'into', 'onto', 'over', 'under', 'a',
  'an', 'of', 'to', 'in', 'on', 'at', 'by', 'as', 'or', 'is', 'be', 'we',
  'our', 'their', 'they', 'it', 'its', 'if', 'than', 'then', 'so', 'such',
]);

export type SynonymMap = Record<string, string[]>;

export const ATS_SYNONYMS: SynonymMap = {
  javascript: ['js'],
  typescript: ['ts'],
  react: ['reactjs'],
  node: ['nodejs'],
  sql: ['mysql', 'postgres', 'postgresql'],
  aws: ['amazon web services'],
  gcp: ['google cloud'],
  pm: ['product manager', 'product management'],
  ux: ['user experience'],
  ui: ['user interface'],
  qa: ['quality assurance'],
};

export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const extractKeywords = (value: string) => {
  const words = normalizeText(value).split(' ').filter(Boolean);
  const filtered = words.filter((word) => word.length > 2 && !ATS_STOP_WORDS.has(word));
  return Array.from(new Set(filtered));
};

export const extractPhrases = (value: string, sizes: number[] = [2, 3]) => {
  const words = normalizeText(value).split(' ').filter(Boolean);
  const phrases: string[] = [];

  sizes.forEach((size) => {
    for (let i = 0; i <= words.length - size; i += 1) {
      const chunk = words.slice(i, i + size);
      if (chunk.every((word) => word.length > 2 && !ATS_STOP_WORDS.has(word))) {
        phrases.push(chunk.join(' '));
      }
    }
  });

  return Array.from(new Set(phrases));
};

const mergeSynonyms = (extra?: SynonymMap) => ({
  ...ATS_SYNONYMS,
  ...(extra || {}),
});

const expandWithSynonyms = (keywords: string[], extra?: SynonymMap) => {
  const expanded = new Set<string>(keywords);
  const combined = mergeSynonyms(extra);
  keywords.forEach((keyword) => {
    const synonyms = combined[keyword];
    if (synonyms) {
      synonyms.forEach((item) => expanded.add(item));
    }
  });
  return expanded;
};

export const getKeywordSetForText = (text: string, extraSynonyms?: SynonymMap) => {
  const keywords = extractKeywords(text);
  return expandWithSynonyms(keywords, extraSynonyms);
};

export const getMissingKeywordsForText = (
  text: string,
  jobKeywords: string[],
  jobPhrases: string[],
  extraSynonyms?: SynonymMap
) => {
  if (!jobKeywords.length && !jobPhrases.length) {
    return { missingKeywords: [] as string[], missingPhrases: [] as string[] };
  }
  const normalized = normalizeText(text);
  const keywordSet = getKeywordSetForText(text, extraSynonyms);

  const missingKeywords = jobKeywords.filter((word) => !keywordSet.has(word));
  const missingPhrases = jobPhrases.filter((phrase) => !normalized.includes(phrase));

  return { missingKeywords, missingPhrases };
};

export const getSkillClusters = (
  jobKeywords: string[],
  resumeText: string,
  extraSynonyms?: SynonymMap
) => {
  const keywordSet = getKeywordSetForText(resumeText, extraSynonyms);
  const combined = mergeSynonyms(extraSynonyms);
  return Object.entries(combined)
    .filter(([canonical]) => jobKeywords.includes(canonical))
    .map(([canonical, synonyms]) => {
      const matchedSynonyms = synonyms.filter((syn) => keywordSet.has(syn));
      const hasCanonical = keywordSet.has(canonical);
      return {
        canonical,
        synonyms,
        matchedSynonyms,
        hasCanonical,
        shouldSuggestCanonical: !hasCanonical && matchedSynonyms.length > 0,
      };
    })
    .filter((cluster) => cluster.matchedSynonyms.length > 0 || cluster.hasCanonical);
};
