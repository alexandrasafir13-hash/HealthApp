/**
 * Health AI chat — sends the conversation history + user context to the LLM
 * and returns { message, panel }.
 *
 * The LLM returns a JSON response with:
 *   message  — conversational text for the chat bubble
 *   panel    — optional structured data for the right panel (null if not relevant)
 */

import * as FileSystem from 'expo-file-system';
import * as base64js from 'base64-js';
import { extractText } from 'unpdf';
import type { ContextSelectionResult } from '@/lib/contextSelection';
import { getSkillInstructions } from '@/lib/skills';
import type { DocumentEntry } from '@/lib/documentStorage';
import {
  CHAT_MODEL,
  CHAT_REASONING_EFFORT,
  HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS,
  getOpenAiApiKey,
  TASK_MODEL,
  TASK_REASONING_EFFORT,
} from '@/lib/healthInsightsConfig';
import type { PlanCheckInLog } from '@/lib/planCheckInStorage';
import type { ChatMessage, HealthChatResponse, PanelOutput } from '@/types/chat';
import type { UserProfile } from '@/types/onboarding';
import type { PersonalPlan } from '@/types/plan';

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(
  profile: UserProfile | null,
  personalPlan: PersonalPlan | null,
  planCheckInLog: PlanCheckInLog,
  documents: DocumentEntry[],
  contextKeys?: ContextSelectionResult,
  history: ChatMessage[] = [],
): string {
  const includeProfile = contextKeys ? contextKeys.profile : true;
  const includeMedication = contextKeys ? contextKeys.medication : false;
  const relevantDocIds = contextKeys ? contextKeys.documentIds : [];

  let userContextText = '';
  const medications = profile?.medications ?? [];

  if (includeProfile && profile) {
    const goals = (profile.primaryInterests ?? [])
      .map((id: string) => id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      .join(', ') || 'general wellness';
    const concerns = (profile.physicalConcernIds ?? [])
      .map((id: string) => id.split('-').join(' '))
      .join(', ');
    const biometrics = [
      profile.age ? `Age: ${profile.age}` : null,
      profile.weightKg ? `Weight: ${profile.weightKg}kg` : null,
      profile.heightCm ? `Height: ${profile.heightCm}cm` : null,
      profile.restingHeartRate ? `Resting HR: ${profile.restingHeartRate} BPM` : null,
      profile.sleepDurationHrs ? `Sleep target: ${profile.sleepDurationHrs}h` : null,
    ].filter(Boolean).join(', ');

    userContextText += `Goals: ${goals}\n`;
    if (concerns) userContextText += `Health concerns: ${concerns}\n`;
    if (biometrics) userContextText += `Biometrics: ${biometrics}\n`;
  }

  if (includeMedication && medications.length > 0) {
    userContextText += `Medication: ${medications.join(', ')}\n`;
  }

  if (relevantDocIds.length > 0) {
    const relevantDocs = documents.filter(d => relevantDocIds.includes(d.id));
    if (relevantDocs.length > 0) {
      userContextText += `Relevant Documents:\n`;
      relevantDocs.forEach(doc => {
        userContextText += `- "${doc.name}": ${doc.description ?? ''} (Issued: ${doc.issuedAt ?? 'Unknown'})\n`;
      });
    }
  }

  const availableButUnloadedDocs = documents.filter(d => !relevantDocIds.includes(d.id));
  if (availableButUnloadedDocs.length > 0) {
    userContextText += `Available document metadata, not loaded as content:\n`;
    availableButUnloadedDocs.forEach(doc => {
      userContextText += `- "${doc.name}": ${doc.description ?? ''} (Issued: ${doc.issuedAt ?? 'Unknown'})\n`;
    });
  }

  const name = profile?.name ?? 'the user';

const base = `You are a personal health AI assistant for ${name}.

LANGUAGE RULE — CRITICAL: Always respond in the exact language the user wrote their chat messages in. Look only at the user's chat messages to determine language. Ignore the language of any uploaded documents, medical reports, or files — those may be in a different language and must never influence the language of your response. If the user writes in English, respond entirely in English. If the user writes in Romanian, respond entirely in Romanian. Default to English if uncertain.

DOMAIN SCOPE — CRITICAL
Only answer requests about health, wellness, behavior change, routines, habits, lifestyle, fitness, nutrition, sleep, stress, mental wellbeing, medical records, care planning, prevention, recovery, or how another topic affects those areas.
Allowed adjacent topics include things like playing fewer games, reading more books, reducing screen time, improving work-life balance, organizing time, managing cravings, building routines, or evaluating how media/work/hobbies affect sleep, mood, energy, relationships, or health goals.
Do not answer unrelated general knowledge, entertainment, news, release schedules, awards, sports, celebrity, finance, politics, trivia, or current-events questions unless the user explicitly asks how that topic connects to their health or wellness.
For out-of-scope requests, briefly say you can help only with health and wellness or how the topic connects to health. Do not provide the requested off-topic facts. Set "panel" to null and "questions" to null.

USER CONTEXT
${userContextText.trim() || 'No specific context provided for this query.'}

CONTEXT WORKFLOW
For every request, follow this loop:
1. Decide whether you already have enough context in USER CONTEXT and the conversation history.
2. If context is missing or not specific enough, ask targeted questions instead of guessing.
3. Use the user's answers and any selected context already loaded into USER CONTEXT.
4. Analyze only when the loaded information is enough to support the result.
5. If the loaded information is still not enough, ask the next smallest set of targeted questions.
6. Repeat until there is enough data to produce a useful result.

Do not pretend missing records, missing values, or missing lifestyle details are available.
Do not ask broad intake questions when a narrower question would unblock the next step.
When asking questions, keep them directly tied to the missing context needed for the user's current request.

YOUR ROLE
Help ${name} with questions about their health, routines, plans, goals, and wellbeing.
You are a case manager and health assistant. You have access to their profile and history above.
Be direct, warm, and practical. No fluff, no disclaimers unless safety requires it.
Do NOT suggest medical diagnosis. Do NOT recommend medications.
If the user is in danger, tell them to contact emergency services and set panel to null.

HOW TO RESPOND TO BROAD GOALS
When the user shares a broad health goal (e.g., "I want to lose weight", "I have recurring headaches"), do NOT immediately generate a generic plan.
Instead:
1. Acknowledge the case and their goal.
2. Ask for missing context (e.g. lifestyle, duration, specific symptoms, past efforts). ASK ONLY 5 QUESTIONS!!!!
3. Offer to organize this as a case or save their answers as key facts.
4. Optionally offer a very lightweight starting point, but avoid pretending you can personalize a plan before enough context exists.

CRITICAL INSTRUCTION FOR DOCUMENTS
If the user's request is about understanding or analyzing documents/test results and those document contents are loaded in this request, do not treat it as a broad goal that requires intake questions.
Instead, analyze the loaded documents and output the detailed findings in the "panel".
If document contents are not loaded but available document metadata appears relevant, ask the user which uploaded document/report/result they want to use. Do not ask for pasted values before asking about the available uploaded document.
If document contents are missing, or are not enough to answer the request, ask targeted questions that gather the missing context, such as which records to use, whether the user can upload/paste the values, or which result they mean.
Do not ask the user to provide or load all documents as a shortcut. Ask the smallest question that would identify the relevant document, result type, date range, or concern.
Do not invent document contents. Do not analyze test results from metadata alone.
When you need answers to clarify things, provide them in the "questions" array. Questions can be "single" (single choice), "multi" (multiple choice), or "free_text".
5. NO FREE TEXT EXCEPT AS "OTHER" OPTION

IMPORTANT: Once the user provides answers to your questions, do NOT ask the same questions again. Instead, use their answers to generate a structured insight, plan, or next steps, and move the conversation forward.

ONBOARDING HANDOFF
When the user has answered your structured questions and you have enough context to move forward:
- Do not start over.
- Do not return more questions unless one critical safety or context gap remains.
- Return the analysis, plan, or next step in "message".
- Also return a non-null "panel" so the app shows the result as a visible artifact.
- Use panel.type "plan" for a phased plan, "insight" for analysis, or "next_step" for immediate next steps.
- The user should always see what you produced after intake is complete.

RESPONSE FORMAT
You MUST always return valid JSON with this exact shape:
{
  "message": "your conversational reply here",
  "panel": null | {
    "type": "insight" | "plan" | "routine" | "goal" | "checklist" | "mixed" | "next_step",
    "title": "short panel title",
    "items": [
      {
        "id": "unique-id",
        "kind": "text" | "bullet" | "todo" | "metric" | "phase",
        "label": "item label",
        "value": "optional value for metric kind",
        "done": false,
        "sub": "optional description"
      }
    ]
  },
  "questions": [
    {
      "id": "q1",
      "text": "What is your primary focus?",
      "type": "single",
      "options": ["Weight loss", "Energy", "Sleep"]
    }
  ]
}

WHEN TO USE PANEL
Set "panel" to non-null when you are generating structured content that the user might want to save:
- An insight about their pattern or data → type: "insight", kinds: metric, bullet
- A routine or action list → type: "routine", kinds: todo
- A plan or phased approach → type: "plan", kinds: phase, bullet
- A goal or target → type: "goal", kinds: metric, bullet
- A to-do or checklist → type: "checklist", kinds: todo
- The immediate handoff after intake is complete → type: "next_step", kinds: bullet, todo

Keep panel items concise. 3-8 items is ideal. Each item must be actionable or informative.

When the user is just having a conversation (greetings, simple questions, clarifications), set panel to null.
CRITICAL: If you are returning "questions" for the user to answer, you MUST set "panel" to null. Do NOT generate a preliminary or partial plan while you are still gathering context.

IMPORTANT
- Return ONLY valid JSON. No markdown. No code blocks. No explanation outside the JSON.
- The "message" field is what appears in the chat. Keep it BRIEF (1-3 sentences max) as a natural conversational reply. Do NOT put long explanations here.
- The "panel" content is what appears in the side panel. Make it scannable, structured, and COMPREHENSIVE.
- When analyzing loaded document contents or test results, put the FULL detailed analysis, findings, and explanations entirely in the "panel". Do NOT leave out important details from the panel.
- Ask questions instead of analyzing when the needed document contents or values are not loaded or not enough for the user's request.`;

  const skillInstructions = getSkillInstructions(history);
  if (skillInstructions) {
    return (
      base +
      '\n\nSKILL INSTRUCTIONS\nThe user has completed the intake phase. The following structured guidelines define exactly how you must format your next response. Follow them precisely.\n\n' +
      skillInstructions
    );
  }

  return base;
}

// ── JSON Schema ───────────────────────────────────────────────────────────────

const PANEL_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    kind: { type: 'string', enum: ['text', 'bullet', 'todo', 'metric', 'phase'] },
    label: { type: 'string' },
    value: { type: ['string', 'null'] },
    done: { type: 'boolean' },
    sub: { type: ['string', 'null'] },
  },
  required: ['id', 'kind', 'label', 'value', 'done', 'sub'],
  additionalProperties: false,
};

