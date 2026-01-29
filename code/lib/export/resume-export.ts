/**
 * Resume Export Utilities
 * 
 * Handles PDF, Image, and Print exports of resume preview.
 * Targets container with id="resume-preview"
 */

const A4_MM = { width: 210, height: 297 };

/**
 * Force element to full A4 width so mobile capture is not compressed horizontally/vertically.
 */
function prepareResumeForCapture(el: HTMLElement): () => void {
  const saved: Array<{ el: HTMLElement; prop: string; value: string }> = [];
  const save = (e: HTMLElement, prop: string) => {
    saved.push({ el: e, prop, value: e.style.getPropertyValue(prop) || '' });
  };
  save(el, 'width');
  save(el, 'max-width');
  save(el, 'min-width');
  save(el, 'overflow');
  el.style.setProperty('width', `${A4_MM.width}mm`);
  el.style.setProperty('max-width', `${A4_MM.width}mm`);
  el.style.setProperty('min-width', `${A4_MM.width}mm`);
  el.style.setProperty('overflow', 'visible');
  return () => {
    saved.forEach(({ el: e, prop, value }) => e.style.setProperty(prop, value));
  };
}

/**
 * Export resume as PDF
 */
export async function exportToPDF(): Promise<void> {
  const element = document.getElementById('resume-preview');
  if (!element) {
    throw new Error('Resume preview container not found');
  }

  const restore = prepareResumeForCapture(element as HTMLElement);
  try {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: [0, 0, 0, 0] as [number, number, number, number],
      filename: 'resume.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: Math.ceil((A4_MM.width / 25.4) * 96),
        windowHeight: Math.ceil((A4_MM.height / 25.4) * 96),
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['section', '.a4-page-content > section', '.a4-page-content-wrapper'],
      },
    };

    await html2pdf().set(opt).from(element).save();
  } finally {
    restore();
  }
}

/**
 * Export resume as PNG Image
 */
export async function exportToImage(): Promise<void> {
  const element = document.getElementById('resume-preview');
  if (!element) {
    throw new Error('Resume preview container not found');
  }

  const restore = prepareResumeForCapture(element as HTMLElement);
  try {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    const html2canvas = (await import('html2canvas')).default;
    const w = Math.ceil((A4_MM.width / 25.4) * 96);
    const h = Math.ceil((A4_MM.height / 25.4) * 96);
    const canvas = await html2canvas(element as HTMLElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: w,
      windowHeight: h,
    });

    return new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'resume.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    }).finally(restore);
  } catch (e) {
    restore();
    throw e;
  }
}

/**
 * Print resume
 */
export function printResume(): void {
  window.print();
}
