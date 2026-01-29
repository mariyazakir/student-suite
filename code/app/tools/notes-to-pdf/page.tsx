/**
 * Notes → PDF Step 4: Camera + OCR
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CSSProperties, ChangeEvent, PointerEvent as ReactPointerEvent } from 'react';
import { getSession } from '@/lib/auth/local-auth';
import {
  exportMultiPageImages,
  exportMultiPagePdf,
  printMultiPage,
} from '@/lib/exportUtils';
import type { TemplateRules } from '@/src/lib/templates';
import { getTemplatesFor } from '@/src/lib/templates';

type PageType = 'plain' | 'ruled' | 'grid' | 'cornell';
type DrawTool = 'pen' | 'eraser' | 'highlighter' | null;

type DrawPoint = {
  x: number;
  y: number;
  pressure?: number;
};

type DrawStroke = {
  id: string;
  tool: Exclude<DrawTool, null>;
  color: string;
  size: number;
  points: DrawPoint[];
  opacity?: number;
};

type PageView = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type NotebookPage = {
  id: string;
  title: string;
  content: string;
  type: PageType;
  drawings: DrawStroke[];
  view: PageView;
  drawingSize?: { width: number; height: number };
  scans: { id: string; dataUrl: string; createdAt: string }[];
};

type NotebookProject = {
  id: string;
  title: string;
  pages: NotebookPage[];
};

type NotebookState = {
  projects: NotebookProject[];
  activeProjectId: string;
  activePageId: string;
  templateId?: string;
};


const DEFAULT_PAGE: Omit<NotebookPage, 'id'> = {
  title: '',
  content: '',
  type: 'plain',
  drawings: [],
  view: {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  },
  scans: [],
};

const createPage = (type: PageType = DEFAULT_PAGE.type): NotebookPage => ({
  id: crypto.randomUUID(),
  ...DEFAULT_PAGE,
  type,
});

const createProject = (title?: string): NotebookProject => ({
  id: crypto.randomUUID(),
  title: title?.trim() || 'Untitled project',
  pages: [createPage()],
});

const getStorageKey = (userId: string | null) =>
  `student-suite-notes-${userId ?? 'guest'}`;

const NOTES_TEMPLATE_FALLBACK = 'notes-plain';

const pageTypeLabels: Record<PageType, string> = {
  plain: 'Plain',
  ruled: 'Ruled',
  grid: 'Grid',
  cornell: 'Cornell',
};

const DEFAULT_PEN_COLOR = '#111827';
const HIGHLIGHTER_COLORS = [
  { name: 'Purple', value: '#a855f7' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#facc15' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getPaperStyle = (type: PageType, isDark: boolean) => {
  const base: CSSProperties = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
  };

  if (type === 'ruled') {
    return {
      ...base,
      backgroundImage: `linear-gradient(to bottom, ${
        isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.35)'
      } 1px, transparent 1px)`,
      backgroundSize: '100% 28px',
    };
  }

  if (type === 'grid') {
    const lineColor = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.28)';
    return {
      ...base,
      backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    };
  }

  if (type === 'cornell') {
    const ruleColor = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.35)';
    return {
      ...base,
      backgroundImage: `
        linear-gradient(to right, ${ruleColor} 1px, transparent 1px),
        linear-gradient(to bottom, ${ruleColor} 1px, transparent 1px),
        linear-gradient(to right, ${ruleColor} 2px, transparent 2px)
      `,
      backgroundSize: '24px 24px, 100% 28px, calc(100% - 140px) 100%',
      backgroundPosition: '0 0, 0 0, 120px 0',
      backgroundRepeat: 'repeat, repeat, no-repeat',
    };
  }

  return base;
};

export default function NotesToPdfPage() {
  const [projects, setProjects] = useState<NotebookProject[]>([createProject()]);
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0].id);
  const [activePageId, setActivePageId] = useState<string>(projects[0].pages[0].id);
  const [isDark, setIsDark] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawTool>(null);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeColor, setStrokeColor] = useState(DEFAULT_PEN_COLOR);
  const [highlighterColor, setHighlighterColor] = useState(HIGHLIGHTER_COLORS[2].value);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSelection, setExportSelection] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanImageSrc, setScanImageSrc] = useState<string | null>(null);
  const [scanPreviewSrc, setScanPreviewSrc] = useState<string | null>(null);
  const [scanRotation, setScanRotation] = useState(0);
  const [scanBrightness, setScanBrightness] = useState(0);
  const [scanContrast, setScanContrast] = useState(0);
  const [cropMargins, setCropMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [keepScanImage, setKeepScanImage] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(32);
  const [isResizingPanels, setIsResizingPanels] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [noteTemplates, setNoteTemplates] = useState(() => getTemplatesFor('notes'));
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() =>
    noteTemplates[0]?.id ?? NOTES_TEMPLATE_FALLBACK,
  );
  const [previewTemplateRules, setPreviewTemplateRules] = useState<TemplateRules | null>(
    noteTemplates[0]?.rules ?? null,
  );
  const templateParamAppliedRef = useRef(false);
  const searchParams = useSearchParams();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const lastLoadedPageIdRef = useRef<string | null>(null);
  const pageEditorRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const pageContentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pageCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const panelsRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const scanImageRef = useRef<HTMLImageElement | null>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawingsSignatureRef = useRef<string>('');
  const hasLoadedRef = useRef(false);
  const redoStacksRef = useRef<Record<string, DrawStroke[]>>({});
  const historyRef = useRef<
    Record<
      string,
      {
        stack: NotebookPage[];
        index: number;
      }
    >
  >({});
  const isRestoringRef = useRef(false);
  const activeStrokeRef = useRef<DrawStroke | null>(null);
  const isDrawingRef = useRef(false);
  const isPaginatingRef = useRef(false);
  const pointerPositionsRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<{
    distance: number;
    midpoint: { x: number; y: number };
    scale: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const panStateRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) || projects[0],
    [projects, activeProjectId],
  );

  const activePage = useMemo(() => {
    const pages = activeProject?.pages ?? [];
    return pages.find((page) => page.id === activePageId) || pages[0];
  }, [activeProject, activePageId]);

  const activeProjectPages = activeProject?.pages ?? [];

  const applyNoteTemplate = (templateId: string) => {
    const template = noteTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedTemplateId(template.id);
    setPreviewTemplateRules(template.rules);
    const nextPageType = template.rules?.layout?.pageType as PageType | undefined;
    if (nextPageType) {
      setProjects((prev) =>
        prev.map((project) =>
          project.id === activeProjectId
            ? {
                ...project,
                pages: project.pages.map((page) =>
                  page.id === activePageId ? { ...page, type: nextPageType } : page,
                ),
              }
            : project,
        ),
      );
    }
  };

  const resolvePageType = (pageType: PageType): PageType => {
    const templateType = previewTemplateRules?.layout?.pageType as PageType | undefined;
    return templateType ?? pageType;
  };

  const previewIsDark = useMemo(() => {
    const mode = previewTemplateRules?.colors?.mode;
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return isDark;
  }, [isDark, previewTemplateRules]);

  const getPreviewPaperStyle = (pageType: PageType) => {
    const base = getPaperStyle(resolvePageType(pageType), previewIsDark);
    const background = previewTemplateRules?.colors?.background;
    return background ? { ...base, backgroundColor: background } : base;
  };

  const clonePage = (page: NotebookPage): NotebookPage => ({
    ...page,
    drawings: page.drawings.map((stroke) => ({
      ...stroke,
      points: stroke.points.map((pt) => ({ ...pt })),
    })),
    scans: [...(page.scans || [])],
  });

  const ensureHistory = (page: NotebookPage) => {
    if (!historyRef.current[page.id]) {
      historyRef.current[page.id] = { stack: [clonePage(page)], index: 0 };
    }
  };

  const pushHistory = (page: NotebookPage) => {
    if (isRestoringRef.current) return;
    ensureHistory(page);
    const entry = historyRef.current[page.id];
    entry.stack = entry.stack.slice(0, entry.index + 1);
    entry.stack.push(clonePage(page));
    entry.index = entry.stack.length - 1;
  };

  const restorePageState = (pageId: string, snapshot: NotebookPage) => {
    isRestoringRef.current = true;
    setProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              pages: project.pages.map((page) => (page.id === pageId ? clonePage(snapshot) : page)),
            }
          : project,
      ),
    );
    requestAnimationFrame(() => {
      isRestoringRef.current = false;
    });
  };

  const undoAll = () => {
    const entry = historyRef.current[activePageId];
    if (!entry || entry.index <= 0) return;
    entry.index -= 1;
    const snapshot = entry.stack[entry.index];
    restorePageState(activePageId, snapshot);
  };

  const redoAll = () => {
    const entry = historyRef.current[activePageId];
    if (!entry || entry.index >= entry.stack.length - 1) return;
    entry.index += 1;
    const snapshot = entry.stack[entry.index];
    restorePageState(activePageId, snapshot);
  };

  const previewTextColor = previewTemplateRules?.colors?.text;

  useEffect(() => {
    if (templateParamAppliedRef.current) return;
    const templateId = searchParams.get('templateId');
    if (!templateId) return;
    const exists = noteTemplates.some((template) => template.id === templateId);
    if (!exists) return;
    applyNoteTemplate(templateId);
    templateParamAppliedRef.current = true;
  }, [searchParams, noteTemplates]);

  useEffect(() => {
    const session = getSession();
    const storageKey = getStorageKey(session?.userId ?? null);
    const raw =
      window.localStorage.getItem(storageKey) ?? window.sessionStorage.getItem(storageKey);
    if (!raw) {
      hasLoadedRef.current = true;
      return;
    }
    try {
      const parsed = JSON.parse(raw) as
        | NotebookState
        | { pages?: NotebookPage[]; activePageId?: string; projectTitle?: string };
      if ('projects' in parsed && parsed.projects?.length) {
        const normalizedProjects = parsed.projects.map((project) => ({
          ...project,
          title: project.title || 'Untitled project',
          pages: (project.pages || []).map((page) => ({
            ...DEFAULT_PAGE,
            ...page,
            drawings: page.drawings || [],
            view: page.view || DEFAULT_PAGE.view,
            scans: page.scans || [],
          })),
        }));
        if (!normalizedProjects[0]?.pages.length) return;
        setProjects(normalizedProjects);
        setActiveProjectId(parsed.activeProjectId || normalizedProjects[0].id);
        setActivePageId(
          parsed.activePageId || normalizedProjects[0].pages[0].id,
        );
        const templateId =
          parsed.templateId || noteTemplates[0]?.id || NOTES_TEMPLATE_FALLBACK;
        setSelectedTemplateId(templateId);
        setPreviewTemplateRules(
          noteTemplates.find((template) => template.id === templateId)?.rules ?? null,
        );
      } else if ('pages' in parsed && parsed.pages?.length) {
        const normalizedPages = parsed.pages.map((page) => ({
          ...DEFAULT_PAGE,
          ...page,
          drawings: page.drawings || [],
          view: page.view || DEFAULT_PAGE.view,
          scans: page.scans || [],
        }));
        const project = {
          id: crypto.randomUUID(),
          title: parsed.projectTitle || 'Untitled project',
          pages: normalizedPages,
        };
        setProjects([project]);
        setActiveProjectId(project.id);
        setActivePageId(parsed.activePageId || normalizedPages[0].id);
        const templateId =
          (parsed as NotebookState).templateId ||
          noteTemplates[0]?.id ||
          NOTES_TEMPLATE_FALLBACK;
        setSelectedTemplateId(templateId);
        setPreviewTemplateRules(
          noteTemplates.find((template) => template.id === templateId)?.rules ?? null,
        );
      }
    } catch {
      // Ignore corrupt storage
    } finally {
      hasLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const updated = getTemplatesFor('notes');
      setNoteTemplates(updated);
      if (!updated.find((tpl) => tpl.id === selectedTemplateId) && updated[0]) {
        applyNoteTemplate(updated[0].id);
      }
    };
    window.addEventListener('storage', handler);
    window.addEventListener('templates-registry-updated', handler as EventListener);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('templates-registry-updated', handler as EventListener);
    };
  }, [selectedTemplateId]);

  useEffect(() => {
    if (activePage) {
      ensureHistory(activePage);
    }
  }, [activePageId, activePage]);



  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    updateDesktop();
    window.addEventListener('resize', updateDesktop);
    return () => window.removeEventListener('resize', updateDesktop);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('notes-to-pdf-split-width');
    if (!saved) return;
    const parsed = Number(saved);
    if (!Number.isNaN(parsed)) {
      setLeftPanelWidth(clamp(parsed, 22, 48));
    }
  }, []);

  useEffect(() => {
    if (!isResizingPanels) return;
    const handlePointerMove = (event: PointerEvent) => {
      if (!panelsRef.current || window.innerWidth < 1024) return;
      const rect = panelsRef.current.getBoundingClientRect();
      const offset = event.clientX - rect.left;
      const nextWidth = clamp((offset / rect.width) * 100, 22, 48);
      setLeftPanelWidth(nextWidth);
      window.localStorage.setItem('notes-to-pdf-split-width', nextWidth.toString());
    };

    const handlePointerUp = () => {
      setIsResizingPanels(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingPanels]);

  useEffect(() => {
    activeProjectPages.forEach((page) => {
      const editor = pageEditorRefs.current[page.id];
      if (!editor) return;
      const isFocused = document.activeElement === editor;
      const nextHtml = page.content || '';
      if (isFocused && editor.innerHTML === nextHtml) return;
      if (editor.innerHTML !== nextHtml) {
        editor.innerHTML = nextHtml;
      }
    });
    lastLoadedPageIdRef.current = activePageId;
  }, [activeProjectPages, activePageId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
      setIsDark(root.classList.contains('dark'));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!redoStacksRef.current[activePageId]) {
      redoStacksRef.current[activePageId] = [];
    }
  }, [activePageId]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    setIsDirty(true);
  }, [projects, activeProjectId, activePageId, selectedTemplateId]);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const session = getSession();
      const storageKey = getStorageKey(session?.userId ?? null);
      const payload: NotebookState = {
        projects,
        activeProjectId,
        activePageId,
        templateId: selectedTemplateId,
      };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
        setSaveError(null);
        setIsDirty(false);
        setLastSavedAt(new Date().toISOString());
      } catch (error) {
        try {
          window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
          setSaveError('Saved locally with fallback storage.');
          setIsDirty(false);
          setLastSavedAt(new Date().toISOString());
        } catch {
          setSaveError(error instanceof Error ? error.message : 'Autosave failed.');
        }
      }
    }, 900);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [projects, activeProjectId, activePageId, selectedTemplateId]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isScanOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseScan();
      }
      if (
        event.key === 'Enter' &&
        ocrText.trim() &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLInputElement)
      ) {
        insertOcrText('current');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScanOpen, ocrText]);

  const renderDrawingsToCanvas = (
    page: NotebookPage,
    canvas: HTMLCanvasElement,
    content: HTMLDivElement,
  ) => {
    const rect = content.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = rect.width * pixelRatio;
    canvas.height = rect.height * pixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const drawingSize = page.drawingSize || { width: rect.width, height: rect.height };
    const scaleX = rect.width / drawingSize.width;
    const scaleY = rect.height / drawingSize.height;

    page.drawings.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.size * ((scaleX + scaleY) / 2);
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity ?? 1;
      }
      ctx.beginPath();
      stroke.points.forEach((point, index) => {
        const x = point.x * scaleX;
        const y = point.y * scaleY;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.restore();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;

    const resizeCanvas = () => {
      const rect = viewport.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = rect.width * pixelRatio;
      canvas.height = rect.height * pixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }
      if (
        !activePage.drawingSize ||
        Math.abs(activePage.drawingSize.width - rect.width) > 1 ||
        Math.abs(activePage.drawingSize.height - rect.height) > 1
      ) {
        updateActivePage({
          drawingSize: { width: rect.width, height: rect.height },
        });
      }
      redrawCanvas();
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(viewport);
    resizeCanvas();

    return () => observer.disconnect();
  }, [activePageId]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport || !activePage) return;
    renderDrawingsToCanvas(activePage, canvas, viewport);
  };

  const drawingsSignature = useMemo(() => {
    return activeProjectPages
      .map((page) => {
        const last = page.drawings[page.drawings.length - 1]?.id ?? '';
        const size = page.drawingSize;
        return `${page.id}:${page.drawings.length}:${last}:${size?.width ?? 0}x${size?.height ?? 0}`;
      })
      .join('|');
  }, [activeProjectPages]);

  useEffect(() => {
    if (drawingsSignatureRef.current === drawingsSignature) return;
    drawingsSignatureRef.current = drawingsSignature;
    const frame = requestAnimationFrame(() => {
      activeProjectPages.forEach((page) => {
        const canvas = pageCanvasRefs.current[page.id];
        const content = pageContentRefs.current[page.id];
        if (!canvas || !content) return;
        renderDrawingsToCanvas(page, canvas, content);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeProjectPages, drawingsSignature]);

  useEffect(() => {
    redrawCanvas();
  }, [activePage?.drawings, activePageId]);

  useEffect(() => {
    if (!activeProject?.pages?.length) return;
    const exists = activeProject.pages.some((page) => page.id === activePageId);
    if (!exists) {
      setActivePageId(activeProject.pages[0].id);
    }
  }, [activeProject, activePageId]);

  const handleAddProject = () => {
    const titleInput = window.prompt('Project title (optional):', '') ?? '';
    const nextProject = createProject(titleInput);
    setProjects((prev) => [...prev, nextProject]);
    setActiveProjectId(nextProject.id);
    setActivePageId(nextProject.pages[0].id);
    redoStacksRef.current[nextProject.pages[0].id] = [];
  };

  const handleDeleteProject = (projectId: string) => {
    const shouldDelete = window.confirm('Delete this project? This cannot be undone.');
    if (!shouldDelete) return;
    setProjects((prev) => {
      const remaining = prev.filter((project) => project.id !== projectId);
      if (remaining.length === 0) {
        const fallback = createProject();
        setActiveProjectId(fallback.id);
        setActivePageId(fallback.pages[0].id);
        return [fallback];
      }
      if (projectId === activeProjectId) {
        setActiveProjectId(remaining[0].id);
        setActivePageId(remaining[0].pages[0].id);
      }
      return remaining;
    });
  };

  const handleAddPage = () => {
    const nextPage = createPage(activePage?.type ?? DEFAULT_PAGE.type);
    setProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId
          ? { ...project, pages: [...project.pages, nextPage] }
          : project,
      ),
    );
    setActivePageId(nextPage.id);
    redoStacksRef.current[nextPage.id] = [];
  };

  const handleDeletePage = (pageId: string) => {
    const shouldDelete = window.confirm('Delete this page? This cannot be undone.');
    if (!shouldDelete) return;
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== activeProjectId) return project;
        const remaining = project.pages.filter((page) => page.id !== pageId);
        delete redoStacksRef.current[pageId];
        if (remaining.length === 0) {
          const fallback = createPage();
          redoStacksRef.current[fallback.id] = [];
          setActivePageId(fallback.id);
          return { ...project, pages: [fallback] };
        }
        if (pageId === activePageId) {
          setActivePageId(remaining[0].id);
        }
        return { ...project, pages: remaining };
      }),
    );
  };

  const updateActivePage = (updates: Partial<NotebookPage>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              pages: project.pages.map((page) =>
                page.id === activePageId
                  ? {
                      ...( () => {
                        const nextPage = { ...page, ...updates };
                        pushHistory(nextPage);
                        return nextPage;
                      })(),
                    }
                  : page,
              ),
            }
          : project,
      ),
    );
  };

  const updateActiveProject = (updates: Partial<NotebookProject>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              ...updates,
            }
          : project,
      ),
    );
  };

  const updatePageById = (pageId: string, updates: Partial<NotebookPage>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              pages: project.pages.map((page) =>
                page.id === pageId
                  ? {
                      ...( () => {
                        const nextPage = { ...page, ...updates };
                        pushHistory(nextPage);
                        return nextPage;
                      })(),
                    }
                  : page,
              ),
            }
          : project,
      ),
    );
  };

  const sizeSliderValue = strokeWidth;
  const sizeSliderMin = 1;
  const sizeSliderMax = 12;

  const handleSizeSliderChange = (value: number) => {
    setStrokeWidth(value);
  };

  const paginateOverflow = (_pageId: string) => {
    return;
  };

  const renderStyledFromPlain = (text: string) => {
    return text
      .split('\n')
      .map((line) => {
        const isBullet = line.startsWith('• ');
        const content = line.replace(/^•\s+/, '');
        const applyBold = /\*(.+?)\*/g;
        const applyItalic = /_(.+?)_/g;
        const fragments: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];
        let cursor = 0;
        const markers: Array<{ start: number; end: number; type: 'bold' | 'italic' }> = [];
        for (const match of content.matchAll(applyBold)) {
          markers.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length, type: 'bold' });
        }
        for (const match of content.matchAll(applyItalic)) {
          markers.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length, type: 'italic' });
        }
        markers.sort((a, b) => a.start - b.start);
        markers.forEach((marker) => {
          if (marker.start > cursor) {
            fragments.push({ text: content.slice(cursor, marker.start) });
          }
          const matched = content.slice(marker.start, marker.end);
          const insideText = matched.length >= 2 ? matched.slice(1, -1) : matched;
          fragments.push({
            text: insideText,
            bold: marker.type === 'bold',
            italic: marker.type === 'italic',
          });
          cursor = marker.end;
        });
        if (cursor < content.length) {
          fragments.push({ text: content.slice(cursor) });
        }
        // Ensure at least one fragment exists (for empty lines)
        if (fragments.length === 0) {
          fragments.push({ text: '' });
        }
        const style: React.CSSProperties = {};
        return {
          isBullet,
          style,
          fragments,
        };
      });
  };


  const toggleInline = (marker: '*' | '_') => {
    const editor = pageEditorRefs.current[activePageId];
    if (!editor) return;
    const fullText = (activePage?.content ?? editor.value) || '';
    const start = editor.selectionStart ?? 0;
    const end = editor.selectionEnd ?? start;
    let finalStart = start;
    let finalEnd = end;
    if (start === end) {
      const wordMatch = fullText.slice(0, start).match(/\b(\w+)$/);
      const wordStart = wordMatch ? start - wordMatch[0].length : start;
      const wordEndMatch = fullText.slice(start).match(/^(\w+)/);
      const wordEnd = wordEndMatch ? start + wordEndMatch[0].length : start;
      finalStart = wordStart;
      finalEnd = wordEnd;
    }
    const before = fullText.slice(0, finalStart);
    const target = fullText.slice(finalStart, finalEnd);
    const after = fullText.slice(finalEnd);
    const isWrapped = target.startsWith(marker) && target.endsWith(marker) && target.length >= 2;
    const wrapped = isWrapped ? target.slice(1, -1) : `${marker}${target}${marker}`;
    const plain = `${before}${wrapped}${after}`;
    updatePageById(activePageId, { content: plain });
    requestAnimationFrame(() => paginateOverflow(activePageId));
    requestAnimationFrame(() => {
      const delta = isWrapped ? -2 : 2;
      const nextStart = finalStart + (isWrapped ? 0 : 1);
      const nextEnd = finalEnd + delta - (isWrapped ? 1 : 0);
      editor.focus();
      editor.setSelectionRange(nextStart, nextEnd);
    });
  };

  const toggleBullets = () => {
    const editor = pageEditorRefs.current[activePageId];
    if (!editor) return;
    const caret = editor.selectionStart ?? 0;
    const contentFromState = (activePage?.content ?? '') || '';
    const lines = contentFromState.split('\n');
    let acc = 0;
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      const nextAcc = acc + lines[i].length + 1;
      if (caret <= nextAcc) {
        idx = i;
        break;
      }
      acc = nextAcc;
    }
    const line = lines[idx] || '';
    const nextLine = line.startsWith('• ') ? line.replace(/^•\s+/, '') : `• ${line.trimStart()}`;
    lines[idx] = nextLine;
    const plain = lines.join('\n');
    updatePageById(activePageId, { content: plain });
    requestAnimationFrame(() => paginateOverflow(activePageId));
    requestAnimationFrame(() => {
      const pos = acc + nextLine.length;
      editor.focus();
      editor.setSelectionRange(pos, pos);
    });
  };

  const handleExportSelection = (value: string) => {
    setExportSelection('');
    if (!value) return;
    if (value === 'pdf') {
      handleExportPdf();
      return;
    }
    if (value === 'png') {
      handleExportImages('png');
      return;
    }
    if (value === 'jpeg') {
      handleExportImages('jpeg');
      return;
    }
    if (value === 'print') {
      handlePrint();
    }
  };

  const handleExportPdf = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      await exportMultiPagePdf({
        exportRef: exportRef.current,
        pageSelector: '[data-export-page]',
        filename: `${getProjectFilename()}.pdf`,
        pageSize: { width: 210, height: 297 },
        debug: { label: 'Notes Export' },
      });
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const getProjectFilename = () => {
    const raw = (activeProject?.title || 'project').trim();
    const safe = raw.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
    return safe || 'project';
  };

  const handleExportImages = async (format: 'png' | 'jpeg') => {
    setExportError(null);
    setIsExporting(true);
    try {
      await exportMultiPageImages({
        exportRef: exportRef.current,
        pageSelector: '[data-export-page]',
        filename: getProjectFilename(),
        format,
        pageSize: { width: 210, height: 297 },
        debug: { label: 'Notes Export' },
      });
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
        title: 'Notes Print',
        pageSize: { width: 210, height: 297 },
        extraStyles: `
          body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        `,
      });
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Print failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const setPageEditorRef =
    (pageId: string) =>
    (node: HTMLTextAreaElement | null) => {
      pageEditorRefs.current[pageId] = node;
      if (pageId === activePageId) {
        editorRef.current = node;
      }
    };

  const setPageContentRef =
    (pageId: string, isActive: boolean) =>
    (node: HTMLDivElement | null) => {
      pageContentRefs.current[pageId] = node;
      if (isActive) {
        viewportRef.current = node;
      }
    };

  const setPageCanvasRef =
    (pageId: string, isActive: boolean) =>
    (node: HTMLCanvasElement | null) => {
      pageCanvasRefs.current[pageId] = node;
      if (isActive) {
        canvasRef.current = node;
      }
    };

  const setPageSurfaceRef =
    (isActive: boolean) =>
    (node: HTMLDivElement | null) => {
      if (isActive) {
        surfaceRef.current = node;
      }
    };

  const handleToolToggle = (tool: Exclude<DrawTool, null>) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  const commitStroke = (stroke: DrawStroke) => {
    updateActivePage({
      drawings: [...(activePage?.drawings || []), stroke],
    });
    redoStacksRef.current[activePageId] = [];
  };

  const undoStroke = () => {
    if (!activePage?.drawings.length) return;
    const nextDrawings = [...activePage.drawings];
    const last = nextDrawings.pop();
    if (!last) return;
    redoStacksRef.current[activePageId] = [
      ...(redoStacksRef.current[activePageId] || []),
      last,
    ];
    updateActivePage({ drawings: nextDrawings });
  };

  const redoStroke = () => {
    const redoStack = redoStacksRef.current[activePageId] || [];
    const last = redoStack.pop();
    if (!last) return;
    redoStacksRef.current[activePageId] = redoStack;
    updateActivePage({ drawings: [...(activePage?.drawings || []), last] });
  };

  const setViewState = (nextView: PageView) => {
    updateActivePage({
      view: nextView,
    });
  };

  const getCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * rect.width) / rect.width;
    const y = ((event.clientY - rect.top) * rect.height) / rect.height;
    const view = activePage?.view ?? DEFAULT_PAGE.view;
    return {
      x: x / view.scale - view.offsetX / view.scale,
      y: y / view.scale - view.offsetY / view.scale,
    };
  };

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    event.preventDefault();
    const { x: canvasX, y: canvasY } = getCanvasPoint(event);
    const stroke: DrawStroke = {
      id: crypto.randomUUID(),
      tool: activeTool,
      color: activeTool === 'highlighter' ? highlighterColor : strokeColor,
      size: strokeWidth,
      points: [{ x: canvasX, y: canvasY, pressure: event.pressure }],
      opacity: activeTool === 'highlighter' ? 0.35 : 1,
    };
    activeStrokeRef.current = stroke;
    isDrawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCanvasPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDrawingRef.current || !activeStrokeRef.current) return;
    event.preventDefault();
    const { x: canvasX, y: canvasY } = getCanvasPoint(event);
    const stroke = activeStrokeRef.current;
    stroke.points.push({ x: canvasX, y: canvasY, pressure: event.pressure });

    const ctx = canvasRef.current.getContext('2d');
    if (ctx && stroke.points.length > 1) {
      const last = stroke.points[stroke.points.length - 1];
      const prev = stroke.points[stroke.points.length - 2];
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.size;
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity ?? 1;
      }
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handleCanvasPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    event.preventDefault();
    commitStroke(activeStrokeRef.current);
    activeStrokeRef.current = null;
    isDrawingRef.current = false;
  };

  const handleViewportPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeTool) return;
    const { view } = activePage;

    if (event.pointerType === 'touch') {
      pointerPositionsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointerPositionsRef.current.size === 2) {
        const points = Array.from(pointerPositionsRef.current.values());
        const dx = points[0].x - points[1].x;
        const dy = points[0].y - points[1].y;
        const distance = Math.hypot(dx, dy);
        const midpoint = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
        pinchStateRef.current = {
          distance,
          midpoint,
          scale: view.scale,
          offsetX: view.offsetX,
          offsetY: view.offsetY,
        };
      } else if (view.scale > 1) {
        panStateRef.current = {
          x: event.clientX,
          y: event.clientY,
          offsetX: view.offsetX,
          offsetY: view.offsetY,
        };
      }
    } else if (spacePressed && event.button === 0) {
      panStateRef.current = {
        x: event.clientX,
        y: event.clientY,
        offsetX: view.offsetX,
        offsetY: view.offsetY,
      };
    }
  };

  const handleViewportPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeTool) return;
    const view = activePage.view;

    if (event.pointerType === 'touch') {
      if (pointerPositionsRef.current.has(event.pointerId)) {
        pointerPositionsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }
      if (pointerPositionsRef.current.size === 2 && pinchStateRef.current) {
        event.preventDefault();
        const points = Array.from(pointerPositionsRef.current.values());
        const dx = points[0].x - points[1].x;
        const dy = points[0].y - points[1].y;
        const distance = Math.hypot(dx, dy);
        const midpoint = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
        const scale = clamp(
          (pinchStateRef.current.scale * distance) / pinchStateRef.current.distance,
          0.6,
          2.5,
        );
        const offsetX =
          pinchStateRef.current.offsetX + (midpoint.x - pinchStateRef.current.midpoint.x);
        const offsetY =
          pinchStateRef.current.offsetY + (midpoint.y - pinchStateRef.current.midpoint.y);
        setViewState({ scale, offsetX, offsetY });
        return;
      }

      if (panStateRef.current) {
        event.preventDefault();
        const offsetX = panStateRef.current.offsetX + (event.clientX - panStateRef.current.x);
        const offsetY = panStateRef.current.offsetY + (event.clientY - panStateRef.current.y);
        setViewState({ ...view, offsetX, offsetY });
      }
    } else if (panStateRef.current) {
      event.preventDefault();
      const offsetX = panStateRef.current.offsetX + (event.clientX - panStateRef.current.x);
      const offsetY = panStateRef.current.offsetY + (event.clientY - panStateRef.current.y);
      setViewState({ ...view, offsetX, offsetY });
    }
  };

  const handleViewportPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerPositionsRef.current.has(event.pointerId)) {
      pointerPositionsRef.current.delete(event.pointerId);
    }
    if (pointerPositionsRef.current.size < 2) {
      pinchStateRef.current = null;
    }
    panStateRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const nextScale = clamp(activePage.view.scale - event.deltaY * 0.001, 0.6, 2.5);
    setViewState({ ...activePage.view, scale: nextScale });
  };

  const resetZoom = () => {
    setViewState({ scale: 1, offsetX: 0, offsetY: 0 });
  };

  const resetScanState = () => {
    setScanImageSrc(null);
    setScanPreviewSrc(null);
    setScanRotation(0);
    setScanBrightness(0);
    setScanContrast(0);
    setCropMargins({ top: 0, right: 0, bottom: 0, left: 0 });
    setOcrText('');
    setOcrProgress(0);
    setIsOcrRunning(false);
    setOcrError(null);
    setKeepScanImage(false);
  };

  const openScanDialog = () => {
    resetScanState();
    setIsScanOpen(true);
  };

  const handleCloseScan = () => {
    setIsScanOpen(false);
    resetScanState();
  };

  const handleFileSelected = (file?: File | null) => {
    if (!file) {
      setOcrError('No image selected.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setScanImageSrc(reader.result);
        setOcrError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFileSelected(file);
    event.target.value = '';
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFileSelected(file);
    event.target.value = '';
  };

  const renderScanPreview = () => {
    if (!scanImageSrc || !scanCanvasRef.current || !scanImageRef.current) return;
    const canvas = scanCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = scanImageRef.current;
    const rotation = ((scanRotation % 360) + 360) % 360;
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const rotatedWidth = rotation % 180 === 0 ? width : height;
    const rotatedHeight = rotation % 180 === 0 ? height : width;

    const left = clamp(cropMargins.left, 0, 40) / 100;
    const right = clamp(cropMargins.right, 0, 40) / 100;
    const top = clamp(cropMargins.top, 0, 40) / 100;
    const bottom = clamp(cropMargins.bottom, 0, 40) / 100;

    const cropX = rotatedWidth * left;
    const cropY = rotatedHeight * top;
    const cropWidth = rotatedWidth * (1 - left - right);
    const cropHeight = rotatedHeight * (1 - top - bottom);

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.save();
    const brightness = 100 + scanBrightness;
    const contrast = 100 + scanContrast;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.translate(-cropX, -cropY);
    ctx.translate(
      rotation === 90 ? rotatedWidth : rotation === 270 ? 0 : 0,
      rotation === 180 ? rotatedHeight : rotation === 90 ? 0 : rotation === 270 ? rotatedHeight : 0,
    );
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    setScanPreviewSrc(canvas.toDataURL('image/png'));
  };

  useEffect(() => {
    if (!scanImageSrc) return;
    const image = new Image();
    image.src = scanImageSrc;
    image.onload = () => {
      scanImageRef.current = image;
      renderScanPreview();
    };
  }, [scanImageSrc]);

  useEffect(() => {
    if (scanImageSrc) {
      renderScanPreview();
    }
  }, [scanRotation, scanBrightness, scanContrast, cropMargins, scanImageSrc]);

  const runOcr = async () => {
    if (!scanCanvasRef.current || !scanPreviewSrc) {
      setOcrError('Please capture or upload an image first.');
      return;
    }
    setIsOcrRunning(true);
    setOcrError(null);
    setOcrProgress(0);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = (await createWorker({
        logger: (message: { status: string; progress: number }) => {
          if (message.status === 'recognizing text') {
            setOcrProgress(Math.round(message.progress * 100));
          }
        },
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core.wasm.js',
        langPath: '/tesseract',
      } as any)) as any;
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data } = await worker.recognize(scanCanvasRef.current);
      setOcrText(data.text || '');
      await worker.terminate();
    } catch (error) {
      setOcrError(error instanceof Error ? error.message : 'OCR failed.');
    } finally {
      setIsOcrRunning(false);
    }
  };

  const insertOcrText = (target: 'current' | 'new') => {
    const cleaned = ocrText.trim();
    if (!cleaned) return;
    const htmlText = cleaned
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join('');

    if (target === 'current') {
      updateActivePage({ content: `${activePage.content || ''}${htmlText}` });
    } else {
      const nextPage = createPage();
      nextPage.content = htmlText;
      if (keepScanImage && scanPreviewSrc) {
        nextPage.scans = [
          ...(nextPage.scans || []),
          { id: crypto.randomUUID(), dataUrl: scanPreviewSrc, createdAt: new Date().toISOString() },
        ];
      }
      setProjects((prev) =>
        prev.map((project) =>
          project.id === activeProjectId
            ? { ...project, pages: [...project.pages, nextPage] }
            : project,
        ),
      );
      setActivePageId(nextPage.id);
    }

    if (keepScanImage && scanPreviewSrc && target === 'current') {
      updateActivePage({
        scans: [
          ...(activePage.scans || []),
          { id: crypto.randomUUID(), dataUrl: scanPreviewSrc, createdAt: new Date().toISOString() },
        ],
      });
    }
    handleCloseScan();
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-2xl border border-gray-200 bg-white/80 p-3 sm:p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 min-w-0">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Notes → PDF
            </h1>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Notebook with typed notes plus pen, eraser, and stylus drawing.
            </p>
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-400">
            {saveError && <span>{saveError}</span>}
            {!saveError && isDirty && <span>Saving…</span>}
            {!saveError && !isDirty && lastSavedAt && <span>Saved</span>}
          </div>
        </header>

        <div ref={panelsRef} className="flex flex-col gap-4 lg:flex-row min-w-0">
          <aside
            className="w-full min-w-0 lg:flex-shrink-0"
            style={isDesktop ? { width: `${leftPanelWidth}%` } : undefined}
          >
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Project title
                  <input
                    type="text"
                    value={activeProject?.title ?? ''}
                    onChange={(event) => updateActiveProject({ title: event.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Untitled project"
                    aria-label="Project title"
                  />
                </label>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Page title
                  <input
                    type="text"
                    value={activePage?.title ?? ''}
                    onChange={(event) => updateActivePage({ title: event.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Untitled page"
                    aria-label="Page title"
                  />
                </label>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Page style
                  <select
                    value={selectedTemplateId}
                    onChange={(event) => applyNoteTemplate(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Page style"
                  >
                    {noteTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  {(noteTemplates.find((template) => template.id === selectedTemplateId)?.description ??
                    'Apply styling to the preview without changing your notes.')}
                </p>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Projects
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {projects.length}
                </span>
              </div>
              <ul className="space-y-2">
                {projects.map((project, index) => {
                  const isActive = project.id === activeProjectId;
                  return (
                    <li key={project.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveProjectId(project.id);
                          if (project.pages[0]) {
                            setActivePageId(project.pages[0].id);
                          }
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                          isActive
                            ? 'border-gray-400 bg-gray-100 text-gray-900 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-50'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                        }`}
                        aria-label={`Open project ${index + 1}`}
                        aria-pressed={isActive}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                              {index + 1}
                            </span>
                            <span className="truncate">
                              {project.title || `Untitled project ${index + 1}`}
                            </span>
                          </div>
                          <span className="text-[11px] uppercase text-gray-400 dark:text-slate-500">
                            {project.pages.length} pages
                          </span>
                        </div>
                      </button>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-gray-400 dark:text-slate-500">
                          {project.title || 'Untitled'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                          aria-label={`Delete project ${index + 1}`}
                          title="Delete project"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={handleAddProject}
                className="mt-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-200"
                aria-label="New Project"
                title="New Project"
              >
                +
              </button>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Pages
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {activeProjectPages.length}
                </span>
              </div>
              <ul className="space-y-2">
                {activeProjectPages.map((page, index) => {
                  const isActive = page.id === activePageId;
                  const previewType = resolvePageType(page.type);
                  return (
                    <li key={page.id}>
                      <button
                        type="button"
                        onClick={() => setActivePageId(page.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                          isActive
                            ? 'border-gray-400 bg-gray-100 text-gray-900 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-50'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                        }`}
                        aria-label={`Open page ${index + 1}`}
                        aria-pressed={isActive}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                              {index + 1}
                            </span>
                            <span className="truncate">
                              {page.title || `Untitled page ${index + 1}`}
                            </span>
                          </div>
                          <span className="text-[11px] uppercase text-gray-400 dark:text-slate-500">
                            {pageTypeLabels[previewType]}
                          </span>
                        </div>
                        <div
                          className="mt-2 h-10 w-full rounded-md border border-dashed border-gray-200"
                          style={getPreviewPaperStyle(page.type)}
                          aria-hidden="true"
                        />
                      </button>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-gray-400 dark:text-slate-500">
                          {page.title || 'Untitled'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePage(page.id)}
                          className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                          aria-label={`Delete page ${index + 1}`}
                          title="Delete page"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="space-y-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <span className="font-semibold uppercase tracking-wide">Text</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleInline('_')}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Italic"
                    title="Italic"
                  >
                    Italic
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleInline('*')}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Bold"
                    title="Bold"
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onClick={toggleBullets}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Insert bullet list"
                    title="Bullet list"
                  >
                    Bullets
                  </button>
                </div>
              </div>
              <div className="space-y-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <span className="font-semibold uppercase tracking-wide">Draw</span>
                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Tool
                  <select
                    value={activeTool ?? 'type'}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === 'type') {
                        setActiveTool(null);
                      } else {
                        handleToolToggle(value as Exclude<DrawTool, null>);
                      }
                    }}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    aria-label="Draw tool"
                  >
                    <option value="type">Type</option>
                    <option value="pen">Pen</option>
                    <option value="highlighter">Highlight</option>
                    <option value="eraser">Eraser</option>
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={undoAll}
                    className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    aria-label="Undo"
                    title="Undo"
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    onClick={redoAll}
                    className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    aria-label="Redo"
                    title="Redo"
                  >
                    Redo
                  </button>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <span>Size</span>
                  <input
                    type="range"
                    min={sizeSliderMin}
                    max={sizeSliderMax}
                    value={sizeSliderValue}
                    onChange={(event) => handleSizeSliderChange(Number(event.target.value))}
                    aria-label="Stroke size"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <span>Color</span>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(event) => setStrokeColor(event.target.value)}
                    aria-label="Stroke color"
                    disabled={activeTool === 'highlighter'}
                  />
                </label>
                {activeTool === 'highlighter' && (
                  <div className="flex flex-wrap items-center gap-1">
                    {HIGHLIGHTER_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setHighlighterColor(color.value)}
                        className={`h-6 w-6 rounded-full border ${
                          highlighterColor === color.value ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        aria-label={`Highlighter color ${color.name}`}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <span className="font-semibold uppercase tracking-wide">Export</span>
                <button
                  type="button"
                  onClick={openScanDialog}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  aria-label="Scan notes with camera or upload"
                  title="Scan notes (camera or upload)"
                >
                  Scan Notes
                </button>
                <select
                  value={exportSelection}
                  onChange={(event) => handleExportSelection(event.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Export options"
                  disabled={isExporting}
                >
                  <option value="">Export…</option>
                  <option value="pdf">PDF</option>
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="print">Print</option>
                </select>
                {isExporting && (
                  <span className="text-[11px] text-gray-500 dark:text-slate-400" role="status" aria-live="polite">
                    Preparing export…
                  </span>
                )}
                {exportError && (
                  <span className="text-[11px] text-red-600 dark:text-red-400" role="alert" aria-live="assertive">
                    {exportError}
                  </span>
                )}
              </div>
            </div>
          </aside>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
            onPointerDown={() => setIsResizingPanels(true)}
            className="hidden w-2 cursor-col-resize items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 lg:flex dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 text-gray-400 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 7l-4 5 4 5" />
              <path d="M16 7l4 5-4 5" />
            </svg>
          </div>

          <main className="flex-1 min-w-0 overflow-hidden">
            <div className="flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 min-w-0">
              <div 
                className="flex-1 min-h-0 overflow-auto overflow-x-auto px-2 pb-4"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div
                  ref={exportRef}
                  className="flex flex-col items-center gap-6 snap-y snap-mandatory min-w-0"
                >
                  {activeProjectPages.map((page, index) => {
                    const isActive = page.id === activePageId;
                    const view = page.view ?? DEFAULT_PAGE.view;
                    const paperStyle = getPreviewPaperStyle(page.type);
                    const textColor = previewTextColor ?? (previewIsDark ? '#ffffff' : '#000000');
                    return (
                      <article
                        key={page.id}
                        className="w-full max-w-[210mm] min-w-0 snap-start flex-shrink-0"
                        aria-label={`Page ${index + 1}`}
                      >
                        <div
                          data-export-page
                          className={`relative mx-auto overflow-hidden rounded-xl border text-sm shadow-lg ${
                            isActive
                              ? 'border-gray-300 ring-2 ring-gray-300 dark:border-slate-600 dark:ring-slate-600'
                              : 'border-gray-200 dark:border-slate-700'
                          }`}
                          style={{
                            width: '210mm',
                            height: '297mm',
                            ...paperStyle,
                          }}
                          onMouseDown={() => setActivePageId(page.id)}
                          onPointerDown={isActive ? handleViewportPointerDown : undefined}
                          onPointerMove={isActive ? handleViewportPointerMove : undefined}
                          onPointerUp={isActive ? handleViewportPointerUp : undefined}
                          onPointerCancel={isActive ? handleViewportPointerUp : undefined}
                          onWheel={isActive ? handleWheel : undefined}
                        >
                          <div
                            ref={setPageSurfaceRef(isActive)}
                            data-export-unscale
                            className="absolute left-0 top-0 h-full w-full"
                            style={{
                              transform: `translate(${view.offsetX}px, ${view.offsetY}px) scale(${view.scale})`,
                              transformOrigin: 'top left',
                            }}
                          >
                  <div
                    ref={setPageContentRef(page.id, isActive)}
                    className="relative h-full w-full"
                    style={{ padding: '15mm', boxSizing: 'border-box' }}
                  >
                    {/* Styled preview overlay - behind textarea */}
                    <div
                      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
                      style={{ padding: '15mm', boxSizing: 'border-box', color: textColor }}
                      aria-hidden="true"
                    >
                      {renderStyledFromPlain(page.content).map((line, lineIdx) => (
                        <div
                          key={lineIdx}
                          className={`whitespace-pre-wrap ${
                            line.isBullet ? 'flex gap-2 items-start' : ''
                          }`}
                          style={{
                            ...line.style,
                            fontSize: '14px',
                            lineHeight: '1.5',
                          }}
                        >
                          {line.isBullet && <span>•</span>}
                          <span>
                            {line.fragments.map((frag, fragIdx) => (
                              <span
                                key={fragIdx}
                                style={{
                                  fontWeight: frag.bold ? '700' : undefined,
                                  fontStyle: frag.italic ? 'italic' : undefined,
                                }}
                              >
                                {frag.text}
                              </span>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Transparent textarea overlay - on top of styled preview */}
                    <textarea
                      ref={(node) => {
                        setPageEditorRef(page.id)(node);
                      }}
                      aria-label={`Notebook page ${index + 1}`}
                      className={`absolute inset-0 z-[1] resize-none bg-transparent text-left outline-none ${
                        previewIsDark ? 'text-white' : 'text-black'
                      } ${activeTool ? 'pointer-events-none' : 'pointer-events-auto'}`}
                      style={{
                        direction: 'ltr',
                        unicodeBidi: 'plaintext',
                        color: 'transparent',
                        caretColor: textColor,
                        fontSize: '14px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        padding: '15mm',
                        boxSizing: 'border-box',
                      }}
                      value={page.content}
                      onChange={(event) => {
                        updatePageById(page.id, { content: event.target.value });
                        requestAnimationFrame(() => paginateOverflow(page.id));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Tab') {
                          event.preventDefault();
                          const target = event.currentTarget;
                          const { selectionStart, selectionEnd } = target;
                          const nextValue =
                            target.value.slice(0, selectionStart) + '  ' + target.value.slice(selectionEnd);
                          updatePageById(page.id, { content: nextValue });
                          requestAnimationFrame(() => {
                            target.setSelectionRange(selectionStart + 2, selectionStart + 2);
                          });
                        }
                        if (event.key === 'Enter') {
                          const { selectionStart, selectionEnd, value } = event.currentTarget;
                          const { lineStart, lineEnd } = (() => {
                            const start = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
                            const nextBreak = value.indexOf('\n', selectionStart);
                            const end = nextBreak === -1 ? value.length : nextBreak;
                            return { lineStart: start, lineEnd: end };
                          })();
                          const line = value.slice(lineStart, lineEnd);
                          if (line.startsWith('• ')) {
                            event.preventDefault();
                            if (line.trim() === '•') {
                              const next = `${value.slice(0, lineStart)}${value.slice(lineEnd + 1)}`;
                              updatePageById(page.id, { content: next });
                              requestAnimationFrame(() => {
                                event.currentTarget.setSelectionRange(lineStart, lineStart);
                              });
                              return;
                            }
                            const insert = `\n• `;
                            const nextValue = value.slice(0, selectionStart) + insert + value.slice(selectionEnd);
                            updatePageById(page.id, { content: nextValue });
                            const caret = selectionStart + insert.length;
                            requestAnimationFrame(() => {
                              event.currentTarget.setSelectionRange(caret, caret);
                            });
                            return;
                          }
                        }
                        if (event.key === 'Backspace') {
                          const target = event.currentTarget;
                          const { selectionStart, selectionEnd, value } = target;
                          if (selectionStart !== selectionEnd) return;
                          const { lineStart, lineEnd } = (() => {
                            const start = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
                            const nextBreak = value.indexOf('\n', selectionStart);
                            const end = nextBreak === -1 ? value.length : nextBreak;
                            return { lineStart: start, lineEnd: end };
                          })();
                          const line = value.slice(lineStart, lineEnd);
                          if (line.startsWith('• ') && selectionStart <= lineStart + 2 && line.trim() === '•') {
                            event.preventDefault();
                            const next = `${value.slice(0, lineStart)}${value.slice(lineStart + 2)}`;
                            updatePageById(page.id, { content: next });
                            requestAnimationFrame(() => {
                              target.setSelectionRange(lineStart, lineStart);
                            });
                          }
                        }
                      }}
                      spellCheck
                    />
                    {/* Placeholder text - positioned absolutely to match textarea */}
                    {!page?.content && (
                      <p
                        className="pointer-events-none absolute inset-0 z-[2] text-sm text-gray-400 dark:text-slate-500"
                        style={{ padding: '15mm', boxSizing: 'border-box' }}
                        aria-hidden="true"
                      >
                        Start typing your notes here…
                      </p>
                    )}
                              <canvas
                                ref={setPageCanvasRef(page.id, isActive)}
                                className={`absolute left-0 top-0 h-full w-full z-10 ${
                                  isActive && activeTool ? 'pointer-events-auto' : 'pointer-events-none'
                                }`}
                                style={{ touchAction: isActive && activeTool ? 'none' : 'auto' }}
                                aria-label="Drawing canvas layer"
                                onPointerDown={isActive ? handleCanvasPointerDown : undefined}
                                onPointerMove={isActive ? handleCanvasPointerMove : undefined}
                                onPointerUp={isActive ? handleCanvasPointerUp : undefined}
                                onPointerCancel={isActive ? handleCanvasPointerUp : undefined}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400">
                          Page {index + 1}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddPage}
                className="no-print inline-flex h-8 w-8 items-center justify-center self-center rounded-full border border-gray-200 text-base font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-200"
                aria-label="Add Page"
                title="Add Page"
              >
                +
              </button>
            </div>
          </main>
        </div>
      </section>
      {/* html2pdf Multi-Page Export Bug Fixed (Assignment + Notes) */}
      {isScanOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Scan notes"
        >
          <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Scan Notes
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Capture or upload an image, crop it, and extract text locally.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseScan}
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                aria-label="Close scan dialog"
                title="Close"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Open device camera"
                    title="Open device camera"
                  >
                    Open Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Upload image from device"
                    title="Upload image"
                  >
                    Upload Image
                  </button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCapture}
                  />
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </div>

                <div className="rounded-xl border border-dashed border-gray-200 p-3 text-sm text-gray-600 dark:border-slate-700 dark:text-slate-300">
                  {scanImageSrc ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                        <canvas ref={scanCanvasRef} className="h-auto w-full" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Capture or upload a photo to preview it here.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <span className="font-semibold uppercase tracking-wide">Controls</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Rotate
                      <select
                        value={scanRotation}
                        onChange={(event) => setScanRotation(Number(event.target.value))}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        aria-label="Rotate image"
                      >
                        <option value={0}>0°</option>
                        <option value={90}>90°</option>
                        <option value={180}>180°</option>
                        <option value={270}>270°</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Brightness
                      <input
                        type="range"
                        min={-50}
                        max={50}
                        value={scanBrightness}
                        onChange={(event) => setScanBrightness(Number(event.target.value))}
                        aria-label="Adjust brightness"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Contrast
                      <input
                        type="range"
                        min={-50}
                        max={50}
                        value={scanContrast}
                        onChange={(event) => setScanContrast(Number(event.target.value))}
                        aria-label="Adjust contrast"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Crop top
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={cropMargins.top}
                        onChange={(event) =>
                          setCropMargins((prev) => ({ ...prev, top: Number(event.target.value) }))
                        }
                        aria-label="Crop from top"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Crop right
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={cropMargins.right}
                        onChange={(event) =>
                          setCropMargins((prev) => ({
                            ...prev,
                            right: Number(event.target.value),
                          }))
                        }
                        aria-label="Crop from right"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Crop bottom
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={cropMargins.bottom}
                        onChange={(event) =>
                          setCropMargins((prev) => ({
                            ...prev,
                            bottom: Number(event.target.value),
                          }))
                        }
                        aria-label="Crop from bottom"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Crop left
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={cropMargins.left}
                        onChange={(event) =>
                          setCropMargins((prev) => ({
                            ...prev,
                            left: Number(event.target.value),
                          }))
                        }
                        aria-label="Crop from left"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={runOcr}
                    disabled={isOcrRunning}
                    className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    aria-label="Run text recognition"
                    title="Run OCR"
                  >
                    {isOcrRunning ? `Running OCR (${ocrProgress}%)` : 'Run OCR'}
                  </button>
                  {ocrError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{ocrError}</p>
                  )}
                </div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  OCR Preview
                  <textarea
                    value={ocrText}
                    onChange={(event) => setOcrText(event.target.value)}
                    className="mt-1 h-56 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Run OCR to see extracted text here."
                    aria-label="Recognized text preview"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={keepScanImage}
                    onChange={(event) => setKeepScanImage(event.target.checked)}
                    aria-label="Keep scanned image attached to page"
                  />
                  Keep scanned image on this page
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => insertOcrText('current')}
                    disabled={!ocrText.trim()}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Insert text into current page"
                    title="Insert into current page"
                  >
                    Insert to current page
                  </button>
                  <button
                    type="button"
                    onClick={() => insertOcrText('new')}
                    disabled={!ocrText.trim()}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label="Insert text into new page"
                    title="Insert into new page"
                  >
                    Insert to new page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Notes → PDF Step 5: Production Polish Implemented
// Assignment Formatter + Notes PDF Enhancements & Export Fix Implemented