const PANEL_SCHEMA = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['insight', 'plan', 'routine', 'goal', 'checklist', 'mixed', 'next_step'],
    },
    title: { type: 'string' },
    items: { type: 'array', items: PANEL_ITEM_SCHEMA },
  },
  required: ['type', 'title', 'items'],
  additionalProperties: false,
};

const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    text: { type: 'string' },
    type: { type: 'string', enum: ['single', 'multi', 'free_text'] },
    options: {
      type: ['array', 'null'],
      items: { type: 'string' }
    },
  },
  required: ['id', 'text', 'type', 'options'],
  additionalProperties: false,
};

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    panel: {
      anyOf: [PANEL_SCHEMA, { type: 'null' }],
    },
    questions: {
      anyOf: [
        { type: 'array', items: QUESTION_SCHEMA },
        { type: 'null' }
      ]
    },
  },
  required: ['message', 'panel', 'questions'],
  additionalProperties: false,
};

// ── Main function ─────────────────────────────────────────────────────────────

type QuestionTopic = 'timeline' | 'bodyMetrics' | 'activityLevel' | 'ageSex';

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ');
}

function inferQuestionTopic(text: string): QuestionTopic | null {
  const normalized = normalizeText(text);

  if (
    /\b(timeline|deadline|timeframe|time horizon)\b/.test(normalized) ||
    /\b(termen|calendar|orizont)\b/.test(normalized)
  ) {
    return 'timeline';
  }

  if (
    /\b(height|weight|cm|kg|kilogram|pound|lb)\b/.test(normalized) ||
    /\b(inaltime|înălțime|greutate)\b/.test(normalized)
  ) {
    return 'bodyMetrics';
  }

  if (
    /\b(activity level|active|sedentary|exercise|movement)\b/.test(normalized) ||
    /\b(activitate|sedentar|miscare|mișcare)\b/.test(normalized)
  ) {
    return 'activityLevel';
  }

  if (/\b(age|sex|gender|varsta|vârstă)\b/.test(normalized)) {
    return 'ageSex';
  }

  return null;
}

