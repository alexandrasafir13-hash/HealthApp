import AsyncStorage from '@react-native-async-storage/async-storage';

const DOCUMENTS_KEY = 'healthee:documents';

export interface DocumentEntry {
  id: string;
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
  issuedAt?: string;
  description?: string;
  textContent?: string;
}

export function parseDocumentMetadata(filename: string): { name: string; issuedAt?: string } {
  let name = filename;
  let issuedAt: string | undefined;

  const dateRegex = /(\d{4}[-_]\d{2}[-_]\d{2}|\d{2}[-_]\d{2}[-_]\d{4})/;
  const match = name.match(dateRegex);
  
  if (match) {
    let dateStr = match[1].replace(/_/g, '-');
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        dateStr = `${parts[2]}-${parts[0]}-${parts[1]}`;
      }
      issuedAt = dateStr;
    }
    name = name.replace(match[0], '');
  }

  name = name.replace(/\.[^/.]+$/, '');
  name = name.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  if (!name) name = 'Untitled Document';

  return { name, issuedAt };
}

export async function loadDocuments(): Promise<DocumentEntry[]> {
  try {
    const data = await AsyncStorage.getItem(DOCUMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load documents', err);
    return [];
  }
}

export async function saveDocument(doc: DocumentEntry): Promise<void> {
  try {
    const docs = await loadDocuments();
    docs.push(doc);
    await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error('Failed to save document', err);
  }
}

export async function saveDocuments(docs: DocumentEntry[]): Promise<void> {
  await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const docs = await loadDocuments();
    const updated = docs.filter(d => d.id !== id);
    await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete document', err);
  }
}

export async function clearDocuments(): Promise<void> {
  await AsyncStorage.removeItem(DOCUMENTS_KEY);
}
