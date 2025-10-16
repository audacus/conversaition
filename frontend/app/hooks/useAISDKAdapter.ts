'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  AISDKStreamEvent,
  AdapterMetaState,
  ConversationMessage,
} from '../types/ai-sdk';
import {
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

const INITIAL_META_STATE: AdapterMetaState = {
  currentSpeaker: null,
  thinkingParticipant: null,
  turn: 0,
  startedAt: null,
  endedAt: null,
  durationSeconds: 0,
  humanInputRequested: false,
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
  const [meta, setMeta] = useState<AdapterMetaState>(INITIAL_META_STATE);
  const pendingMessageIdRef = useRef<string | null>(null);
  const messageCreationGuardRef = useRef<Set<string>>(new Set());

  const reset = useCallback(() => {
    setMessages([]);
    setStatus({ ...DEFAULT_STATUS });
    setMeta(INITIAL_META_STATE);
    pendingMessageIdRef.current = null;
    messageCreationGuardRef.current.clear();
  }, []);

  const applyStatus = useCallback((payload: ConversationStatusPayload) => {
    setStatus(prev => mergeStatus(prev, payload));
  }, []);

  const restoreMessages = useCallback((restoredMessages: Array<{
    participant: string;
    content: string;
    type: string;
    timestamp?: string;
  }>) => {
    const messages: ConversationMessage[] = restoredMessages.map((msg, index) => ({
      id: createMessageId(`${msg.participant}-${index}`),
      participant: msg.participant,
      content: msg.content,
      role: msg.type === 'human' ? 'human' : 'ai',
      isStreaming: false,
      complete: true,
      timestamp: msg.timestamp || new Date().toISOString(),
    }));
    setMessages(messages);
  }, []);

  const appendSystemMessage = useCallback((content: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: createMessageId('system'),
        participant: 'System',
        content,
        role: 'system',
        isStreaming: false,
        complete: true,
      },
    ]);
  }, []);

  const handleStreamEvent = useCallback((event: AISDKStreamEvent) => {
    if (event.type === 'conversation-start') {
      reset();
      const startedAt = new Date().toISOString();
      setMeta({
        ...INITIAL_META_STATE,
        startedAt,
      });
      applyStatus({
        active: true,
        paused: false,
        participants: event.data.participants ?? [],
        topic: event.data.topic,
      });
      return;
    }

    const statusPayload = extractStatusFromEvent(event);
    if (statusPayload) {
      applyStatus(statusPayload);
    }

    switch (event.type) {
      case 'speaker-change': {
        setMeta(prev => ({
          ...prev,
          currentSpeaker: event.data.participant ?? prev.currentSpeaker,
          turn: event.data.turn ?? prev.turn,
        }));
        break;
      }

      case 'thinking-start': {
        setMeta(prev => ({
          ...prev,
          thinkingParticipant: event.data.participant ?? prev.thinkingParticipant,
        }));
        break;
      }

      case 'text-start': {
        const participant = event.data.participant ?? 'Participant';

        // Guard against StrictMode double-invocation
        const guardKey = `${participant}-${meta.turn}`;
        if (messageCreationGuardRef.current.has(guardKey)) {
          return;
        }

        messageCreationGuardRef.current.add(guardKey);

        // Only set ref - message will be created lazily in text-delta
        // This avoids race condition between async state update and rapid text-delta arrival
        const id = createMessageId(participant.toLowerCase() || 'participant');
        pendingMessageIdRef.current = id;

        setMeta(prev => ({
          ...prev,
          thinkingParticipant: null,
          currentSpeaker: participant,
        }));
        break;
      }

      case 'text-delta': {
        const delta = event.data.textDelta ?? '';
        if (!delta) {
          break;
        }

        const participant = event.data.participant ?? 'Participant';

        setMessages(prev => {
          const refId = pendingMessageIdRef.current;

          if (!refId) {
            return prev;
          }

          // Check if message exists
          const existingMsg = prev.find(m => m.id === refId);

          if (!existingMsg) {
            // Lazy creation: Message doesn't exist yet, create it now with first delta
            // This solves race condition between text-start's async setState and text-delta arrival
            return [
              ...prev,
              {
                id: refId,
                participant,
                content: delta,
                role: 'ai',
                isStreaming: true,
                complete: false,
              },
            ];
          }

          // Update existing message
          return prev.map(message =>
            message.id === refId
              ? {
                  ...message,
                  content: `${message.content}${delta}`,
                  isStreaming: true,
                }
              : message
          );
        });
        break;
      }

      case 'text-done': {
        const finalContent = event.data.content;
        const participant = event.data.participant;

        setMeta(prev => ({
          ...prev,
          thinkingParticipant: null,
        }));

        setMessages(prev => {
          if (!prev.length) {
            return prev;
          }

          // Prefer pending message ID, but fallback to last streaming message matching participant
          let activeId = pendingMessageIdRef.current;

          if (!activeId) {
            // Find the last streaming message for this participant
            const lastStreamingMsg = prev.slice().reverse().find(
              msg => msg.isStreaming && (!participant || msg.participant === participant)
            );

            if (!lastStreamingMsg) {
              console.warn('Received text-done but no streaming message found, skipping');
              return prev;
            }

            activeId = lastStreamingMsg.id;
          }

          return prev.map(message =>
            message.id === activeId
              ? {
                  ...message,
                  participant: message.participant ?? participant ?? 'Participant',
                  content:
                    typeof finalContent === 'string' && finalContent.length > 0
                      ? finalContent
                      : message.content,
                  isStreaming: false,
                  complete: true,
                  usage: event.data.usage,
                }
              : message
          );
        });

        pendingMessageIdRef.current = null;
        break;
      }

      case 'turn-complete': {
        setMeta(prev => ({
          ...prev,
          turn: event.data.turn ?? prev.turn,
          humanInputRequested: false, // Clear request on turn complete
        }));
        // Clear guard to allow next turn's messages
        messageCreationGuardRef.current.clear();
        break;
      }

      case 'human-input-requested': {
        setMeta(prev => ({
          ...prev,
          currentSpeaker: 'Human',
          humanInputRequested: true,
        }));
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
            role: 'human',
            isStreaming: false,
            complete: true,
            timestamp: new Date().toISOString(),
          },
        ]);
        break;
      }

      case 'conversation-end': {
        const message =
          typeof event.data.message === 'string' && event.data.message.length > 0
            ? event.data.message
            : 'Conversation ended.';
        const endedAt = new Date().toISOString();

        setMeta(prev => {
          const started = prev.startedAt ? Date.parse(prev.startedAt) : Number.NaN;
          const finished = Date.parse(endedAt);
          const durationSeconds = Number.isNaN(started)
            ? prev.durationSeconds
            : Math.max(0, Math.round((finished - started) / 1000));

          return {
            ...prev,
            currentSpeaker: null,
            thinkingParticipant: null,
            endedAt,
            durationSeconds,
          };
        });

        applyStatus({
          active: false,
          paused: false,
          participants: event.data.participants,
          topic: event.data.topic,
        });

        pendingMessageIdRef.current = null;
        appendSystemMessage(message);
        break;
      }

      case 'conversation-event': {
        const nestedType = event.data?.eventType;
        const payload = event.data?.data ?? {};

        if (nestedType === 'human_input_requested') {
          setMeta(prev => ({
            ...prev,
            currentSpeaker: 'Human',
            humanInputRequested: true,
          }));
        }

        if (nestedType === 'human_message_added') {
          const id = createMessageId('human');
          setMessages(prev => [
            ...prev,
            {
              id,
              participant:
                typeof payload?.participant === 'string' ? payload.participant : 'Human',
              content: typeof payload?.content === 'string' ? payload.content : '',
              role: 'human',
              isStreaming: false,
              complete: true,
              timestamp:
                typeof payload?.timestamp === 'string' ? payload.timestamp : new Date().toISOString(),
            },
          ]);
        }

        if (
          nestedType === 'conversation_paused' ||
          nestedType === 'conversation_resumed' ||
          nestedType === 'conversation_timeout'
        ) {
          const fallbackLabel = (nestedType ?? '').replace(/_/g, ' ').trim();
          const message =
            typeof payload?.message === 'string' && payload.message.length > 0
              ? payload.message
              : fallbackLabel || 'Conversation update';

          appendSystemMessage(message);
        }
        break;
      }

      case 'error': {
        const errorMessage = event.data.error || 'An unexpected error occurred.';
        appendSystemMessage(errorMessage);
        break;
      }

      default:
        break;
    }
  }, [appendSystemMessage, applyStatus, reset, meta.turn]);

  return useMemo(
    () => ({
      messages,
      status,
      meta,
      handleStreamEvent,
      applyStatus,
      reset,
      restoreMessages,
    }),
    [messages, status, meta, handleStreamEvent, applyStatus, reset, restoreMessages],
  );
};
