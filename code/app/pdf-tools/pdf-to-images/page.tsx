/**
 * PDF Tools - PDF to Images
 */

'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type ImageFormat = 'png' | 'jpg';
type JpgQuality = 'low' | 'medium' | 'high';
type ScaleOption = 1 | 2 | 3;

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

const qualityMap: Record<JpgQuality, number> = {
  low: 0.6,
  medium: 0.8,
  high: 0.92,
};

export default function PdfToImagesPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState<JpgQuality>('medium');
  const [scale, setScale] = useState<ScaleOption>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
    setProgress(null);
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
    setError(null);
    setProgress(null);
    setStatusMessage(null);
  };

  const canConvert = Boolean(file) && !isProcessing;

  const renderPageToBlob = async (
    page: any,
    imageFormat: ImageFormat,
    jpgQuality: JpgQuality,
    scaleValue: number,
  ) => {
    const viewport = page.getViewport({ scale: scaleValue });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas is not available.');
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const mimeType = imageFormat === 'png' ? 'image/png' : 'image/jpeg';
    const qualityValue = imageFormat === 'png' ? undefined : qualityMap[jpgQuality];
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => {
          if (!value) {
            reject(new Error('Failed to render image.'));
          } else {
            resolve(value);
          }
        },
        mimeType,
        qualityValue,
      );
    });
    return blob;
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(null);
    setStatusMessage(null);
    try {
      const { GlobalWorkerOptions, getDocument } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const bytes = await file.arrayBuffer();
      const loadingTask = getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      const total = pdf.numPages;
      setProgress({ current: 0, total });

      if (total === 1) {
        setStatusMessage('Rendering page 1 of 1…');
        const page = await pdf.getPage(1);
        const blob = await renderPageToBlob(page, format, quality, scale);
        downloadBlob(blob, `page-1.${format}`);
        setProgress(null);
        setStatusMessage(null);
        return;
      }

      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
        setProgress({ current: pageNumber, total });
        setStatusMessage(`Rendering page ${pageNumber} of ${total}…`);
        const page = await pdf.getPage(pageNumber);
        const blob = await renderPageToBlob(page, format, quality, scale);
        zip.file(`page-${pageNumber}.${format}`, blob);
      }
      setStatusMessage('Creating ZIP file…');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'pdf-images.zip');
      setProgress(null);
      setStatusMessage(null);
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : 'Conversion failed.');
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
      setProgress(null);
    }
  };

  return (
    <div className="no-print">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[color:var(--topbar-text)]">
          PDF → Images
        </h1>
        <p className="text-sm text-[color:var(--topbar-muted)] mt-2">
          Convert each PDF page into image files.
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
          <h2 className="text-base font-semibold text-[color:var(--topbar-text)]">
            Conversion options
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm text-[color:var(--topbar-text)]">
              Image format
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value as ImageFormat)}
                className="mt-1 w-full rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                aria-label="Image format"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
              </select>
            </label>
            <label className="text-sm text-[color:var(--topbar-text)]">
              JPG quality
              <select
                value={quality}
                onChange={(event) => setQuality(event.target.value as JpgQuality)}
                disabled={format !== 'jpg'}
                className="mt-1 w-full rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)] disabled:opacity-60"
                aria-label="JPG quality"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="text-sm text-[color:var(--topbar-text)]">
              Resolution scale
              <select
                value={scale}
                onChange={(event) => setScale(Number(event.target.value) as ScaleOption)}
                className="mt-1 w-full rounded-md border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)] focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
                aria-label="Resolution scale"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
              </select>
            </label>
          </div>
        </div>

        {(progress || statusMessage) && (
          <div
            className="rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] px-3 py-2 text-sm text-[color:var(--topbar-text)]"
            role="status"
            aria-live="polite"
          >
            {statusMessage ||
              (progress && `Converting page ${progress.current} of ${progress.total}…`) ||
              null}
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
            onClick={handleConvert}
            disabled={!canConvert}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-[color:var(--sidebar-focus)] disabled:cursor-not-allowed disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[color:var(--sidebar-focus)]"
            aria-label="Convert PDF to images"
          >
            {isProcessing ? 'Converting…' : 'Convert to Images'}
          </button>
        </div>
        <p className="text-xs text-[color:var(--topbar-muted)]">
          Large PDFs may take longer to render and zip; keep this tab open during processing.
        </p>
      </section>

      {/* PDF Tools: PDF to Images Implemented */}
      {/* QA P0/P1 Fixes Applied – Ready for Launch */}
    </div>
  );
}
