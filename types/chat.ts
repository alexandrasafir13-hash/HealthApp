/**
 * Chat data model for the Healthy AI assistant.
 */

// ── Panel item kinds ─────────────────────────────────────────────────────────

export type PanelItemKind = 'text' | 'bullet' | 'todo' | 'metric' | 'phase';

export interface PanelItem {
  id: string;
  kind: PanelItemKind;
  label: string;
  /** Used for metric kind (e.g. "6.2h") */
  value?: string;
  /** Used for todo kind */
  done?: boolean;
  /** Optional sub-label / description */
  sub?: string;
}

// ── Panel output (right panel content) ──────────────────────────────────────

export type PanelOutputType =
  | 'insight'
  | 'plan'
  | 'routine'
  | 'goal'
  | 'checklist'
  | 'mixed'
  | 'question'
  | 'fact'
  | 'document_note'
  | 'next_step';

export interface PanelOutput {
  type: PanelOutputType;
  title: string;
  items: PanelItem[];
}

export interface ChatQuestion {
  id: string;
  text: string;
  type: 'single' | 'multi' | 'free_text';
  options?: string[];
}

// ── Chat message ─────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Plain conversational text shown in the chat bubble */
  content: string;
  /** Optional structured data that populates the right panel */
  panel?: PanelOutput;
  /** Optional structured questions to ask the user */
  questions?: ChatQuestion[];
  /** Whether the user has answered the questions */
  answered?: boolean;
  createdAt: string;
}

// ── Case artifact (saved item in case workspace) ───────────────────────────

export type CaseArtifactType =
  | 'fact'
  | 'insight'
  | 'question'
  | 'next_step'
  | 'document_note'
  | 'timeline_event'
  | PanelOutputType; // Keep legacy types for easy mapping

export interface CaseArtifact {
  id: string;
  sessionId: string;
  sourceMessageId?: string;
  type: CaseArtifactType;
  /** Which skill produced this artifact (e.g. 'medical', 'meal-prep', 'exercise') */
  skill?: string;
  title: string;
  items: PanelItem[];
  savedAt: string;
}

// ── Chat session (one conversation) ─────────────────────────────────────────

export interface ChatSession {
  id: string;
  /** Auto-generated from first user message */
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  /** Keys of the context modules that the LLM selected as relevant for this session */
  contextKeys?: {
    profile: boolean;
    medication: boolean;
    documentIds: string[];
  };
  /** Whether the user has explicitly saved this entire request */
  isSaved?: boolean;
  /** When the session was last saved */
  savedAt?: string;
}

// ── LLM response shape ───────────────────────────────────────────────────────

export interface HealthChatResponse {
  message: string;
  panel: PanelOutput | null;
  questions?: ChatQuestion[];
}
