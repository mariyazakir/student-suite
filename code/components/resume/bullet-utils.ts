export const BULLET_PREFIX = '• ';
const ALT_BULLET_PREFIX = '- ';

export const normalizeBulletText = (value: string) => value.replace(/\r\n/g, '\n');

const getLineBounds = (value: string, caret: number) => {
  const lineStart = value.lastIndexOf('\n', Math.max(0, caret - 1)) + 1;
  const nextBreak = value.indexOf('\n', caret);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  return { lineStart, lineEnd };
};

const isBulletLine = (line: string) =>
  line.startsWith(BULLET_PREFIX) || line.startsWith(ALT_BULLET_PREFIX);

const isEmptyBullet = (line: string) => {
  const trimmed = line.trim();
  return trimmed === '•' || trimmed === '-';
};

export const handleBulletKeyDown = (
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onChange: (nextValue: string, nextCaret: number) => void,
) => {
  const textarea = event.currentTarget;
  const { selectionStart, selectionEnd } = textarea;
  if (selectionStart === null || selectionEnd === null) return;

  const liveValue = textarea.value;
  const { lineStart, lineEnd } = getLineBounds(liveValue, selectionStart);
  const line = liveValue.slice(lineStart, lineEnd);

  if (event.key === 'Enter' && isBulletLine(line)) {
    event.preventDefault();
    const prefix = line.startsWith(BULLET_PREFIX)
      ? BULLET_PREFIX
      : ALT_BULLET_PREFIX;
    if (isEmptyBullet(line)) {
      const before = liveValue.slice(0, lineStart);
      const after = liveValue.slice(lineEnd);
      const nextValue = `${before}\n${after.replace(/^\n/, '')}`;
      const nextCaret = before.length + 1;
      onChange(nextValue, nextCaret);
      return;
    }
    const insert = `\n${prefix}`;
    const nextValue = liveValue.slice(0, selectionStart) + insert + liveValue.slice(selectionEnd);
    const nextCaret = selectionStart + insert.length;
    onChange(nextValue, nextCaret);
    return;
  }

  if (event.key === 'Backspace' && isEmptyBullet(line)) {
    if (selectionStart === selectionEnd && selectionStart <= lineStart + BULLET_PREFIX.length) {
      event.preventDefault();
      const prefixLength = line.startsWith(BULLET_PREFIX) ? BULLET_PREFIX.length : ALT_BULLET_PREFIX.length;
      const nextValue = value.slice(0, lineStart) + value.slice(lineStart + prefixLength);
      onChange(nextValue, lineStart);
    }
  }
};

export const insertBulletAtCursor = (
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (nextValue: string, nextCaret: number) => void,
) => {
  const { selectionStart, selectionEnd } = textarea;
  if (selectionStart === null || selectionEnd === null) return;
  const nextValue = value.slice(0, selectionStart) + BULLET_PREFIX + value.slice(selectionEnd);
  const nextCaret = selectionStart + BULLET_PREFIX.length;
  onChange(nextValue, nextCaret);
};
