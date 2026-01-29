/**
 * Text utilities for resume editors.
 * - Provides gentle auto-capitalization for the first alphabetic character
 *   on each line when that line previously had no alphabetic characters.
 * - Preserves user intent if they later change a capitalized character
 *   back to lowercase.
 */

const normalizeLines = (value: string) => value.replace(/\r\n/g, '\n').split('\n');

const findFirstAlphabet = (line: string) => {
  const match = line.match(/^(\s*(?:[•*-]\s*)?)([A-Za-z])/);
  if (!match) return null;
  return {
    prefixLength: match[1].length,
    char: match[2],
  };
};

/**
 * Capitalizes the first alphabetic character of each line only when the
 * previous value did not have any alphabetic character on that line.
 */
export const capitalizeLineStarts = (previousValue: string, nextValue: string) => {
  const prevLines = normalizeLines(previousValue || '');
  const nextLines = normalizeLines(nextValue || '');

  const updated = nextLines.map((line, idx) => {
    const nextFirst = findFirstAlphabet(line);
    if (!nextFirst) return line;

    const prevFirst = findFirstAlphabet(prevLines[idx] ?? '');
    const hadAlphabetBefore = Boolean(prevFirst);

    if (!hadAlphabetBefore && nextFirst.char >= 'a' && nextFirst.char <= 'z') {
      const capped = nextFirst.char.toUpperCase();
      return `${line.slice(0, nextFirst.prefixLength)}${capped}${line.slice(nextFirst.prefixLength + 1)}`;
    }

    return line;
  });

  return updated.join('\n');
};
