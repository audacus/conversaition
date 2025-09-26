'use client';

import { useCallback, useRef, useState } from 'react';
import { AISDKStreamEvent } from '../types/ai-sdk';
import {
  ConversationMessage,
  ConversationStatus,
  ConversationStatusPayload,
} from '../types/sse';

const createMessageId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_STATUS: ConversationStatus = {
  active: false,
  paused: false,
  participants: [],
  topic: undefined,
};

const mergeStatus = (
  current: ConversationStatus,
  update: ConversationStatusPayload
): ConversationStatus => ({
  active: update.active ?? current.active,
  paused: update.paused ?? current.paused,
  participants: update.participants ?? current.participants,
  topic: update.topic ?? current.topic,
});

const extractStatusFromEvent = (
  event: AISDKStreamEvent
): ConversationStatusPayload | null => {
  if (event.type === 'conversation-start') {
    return {
      active: true,
      paused: false,
      participants: event.data.participants ?? [],
      topic: event.data.topic,
    };
  }

  if (event.type === 'conversation_status') {
    return {
      active: event.data.active,
      paused: event.data.paused,
      participants: event.data.participants,
      topic: event.data.topic,
    };
  }

  if (event.type === 'conversation_paused') {
    return { active: true, paused: true };
  }

  if (event.type === 'conversation_resumed') {
    return { active: true, paused: false };
  }

  if (event.type === 'conversation-event') {
    const nestedType = event.data?.eventType;
    const nestedData = event.data?.data as ConversationStatusPayload | undefined;

    if (nestedType === 'conversation_status' && nestedData) {
      return nestedData;
    }

    if (nestedType === 'conversation_paused') {
      return { active: true, paused: true };
    }

    if (nestedType === 'conversation_resumed') {
      return { active: true, paused: false };
    }
  }

  return null;
};

export const useAISDKAdapter = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [status, setStatus] = useState<ConversationStatus>({ ...DEFAULT_STATUS });
  const pendingMessageIdRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setMessages([]);
    setStatus({ ...DEFAULT_STATUS });
    pendingMessageIdRef.current = null;
  }, []);

  const applyStatus = useCallback((payload: ConversationStatusPayload) => {
    setStatus(prev => mergeStatus(prev, payload));
  }, []);

  const handleStreamEvent = useCallback((event: AISDKStreamEvent) => {
    switch (event.type) {
      case 'text-start': {
        const id = createMessageId(event.data.participant ?? 'participant');
        pendingMessageIdRef.current = id;
        setMessages(prev => [
          ...prev,
          {
            id,
            participant: event.data.participant,
            content: '',
            complete: false,
          },
        ]);
        break;
      }

      case 'text-delta': {
        const delta = event.data.textDelta ?? '';
        if (!delta) {
          break;
        }

        setMessages(prev => {
          if (prev.length === 0) {
            return prev;
          }

          const activeId = pendingMessageIdRef.current ?? prev[prev.length - 1].id;

          return prev.map(message =>
            message.id === activeId
              ? {
                  ...message,
                  participant: message.participant ?? event.data.participant,
                  content: `${message.content}${delta}`,
                }
              : message
          );
        });
        break;
      }

      case 'text-done': {
        const finalContent = event.data.content;
        const participant = event.data.participant;

        setMessages(prev => {
          if (prev.length === 0) {
            return prev;
          }

          const activeId = pendingMessageIdRef.current ?? prev[prev.length - 1].id;

          return prev.map(message =>
            message.id === activeId
              ? {
                  ...message,
                  participant: message.participant ?? participant,
                  content:
                    typeof finalContent === 'string' && finalContent.length > 0
                      ? finalContent
                      : message.content,
                  complete: true,
                }
              : message
          );
        });

        pendingMessageIdRef.current = null;
        break;
      }

      case 'user-message': {
        const id = createMessageId(event.data.participant ?? 'human');
        setMessages(prev => [
          ...prev,
          {
            id,
            participant: event.data.participant ?? 'Human',
            content: event.data.content ?? '',
            timestamp: new Date().toISOString(),
            complete: true,
          },
        ]);
        break;
      }

      case 'conversation-event': {
        const nestedType = event.data?.eventType;
        const payload = event.data?.data ?? {};

        if (nestedType === 'human_message_added') {
          const id = createMessageId('human');
          setMessages(prev => [
            ...prev,
            {
              id,
              participant:
                typeof payload?.participant === 'string'
                  ? payload.participant
                  : 'Human',
              content:
                typeof payload?.content === 'string' ? payload.content : '',
              timestamp:
                typeof payload?.timestamp === 'string'
                  ? payload.timestamp
                  : undefined,
              complete: true,
            },
          ]);
        }

        const statusPayload = extractStatusFromEvent(event);
        if (statusPayload) {
          applyStatus(statusPayload);
        }
        break;
      }

      default: {
        const statusPayload = extractStatusFromEvent(event);
        if (statusPayload) {
          applyStatus(statusPayload);
        }
        break;
      }
    }
  }, [applyStatus]);

  return {
    messages,
    status,
    handleStreamEvent,
    applyStatus,
    reset,
  };
};
