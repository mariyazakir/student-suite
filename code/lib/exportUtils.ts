type ExportDebug = {
  enabled?: boolean;
  label?: string;
};

type PageSizeMm = {
  width: number;
  height: number;
};

const waitForNextPaint = async () => {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => setTimeout(resolve, 50));
};

const waitForFonts = async () => {
  if (typeof document === 'undefined') return;
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fonts?.ready) {
    await fonts.ready;
  }
};

const waitForImages = async (root: HTMLElement) => {
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

const normalizePageSize = (pageSize: PageSizeMm) => ({
  width: Number.isFinite(pageSize.width) && pageSize.width > 0 ? pageSize.width : 210,
  height: Number.isFinite(pageSize.height) && pageSize.height > 0 ? pageSize.height : 297,
});

const setExportVisibility = () => {
  const style = document.createElement('style');
  style.dataset.exportHide = 'true';
  style.textContent = `
    body[data-exporting="true"] .no-print,
    body[data-exporting="true"] [data-export-hide="true"] {
      display: none !important;
    }
  `;
  document.body.setAttribute('data-exporting', 'true');
  document.head.appendChild(style);
  return () => {
    document.body.removeAttribute('data-exporting');
    style.remove();
  };
};

const getDebugEnabled = (debug?: ExportDebug) => {
  if (debug?.enabled !== undefined) return debug.enabled;
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('exportDebug') === 'true';
};

const logDebug = (debug: ExportDebug | undefined, message: string, extra?: unknown) => {
  if (!getDebugEnabled(debug)) return;
  const label = debug?.label ? `[${debug.label}] ` : '';
  if (extra !== undefined) {
    console.info(`${label}${message}`, extra);
  } else {
    console.info(`${label}${message}`);
  }
};

const resolveExportRoot = (exportRef: HTMLDivElement | null) => {
  if (!exportRef) {
    throw new Error('Export container not ready.');
  }
  const rect = exportRef.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    throw new Error('Export container has no visible size.');
  }
  return exportRef;
};

const resolveExportPages = (root: HTMLElement, selector: string) => {
  const pages = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
  if (pages.length === 0) {
    throw new Error('No export pages found.');
  }
  const visiblePages = pages.filter((page) => {
    const rect = page.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  if (visiblePages.length === 0) {
    throw new Error('Export pages are not ready yet.');
  }
  return visiblePages;
};

const getJsPdfCtor = async () => {
  const html2pdf = (await import('html2pdf.js')).default as any;
  const jsPDF =
    (html2pdf as any)?.jsPDF ||
    (html2pdf as any)?.default?.jsPDF ||
    (window as any)?.jspdf?.jsPDF;
  if (jsPDF) {
    return jsPDF;
  }
  try {
    const module = (await import('jspdf')) as { jsPDF?: unknown };
    if (module?.jsPDF) {
      return module.jsPDF;
    }
  } catch {
    // ignore and surface error below
  }
  throw new Error('jsPDF is not available.');
};

export const exportMultiPagePdf = async ({
  exportRef,
  pageSelector,
  filename,
  pageSize,
  debug,
}: {
  exportRef: HTMLDivElement | null;
  pageSelector: string;
  filename: string;
  pageSize: PageSizeMm;
  debug?: ExportDebug;
}) => {
  const cleanupVisibility = setExportVisibility();
  try {
    const normalizedPageSize = normalizePageSize(pageSize);
    const root = resolveExportRoot(exportRef);
    logDebug(debug, 'Export root', root);
    await waitForNextPaint();
    await waitForFonts();
    await waitForImages(root);
    const pages = resolveExportPages(root, pageSelector);
    logDebug(debug, 'Pages detected', pages.length);
    logDebug(debug, 'PDF page size', normalizedPageSize);

    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = await getJsPdfCtor();
    const pdf = new jsPDF({
      unit: 'mm',
      format: [normalizedPageSize.width, normalizedPageSize.height],
      orientation: 'portrait',
    });

    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i];
      const rect = page.getBoundingClientRect();
      const canvas = await html2canvas(page, {
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
      logDebug(debug, `Canvas ${i + 1} size`, {
        width: canvas.width,
        height: canvas.height,
      });
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Export canvas is empty.');
      }
      const imgData = canvas.toDataURL('image/png');
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'PNG', 0, 0, normalizedPageSize.width, normalizedPageSize.height);
    }

    logDebug(debug, 'PDF page count', pages.length);
    pdf.save(filename);
  } finally {
    cleanupVisibility();
  }
};

export const exportMultiPageImages = async ({
  exportRef,
  pageSelector,
  filename,
  format,
  debug,
}: {
  exportRef: HTMLDivElement | null;
  pageSelector: string;
  filename: string;
  format: 'png' | 'jpeg';
  debug?: ExportDebug;
}) => {
  const cleanupVisibility = setExportVisibility();
  try {
    const root = resolveExportRoot(exportRef);
    logDebug(debug, 'Export root', root);
    await waitForNextPaint();
    await waitForFonts();
    await waitForImages(root);
    const pages = resolveExportPages(root, pageSelector);
    logDebug(debug, 'Pages detected', pages.length);

    const html2canvas = (await import('html2canvas')).default;
    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i];
      const rect = page.getBoundingClientRect();
      const canvas = await html2canvas(page, {
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
      logDebug(debug, `Canvas ${i + 1} size`, {
        width: canvas.width,
        height: canvas.height,
      });
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Export canvas is empty.');
      }
      const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}-page-${i + 1}.${format}`;
      link.click();
    }
  } finally {
    cleanupVisibility();
  }
};

export const printMultiPage = async ({
  exportRef,
  pageSelector,
  title,
  pageSize,
  extraStyles,
}: {
  exportRef: HTMLDivElement | null;
  pageSelector: string;
  title: string;
  pageSize: PageSizeMm;
  extraStyles?: string;
}) => {
  const normalizedPageSize = normalizePageSize(pageSize);
  const root = resolveExportRoot(exportRef);
  await waitForNextPaint();
  await waitForFonts();
  await waitForImages(root);
  const pages = resolveExportPages(root, pageSelector);
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('Popup blocked.');
  const style = `
    <style>
      @page { size: ${normalizedPageSize.width}mm ${normalizedPageSize.height}mm; margin: 0; }
      body { margin: 0; }
      .export-root { display: flex; flex-direction: column; gap: 16px; }
      .export-page { page-break-after: always; break-after: page; }
      .export-page:last-child { page-break-after: auto; break-after: auto; }
      ${extraStyles ?? ''}
    </style>
  `;
  const html = pages
    .map((page) => `<div class="export-page">${page.outerHTML}</div>`)
    .join('');
  printWindow.document.write(
    `<html><head><title>${title}</title>${style}</head><body><div class="export-root">${html}</div></body></html>`,
  );
  printWindow.document.close();
  const runPrint = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
  const waitForPrintImages = () =>
    Promise.all(
      Array.from(printWindow.document.images).map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const handleDone = () => resolve();
          img.addEventListener('load', handleDone, { once: true });
          img.addEventListener('error', handleDone, { once: true });
        });
      }),
    );
  waitForPrintImages()
    .catch(() => null)
    .finally(() => {
      setTimeout(runPrint, 300);
    });
};
