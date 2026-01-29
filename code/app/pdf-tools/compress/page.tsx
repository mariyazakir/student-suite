/**
 * PDF Tools - Compress
 */

'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type CompressionLevel = 'low' | 'medium' | 'high';

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

export default function CompressPdfPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  const uploadLabel = useMemo(() => (file ? 'Replace PDF' : 'Choose PDF'), [file]);

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
    setResult(null);
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
    setResult(null);
    setError(null);
  };

  const canCompress = Boolean(file) && !isProcessing;

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const source = await PDFDocument.load(bytes);

      const compressedDoc = await PDFDocument.create();
      const pages = await compressedDoc.copyPages(source, source.getPageIndices());
      pages.forEach((page) => compressedDoc.addPage(page));

      compressedDoc.setTitle('');
      compressedDoc.setSubject('');
      compressedDoc.setAuthor('');
      compressedDoc.setKeywords([]);
      compressedDoc.setProducer('Student Suite');

      const useObjectStreams = level !== 'low';
      const saveBytes = await compressedDoc.save({
        useObjectStreams,
      });

      const blob = new Blob([new Uint8Array(saveBytes)], { type: 'application/pdf' });
      downloadBlob(blob, 'compressed.pdf');
      setResult({ originalSize: file.size, compressedSize: blob.size });
    } catch (compressError) {
      setError(compressError instanceof Error ? compressError.message : 'Compression failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reductionPercent = useMemo(() => {
    if (!result) return null;
    if (result.originalSize === 0) return 0;
    const reduced = Math.max(0, result.originalSize - result.compressedSize);
    return Math.round((reduced / result.originalSize) * 100);
  }, [result]);

  return (
    <div className="no-print">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[color:var(--topbar-text)]">
          Compress PDF
        </h1>
        <p className="text-sm text-[color:var(--topbar-muted)] mt-2">
          Reduce PDF file size while keeping text readable.
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

        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[color:var(--topbar-text)]">
            Compression level
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                key: 'low',
                label: 'Low (Best Quality)',
                description: 'Minimal changes. Best for preserving layout.',
              },
              {
                key: 'medium',
                label: 'Medium (Balanced)',
                description: 'Re-saves PDF with optimized structure.',
              },
              {
                key: 'high',
                label: 'High (Maximum Compression)',
                description: 'Aggressive structure cleanup for smaller size.',
              },
            ].map((option) => (
              <label
                key={option.key}
                className={`flex cursor-pointer flex-col gap-2 rounded-lg border px-4 py-3 text-sm focus-within:outline focus-within:outline-2 focus-within:outline-[color:var(--sidebar-focus)] ${
                  level === option.key
                    ? 'border-[color:var(--sidebar-focus)] bg-[color:var(--sidebar-hover-bg)]'
                    : 'border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="compression-level"
                    value={option.key}
                    checked={level === option.key}
                    onChange={() => setLevel(option.key as CompressionLevel)}
                    className="mt-1"
                    aria-label={option.label}
                  />
                  <div className="text-[color:var(--topbar-text)] font-medium">{option.label}</div>
                </div>
                <p className="text-xs text-[color:var(--topbar-muted)]">{option.description}</p>
              </label>
            ))}
          </div>
        </div>

        {result && (
          <div className="rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 text-sm text-[color:var(--topbar-text)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <span>Original: {formatBytes(result.originalSize)}</span>
              <span>Compressed: {formatBytes(result.compressedSize)}</span>
              <span>Reduced: {reductionPercent ?? 0}%</span>
            </div>
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
            onClick={handleCompress}
            disabled={!canCompress}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-[color:var(--sidebar-focus)] disabled:cursor-not-allowed disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
            aria-label="Compress and download PDF"
          >
            {isProcessing ? 'Compressing…' : 'Compress & Download'}
          </button>
        </div>
        {isProcessing && (
          <div
            className="rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)]"
            role="status"
            aria-live="polite"
          >
            Compressing PDF…
          </div>
        )}
        <p className="text-xs text-[color:var(--topbar-muted)]">
          Large PDFs with many images may take longer to compress; keep this tab open.
        </p>
      </section>

      {/* PDF Tools: Compress PDF Implemented */}
    </div>
  );
}
