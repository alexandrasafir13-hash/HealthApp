import { createContext, useContext, useState, ReactNode } from 'react';
import { DocumentEntry } from '@/lib/documentStorage';

interface DocumentContextType {
  selectedDocument: DocumentEntry | null;
  setSelectedDocument: (doc: DocumentEntry | null) => void;
  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [selectedDocument, setSelectedDocument] = useState<DocumentEntry | null>(null);
  const [isPanelOpen, setPanelOpen] = useState(false);

  return (
    <DocumentContext.Provider
      value={{
        selectedDocument,
        setSelectedDocument,
        isPanelOpen,
        setPanelOpen,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocumentContext() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
}
