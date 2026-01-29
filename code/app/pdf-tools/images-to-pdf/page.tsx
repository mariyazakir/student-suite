/**
 * PDF Tools - Images to PDF
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type UploadImage = {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
};

type PageSize = 'a4' | 'letter';
type Orientation = 'portrait' | 'landscape';
type FitMode = 'fit' | 'fill' | 'actual';
type MarginSize = 'none' | 'small' | 'medium' | 'large';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

const MARGIN_MAP: Record<MarginSize, number> = {
  none: 0,
  small: 18,
  medium: 36,
  large: 54,
};

const formatBytes = (size: number) => {
  if (!Number.isFinite(size)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const createUploadId = () => (typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()));

const isSupportedImage = (file: File) => {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

const loadImageDimensions = (url: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Unable to load image.'));
    img.src = url;
  });

const webpToPngBytes = async (file: File) => {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Image conversion failed.');
    }
    context.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (!value) {
          reject(new Error('Image conversion failed.'));
        } else {
          resolve(value);
        }
      }, 'image/png');
    });
    return new Uint8Array(await blob.arrayBuffer());
  }
  // Fallback for browsers without createImageBitmap (e.g., Safari)
  const img = document.createElement('img');
  const url = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image conversion failed.'));
    img.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    URL.revokeObjectURL(url);
    throw new Error('Image conversion failed.');
  }
  context.drawImage(img, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (!value) {
        reject(new Error('Image conversion failed.'));
      } else {
        resolve(value);
      }
    }, 'image/png');
  });
  URL.revokeObjectURL(url);
  return new Uint8Array(await blob.arrayBuffer());
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function ImagesToPdfPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<UploadImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [fitMode, setFitMode] = useState<FitMode>('fit');
  const [margin, setMargin] = useState<MarginSize>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [images]);

  const addFiles = async (incoming: File[]) => {
    if (!incoming.length) return;
    const valid: File[] = [];
    const invalid: string[] = [];

    incoming.forEach((file) => {
      if (isSupportedImage(file)) {
        valid.push(file);
      } else {
        invalid.push(file.name);
      }
    });

    if (invalid.length) {
      setError(`Unsupported format: ${invalid.join(', ')}`);
    } else {
      setError(null);
    }

    if (!valid.length) return;

    const uploads: UploadImage[] = [];
    for (const file of valid) {
      const url = URL.createObjectURL(file);
      try {
        const { width, height } = await loadImageDimensions(url);
        uploads.push({ id: createUploadId(), file, url, width, height });
      } catch (loadError) {
        URL.revokeObjectURL(url);
        setError(loadError instanceof Error ? loadError.message : 'Failed to read an image.');
      }
    }

    if (uploads.length) {
      setImages((prev) => [...prev, ...uploads]);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    addFiles(selected);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = Array.from(event.dataTransfer.files || []);
    addFiles(dropped);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDragStart = (id: string) => (event: React.DragEvent<HTMLButtonElement>) => {
    setDraggingId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  };

  const handleDropOnItem = (targetId: string) => (event: React.DragEvent<HTMLLIElement>) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain') || draggingId;
    if (!sourceId || sourceId === targetId) return;
    const fromIndex = images.findIndex((item) => item.id === sourceId);
    const toIndex = images.findIndex((item) => item.id === targetId);
    moveImage(fromIndex, toIndex);
    setDraggingId(null);
  };

  const canConvert = images.length > 0 && !isProcessing;

  const handleConvert = async () => {
    if (!canConvert) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const baseSize = PAGE_SIZES[pageSize];
      const pageWidth = orientation === 'portrait' ? baseSize.width : baseSize.height;
      const pageHeight = orientation === 'portrait' ? baseSize.height : baseSize.width;
      const marginSize = MARGIN_MAP[margin];
      const availableWidth = pageWidth - marginSize * 2;
      const availableHeight = pageHeight - marginSize * 2;

      for (const image of images) {
        const bytes = await image.file.arrayBuffer();
        let embedded;
        if (image.file.type === 'image/png') {
          embedded = await pdfDoc.embedPng(bytes);
        } else if (image.file.type === 'image/webp') {
          const pngBytes = await webpToPngBytes(image.file);
          embedded = await pdfDoc.embedPng(pngBytes);
        } else {
          embedded = await pdfDoc.embedJpg(bytes);
        }

        const imgWidth = embedded.width;
        const imgHeight = embedded.height;

        let scale = 1;
        if (fitMode === 'fit') {
          scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        } else if (fitMode === 'fill') {
          scale = Math.max(availableWidth / imgWidth, availableHeight / imgHeight);
        } else {
          const maxScale = Math.min(1, availableWidth / imgWidth, availableHeight / imgHeight);
          scale = maxScale;
        }

        const drawWidth = imgWidth * scale;
        const drawHeight = imgHeight * scale;
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawRectangle({
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
          color: rgb(1, 1, 1),
        });
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;
        page.drawImage(embedded, { x, y, width: drawWidth, height: drawHeight });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      downloadBlob(blob, 'images-to-pdf.pdf');
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : 'Conversion failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="no-print">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[color:var(--topbar-text)]">
          Images → PDF
        </h1>
        <p className="text-sm text-[color:var(--topbar-muted)] mt-2">
          Convert multiple images into a single PDF.
        </p>
      </header>

      <section className="space-y-6">
        <div
          className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
            dragActive
              ? 'border-[color:var(--sidebar-focus)] bg-[color:var(--sidebar-hover-bg)]'
              : 'border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)]'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <p className="text-sm text-[color:var(--topbar-text)] font-medium">
            Drag & drop images here
          </p>
          <p className="text-xs text-[color:var(--topbar-muted)] mt-1">
            or click to upload JPG, PNG, or WEBP
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-[color:var(--sidebar-hover-bg)] text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
            aria-label="Upload image files"
          >
            Choose images
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileInput}
            aria-label="Upload image files"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[color:var(--topbar-text)]">
              Uploaded images
            </h2>
            <span className="text-xs text-[color:var(--topbar-muted)]">
              {images.length} image{images.length === 1 ? '' : 's'}
            </span>
          </div>

          {images.length === 0 ? (
            <div className="rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-4 py-6 text-center text-sm text-[color:var(--topbar-muted)]">
              Add at least one image to begin.
            </div>
          ) : (
            <ul className="space-y-3">
              {images.map((item, index) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-3 sm:flex-row sm:items-center sm:justify-between"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDropOnItem(item.id)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      draggable
                      onDragStart={handleDragStart(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowUp') {
                          event.preventDefault();
                          moveImage(index, index - 1);
                        }
                        if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          moveImage(index, index + 1);
                        }
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-hover-bg)] text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                      aria-label={`Reorder ${item.file.name}`}
                      aria-describedby={`image-name-${item.id}`}
                      title="Drag to reorder or use arrow keys"
                    >
                      ☰
                    </button>
                    <div className="h-14 w-14 flex items-center justify-center rounded-md border border-[color:var(--sidebar-border)] bg-white">
                      <img
                        src={item.url}
                        alt={item.file.name}
                        className="h-full w-full rounded-md object-cover"
                      />
                    </div>
                    <div>
                      <div
                        id={`image-name-${item.id}`}
                        className="text-sm font-medium text-[color:var(--topbar-text)]"
                      >
                        {item.file.name}
                      </div>
                      <div className="text-xs text-[color:var(--topbar-muted)]">
                        {formatBytes(item.file.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(item.id)}
                    className="self-start rounded-md px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)] sm:self-center"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    ✕ Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[color:var(--topbar-text)]">Page settings</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm text-[color:var(--topbar-text)]">
              Page size
              <select
                value={pageSize}
                onChange={(event) => setPageSize(event.target.value as PageSize)}
                className="mt-1 w-full rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                aria-label="Page size"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </label>
            <label className="text-sm text-[color:var(--topbar-text)]">
              Orientation
              <select
                value={orientation}
                onChange={(event) => setOrientation(event.target.value as Orientation)}
                className="mt-1 w-full rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                aria-label="Page orientation"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
            <label className="text-sm text-[color:var(--topbar-text)]">
              Image fit
              <select
                value={fitMode}
                onChange={(event) => setFitMode(event.target.value as FitMode)}
                className="mt-1 w-full rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                aria-label="Image fit mode"
              >
                <option value="fit">Fit to page</option>
                <option value="fill">Fill page</option>
                <option value="actual">Actual size</option>
              </select>
            </label>
            <label className="text-sm text-[color:var(--topbar-text)]">
              Page margin
              <select
                value={margin}
                onChange={(event) => setMargin(event.target.value as MarginSize)}
                className="mt-1 w-full rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                aria-label="Page margin"
              >
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/pdf-tools"
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium bg-[color:var(--sidebar-hover-bg)] text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
            aria-label="Back to PDF Tools"
          >
            Back to PDF Tools
          </Link>
          <button
            type="button"
            onClick={handleConvert}
            disabled={!canConvert}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-[color:var(--sidebar-focus)] disabled:cursor-not-allowed disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
            aria-label="Convert images to PDF"
          >
            {isProcessing ? 'Converting…' : 'Convert to PDF'}
          </button>
        </div>
        <p className="text-xs text-[color:var(--topbar-muted)]">
          Large or numerous images may take longer to convert; keep this tab open.
        </p>
      </section>

      {/* PDF Tools: Images to PDF Implemented */}
    </div>
  );
}
