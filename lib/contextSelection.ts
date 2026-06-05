import { getOpenAiApiKey, TASK_MODEL, TASK_REASONING_EFFORT } from '@/lib/healthInsightsConfig';
import type { DocumentEntry } from '@/lib/documentStorage';
import type { ChatMessage } from '@/types/chat';

export interface ContextSelectionResult {
  profile: boolean;
  medication: boolean;
  documentIds: string[];
}

function usesReasoningEffort(model: string): boolean {
  const normalized = model.toLowerCase();
  return /^gpt-5\b|^o\d|^o[.-]/.test(normalized);
}

export async function selectRelevantContext(
  initialMessage: string,
  availableDocuments: DocumentEntry[],
  hasProfile: boolean,
  history: ChatMessage[] = [],
  hasMedication: boolean = false,
): Promise<ContextSelectionResult> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured.');
  }
  const taskUsesReasoning = usesReasoningEffort(TASK_MODEL);

  let availableContextText = '';
  if (hasProfile) availableContextText += '- profile: user goals, biometrics, health concerns\n';
  if (hasMedication) availableContextText += '- medication: current medicines, supplements, or treatment notes\n';

  if (availableDocuments.length > 0) {
    availableContextText += 'Available documents:\n';
    availableDocuments.forEach(doc => {
      availableContextText += `- ID: ${doc.id} | Name: "${doc.name}" | Description: "${doc.description ?? ''}" | Date: ${doc.issuedAt ?? 'Unknown'} | Type: ${doc.mimeType ?? 'Unknown'}\n`;
    });
  }

  const recentConversationText = history
    .slice(-8)
    .map(message => `${message.role}: ${message.content}`)
    .join('\n');

  const systemPrompt = `You choose what context the health assistant should inspect before answering.

Available context:
${availableContextText || 'None'}

Recent conversation:
${recentConversationText || 'No previous conversation.'}

Latest user message:
"${initialMessage}"

Decide which context should be loaded for this turn.
Use semantic relevance, not hardcoded categories. If the user says something broad like "test results" and the available document metadata shows lab reports, blood tests, imaging reports, or other test-result documents, select those documents from the start.
If the user is asking about results, documents, records, or reports and uploaded document metadata plausibly matches, select the matching document IDs so the assistant can inspect their contents.
If several uploaded documents are part of the same medical question, select all of those relevant documents.
Do not select medical documents for unrelated lifestyle, productivity, hobby, reading, work, or general wellbeing requests unless the user connects that request to those documents.
Only leave documentIds empty when the available document metadata genuinely does not identify what to inspect.
Select profile or medication when they may change the interpretation, recommendations, safety considerations, or next questions.

Return only valid JSON with this schema:
{
  "profile": boolean,
  "medication": boolean,
  "documentIds": ["string"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: TASK_MODEL,
        messages: [{ role: 'system', content: systemPrompt }],
        ...(taskUsesReasoning ? { reasoning_effort: TASK_REASONING_EFFORT } : { temperature: 0.1 }),
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to select context: ${response.status}`);
    }

    const json = await response.json();
    const raw = json.choices[0].message.content;
    const parsed = JSON.parse(raw);
    const documentIds = Array.isArray(parsed.documentIds)
      ? parsed.documentIds.filter((id: string) => availableDocuments.some(doc => doc.id === id))
      : [];

    return {
      profile: !!parsed.profile && hasProfile,
      medication: !!parsed.medication && hasMedication,
      documentIds,
    };
  } catch (err) {
    console.warn('Failed to dynamically select context:', err);
    return {
      profile: hasProfile,
      medication: hasMedication,
      documentIds: [],
    };
  }
}