function inferAnsweredQuestionTopics(history: ChatMessage[]): Set<QuestionTopic> {
  const topics = new Set<QuestionTopic>();

  history
    .filter((message) => message.role === 'user')
    .forEach((message) => {
      const content = normalizeText(message.content);

      if (
        content.includes('answer:') ||
        content.includes('raspuns:') ||
        content.includes('răspuns:')
      ) {
        const topicFromAnsweredQuestion = inferQuestionTopic(content);
        if (topicFromAnsweredQuestion) {
          topics.add(topicFromAnsweredQuestion);
        }
      }

      if (/\b\d+\s*(month|months|week|weeks)\b/.test(content) || /\b\d+\s*(luni|saptamani|săptămâni)\b/.test(content)) {
        topics.add('timeline');
      }

      if (/\b\d{2,3}\s*cm\b/.test(content) || /\b\d{2,3}\s*kg\b/.test(content)) {
        topics.add('bodyMetrics');
      }

      if (/\b(sedentary|mostly sedentary|active|very active|sedentar)\b/.test(content)) {
        topics.add('activityLevel');
      }
    });

  return topics;
}

function removeRepeatedQuestions(
  questions: HealthChatResponse['questions'],
  history: ChatMessage[],
): HealthChatResponse['questions'] {
  if (!questions?.length) return undefined;

  const answeredTopics = inferAnsweredQuestionTopics(history);
  if (answeredTopics.size === 0) return questions;

  const filtered = questions.filter((question) => {
    const topic = inferQuestionTopic(question.text);
    return !topic || !answeredTopics.has(topic);
  });

  return filtered.length > 0 ? filtered : undefined;
}

