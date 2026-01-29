'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useSearchParams } from 'next/navigation';
import {
  exportMultiPageImages,
  exportMultiPagePdf,
  printMultiPage,
} from '@/lib/exportUtils';
import { getTemplatesFor } from '@/src/lib/templates';
import type { Template } from '@/src/lib/templates';

type PageSize = 'a4' | 'letter';
type MarginPreset = 'normal' | 'narrow' | 'wide' | 'custom';
type LineSpacing = 1 | 1.5 | 2;
type TextAlign = 'left' | 'center' | 'justify';
type CoverStyle = 'minimal' | 'formal' | 'modern';
type TitleAlign = 'left' | 'center' | 'right';
type PanelView = 'editor' | 'preview';
type CoverFields = {
  title: string;
  studentName: string;
  classGrade: string;
  subject: string;
  teacherName: string;
  institutionName: string;
  submissionDate: string;
  rollId: string;
};

type MarginValues = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const PAGE_SIZES: Record<PageSize, { width: string; height: string; label: string }> = {
  a4: { width: '210mm', height: '297mm', label: 'A4' },
  letter: { width: '216mm', height: '279mm', label: 'Letter' },
};
const PAGE_SIZES_MM: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  letter: { width: 216, height: 279 },
};

const MARGIN_PRESETS: Record<Exclude<MarginPreset, 'custom'>, MarginValues> = {
  normal: { top: 25, right: 25, bottom: 25, left: 25 },
  narrow: { top: 12, right: 12, bottom: 12, left: 12 },
  wide: { top: 30, right: 30, bottom: 30, left: 30 },
};

const FONT_FAMILIES = [
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Calibri', value: 'Calibri, "Segoe UI", sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
];

const FONT_SIZES = Array.from({ length: 9 }, (_, i) => 10 + i);
const STORAGE_KEY = 'assignment-formatter-v1';
const SAVED_ASSIGNMENTS_KEY = 'assignment-formatter-saves';
const COVER_FONT_DEFAULTS = {
  title: 24,
  studentName: 12,
  classGrade: 12,
  subject: 12,
  teacherName: 12,
  institutionName: 12,
  submissionDate: 12,
  rollId: 12,
};

const DEFAULT_SETTINGS = {
  pageSize: 'a4' as PageSize,
  marginPreset: 'normal' as MarginPreset,
  customMargins: { top: 20, right: 20, bottom: 20, left: 20 },
  lineSpacing: 1.5 as LineSpacing,
  paragraphSpacing: 8,
  textAlign: 'left' as TextAlign,
  fontFamily: FONT_FAMILIES[0].value,
  fontSize: 12,
  titleAlign: 'center' as TitleAlign,
  firstLineIndent: 0,
  headingSizes: { h1: 20, h2: 16, h3: 14 },
  headingWeight: 600,
  includeCover: false,
  coverStyle: 'minimal' as CoverStyle,
  coverFontSizes: COVER_FONT_DEFAULTS,
};

const ASSIGNMENT_TEMPLATE_FALLBACK = 'assignment-academic';

