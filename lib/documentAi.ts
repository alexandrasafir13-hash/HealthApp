import { Platform } from 'react-native';
import { getOpenAiApiKey, TASK_MODEL, TASK_REASONING_EFFORT } from '@/lib/healthInsightsConfig';

// Dynamically load pdf.js from CDN on web to bypass Metro bundler issues
const loadPdfJs = async (): Promise<any> => {
  if (Platform.OS !== 'web') throw new Error('PDF parsing is only supported on web');
  
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjs);
    };
    script.onerror = () => reject(new Error('Failed to load pdf.js'));
    document.head.appendChild(script);
  });
};

export interface DocumentAIResult {
  name: string;
  description: string;
  issuedAt?: string;
  clinic?: string;
  doctor?: string;
  textContent?: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const extractPdfText = async (file: File): Promise<string> => {
  const pdfjsLib = await loadPdfJs();
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  // Extract up to 3 pages to avoid huge tokens
  const numPages = Math.min(3, pdf.numPages);
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(' ') + '\n';
  }
  
  return fullText;
};

const extractText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export async function processDocumentContents(file: File, filename: string): Promise<DocumentAIResult> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured.');
  }

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  
  let textContent = '';
  let base64Image = '';

  try {
    if (isImage) {
      base64Image = await fileToBase64(file);
    } else if (isPdf) {
      textContent = await extractPdfText(file);
    } else {
      // Assuming text or csv
      textContent = await extractText(file);
    }
  } catch (e) {
    console.warn('Failed to extract file content for AI', e);
  }

  const messages: any[] = [
    {
      role: 'system',
      content: `You are a medical document analyzer. You will be provided with a document (either image or text). 
Your job is to:
1. Extract a highly specific and descriptive name for the document based on its actual contents (e.g., "Complete Blood Count (CBC) Results", "Dr. Smith Consultation Notes", "MRI Cervical Spine Report"). Do NOT use generic names like "Medical Report" or "Unknown Document". If the document contents are too vague or you cannot determine a specific medical name, you MUST return the exact original filename.
2. Write a short, 1-2 sentence description of what the document contains, highlighting key findings if present.
3. Extract the date the document was ISSUED or created, formatted exactly as YYYY-MM-DD. If you cannot find one, omit it or set it to null. Do NOT use today's date unless you see it in the document.
4. Extract the name of the medical clinic, hospital, or laboratory where the document was issued, if present.
5. Extract the name of the doctor or healthcare provider who issued the document, if present.

You must respond ONLY with valid JSON matching this schema:
{
  "name": "string",
  "description": "string",
  "issuedAt": "string or null",
  "clinic": "string or null",
  "doctor": "string or null"
}`
    }
  ];

  let userContent: any[] = [
    { type: 'text', text: `Filename: ${filename}` }
  ];

  if (isImage && base64Image) {
    userContent.push({
      type: 'image_url',
      image_url: { url: base64Image }
    });
  } else if (textContent) {
    // Truncate text content to avoid token limits
    userContent.push({
      type: 'text',
      text: `Document Content:\n${textContent.slice(0, 15000)}`
    });
  }

  messages.push({
    role: 'user',
    content: userContent
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: TASK_MODEL, // The configured task model needs to support vision
      messages,
      reasoning_effort: TASK_REASONING_EFFORT,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API failed: ${response.status}`);
  }

  const json = await response.json();
  const raw = json.choices[0].message.content;
  const parsed = JSON.parse(raw);

  return {
    name: parsed.name || filename,
    description: parsed.description || 'No description available.',
    issuedAt: parsed.issuedAt || undefined,
    clinic: parsed.clinic || undefined,
    doctor: parsed.doctor || undefined,
    textContent: textContent || undefined,
  };
}