function formatMessageForModel(message: ChatMessage): { role: ChatMessage['role']; content: string } {
  let content = message.content;

  if (message.role === 'assistant') {
    if (message.panel) {
      const itemsText = message.panel.items
        .map(item => `- ${item.label}${item.value ? ': ' + item.value : ''}${item.sub ? ' (' + item.sub + ')' : ''}`)
        .join('\n');
      content += `\n\n[You generated a side panel titled "${message.panel.title}" with the following contents:]\n${itemsText}`;
    }

    if (message.questions?.length) {
      const questionText = message.questions
        .map((question, index) => {
          const options = question.options?.length
            ? ` Options: ${question.options.join(', ')}.`
            : '';
          return `${index + 1}. ${question.text}${options}`;
        })
        .join('\n');

      content += `\n\nStructured questions shown to the user in the UI:\n${questionText}\nStatus: ${message.answered ? 'answered by the user' : 'not answered yet'}.`;
    }
  }

  return {
    role: message.role,
    content,
  };
}

function intakeFallbackResponse(history: ChatMessage[]): HealthChatResponse {
  const message = 'I have your answers. The next step is to turn them into a short, practical plan without restarting the intake.';

  return {
    message,
    panel: {
      type: 'next_step',
      title: 'Next step',
      items: [
        {
          id: 'next-step-1',
          kind: 'bullet',
          label: 'Use the answers already submitted for the analysis.',
          done: false,
        },
        {
          id: 'next-step-2',
          kind: 'bullet',
          label: 'Generate a visible plan, not a new conversation.',
          done: false,
        },
        {
          id: 'next-step-3',
          kind: 'todo',
          label: 'Send “continue” if generation does not resume automatically.',
          done: false,
        },
      ],
    },
    questions: undefined,
  };
}