const loadSavedAssignments = (): SavedAssignment[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_ASSIGNMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAssignment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistSavedAssignments = (items: SavedAssignment[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SAVED_ASSIGNMENTS_KEY, JSON.stringify(items));
};

type SavedAssignment = {
  id: string;
  name: string;
  savedAt: string;
  payload: {
    contentHtml: string;
    includeCover: boolean;
    coverStyle: CoverStyle;
    coverFields: CoverFields;
    coverFontSizes: typeof COVER_FONT_DEFAULTS;
    pageSize: PageSize;
    marginPreset: MarginPreset;
    customMargins: MarginValues;
    lineSpacing: LineSpacing;
    paragraphSpacing: number;
    textAlign: TextAlign;
    fontFamily: string;
    fontSize: number;
    titleAlign: TitleAlign;
    firstLineIndent: number;
    headingSizes: { h1: number; h2: number; h3: number };
    headingWeight: number;
    proofEnabled: boolean;
    templateId: string;
  };
};

export default function AssignmentFormatterPage() {
  const [contentHtml, setContentHtml] = useState('');
  const [activePanel, setActivePanel] = useState<PanelView>('editor');
  const [previewScale, setPreviewScale] = useState(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Give more room to the preview by default
  const [splitPercent, setSplitPercent] = useState(32);
  const [includeCover, setIncludeCover] = useState(false);
  const [coverStyle, setCoverStyle] = useState<CoverStyle>('minimal');
  const [coverFields, setCoverFields] = useState<CoverFields>({
    title: '',
    studentName: '',
    classGrade: '',
    subject: '',
    teacherName: '',
    institutionName: '',
    submissionDate: '',
    rollId: '',
  });
  const [coverFontSizes, setCoverFontSizes] = useState(DEFAULT_SETTINGS.coverFontSizes);
  const [titleAlign, setTitleAlign] = useState<TitleAlign>(DEFAULT_SETTINGS.titleAlign);
  const [firstLineIndent, setFirstLineIndent] = useState(DEFAULT_SETTINGS.firstLineIndent);
  const [headingSizes, setHeadingSizes] = useState(DEFAULT_SETTINGS.headingSizes);
  const [headingWeight, setHeadingWeight] = useState(DEFAULT_SETTINGS.headingWeight);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [longImage, setLongImage] = useState(false);
  const [textColor, setTextColor] = useState('#111827');
  const [proofEnabled, setProofEnabled] = useState(false);
  const [proofMenu, setProofMenu] = useState<{
    id: string;
    word: string;
    suggestions: string[];
    x: number;
    y: number;
  } | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal');
  const [customMargins, setCustomMargins] = useState<MarginValues>({
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  });
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>(1.5);
  const [paragraphSpacing, setParagraphSpacing] = useState(8);
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
  const [fontSize, setFontSize] = useState(12);
  const [assignmentTemplates, setAssignmentTemplates] = useState<Array<Template & { id: string }>>(
    () => getTemplatesFor('assignment') as Array<Template & { id: string }>,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() =>
    assignmentTemplates[0]?.id ?? ASSIGNMENT_TEMPLATE_FALLBACK,
  );
  const templateParamAppliedRef = useRef(false);
  const searchParams = useSearchParams();
  const [savedAssignments, setSavedAssignments] = useState<SavedAssignment[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [bodyPages, setBodyPages] = useState<string[]>(['']);
  const isDraggingRef = useRef(false);
  const splitWrapRef = useRef<HTMLDivElement | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const previewPageRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedRef = useRef(false);
  const isProofingRef = useRef(false);
  const proofCounterRef = useRef(0);
  const proofTimeoutRef = useRef<number | null>(null);
  const lastHtmlRef = useRef<string>('');
  const isComposingRef = useRef(false);
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);
  const isUserInputRef = useRef(false);

  const marginValues = useMemo<MarginValues>(() => {
    if (marginPreset === 'custom') return customMargins;
    return MARGIN_PRESETS[marginPreset];
  }, [marginPreset, customMargins]);

  const pageDimensions = PAGE_SIZES[pageSize];
  const contentWidth = `calc(${pageDimensions.width} - ${marginValues.left}mm - ${marginValues.right}mm)`;
  const contentHeight = `calc(${pageDimensions.height} - ${marginValues.top}mm - ${marginValues.bottom}mm)`;

  // Preserve cursor position helper
  const saveCursorPosition = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const start = preCaretRange.toString().length;
    const end = start + range.toString().length;
    cursorPositionRef.current = { start, end };
  };

  const restoreCursorPosition = () => {
    if (!editorRef.current || !cursorPositionRef.current) return;
    const { start, end } = cursorPositionRef.current;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null,
    );
    let currentPos = 0;
    let startNode: Node | null = null;
    let endNode: Node | null = null;
    let startOffset = 0;
    let endOffset = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const nodeLength = node.textContent?.length || 0;
      if (!startNode && currentPos + nodeLength >= start) {
        startNode = node;
        startOffset = start - currentPos;
      }
      if (!endNode && currentPos + nodeLength >= end) {
        endNode = node;
        endOffset = end - currentPos;
        break;
      }
      currentPos += nodeLength;
    }

    if (startNode) {
      try {
        range.setStart(startNode, Math.min(startOffset, startNode.textContent?.length || 0));
        if (endNode) {
          range.setEnd(endNode, Math.min(endOffset, endNode.textContent?.length || 0));
        } else {
          range.setEnd(startNode, Math.min(startOffset, startNode.textContent?.length || 0));
        }
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        // Fallback: place cursor at end
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const isFocused = document.activeElement === editor;
    
    // Don't sync during composition or when user is actively typing
    if (isComposingRef.current) return;
    if (isFocused && lastHtmlRef.current === contentHtml) return;
    
    // Only sync if contentHtml changed externally (not from user input)
    if (editor.innerHTML !== contentHtml) {
      // Save cursor position before updating
      if (isFocused) {
        saveCursorPosition();
      }
      editor.innerHTML = contentHtml;
      // Ensure LTR direction is maintained after innerHTML update
      editor.setAttribute('dir', 'ltr');
      editor.style.direction = 'ltr';
      editor.style.unicodeBidi = 'plaintext';
      // Restore cursor position after update
      if (isFocused) {
        requestAnimationFrame(() => {
          restoreCursorPosition();
        });
      }
    }
    lastHtmlRef.current = contentHtml;
  }, [contentHtml]);

  useEffect(() => {
    const handleMove = (event: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const wrapper = splitWrapRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const clientX =
        event instanceof TouchEvent ? event.touches[0]?.clientX : event.clientX;
      if (clientX == null) return;
      if (event instanceof TouchEvent) {
        event.preventDefault();
      }
      const nextPercent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(60, Math.max(30, Math.round(nextPercent)));
      setSplitPercent(clamped);
    };
    const handleUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      hasLoadedRef.current = true;
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setContentHtml(parsed.contentHtml ?? '');
      setIncludeCover(Boolean(parsed.includeCover));
      setCoverStyle(parsed.coverStyle ?? 'minimal');
      setCoverFields((prev) => ({ ...prev, ...(parsed.coverFields ?? {}) }));
      setCoverFontSizes(parsed.coverFontSizes ?? DEFAULT_SETTINGS.coverFontSizes);
      setPageSize(parsed.pageSize ?? DEFAULT_SETTINGS.pageSize);
      setMarginPreset(parsed.marginPreset ?? DEFAULT_SETTINGS.marginPreset);
      setCustomMargins(parsed.customMargins ?? DEFAULT_SETTINGS.customMargins);
      setLineSpacing(parsed.lineSpacing ?? DEFAULT_SETTINGS.lineSpacing);
      setParagraphSpacing(parsed.paragraphSpacing ?? DEFAULT_SETTINGS.paragraphSpacing);
      setTextAlign(parsed.textAlign ?? DEFAULT_SETTINGS.textAlign);
      setFontFamily(parsed.fontFamily ?? DEFAULT_SETTINGS.fontFamily);
      setFontSize(parsed.fontSize ?? DEFAULT_SETTINGS.fontSize);
      setTitleAlign(parsed.titleAlign ?? DEFAULT_SETTINGS.titleAlign);
      setFirstLineIndent(parsed.firstLineIndent ?? DEFAULT_SETTINGS.firstLineIndent);
      setHeadingSizes(parsed.headingSizes ?? DEFAULT_SETTINGS.headingSizes);
      setHeadingWeight(parsed.headingWeight ?? DEFAULT_SETTINGS.headingWeight);
      setProofEnabled(Boolean(parsed.proofEnabled));
      setSelectedTemplateId(
        parsed.templateId ?? assignmentTemplates[0]?.id ?? ASSIGNMENT_TEMPLATE_FALLBACK,
      );
    } catch {
      // Ignore malformed saved data.
    } finally {
      hasLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    setSavedAssignments(loadSavedAssignments());
  }, []);

  useEffect(() => {
    const handler = () => {
      setAssignmentTemplates(getTemplatesFor('assignment') as Array<Template & { id: string }>);
    };
    window.addEventListener('storage', handler);
    window.addEventListener('templates-registry-updated', handler as EventListener);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('templates-registry-updated', handler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      const payload = {
        contentHtml,
        includeCover,
        coverStyle,
        coverFields,
        coverFontSizes,
        pageSize,
        marginPreset,
        customMargins,
        lineSpacing,
        paragraphSpacing,
        textAlign,
        fontFamily,
        fontSize,
        titleAlign,
        firstLineIndent,
        headingSizes,
        headingWeight,
        proofEnabled,
        templateId: selectedTemplateId,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    contentHtml,
    includeCover,
    coverStyle,
    coverFields,
    coverFontSizes,
    pageSize,
    marginPreset,
    customMargins,
    lineSpacing,
    paragraphSpacing,
    textAlign,
    fontFamily,
    fontSize,
    selectedTemplateId,
    titleAlign,
    firstLineIndent,
    headingSizes,
    headingWeight,
    proofEnabled,
  ]);

  const handleEditorInput = () => {
    if (!editorRef.current || isComposingRef.current) return;
    const nextHtml = editorRef.current.innerHTML;
    // Mark this as user input to prevent unnecessary sync back
    isUserInputRef.current = true;
    setContentHtml(nextHtml);
    // Only schedule proofing if enabled and user is not actively typing
    // Proofing will be applied when user pauses or clicks "Check now"
    if (proofEnabled && !isProofingRef.current) {
      scheduleProofing();
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionUpdate = () => {
    // Keep composition flag true during updates
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    // Sync content after composition ends
    if (editorRef.current) {
      const nextHtml = editorRef.current.innerHTML;
      isUserInputRef.current = true;
      setContentHtml(nextHtml);
    }
  };

  const handleEditorContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!proofEnabled) return;
    const target = event.target as HTMLElement | null;
    const proofTarget = target?.closest('[data-proof-id]') as HTMLElement | null;
    if (!proofTarget || !proofTarget.dataset.suggestions) {
      setProofMenu(null);
      return;
    }
    const suggestions = proofTarget.dataset.suggestions
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean);
    if (suggestions.length === 0) {
      return;
    }
    event.preventDefault();
    setProofMenu({
      id: proofTarget.dataset.proofId || '',
      word: proofTarget.dataset.proofWord || proofTarget.textContent || '',
      suggestions,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['txt', 'md', 'html'].includes(extension)) {
      setUploadError('Please upload a .txt, .md, or .html file.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const nextHtml = extension === 'html' ? result : plainTextToHtml(result || '');
      setContentHtml(nextHtml);
      setNotice('File uploaded. Formatting applied.');
      window.setTimeout(() => setNotice(null), 2200);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the file. Please try again.');
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const applyFormat = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
      restoreCursorPosition();
    }
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const saveSelectionBeforeFormat = () => {
    if (document.activeElement === editorRef.current) {
      saveCursorPosition();
    }
  };

  const paginateContent = () => {
    const measure = measureRef.current;
    if (!measure) return;
    const html = contentHtml || '';
    const fragment = document.createElement('div');
    fragment.innerHTML = html;
    const nodes = Array.from(fragment.childNodes);

    if (nodes.length === 0) {
      setBodyPages(['']);
      return;
    }

    measure.innerHTML = '';
    const pages: string[] = [];
    let pageContainer = document.createElement('div');
    measure.appendChild(pageContainer);

    nodes.forEach((node) => {
      if (
        node instanceof HTMLElement &&
        (node.dataset.pageBreak === 'true' || node.classList.contains('assignment-page-break'))
      ) {
        if (pageContainer.innerHTML.trim()) {
          pages.push(pageContainer.innerHTML);
        } else {
          pages.push('');
        }
        pageContainer = document.createElement('div');
        measure.innerHTML = '';
        measure.appendChild(pageContainer);
        return;
      }
      pageContainer.appendChild(node);
      if (pageContainer.scrollHeight > measure.clientHeight + 1) {
        pageContainer.removeChild(node);
        pages.push(pageContainer.innerHTML);
        pageContainer = document.createElement('div');
        measure.innerHTML = '';
        measure.appendChild(pageContainer);
        pageContainer.appendChild(node);
      }
    });

    pages.push(pageContainer.innerHTML);
    setBodyPages(pages);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => paginateContent());
    return () => cancelAnimationFrame(frame);
  }, [
    contentHtml,
    pageSize,
    marginPreset,
    customMargins,
    lineSpacing,
    paragraphSpacing,
    textAlign,
    fontFamily,
    fontSize,
  ]);

  useEffect(() => {
    const updateScale = () => {
      const wrap = previewWrapRef.current;
      const page = previewPageRef.current;
      if (!wrap || !page) return;
      const wrapWidth = wrap.clientWidth;
      const pageWidth = page.offsetWidth || wrapWidth;
      const nextScale = wrapWidth < pageWidth ? wrapWidth / pageWidth : 1;
      setPreviewScale(Number.isFinite(nextScale) ? nextScale : 1);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (previewWrapRef.current) observer.observe(previewWrapRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [pageSize, marginPreset, customMargins, includeCover, bodyPages.length]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (proofEnabled) {
      applyProofingToEditor();
      return;
    }
    const stripped = stripProofingHtml(editorRef.current.innerHTML);
    if (editorRef.current.innerHTML !== stripped) {
      editorRef.current.innerHTML = stripped;
      handleEditorInput();
    }
  }, [proofEnabled]);

  useEffect(() => {
    if (!proofMenu) return;
    const handleClick = () => setProofMenu(null);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProofMenu(null);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [proofMenu]);

  const handleCoverFieldChange = (field: keyof typeof coverFields, value: string) => {
    setCoverFields((prev) => ({ ...prev, [field]: value }));
  };

  const escapeHtml = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const normalizeLine = (line: string) => line.replace(/\s+/g, ' ').trim();

  const plainTextToHtml = (text: string) => {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const blocks: string[] = [];
    let buffer: string[] = [];
    const flush = () => {
      if (buffer.length === 0) return;
      const paragraph = buffer.join(' ').trim();
      if (paragraph) {
        blocks.push(`<p>${escapeHtml(paragraph)}</p>`);
      }
      buffer = [];
    };
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flush();
      } else {
        buffer.push(trimmed);
      }
    });
    flush();
    return blocks.join('');
  };

  const COMMON_WORDS = useMemo(
    () =>
      new Set([
        'a',
        'about',
        'after',
        'all',
        'also',
        'an',
        'and',
        'are',
        'as',
        'at',
        'be',
        'because',
        'been',
        'before',
        'but',
        'by',
        'can',
        'class',
        'content',
        'course',
        'date',
        'do',
        'does',
        'document',
        'each',
        'education',
        'for',
        'from',
        'good',
        'grade',
        'had',
        'has',
        'have',
        'he',
        'her',
        'his',
        'how',
        'i',
        'in',
        'is',
        'it',
        'its',
        'knowledge',
        'lab',
        'learning',
        'lesson',
        'literature',
        'me',
        'more',
        'my',
        'name',
        'new',
        'no',
        'not',
        'of',
        'on',
        'one',
        'or',
        'our',
        'paper',
        'project',
        'report',
        'research',
        'school',
        'she',
        'should',
        'so',
        'subject',
        'student',
        'study',
        'submission',
        'teacher',
        'that',
        'the',
        'their',
        'them',
        'then',
        'there',
        'these',
        'they',
        'this',
        'title',
        'to',
        'topic',
        'we',
        'were',
        'what',
        'when',
        'where',
        'which',
        'with',
        'work',
        'you',
        'your',
      ]),
    [],
  );

  const getSuggestions = (word: string) => {
    const lower = word.toLowerCase();
    const score = (a: string, b: string) => {
      const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
      for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
      for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
      for (let i = 1; i <= a.length; i += 1) {
        for (let j = 1; j <= b.length; j += 1) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost,
          );
        }
      }
      return dp[a.length][b.length];
    };
    const candidates = Array.from(COMMON_WORDS).filter(
      (candidate) => candidate[0] === lower[0] && Math.abs(candidate.length - lower.length) <= 2,
    );
    return candidates
      .map((candidate) => ({ candidate, dist: score(lower, candidate) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .map((item) => item.candidate);
  };

  const isAllCapsHeading = (line: string) => {
    const letters = line.replace(/[^A-Za-z]/g, '');
    return letters.length > 2 && letters === letters.toUpperCase();
  };

  const isNumberedHeading = (line: string) =>
    /^(\d+(\.\d+)*|[IVXLCDM]+|[A-Z])\./i.test(line);

  const isBulletLine = (line: string) => /^[-*•]\s+/.test(line);

  const isNumberedLine = (line: string) => /^(\d+\.|[a-z]\.|[ivxlcdm]+\.)\s+/i.test(line);

  const autoFormatContent = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const rawText = editor.innerText.replace(/\r\n/g, '\n');
    const lines = rawText.split('\n');
    const blocks: string[][] = [];
    let current: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.replace(/\s+$/g, '');
      if (trimmed === '') {
        if (current.length) {
          blocks.push(current);
          current = [];
        }
      } else {
        current.push(trimmed);
      }
    });
    if (current.length) blocks.push(current);

    const htmlBlocks: string[] = [];

    blocks.forEach((block) => {
      const normalizedLines = block.map(normalizeLine).filter(Boolean);
      if (normalizedLines.length === 0) return;

      const singleLine = normalizedLines.length === 1 ? normalizedLines[0] : '';
      const wordCount = singleLine ? singleLine.split(' ').length : 0;

      if (singleLine && isAllCapsHeading(singleLine)) {
        htmlBlocks.push(`<h1>${escapeHtml(singleLine)}</h1>`);
        return;
      }
      if (singleLine && singleLine.endsWith(':')) {
        htmlBlocks.push(`<h2>${escapeHtml(singleLine)}</h2>`);
        return;
      }
      if (singleLine && wordCount < 8) {
        htmlBlocks.push(`<h1>${escapeHtml(singleLine)}</h1>`);
        return;
      }
      if (singleLine && isNumberedHeading(singleLine)) {
        htmlBlocks.push(`<h3>${escapeHtml(singleLine)}</h3>`);
        return;
      }

      const bulletLines = normalizedLines.filter((line) => isBulletLine(line));
      const numberLines = normalizedLines.filter((line) => isNumberedLine(line));

      if (bulletLines.length === normalizedLines.length) {
        const items = normalizedLines
          .map((line) => line.replace(/^[-*•]\s+/, ''))
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join('');
        htmlBlocks.push(`<ul>${items}</ul>`);
        return;
      }
      if (numberLines.length === normalizedLines.length) {
        const items = normalizedLines
          .map((line) => line.replace(/^(\d+\.|[a-z]\.|[ivxlcdm]+\.)\s+/i, ''))
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join('');
        htmlBlocks.push(`<ol>${items}</ol>`);
        return;
      }

      const paragraph = normalizedLines.join(' ');
      htmlBlocks.push(`<p>${escapeHtml(paragraph)}</p>`);
    });

    const formattedHtml = htmlBlocks.join('');
    editor.focus();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(editor);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('insertHTML', false, formattedHtml);
      selection.removeAllRanges();
    } else {
      editor.innerHTML = formattedHtml;
    }
    handleEditorInput();
    setNotice('Auto-format applied. Use Ctrl+Z to undo.');
    window.setTimeout(() => setNotice(null), 2200);
  };

  const insertPageBreak = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(
      'insertHTML',
      false,
      '<div data-page-break="true" class="assignment-page-break"></div><p></p>',
    );
    handleEditorInput();
    window.requestAnimationFrame(() => {
      editor.scrollTo({ top: editor.scrollHeight, behavior: 'smooth' });
      previewWrapRef.current?.scrollTo({
        top: previewWrapRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  };

  const removeLastPageBreak = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const shouldDelete = window.confirm('Delete the last page? This cannot be undone.');
    if (!shouldDelete) return;
    const container = document.createElement('div');
    container.innerHTML = editor.innerHTML;
    const breaks = Array.from(container.querySelectorAll('[data-page-break="true"]'));
    const lastBreak = breaks[breaks.length - 1];
    if (!lastBreak) return;
    const next = lastBreak.nextSibling;
    if (next && next.nodeType === Node.ELEMENT_NODE) {
      const element = next as HTMLElement;
      if (element.tagName === 'P' && element.textContent?.trim() === '') {
        element.remove();
      }
    }
    lastBreak.remove();
    editor.innerHTML = container.innerHTML;
    handleEditorInput();
  };

  const stripProofingHtml = (html: string) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    container.querySelectorAll('[data-proof]').forEach((node) => {
      node.replaceWith(document.createTextNode(node.textContent || ''));
    });
    return container.innerHTML;
  };

  const applyProofingToEditor = () => {
    if (!proofEnabled || !editorRef.current || isProofingRef.current || isComposingRef.current) return;
    isProofingRef.current = true;
    const editor = editorRef.current;
    const wasFocused = document.activeElement === editor;
    
    // Save cursor position before proofing
    if (wasFocused) {
      saveCursorPosition();
    }
    
    const baseHtml = stripProofingHtml(editor.innerHTML);
    const container = document.createElement('div');
    container.innerHTML = baseHtml;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    textNodes.forEach((node) => {
      const text = node.nodeValue || '';
      if (!text.trim()) return;
      const parts = text.split(/(\b[^\s]+\b)/);
      let prevWord = '';
      let startSentence = true;
      let extraSpaceFlag = false;
      const fragment = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (!/\b[^\s]+\b/.test(part)) {
          if (/\s{2,}/.test(part)) {
            extraSpaceFlag = true;
          }
          fragment.appendChild(document.createTextNode(part));
          if (/[.!?]\s*$/.test(part)) {
            startSentence = true;
          }
          return;
        }
        const cleaned = part.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '');
        const lower = cleaned.toLowerCase();
        const isWord = cleaned.length >= 1;
        let errorReason = '';
        if (
          isWord &&
          cleaned.length >= 3 &&
          !COMMON_WORDS.has(lower) &&
          !/^\d+$/.test(cleaned) &&
          !isAllCapsHeading(cleaned)
        ) {
          errorReason = 'Possible misspelling';
        }
        if (prevWord && lower === prevWord) {
          errorReason = 'Repeated word';
        }
        if (startSentence && /^[a-z]/.test(cleaned)) {
          errorReason = 'Sentence should start with a capital letter';
        }
        if (extraSpaceFlag) {
          errorReason = 'Extra spaces';
          extraSpaceFlag = false;
        }

        const suggestions = cleaned ? getSuggestions(cleaned) : [];
        if (errorReason) {
          const span = document.createElement('span');
          const proofId = `proof-${proofCounterRef.current++}`;
          span.dataset.proof = 'true';
          span.dataset.proofId = proofId;
          span.dataset.proofWord = cleaned || part;
          span.dataset.suggestions = suggestions.join('|');
          span.className = 'assignment-proof';
          span.title = suggestions.length
            ? `${errorReason}. Suggestions: ${suggestions.join(', ')}`
            : errorReason;
          span.appendChild(document.createTextNode(part));
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }

        if (cleaned) {
          prevWord = lower;
        }
        if (/[.!?]$/.test(part)) {
          startSentence = true;
        } else {
          startSentence = false;
        }
      });
      node.replaceWith(fragment);
    });

    editor.innerHTML = container.innerHTML;
    // Ensure LTR direction is maintained
    editor.setAttribute('dir', 'ltr');
    editor.style.direction = 'ltr';
    editor.style.unicodeBidi = 'plaintext';
    
    // Restore cursor position after proofing
    if (wasFocused) {
      requestAnimationFrame(() => {
        restoreCursorPosition();
        editor.focus();
      });
    }
    
    // Update state without triggering another sync (since we just set innerHTML)
    setContentHtml(container.innerHTML);
    lastHtmlRef.current = container.innerHTML;
    isProofingRef.current = false;
  };

  const scheduleProofing = () => {
    // Don't schedule proofing during composition
    if (isComposingRef.current) return;
    if (proofTimeoutRef.current) window.clearTimeout(proofTimeoutRef.current);
    // Increased delay to avoid interfering with active typing
    proofTimeoutRef.current = window.setTimeout(() => {
      // Double-check composition state before applying
      if (!isComposingRef.current) {
        applyProofingToEditor();
      }
    }, 2000);
  };

  const handleProofMenuSelect = (replacement: string) => {
    if (!editorRef.current || !proofMenu) return;
    const target = editorRef.current.querySelector(
      `[data-proof-id="${proofMenu.id}"]`,
    ) as HTMLSpanElement | null;
    if (!target) {
      setProofMenu(null);
      return;
    }
    target.replaceWith(document.createTextNode(replacement));
    handleEditorInput();
    setProofMenu(null);
    if (proofEnabled) {
      scheduleProofing();
    }
  };

  const applyAssignmentTemplate = (templateId: string) => {
    const template = assignmentTemplates.find((item) => item.id === templateId);
    if (!template) return;

    const layout = (template.rules.layout || {}) as {
      pageSize?: PageSize;
      marginPreset?: MarginPreset;
      includeCover?: boolean;
      coverStyle?: CoverStyle;
      titleAlign?: TitleAlign;
      textAlign?: TextAlign;
    };
    const fonts = (template.rules.fonts || {}) as {
      fontFamily?: string;
      fontSize?: number;
      headingSizes?: typeof headingSizes;
      headingWeight?: number;
    };
    const spacing = (template.rules.spacing || {}) as {
      lineSpacing?: LineSpacing;
      paragraphSpacing?: number;
      firstLineIndent?: number;
    };
    const colors = template.rules.colors || {};

    if (layout.pageSize && PAGE_SIZES[layout.pageSize as PageSize]) {
      setPageSize(layout.pageSize as PageSize);
    }
    if (layout.marginPreset) {
      setMarginPreset(layout.marginPreset as MarginPreset);
    }
    if (layout.textAlign) {
      setTextAlign(layout.textAlign as TextAlign);
    }
    if (layout.titleAlign) {
      setTitleAlign(layout.titleAlign as TitleAlign);
    }
    if (layout.includeCover !== undefined) {
      setIncludeCover(layout.includeCover);
    }
    if (layout.coverStyle) {
      setCoverStyle(layout.coverStyle as CoverStyle);
    }

    if (spacing.lineSpacing) {
      setLineSpacing(spacing.lineSpacing as LineSpacing);
    }
    if (spacing.paragraphSpacing != null) {
      setParagraphSpacing(spacing.paragraphSpacing);
    }
    if (spacing.firstLineIndent != null) {
      setFirstLineIndent(spacing.firstLineIndent);
    }

    if (fonts.fontFamily) {
      setFontFamily(fonts.fontFamily);
    }
    if (fonts.fontSize) {
      setFontSize(fonts.fontSize);
    }
    if (fonts.headingSizes) {
      setHeadingSizes(fonts.headingSizes);
    }
    if (fonts.headingWeight) {
      setHeadingWeight(fonts.headingWeight);
    }

    if (colors.text) {
      setTextColor(colors.text);
    }

    setSelectedTemplateId(template.id);
  };

  const resetAfterAction = () => {
    resetToDefault();
    setContentHtml('');
    setBodyPages(['']);
    setCoverFields({
      title: '',
      studentName: '',
      classGrade: '',
      subject: '',
      teacherName: '',
      institutionName: '',
      submissionDate: '',
      rollId: '',
    });
    setSelectedSavedId(null);
  };

  const handleSaveAssignment = () => {
    const name = window.prompt('Enter assignment name', 'Untitled Assignment')?.trim();
    if (!name) return;
    const payload: SavedAssignment['payload'] = {
      contentHtml,
      includeCover,
      coverStyle,
      coverFields,
      coverFontSizes,
      pageSize,
      marginPreset,
      customMargins,
      lineSpacing,
      paragraphSpacing,
      textAlign,
      fontFamily,
      fontSize,
      titleAlign,
      firstLineIndent,
      headingSizes,
      headingWeight,
      proofEnabled,
      templateId: selectedTemplateId,
    };

    const saved: SavedAssignment = {
      id: crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      payload,
    };
    const next = [saved, ...savedAssignments];
    setSavedAssignments(next);
    persistSavedAssignments(next);
    setSelectedSavedId(saved.id);
    resetAfterAction();
  };

  const handleLoadAssignment = (id: string) => {
    const item = savedAssignments.find((entry) => entry.id === id);
    if (!item) return;
    const p = item.payload;
    setContentHtml(p.contentHtml);
    setIncludeCover(p.includeCover);
    setCoverStyle(p.coverStyle);
    setCoverFields(p.coverFields);
    setCoverFontSizes(p.coverFontSizes);
    setPageSize(p.pageSize);
    setMarginPreset(p.marginPreset);
    setCustomMargins(p.customMargins);
    setLineSpacing(p.lineSpacing);
    setParagraphSpacing(p.paragraphSpacing);
    setTextAlign(p.textAlign);
    setFontFamily(p.fontFamily);
    setFontSize(p.fontSize);
    setTitleAlign(p.titleAlign);
    setFirstLineIndent(p.firstLineIndent);
    setHeadingSizes(p.headingSizes);
    setHeadingWeight(p.headingWeight);
    setProofEnabled(p.proofEnabled);
    applyAssignmentTemplate(p.templateId);
    setSelectedSavedId(id);
  };

  const handleDeleteAssignment = (id: string) => {
    const next = savedAssignments.filter((item) => item.id !== id);
    setSavedAssignments(next);
    persistSavedAssignments(next);
    if (selectedSavedId === id) {
      setSelectedSavedId(null);
    }
  };

  useEffect(() => {
    if (templateParamAppliedRef.current) return;
    const templateId = searchParams.get('templateId');
    if (!templateId) return;
    const exists = assignmentTemplates.some((template) => template.id === templateId);
    if (!exists) return;
    applyAssignmentTemplate(templateId);
    setSelectedTemplateId(templateId);
    templateParamAppliedRef.current = true;
  }, [searchParams, assignmentTemplates]);

  const resetToDefault = () => {
    if (!window.confirm('Reset formatting to default? This will not erase content.')) return;
    setPageSize(DEFAULT_SETTINGS.pageSize);
    setMarginPreset(DEFAULT_SETTINGS.marginPreset);
    setCustomMargins(DEFAULT_SETTINGS.customMargins);
    setLineSpacing(DEFAULT_SETTINGS.lineSpacing);
    setParagraphSpacing(DEFAULT_SETTINGS.paragraphSpacing);
    setTextAlign(DEFAULT_SETTINGS.textAlign);
    setFontFamily(DEFAULT_SETTINGS.fontFamily);
    setFontSize(DEFAULT_SETTINGS.fontSize);
    setTitleAlign(DEFAULT_SETTINGS.titleAlign);
    setFirstLineIndent(DEFAULT_SETTINGS.firstLineIndent);
    setHeadingSizes(DEFAULT_SETTINGS.headingSizes);
    setHeadingWeight(DEFAULT_SETTINGS.headingWeight);
    setIncludeCover(DEFAULT_SETTINGS.includeCover);
    setCoverStyle(DEFAULT_SETTINGS.coverStyle);
    setCoverFontSizes(DEFAULT_SETTINGS.coverFontSizes);
    setProofEnabled(false);
    setSelectedTemplateId(assignmentTemplates[0]?.id ?? ASSIGNMENT_TEMPLATE_FALLBACK);
  };

  const getExportFilename = () => {
    const raw = (coverFields.title || 'assignment').trim();
    const safe = raw.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
    return safe || 'assignment';
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  const waitForExportAssets = async (root: HTMLElement) => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) {
      await fonts.ready;
    }
    const images = Array.from(root.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const handleDone = () => resolve();
          img.addEventListener('load', handleDone, { once: true });
          img.addEventListener('error', handleDone, { once: true });
        });
      }),
    );
  };

  const handleExportPdf = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      await exportMultiPagePdf({
        exportRef: exportRef.current,
        pageSelector: '[data-export-page]',
        filename: `${getExportFilename()}.pdf`,
        pageSize: PAGE_SIZES_MM[pageSize],
        debug: { label: 'Assignment Export' },
      });
      resetAfterAction();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImages = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (!exportRef.current) throw new Error('Export container not ready.');
      if (longImage) {
        await waitForExportAssets(exportRef.current);
        const rect = exportRef.current.getBoundingClientRect();
        const canvas = await html2canvas(exportRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: Math.ceil(rect.width),
          windowHeight: Math.ceil(rect.height),
          scrollX: 0,
          scrollY: 0,
        });
        const dataUrl = canvas.toDataURL(`image/${imageFormat}`, 0.95);
        downloadDataUrl(dataUrl, `${getExportFilename()}.${imageFormat}`);
        return;
      }
      await exportMultiPageImages({
        exportRef: exportRef.current,
        pageSelector: '[data-export-page]',
        filename: getExportFilename(),
        format: imageFormat,
        pageSize: PAGE_SIZES_MM[pageSize],
        debug: { label: 'Assignment Export' },
      });
      resetAfterAction();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      await printMultiPage({
        exportRef: exportRef.current,
        pageSelector: '[data-export-page]',
        title: getExportFilename(),
        pageSize: PAGE_SIZES_MM[pageSize],
        extraStyles: `
          body { font-family: ${fontFamily}; }
          .assignment-preview-content p { margin: 0 0 ${paragraphSpacing}px 0; text-indent: ${firstLineIndent}px; }
          .assignment-preview-content h1 { font-size: ${headingSizes.h1}px; font-weight: ${headingWeight}; text-align: ${titleAlign}; margin: 0 0 ${paragraphSpacing}px 0; }
          .assignment-preview-content h2 { font-size: ${headingSizes.h2}px; font-weight: ${headingWeight}; margin: 0 0 ${paragraphSpacing}px 0; }
          .assignment-preview-content h3 { font-size: ${headingSizes.h3}px; font-weight: ${headingWeight}; margin: 0 0 ${paragraphSpacing}px 0; }
        `,
      });
      resetAfterAction();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Print failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 px-3 sm:px-4 py-4 sm:py-6 pb-24 dark:bg-slate-950 md:pb-6 overflow-x-hidden max-w-full">
      <style>{`
        .assignment-editor p,
        .assignment-preview-content p {
          margin: 0 0 ${paragraphSpacing}px 0;
          text-indent: ${firstLineIndent}px;
        }
        .assignment-editor .assignment-page-break {
          border-top: 2px dashed #e5e7eb;
          margin: 16px 0;
        }
        .assignment-proof {
          text-decoration: underline wavy #ef4444;
          text-underline-offset: 2px;
        }
        .assignment-editor h1,
        .assignment-preview-content h1 {
          font-size: ${headingSizes.h1}px;
          font-weight: ${headingWeight};
          text-align: ${titleAlign};
          margin: 0 0 ${paragraphSpacing}px 0;
        }
        .assignment-editor h2,
        .assignment-preview-content h2 {
          font-size: ${headingSizes.h2}px;
          font-weight: ${headingWeight};
          margin: 0 0 ${paragraphSpacing}px 0;
        }
        .assignment-editor h3,
        .assignment-preview-content h3 {
          font-size: ${headingSizes.h3}px;
          font-weight: ${headingWeight};
          margin: 0 0 ${paragraphSpacing}px 0;
        }
        .assignment-preview-page {
          page-break-after: always;
          break-after: page;
        }
        .assignment-preview-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .assignment-cover-formal h2 {
          border-bottom: 1px solid #111827;
          padding-bottom: 6px;
        }
        .assignment-cover-modern .cover-divider {
          height: 1px;
          width: 120px;
          background: #d1d5db;
        }
        @media print {
          body { margin: 0; }
          .assignment-editor-panel { display: none; }
          .assignment-preview-panel { width: 100%; }
          .assignment-preview-page {
            box-shadow: none !important;
            border: 1px solid #e5e7eb;
          }
        }
      `}</style>
      <div className="mx-auto w-full max-w-6xl md:hidden">
        <div
          role="tablist"
          aria-label="Editor and preview tabs"
          className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activePanel === 'editor'}
            onClick={() => setActivePanel('editor')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
              activePanel === 'editor'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activePanel === 'preview'}
            onClick={() => setActivePanel('preview')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
              activePanel === 'preview'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <div
        ref={splitWrapRef}
        className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-6 md:flex-row min-w-0"
      >
        <aside
          className={`assignment-editor-panel w-full md:flex-none ${
            activePanel === 'editor' ? 'block' : 'hidden md:block'
          }`}
          style={{ flexBasis: `${splitPercent}%` }}
        >
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Assignment Formatter
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
              Format your assignment with consistent page rules.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              {saveStatus === 'saving' && <span>Saving…</span>}
              {saveStatus === 'saved' && <span>Saved</span>}
            </div>

            <div className="mt-4 grid gap-4">
              <fieldset className="grid gap-3">
                <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Template
                </legend>
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Choose template
                  <select
                    value={selectedTemplateId}
                    onChange={(event) => applyAssignmentTemplate(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Select assignment template"
                  >
                    {assignmentTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    Layout, margins, fonts, and spacing apply instantly without changing your content.
                  </p>
                </label>
                <button
                  type="button"
                  onClick={resetToDefault}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Reset to default formatting"
                  title="Reset to default formatting"
                >
                  Reset to default
                </button>
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Saved assignments
                </legend>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAssignment}
                    className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    Save current
                  </button>
                  <button
                    type="button"
                    onClick={resetAfterAction}
                    className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    Reset
                  </button>
                </div>
                {savedAssignments.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    No saved assignments yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {savedAssignments.map((item) => {
                      const isActive = selectedSavedId === item.id;
                      return (
                        <li
                          key={item.id}
                          className={`rounded-lg border px-3 py-2 text-sm transition ${
                            isActive
                              ? 'border-gray-300 bg-gray-100 dark:border-slate-600 dark:bg-slate-800'
                              : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate font-medium text-gray-900 dark:text-slate-100">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-slate-400">
                                {new Date(item.savedAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleLoadAssignment(item.id)}
                                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              >
                                Load
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAssignment(item.id)}
                                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:border-slate-700 dark:bg-slate-900 dark:text-red-400"
                                aria-label={`Delete ${item.name}`}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Upload
                </legend>
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Upload assignment file
                  <input
                    type="file"
                    accept=".txt,.md,.html"
                    onChange={handleFileUpload}
                    className="mt-2 block w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:file:bg-slate-700 dark:file:text-slate-100"
                    aria-label="Upload assignment file"
                  />
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Supports .txt, .md, and .html files.
                </p>
                {uploadError && (
                  <p className="text-xs text-red-500" role="alert">
                    {uploadError}
                  </p>
                )}
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Layout
                </legend>
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Panel split ({splitPercent}% editor)
                  <input
                    type="range"
                    min={20}
                    max={55}
                    value={splitPercent}
                    onChange={(event) => setSplitPercent(Number(event.target.value))}
                    className="mt-2 w-full"
                    aria-label="Adjust editor and preview split"
                  />
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-400 md:hidden">
                  Use tabs above to switch between editor and preview.
                </p>
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Cover Page
                </legend>
                <label className="flex items-center justify-between gap-2 text-sm text-gray-700 dark:text-slate-200">
                  <span>Include Cover Page</span>
                  <input
                    type="checkbox"
                    checked={includeCover}
                    onChange={(event) => setIncludeCover(event.target.checked)}
                    aria-label="Include cover page"
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                  />
                </label>
                {includeCover && (
                  <div className="grid gap-3">
                    <label className="text-sm text-gray-700 dark:text-slate-200">
                      Cover style
                      <select
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        value={coverStyle}
                        onChange={(event) => setCoverStyle(event.target.value as CoverStyle)}
                        aria-label="Select cover page style"
                      >
                        <option value="minimal">Minimal</option>
                        <option value="formal">Formal</option>
                        <option value="modern">Modern</option>
                      </select>
                    </label>
                    <label className="text-sm text-gray-700 dark:text-slate-200">
                      Assignment title
                      <input
                        type="text"
                        value={coverFields.title}
                        onChange={(event) => handleCoverFieldChange('title', event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        aria-label="Assignment title"
                        required
                      />
                      <input
                        type="range"
                        min={18}
                        max={36}
                        value={coverFontSizes.title}
                        onChange={(event) =>
                          setCoverFontSizes((prev) => ({
                            ...prev,
                            title: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full"
                        aria-label="Cover title font size"
                      />
                    </label>
                    <label className="text-sm text-gray-700 dark:text-slate-200">
                      Student name
                      <input
                        type="text"
                        value={coverFields.studentName}
                        onChange={(event) => handleCoverFieldChange('studentName', event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        aria-label="Student name"
                      />
                      <input
                        type="range"
                        min={10}
                        max={24}
                        value={coverFontSizes.studentName}
                        onChange={(event) =>
                          setCoverFontSizes((prev) => ({
                            ...prev,
                            studentName: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full"
                        aria-label="Student name font size"
                      />
                    </label>
                    <label className="text-sm text-gray-700 dark:text-slate-200">
                      Class / Grade
                      <input
                        type="text"
                        value={coverFields.classGrade}
                        onChange={(event) => handleCoverFieldChange('classGrade', event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        aria-label="Class or grade"
                      />
                      <input
                        type="range"
                        min={10}
                        max={24}
                        value={coverFontSizes.classGrade}
                        onChange={(event) =>
                          setCoverFontSizes((prev) => ({
                            ...prev,
                            classGrade: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full"
                        aria-label="Class or grade font size"
                      />
                    </label>
                    <label className="text-sm text-gray-700 dark:text-slate-200">
                      Subject
                      <input
                        type="text"
                        value={coverFields.subject}
                        onChange={(event) => handleCoverFieldChange('subject', event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        aria-label="Subject"
                      />
                      <input
                        type="range"
                        min={10}
                        max={24}
                        value={coverFontSizes.subject}
                        onChange={(event) =>
                          setCoverFontSizes((prev) => ({
                            ...prev,
                            subject: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full"
                        aria-label="Subject font size"
                      />
                    </label>
                    <label className="text-sm text-gray-700 dark:text-slate-200">
                      Teacher name
                      <input
                        type="text"
                        value={coverFields.teacherName}
                        onChange={(event) => handleCoverFieldChange('teacherName', event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        aria-label="Teacher name"
                      />
                      <input
                        type="range"
                        min={10}
                        max={24}
                        value={coverFontSizes.teacherName}
                        onChange={(event) =>
                          setCoverFontSizes((prev) => ({
                            ...prev,
                            teacherName: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full"
                        aria-label="Teacher name font size"
                      />
                    </label>
                    <label className="text-sm text-gray-700 dark:text-slate-200">
                      Institution name (optional)
                      <input
                        type="text"
                        value={coverFields.institutionName}
                        onChange={(event) => handleCoverFieldChange('institutionName', event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        aria-label="Institution name"
                      />
                      <input
                        type="range"
                        min={10}
                        max={24}
                        value={coverFontSizes.institutionName}
                        onChange={(event) =>
                          setCoverFontSizes((prev) => ({
                            ...prev,
                            institutionName: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full"
                        aria-label="Institution name font size"
                      />
                    </label>
                    <label className="text-sm text-gray-700 dark:text-slate-200">
                      Submission date
                      <input
                        type="date"
                        value={coverFields.submissionDate}
                        onChange={(event) => handleCoverFieldChange('submissionDate', event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        aria-label="Submission date"
                      />
                      <input
                        type="range"
                        min={10}
                        max={24}
                        value={coverFontSizes.submissionDate}
                        onChange={(event) =>
                          setCoverFontSizes((prev) => ({
                            ...prev,
                            submissionDate: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full"
                        aria-label="Submission date font size"
                      />
                    </label>
                    <label className="text-sm text-gray-700 dark:text-slate-200">
                      Roll No / ID (optional)
                      <input
                        type="text"
                        value={coverFields.rollId}
                        onChange={(event) => handleCoverFieldChange('rollId', event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        aria-label="Roll number or ID"
                      />
                      <input
                        type="range"
                        min={10}
                        max={24}
                        value={coverFontSizes.rollId}
                        onChange={(event) =>
                          setCoverFontSizes((prev) => ({
                            ...prev,
                            rollId: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full"
                        aria-label="Roll number font size"
                      />
                    </label>
                  </div>
                )}
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Page Settings
                </legend>
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Page size
                  <select
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={pageSize}
                    onChange={(event) => setPageSize(event.target.value as PageSize)}
                    aria-label="Select page size"
                  >
                    {Object.entries(PAGE_SIZES).map(([value, option]) => (
                      <option key={value} value={value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Margins
                  <select
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={marginPreset}
                    onChange={(event) => setMarginPreset(event.target.value as MarginPreset)}
                    aria-label="Select margin preset"
                  >
                    <option value="normal">Normal</option>
                    <option value="narrow">Narrow</option>
                    <option value="wide">Wide</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                {marginPreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-slate-200">
                    {(['top', 'right', 'bottom', 'left'] as const).map((key) => (
                      <label key={key} className="flex flex-col">
                        {key[0].toUpperCase() + key.slice(1)} (mm)
                        <input
                          type="number"
                          min={5}
                          max={40}
                          value={customMargins[key]}
                          onChange={(event) =>
                            setCustomMargins((prev) => ({
                              ...prev,
                              [key]: Number(event.target.value),
                            }))
                          }
                          className="mt-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          aria-label={`Custom margin ${key}`}
                        />
                      </label>
                    ))}
                  </div>
                )}
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Line spacing
                  <select
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={lineSpacing}
                    onChange={(event) => setLineSpacing(Number(event.target.value) as LineSpacing)}
                    aria-label="Select line spacing"
                  >
                    <option value={1}>1.0</option>
                    <option value={1.5}>1.5</option>
                    <option value={2}>2.0</option>
                  </select>
                </label>
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Paragraph spacing (px)
                  <input
                    type="number"
                    min={0}
                    max={32}
                    value={paragraphSpacing}
                    onChange={(event) => setParagraphSpacing(Number(event.target.value))}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Paragraph spacing"
                  />
                </label>
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Text alignment
                  <select
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={textAlign}
                    onChange={(event) => setTextAlign(event.target.value as TextAlign)}
                    aria-label="Select text alignment"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="justify">Justify</option>
                  </select>
                </label>
              </fieldset>

              <fieldset className="grid gap-3">
                <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Font Controls
                </legend>
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Font family
                  <select
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={fontFamily}
                    onChange={(event) => setFontFamily(event.target.value)}
                    aria-label="Select font family"
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font.label} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Font size (pt)
                  <select
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={fontSize}
                    onChange={(event) => setFontSize(Number(event.target.value))}
                    aria-label="Select font size"
                  >
                    {FONT_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-700 dark:text-slate-200">
                  Text color
                  <input
                    type="color"
                    value={textColor}
                    onChange={(event) => {
                      document.execCommand('styleWithCSS', false, 'true');
                      setTextColor(event.target.value);
                      applyFormat('foreColor', event.target.value);
                    }}
                    className="mt-2 h-10 w-16 cursor-pointer rounded-md border border-gray-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
                    aria-label="Select text color"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyFormat('undo')}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Undo"
                    title="Undo"
                  >
                    ↶
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('redo')}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Redo"
                    title="Redo"
                  >
                    ↷
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      saveSelectionBeforeFormat();
                    }}
                    onClick={() => applyFormat('bold')}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Bold"
                    title="Bold"
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      saveSelectionBeforeFormat();
                    }}
                    onClick={() => applyFormat('italic')}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Italic"
                    title="Italic"
                  >
                    Italic
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      saveSelectionBeforeFormat();
                    }}
                    onClick={() => applyFormat('underline')}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Underline"
                    title="Underline"
                  >
                    Underline
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      saveSelectionBeforeFormat();
                    }}
                    onClick={() => applyFormat('formatBlock', 'p')}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Paragraph style"
                    title="Paragraph"
                  >
                    Paragraph
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      saveSelectionBeforeFormat();
                    }}
                    onClick={() => applyFormat('formatBlock', 'h3')}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Heading style"
                    title="Heading"
                  >
                    Heading
                  </button>
                  <button
                    type="button"
                    onClick={autoFormatContent}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Auto format assignment content"
                    title="Auto Format"
                  >
                    Auto Format
                  </button>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={proofEnabled}
                    onChange={(event) => setProofEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                    aria-label="Toggle grammar and spell check"
                  />
                  Grammar & spell check
                </label>
                <button
                  type="button"
                  onClick={applyProofingToEditor}
                  disabled={!proofEnabled}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Run grammar and spell check now"
                >
                  Check now
                </button>
                {notice && (
                  <p className="text-xs text-gray-500 dark:text-slate-400" role="status">
                    {notice}
                  </p>
                )}
              </fieldset>

              <fieldset className="grid gap-3">
                <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Export
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Download PDF"
                    title="Download PDF"
                  >
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={isExporting}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Print assignment"
                    title="Print"
                  >
                    Print
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-sm text-gray-700 dark:text-slate-200">
                    Image format
                    <select
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      value={imageFormat}
                      onChange={(event) => setImageFormat(event.target.value as 'png' | 'jpeg')}
                      aria-label="Select image format"
                      disabled={isExporting}
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={longImage}
                      onChange={(event) => setLongImage(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                      disabled={isExporting}
                      aria-label="Export as one long image"
                    />
                    One long image
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleExportImages}
                  disabled={isExporting}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Export as image"
                  title="Export as image"
                >
                  Export as Image
                </button>
                {isExporting && (
                  <p className="text-xs text-gray-500 dark:text-slate-400" role="status">
                    Exporting, please wait…
                  </p>
                )}
                {exportError && (
                  <p className="text-xs text-red-500" role="alert">
                    {exportError}
                  </p>
                )}
              </fieldset>
            </div>

          </div>
        </aside>
        <div className="hidden items-stretch md:flex">
          <div className="relative flex w-6 items-center justify-center">
            <div className="h-full w-px bg-gray-200 dark:bg-slate-700" />
            <button
              type="button"
              onMouseDown={() => {
                isDraggingRef.current = true;
              }}
              onTouchStart={() => {
                isDraggingRef.current = true;
              }}
              className="absolute flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-sm text-gray-600 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Resize panels"
              title="Drag to resize"
            >
              ⇔
            </button>
          </div>
        </div>

        <section
          className={`assignment-preview-panel w-full min-w-0 md:flex-1 ${
            activePanel === 'preview' ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Write in Preview
            </h2>
            <div
              ref={(node) => {
                previewWrapRef.current = node;
                exportRef.current = node;
              }}
              className="mt-4 flex flex-col items-center gap-6 max-w-full overflow-x-auto overflow-y-auto tools-preview-container"
            >
              {includeCover && (
                <div
                  data-export-page
                  className="flex w-full justify-center"
                  style={{ height: `calc(${pageDimensions.height} * ${previewScale})` }}
                >
                  <div
                    data-export-unscale
                    className="assignment-preview-page relative rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-white"
                    style={{
                      width: pageDimensions.width,
                      height: pageDimensions.height,
                      padding: `${marginValues.top}mm ${marginValues.right}mm ${marginValues.bottom}mm ${marginValues.left}mm`,
                      boxSizing: 'border-box',
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top center',
                      backgroundColor: '#ffffff',
                    }}
                    aria-label="Cover page preview"
                  >
                    <div
                      className={`assignment-preview-content flex h-full w-full flex-col ${
                        coverStyle === 'minimal'
                          ? 'items-center justify-center text-center'
                          : coverStyle === 'formal'
                            ? 'assignment-cover-formal items-start justify-start text-left'
                            : 'assignment-cover-modern items-center justify-center text-center'
                      }`}
                      style={{
                        fontFamily,
                        color: textColor,
                      }}
                    >
                      <div className="w-full">
                        <h2
                          className="text-2xl font-semibold"
                          style={{ fontSize: `${coverFontSizes.title}px` }}
                        >
                          {coverFields.title || 'Assignment Title'}
                        </h2>
                        {coverStyle === 'modern' && (
                          <div className="cover-divider mx-auto my-4" aria-hidden="true" />
                        )}
                        <div className="mt-6 space-y-2 text-sm">
                          {coverFields.studentName && (
                            <p style={{ fontSize: `${coverFontSizes.studentName}px` }}>
                              <strong>Student:</strong> {coverFields.studentName}
                            </p>
                          )}
                          {coverFields.classGrade && (
                            <p style={{ fontSize: `${coverFontSizes.classGrade}px` }}>
                              <strong>Class / Grade:</strong> {coverFields.classGrade}
                            </p>
                          )}
                          {coverFields.subject && (
                            <p style={{ fontSize: `${coverFontSizes.subject}px` }}>
                              <strong>Subject:</strong> {coverFields.subject}
                            </p>
                          )}
                          {coverFields.teacherName && (
                            <p style={{ fontSize: `${coverFontSizes.teacherName}px` }}>
                              <strong>Teacher:</strong> {coverFields.teacherName}
                            </p>
                          )}
                          {coverFields.institutionName && (
                            <p style={{ fontSize: `${coverFontSizes.institutionName}px` }}>
                              <strong>Institution:</strong> {coverFields.institutionName}
                            </p>
                          )}
                          {coverFields.submissionDate && (
                            <p style={{ fontSize: `${coverFontSizes.submissionDate}px` }}>
                              <strong>Submission Date:</strong> {coverFields.submissionDate}
                            </p>
                          )}
                          {coverFields.rollId && (
                            <p style={{ fontSize: `${coverFontSizes.rollId}px` }}>
                              <strong>Roll No / ID:</strong> {coverFields.rollId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div
                data-export-page
                className="flex w-full justify-center"
                style={{ height: `calc(${pageDimensions.height} * ${previewScale})` }}
              >
                <div
                  ref={previewPageRef}
                  data-export-unscale
                  className="assignment-preview-page relative rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-white"
                  style={{
                    width: pageDimensions.width,
                    height: pageDimensions.height,
                    padding: `${marginValues.top}mm ${marginValues.right}mm ${marginValues.bottom}mm ${marginValues.left}mm`,
                    boxSizing: 'border-box',
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top center',
                    backgroundColor: '#ffffff',
                  }}
                  aria-label="Editable preview page"
                >
                  <div
                    ref={editorRef}
                    className="assignment-editor h-full w-full outline-none"
                    role="textbox"
                    aria-label="Assignment editor"
                    aria-multiline="true"
                    contentEditable
                    spellCheck={false}
                    dir="ltr"
                    onInput={handleEditorInput}
                    onCompositionStart={handleCompositionStart}
                    onCompositionUpdate={handleCompositionUpdate}
                    onCompositionEnd={handleCompositionEnd}
                    onContextMenu={handleEditorContextMenu}
                    style={{
                      fontFamily,
                      fontSize: `${fontSize}pt`,
                      lineHeight: lineSpacing,
                      textAlign,
                      color: textColor,
                      direction: 'ltr',
                      unicodeBidi: 'plaintext',
                    }}
                  />
                  {!contentHtml && (
                    <p className="pointer-events-none mt-2 text-sm text-gray-400 dark:text-slate-500">
                      Start typing your assignment here…
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div data-export-hide="true" className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={insertPageBreak}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-lg font-semibold text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:text-slate-200"
                aria-label="Add Page"
                title="Add Page"
              >
                +
              </button>
              <button
                type="button"
                onClick={removeLastPageBreak}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-lg font-semibold text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:text-slate-200"
                aria-label="Delete last page"
                title="Delete Page"
              >
                −
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 px-3 py-3 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            aria-label="Download PDF"
            title="Download PDF"
          >
            PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isExporting}
            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            aria-label="Print assignment"
            title="Print"
          >
            Print
          </button>
          <button
            type="button"
            onClick={handleExportImages}
            disabled={isExporting}
            className="rounded-md border border-gray-200 bg-white px-2 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Export as image"
            title="Export as image"
          >
            Image
          </button>
        </div>
        {isExporting && (
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400" role="status">
            Exporting, please wait…
          </p>
        )}
        {exportError && (
          <p className="mt-2 text-center text-xs text-red-500" role="alert">
            {exportError}
          </p>
        )}
      </div>

      {proofMenu && (
        <div
          role="menu"
          aria-label="Spelling suggestions"
          className="fixed z-50 w-56 rounded-lg border border-gray-200 bg-white p-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900"
          style={{ left: proofMenu.x, top: proofMenu.y }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-slate-400">
            Suggestions
          </div>
          {proofMenu.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleProofMenuSelect(suggestion)}
              className="w-full rounded-md px-2 py-1 text-left text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label={`Replace with ${suggestion}`}
            >
              {suggestion}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setProofMenu(null)}
            className="mt-1 w-full rounded-md px-2 py-1 text-left text-xs text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close suggestions"
          >
            Close
          </button>
        </div>
      )}

      <div
        ref={measureRef}
        className="assignment-preview-content pointer-events-none absolute left-[-9999px] top-0 opacity-0"
        aria-hidden="true"
        style={{
          width: contentWidth,
          height: contentHeight,
          fontFamily,
          fontSize: `${fontSize}pt`,
          lineHeight: lineSpacing,
          textAlign,
        }}
      />
      {/* html2pdf Multi-Page Export Bug Fixed (Assignment + Notes) */}
      {/* Assignment Formatter Step 1: Core Layout & Page Rules Implemented */}
      {/* Assignment Formatter Step 2: Cover Page Generator Implemented */}
      {/* Assignment Formatter Step 3: Prebuilt Templates Implemented */}
      {/* Assignment Formatter Step 4: Auto-Format Rules Implemented */}
      {/* Assignment Formatter Step 5: Export Engine Implemented */}
      {/* Assignment Formatter Step 6: Production Polish Implemented */}
      {/* Assignment Formatter + Notes PDF Enhancements & Export Fix Implemented */}
    </section>
  );
}
