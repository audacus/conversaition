export type ConversationRole = 'ai' | 'human' | 'system';

export interface ConversationMessage {
  id: string;
  participant: string;
  content: string;
  role: ConversationRole;
  isStreaming: boolean;
  complete: boolean;
  timestamp?: string;
}

export interface AdapterMetaState {
  currentSpeaker: string | null;
  thinkingParticipant: string | null;
  turn: number;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
}

export interface AISDKBaseEvent<TType extends string, TData = Record<string, unknown>> {
  type: TType;
  data: TData;
}

export type AISDKStreamEvent =
  | AISDKBaseEvent<'conversation-start', { topic?: string; participants?: string[] }>
  | AISDKBaseEvent<'speaker-change', { participant?: string; turn?: number }>
  | AISDKBaseEvent<'thinking-start', { participant?: string; model?: string }>
  | AISDKBaseEvent<'text-start', { participant?: string }>
  | AISDKBaseEvent<'text-delta', { textDelta?: string; participant?: string }>
  | AISDKBaseEvent<'text-done', { participant?: string; content?: string; finishReason?: string }>
  | AISDKBaseEvent<'user-message', { content?: string; participant?: string }>
  | AISDKBaseEvent<'turn-complete', { turn?: number; totalMessages?: number }>
  | AISDKBaseEvent<'conversation-event', { eventType?: string; participant?: string; data?: Record<string, unknown> }>
  | AISDKBaseEvent<'conversation_status', { active?: boolean; paused?: boolean; participants?: string[]; topic?: string }>
  | AISDKBaseEvent<'conversation_paused', Record<string, unknown>>
  | AISDKBaseEvent<'conversation_resumed', Record<string, unknown>>
  | AISDKBaseEvent<'conversation-end', { message?: string; participants?: string[]; topic?: string }>
  | AISDKBaseEvent<'error', { error?: string; participant?: string }>
  | AISDKBaseEvent<string, Record<string, unknown>>;

export type AISDKEventHandler = (event: AISDKStreamEvent) => void;