export async function sendHealthChatMessage(
  history: ChatMessage[],
  profile: UserProfile | null,
  personalPlan: PersonalPlan | null,
  planCheckInLog: PlanCheckInLog,
  documents: DocumentEntry[] = [],
  contextKeys?: ContextSelectionResult,
): Promise<HealthChatResponse> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
  }

  const systemPrompt = buildSystemPrompt(profile, personalPlan, planCheckInLog, documents, contextKeys, history);

  // Map our internal message format to OpenAI format. Question cards are part of
  // the conversation, so include them even though they are rendered outside the
  // assistant's plain chat bubble.
  const mappedMessages = history.map(formatMessageForModel);
  const finalMessages: any[] = [{ role: 'system', content: systemPrompt }];

  const relevantDocIds = contextKeys ? contextKeys.documentIds : [];
  const relevantDocs = documents.filter(d => relevantDocIds.includes(d.id));

  const docsMessageParts: any[] = [];
  if (relevantDocs.length > 0) {
    for (const doc of relevantDocs) {
      try {
        const isPdf = doc.mimeType === 'application/pdf' || /\.(pdf)$/i.test(doc.name || doc.uri) || (doc.name || '').toLowerCase().includes('pdf') || (doc.name || '').toLowerCase().includes('analize') || (doc.name || '').toLowerCase().includes('rezultat');
        const isImage = !isPdf && (doc.mimeType?.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(doc.name || doc.uri));
        
        if (doc.textContent?.trim()) {
          docsMessageParts.push({
            type: 'text',
            text: `Content of document "${doc.name}":\n${doc.textContent}`
          });
        } else if (isPdf) {
          const base64 = await FileSystem.readAsStringAsync(doc.uri, { encoding: FileSystem.EncodingType.Base64 });
          const uint8Array = base64js.toByteArray(base64);
          const extracted = await extractText(uint8Array);
          const textContent = typeof extracted.text === 'string' ? extracted.text : extracted.text.join('\n');
          docsMessageParts.push({
            type: 'text',
            text: `Content of PDF document "${doc.name}":\n${textContent}`
          });
        } else if (isImage) {
          const base64 = await FileSystem.readAsStringAsync(doc.uri, { encoding: FileSystem.EncodingType.Base64 });
          docsMessageParts.push({
            type: 'image_url',
            image_url: {
              url: `data:${doc.mimeType || 'image/jpeg'};base64,${base64}`
            }
          });
        } else {
          const isText = doc.mimeType?.startsWith('text/') || /\.(txt|csv|json|md)$/i.test(doc.name || doc.uri);
          if (isText) {
            const textContent = await FileSystem.readAsStringAsync(doc.uri, { encoding: FileSystem.EncodingType.UTF8 });
            docsMessageParts.push({
              type: 'text',
              text: `Content of text document "${doc.name}":\n${textContent}`
            });
          }
        }
      } catch (err) {
        console.warn(`Could not read document ${doc.id} at ${doc.uri}:`, err);
      }
    }
  }

  if (docsMessageParts.length > 0) {
    finalMessages.push({
      role: 'user',
      content: [
        { type: 'text', text: 'Here are the contents of the relevant documents for your analysis:' },
        ...docsMessageParts
      ]
    });
  }

  finalMessages.push(...mappedMessages);

  let raw = '';
  let lastEmptyResponse: unknown = null;
  const tokenBudgets = [
    HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS,
    Math.max(HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS * 2, 8192),
  ];

  for (const maxCompletionTokens of tokenBudgets) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: finalMessages,
        reasoning_effort: CHAT_REASONING_EFFORT,
        max_completion_tokens: maxCompletionTokens,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'health_chat_response',
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const msg = (errJson as any)?.error?.message ?? `Request failed (${response.status})`;
      throw new Error(msg);
    }

    const json = await response.json();
    const choice = json?.choices?.[0];
    const messageObj = choice?.message;

    if (messageObj?.refusal) {
      throw new Error(`AI Refusal: ${messageObj.refusal}`);
    }

    raw = messageObj?.content?.trim() ?? '';
    if (raw) break;

    lastEmptyResponse = {
      finishReason: choice?.finish_reason,
      usage: json?.usage,
    };
  }

  if (!raw) {
    console.warn('Empty response JSON from OpenAI:', JSON.stringify(lastEmptyResponse, null, 2));
    return intakeFallbackResponse(history);
  }

  let parsed: HealthChatResponse;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // If JSON parsing fails, return the raw text as message with no panel
    return { message: raw, panel: null };
  }

  // Normalize panel — ensure required fields exist
  const panel: PanelOutput | null = parsed.panel
    ? {
      type: parsed.panel.type ?? 'mixed',
      title: parsed.panel.title ?? 'Generated Content',
      items: (parsed.panel.items ?? []).map((item: any, i: number) => ({
        id: item.id ?? `item-${i}`,
        kind: item.kind ?? 'bullet',
        label: item.label ?? '',
        value: item.value ?? undefined,
        done: item.done ?? false,
        sub: item.sub ?? undefined,
      })),
    }
    : null;

  const questions = removeRepeatedQuestions(parsed.questions, history);
  const finalPanel = panel ?? (
    parsed.questions?.length && !questions
      ? intakeFallbackResponse(history).panel
      : null
  );

  return {
    message: parsed.message ?? '',
    panel: finalPanel,
    questions,
  };
}

