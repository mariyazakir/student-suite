/**
 * PDF Tools - Split
 */

'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { PDFDocument } from 'pdf-lib';

type SplitMode = 'range' | 'specific' | 'all';

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

const parseSpecificPages = (input: string) => {
  if (!input.trim()) return [];
  const parts = input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const pages: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return null;
    }
    const page = Number(part);
    pages.push(page);
  }
  return pages;
};

export default function SplitPdfPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('range');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [specificPages, setSpecificPages] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadLabel = useMemo(() => (file ? 'Replace PDF' : 'Choose PDF'), [file]);

  const resetInputs = () => {
    setRangeStart('');
    setRangeEnd('');
    setSpecificPages('');
  };

  const handleFile = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    const isPdf = ACCEPTED_TYPES.includes(selectedFile.type) || selectedFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Only PDF files are allowed.');
      setFile(null);
      setPageCount(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
    resetInputs();
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await selectedFile.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to read PDF.');
      setFile(null);
      setPageCount(null);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    handleFile(selected);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0] || null;
    handleFile(dropped);
  };

  const clearFile = () => {
    setFile(null);
    setPageCount(null);
    resetInputs();
    setError(null);
  };

  const validationError = useMemo(() => {
    if (!file || !pageCount) return 'Upload a PDF to continue.';
    if (splitMode === 'range') {
      if (!rangeStart.trim() || !rangeEnd.trim()) return 'Enter a start and end page.';
      const start = Number(rangeStart);
      const end = Number(rangeEnd);
      if (!Number.isInteger(start) || !Number.isInteger(end)) return 'Pages must be numbers.';
      if (start < 1 || end < 1) return 'Pages must be 1 or greater.';
      if (start > end) return 'Start page must be before end page.';
      if (end > pageCount) return 'End page is out of range.';
      return null;
    }
    if (splitMode === 'specific') {
      if (!specificPages.trim()) return 'Enter page numbers to extract.';
      const parsed = parseSpecificPages(specificPages);
      if (!parsed) return 'Use comma-separated numbers only.';
      if (!parsed.length) return 'Enter at least one page.';
      if (parsed.some((page) => page < 1)) return 'Pages must be 1 or greater.';
      if (parsed.some((page) => page > pageCount)) return 'One or more pages are out of range.';
      return null;
    }
    return null;
  }, [file, pageCount, rangeStart, rangeEnd, specificPages, splitMode]);

  const canSplit = !validationError && !isProcessing;

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

  const buildPdfFromPages = async (source: PDFDocument, pages: number[]) => {
    const { PDFDocument } = await import('pdf-lib');
    const output = await PDFDocument.create();
    const copied = await output.copyPages(source, pages);
    copied.forEach((page) => output.addPage(page));
    const bytes = await output.save();
    return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  };

  const handleSplit = async () => {
    if (!file || !pageCount || validationError) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const source = await PDFDocument.load(bytes);
      if (splitMode === 'all') {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        for (let index = 0; index < pageCount; index += 1) {
          const blob = await buildPdfFromPages(source, [index]);
          zip.file(`split-page-${index + 1}.pdf`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, 'split-pages.zip');
        return;
      }

      if (splitMode === 'range') {
        const start = Number(rangeStart);
        const end = Number(rangeEnd);
        const indexes = Array.from({ length: end - start + 1 }, (_, i) => i + start - 1);
        const blob = await buildPdfFromPages(source, indexes);
        downloadBlob(blob, `split-pages-${start}-${end}.pdf`);
        return;
      }

      const parsed = parseSpecificPages(specificPages) || [];
      const uniquePages = Array.from(new Set(parsed)).sort((a, b) => a - b);
      if (uniquePages.length === 1) {
        const blob = await buildPdfFromPages(source, [uniquePages[0] - 1]);
        downloadBlob(blob, `split-page-${uniquePages[0]}.pdf`);
        return;
      }
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      for (const page of uniquePages) {
        const blob = await buildPdfFromPages(source, [page - 1]);
        zip.file(`split-page-${page}.pdf`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'split-pages.zip');
    } catch (splitError) {
      setError(splitError instanceof Error ? splitError.message : 'Split failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="no-print">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[color:var(--topbar-text)]">
          Split PDF
        </h1>
        <p className="text-sm text-[color:var(--topbar-muted)] mt-2">
          Extract pages or split PDFs by range.
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
            Drag & drop a PDF here
          </p>
          <p className="text-xs text-[color:var(--topbar-muted)] mt-1">or click to upload</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-[color:var(--sidebar-hover-bg)] text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
            aria-label="Upload PDF file"
          >
            {uploadLabel}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleInputChange}
            aria-label="Upload PDF file"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {file && pageCount && (
          <div className="rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium text-[color:var(--topbar-text)]">
                  {file.name}
                </div>
                <div className="text-xs text-[color:var(--topbar-muted)]">
                  {formatBytes(file.size)} · {pageCount} page{pageCount === 1 ? '' : 's'}
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="self-start rounded-md px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)] sm:self-center"
                aria-label="Remove uploaded PDF"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[color:var(--topbar-text)]">Split options</h2>
          <div className="grid gap-4 rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:grid-cols-3">
            {([
              { key: 'range', label: 'Extract page range' },
              { key: 'specific', label: 'Extract specific pages' },
              { key: 'all', label: 'Split all pages' },
            ] as const).map((option) => (
              <label
                key={option.key}
                className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm focus-within:outline focus-within:outline-2 focus-within:outline-[color:var(--sidebar-focus)] ${
                  splitMode === option.key
                    ? 'border-[color:var(--sidebar-focus)] bg-[color:var(--sidebar-hover-bg)]'
                    : 'border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="split-mode"
                  value={option.key}
                  checked={splitMode === option.key}
                  onChange={() => setSplitMode(option.key)}
                  className="mt-1"
                  aria-label={option.label}
                />
                <span className="text-[color:var(--topbar-text)]">{option.label}</span>
              </label>
            ))}
          </div>

          {splitMode === 'range' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-[color:var(--topbar-text)]">
                Start page
                <input
                  type="number"
                  min={1}
                  value={rangeStart}
                  onChange={(event) => setRangeStart(event.target.value)}
                  className="mt-1 w-full rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                  aria-label="Start page"
                />
              </label>
              <label className="text-sm text-[color:var(--topbar-text)]">
                End page
                <input
                  type="number"
                  min={1}
                  value={rangeEnd}
                  onChange={(event) => setRangeEnd(event.target.value)}
                  className="mt-1 w-full rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                  aria-label="End page"
                />
              </label>
            </div>
          )}

          {splitMode === 'specific' && (
            <label className="text-sm text-[color:var(--topbar-text)]">
              Page numbers (comma-separated)
              <input
                type="text"
                value={specificPages}
                onChange={(event) => setSpecificPages(event.target.value)}
                placeholder="1,3,5"
                className="mt-1 w-full rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                aria-label="Specific pages"
              />
            </label>
          )}

          {splitMode === 'all' && (
            <p className="text-sm text-[color:var(--topbar-muted)]">
              Each page will be saved as a separate PDF.
            </p>
          )}
        </div>

        {validationError && file && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {validationError}
          </div>
        )}

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
            onClick={handleSplit}
            disabled={!canSplit}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-[color:var(--sidebar-focus)] disabled:cursor-not-allowed disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
            aria-label="Split and download PDFs"
          >
            {isProcessing ? 'Splitting…' : 'Split & Download'}
          </button>
        </div>
        {isProcessing && (
          <div
            className="rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)]"
            role="status"
            aria-live="polite"
          >
            Processing split…
          </div>
        )}
        <p className="text-xs text-[color:var(--topbar-muted)]">
          Large PDFs with many pages may take longer to split; keep this tab open.
        </p>
      </section>

      {/* PDF Tools: Split PDF Implemented */}
    </div>
  );
}
