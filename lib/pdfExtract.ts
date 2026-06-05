import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

// Polyfill for React Native to handle pdfjs-dist if needed
// Or just export a function that takes a base64 string and returns text.

export async function extractTextFromPdfBase64(base64: string): Promise<string> {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // We must disable workers because they don't work well in React Native
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      standardFontDataUrl: '' 
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `Page ${i}:\n${pageText}\n\n`;
    }
    return fullText;
  } catch (err) {
    console.error("PDF Extraction error", err);
    return "";
  }
}