export async function generateTitleForRequest(requestText: string): Promise<string> {
  const apiKey = getOpenAiApiKey();
  const fallback = requestText.trim();
  const fallbackTitle = fallback.length > 50 ? fallback.slice(0, 48) + '…' : fallback;
  const taskModel = TASK_MODEL.toLowerCase();
  const usesReasoningTokens = /^gpt-5\b|^o\d|^o[.-]/.test(taskModel);

  if (!apiKey) return fallbackTitle;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: TASK_MODEL,
        ...(usesReasoningTokens ? { reasoning_effort: TASK_REASONING_EFFORT } : {}),
        messages: [
          {
            role: 'system',
            content: 'Generate a short, descriptive title (maximum 40 characters) for the following user request. Write the title in the same language as the user\'s request. Do not include quotes or extra punctuation. Only return the title itself.',
          },
          { role: 'user', content: requestText }
        ],
        max_completion_tokens: usesReasoningTokens ? 500 : 30,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.warn('Failed to generate title:', response.status, errBody);
      return fallbackTitle;
    }

    const json = await response.json();
    const title = json?.choices?.[0]?.message?.content?.trim();
    if (title) {
      return title.replace(/^["']|["']$/g, '');
    }
  } catch (err) {
    console.warn('Error generating title:', err);
  }
  return fallbackTitle;
}
