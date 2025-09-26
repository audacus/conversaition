export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

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
