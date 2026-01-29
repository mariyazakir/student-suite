/**
 * PDF Tools - Merge
 */

'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type UploadFile = {
  id: string;
  file: File;
};

const ACCEPTED_TYPES = ['application/pdf'];

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

export default function MergePdfPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canMerge = files.length >= 2 && !isMerging;

  const sortedFiles = useMemo(() => files, [files]);

  const addFiles = (incoming: File[]) => {
    if (!incoming.length) return;
    const valid: UploadFile[] = [];
    const invalid: string[] = [];

    incoming.forEach((file) => {
      const isPdf = ACCEPTED_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        valid.push({ id: createUploadId(), file });
      } else {
        invalid.push(file.name);
      }
    });

    if (invalid.length) {
      setError(`Only PDF files are allowed. Invalid: ${invalid.join(', ')}`);
    } else {
      setError(null);
    }

    if (valid.length) {
      setFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = Array.from(event.target.files || []);
    addFiles(inputFiles);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    addFiles(droppedFiles);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= files.length) return;
    setFiles((prev) => {
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
    const fromIndex = files.findIndex((item) => item.id === sourceId);
    const toIndex = files.findIndex((item) => item.id === targetId);
    moveFile(fromIndex, toIndex);
    setDraggingId(null);
  };

  const handleMerge = async () => {
    if (!canMerge) return;
    setIsMerging(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();
      for (const item of files) {
        const bytes = await item.file.arrayBuffer();
        const loadedPdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (mergeError) {
      setError(mergeError instanceof Error ? mergeError.message : 'Merge failed.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="no-print">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[color:var(--topbar-text)]">
          Merge PDF
        </h1>
        <p className="text-sm text-[color:var(--topbar-muted)] mt-2">
          Combine multiple PDFs into one file.
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
            Drag & drop PDFs here
          </p>
          <p className="text-xs text-[color:var(--topbar-muted)] mt-1">
            or click to upload multiple files
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-[color:var(--sidebar-hover-bg)] text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
            aria-label="Upload PDF files"
          >
            Choose PDFs
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={handleFileInput}
            aria-label="Upload PDF files"
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
              Uploaded files
            </h2>
            <span className="text-xs text-[color:var(--topbar-muted)]">
              {files.length} file{files.length === 1 ? '' : 's'}
            </span>
          </div>

          {sortedFiles.length === 0 ? (
            <div className="rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-4 py-6 text-center text-sm text-[color:var(--topbar-muted)]">
              Add at least two PDFs to merge.
            </div>
          ) : (
            <ul className="space-y-3">
              {sortedFiles.map((item, index) => (
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
                          moveFile(index, index - 1);
                        }
                        if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          moveFile(index, index + 1);
                        }
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-hover-bg)] text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                      aria-label={`Reorder ${item.file.name}`}
                      aria-describedby={`file-name-${item.id}`}
                      title="Drag to reorder or use arrow keys"
                    >
                      ☰
                    </button>
                    <div>
                      <div
                        id={`file-name-${item.id}`}
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
                    onClick={() => removeFile(item.id)}
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
            onClick={handleMerge}
            disabled={!canMerge}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-[color:var(--sidebar-focus)] disabled:cursor-not-allowed disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
            aria-label="Merge and download PDF"
          >
            {isMerging ? 'Merging…' : 'Merge & Download'}
          </button>
        </div>
        {isMerging && (
          <div
            className="rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)]"
            role="status"
            aria-live="polite"
          >
            Merging files…
          </div>
        )}
        <p className="text-xs text-[color:var(--topbar-muted)]">
          Large PDFs may take longer to process; keep this tab open during merge.
        </p>
      </section>
    </div>
  );
}
