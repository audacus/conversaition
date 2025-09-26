export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface ConversationMessage {
  id: string;
  content: string;
  participant?: string;
  timestamp?: string;
  complete: boolean;
}

export interface ConversationStatus {
  active: boolean;
  paused: boolean;
  participants: string[];
  topic?: string;
}

export interface ConversationStatusPayload {
  active?: boolean;
  paused?: boolean;
  participants?: string[];
  topic?: string;
}
