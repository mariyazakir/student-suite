/**
 * Resume Export Utilities
 * 
 * Handles PDF, Image, and Print exports of resume preview.
 * Targets container with id="resume-preview"
 */

/**
 * Export resume as PDF
 */
export async function exportToPDF(): Promise<void> {
  const element = document.getElementById('resume-preview');
  if (!element) {
    throw new Error('Resume preview container not found');
  }

  // Dynamically import html2pdf to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  const opt = {
    margin: [0, 0, 0, 0] as [number, number, number, number], // No margins - A4 pages handle their own margins
    filename: 'resume.pdf',
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
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
}

/**
 * Export resume as PNG Image
 */
export async function exportToImage(): Promise<void> {
  const element = document.getElementById('resume-preview');
  if (!element) {
    throw new Error('Resume preview container not found');
  }

  // Dynamically import html2canvas
  const html2canvas = (await import('html2canvas')).default;
  
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  // Convert canvas to blob and download
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
  });
}

/**
 * Print resume
 */
export function printResume(): void {
  window.print();
}
