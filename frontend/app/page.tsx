'use client';

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { useConversationApi } from './hooks/useConversationApi';
import { useSSEStream } from './hooks/useSSEStream';
import { useAISDKAdapter } from './hooks/useAISDKAdapter';
import type { AISDKStreamEvent } from './types/ai-sdk';

const DEFAULT_TOPIC = 'Should AI have creative rights?';
const PARTICIPANT_OPTIONS = ['Alice', 'Bob', 'Charlie'] as const;

const avatarMap: Record<string, string> = {
  Alice: '/Alice.svg',
  Bob: '/Bob.svg',
  Charlie: '/Charlie.svg',
  Human: '/User.svg',
  System: '/User.svg',
};

const participantBadgeClassMap: Record<string, string> = {
  Alice: 'bg-blue-50 border-blue-300 text-blue-900',
  Bob: 'bg-green-50 border-green-300 text-green-900',
  Charlie: 'bg-purple-50 border-purple-300 text-purple-900',
  Human: 'bg-orange-50 border-orange-300 text-orange-900',
  System: 'bg-gray-100 border-gray-300 text-gray-800',
};

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0s';
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) {
    return '';
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function Home() {
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [humanMessage, setHumanMessage] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([...PARTICIPANT_OPTIONS]);
  const [streamError, setStreamError] = useState<string | null>(null);

  const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
  const apiBaseUrl = rawApiBaseUrl.endsWith('/')
    ? rawApiBaseUrl.slice(0, -1)
    : rawApiBaseUrl;

  const {
    loading: apiLoading,
    error: apiError,
    startConversation,
    pauseConversation,
    resumeConversation,
    stopConversation,
    sendMessage,
  } = useConversationApi(apiBaseUrl);

  const {
    messages,
    status: conversationStatus,
    meta,
    handleStreamEvent: handleAdapterEvent,
    applyStatus,
    reset,
  } = useAISDKAdapter();

  const handleStreamEvent = useCallback(
    (event: AISDKStreamEvent) => {
      setStreamError(null);
      handleAdapterEvent(event);
    },
    [handleAdapterEvent],
  );

  const handleSSEError = useCallback((error: Event) => {
    console.error('SSE connection error', error);
    if (conversationStatus.active) {
      setStreamError('Lost connection to conversation stream.');
    }
  }, [conversationStatus.active]);

  const {
    connect,
    disconnect,
    connectionStatus,
    isStreaming,
  } = useSSEStream({ url: `${apiBaseUrl}/conversation/stream`, onError: handleSSEError });

  const isConversationActive = conversationStatus.active;
  const isConversationPaused = conversationStatus.paused;
  const hasSelectedParticipants = selectedParticipants.length > 0;

  const currentParticipants = conversationStatus.participants.length
    ? conversationStatus.participants
    : selectedParticipants;

  const canStartConversation = !isConversationActive && !apiLoading && hasSelectedParticipants;
  const trimmedHumanMessage = humanMessage.trim();
  const canSendHumanMessage = isConversationPaused && trimmedHumanMessage.length > 0;

  const handleStartConversation = useCallback(async () => {
    try {
      setStreamError(null);
      disconnect();
      reset();
      applyStatus({
        active: false,
        paused: false,
        participants: selectedParticipants,
        topic,
      });

      await startConversation(topic, selectedParticipants);

      applyStatus({
        active: true,
        paused: false,
        participants: selectedParticipants,
        topic,
      });

      connect(handleStreamEvent);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setStreamError('Failed to start conversation. Check backend availability.');
    }
  }, [applyStatus, connect, disconnect, handleStreamEvent, reset, selectedParticipants, startConversation, topic]);

  const handlePauseConversation = useCallback(async () => {
    try {
      await pauseConversation();
      applyStatus({ paused: true, active: true });
    } catch (error) {
      console.error('Failed to pause conversation:', error);
      setStreamError('Unable to pause conversation.');
    }
  }, [applyStatus, pauseConversation]);

  const handleResumeConversation = useCallback(async () => {
    try {
      await resumeConversation();
      applyStatus({ paused: false, active: true });
    } catch (error) {
      console.error('Failed to resume conversation:', error);
      setStreamError('Unable to resume conversation.');
    }
  }, [applyStatus, resumeConversation]);

  const handleStopConversation = useCallback(async () => {
    try {
      await stopConversation();
      applyStatus({
        active: false,
        paused: false,
        participants: conversationStatus.participants.length
          ? conversationStatus.participants
          : selectedParticipants,
        topic: conversationStatus.topic ?? topic,
      });
      disconnect();
    } catch (error) {
      console.error('Failed to stop conversation:', error);
      setStreamError('Unable to stop conversation.');
    }
  }, [applyStatus, conversationStatus, disconnect, selectedParticipants, stopConversation, topic]);

  const handleSendHumanMessage = useCallback(async () => {
    if (!canSendHumanMessage) {
      return;
    }

    try {
      await sendMessage(trimmedHumanMessage);
      setHumanMessage('');
    } catch (error) {
      console.error('Failed to send human message:', error);
      setStreamError('Unable to inject human message.');
    }
  }, [canSendHumanMessage, sendMessage, trimmedHumanMessage]);

  const handleParticipantToggle = useCallback((participant: string, checked: boolean) => {
    setSelectedParticipants(prev => {
      if (checked) {
        if (prev.includes(participant)) {
          return prev;
        }
        return [...prev, participant];
      }
      return prev.filter(item => item !== participant);
    });
  }, []);

  const activeInfo = useMemo(() => {
    const items: string[] = [];

    if (meta.currentSpeaker) {
      items.push(`Speaking: ${meta.currentSpeaker}`);
    }

    if (meta.thinkingParticipant) {
      items.push(`Thinking: ${meta.thinkingParticipant}`);
    }

    items.push(`Turn: ${meta.turn}`);

    if (meta.startedAt) {
      const startedLabel = formatTimestamp(meta.startedAt);
      if (startedLabel) {
        items.push(`Started: ${startedLabel}`);
      }
      const startMs = Date.parse(meta.startedAt);
      const endMs = meta.endedAt ? Date.parse(meta.endedAt) : Date.now();
      if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
        const durationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));
        if (durationSeconds > 0) {
          items.push(`Duration: ${formatDuration(durationSeconds)}`);
        }
      }
    }
    return items;
  }, [meta.currentSpeaker, meta.thinkingParticipant, meta.turn, meta.startedAt, meta.endedAt]);

  const renderStatusChip = (label: string, tone: 'success' | 'warning' | 'danger' | 'idle') => {
    const base = 'px-3 py-1 rounded-full text-sm font-medium';
    const palette = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      idle: 'bg-gray-100 text-gray-700',
    } as const;

    return <span className={`${base} ${palette[tone]}`}>{label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Conversaition</h1>
          <p className="text-gray-600">Multi-AI conversation platform with human-in-the-loop guidance</p>
        </header>

      <section className="bg-white rounded-lg shadow p-5 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {renderStatusChip(
              connectionStatus === 'connected'
                  ? '🟢 Stream Connected'
                  : connectionStatus === 'connecting'
                  ? '🟡 Connecting'
                  : '🔴 Disconnected',
                connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'danger',
              )}

              {isConversationActive
                ? renderStatusChip(
                    isConversationPaused ? '⏸️ Paused' : '▶️ Active',
                    isConversationPaused ? 'warning' : 'success',
                  )
                : renderStatusChip('Idle', 'idle')}

              {isStreaming && renderStatusChip('Streaming...', 'success')}
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              {activeInfo.map(info => (
                <span key={info} className="px-2 py-1 bg-gray-100 rounded-md">
                  {info}
                </span>
              ))}
            </div>
          </div>

          {(apiError || streamError) && (
            <div className="grid gap-2 text-sm">
              {apiError && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  API Error: {apiError}
                </div>
              )}
              {streamError && (
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                  {streamError}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conversation Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  disabled={isConversationActive}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900 disabled:text-gray-600"
                  placeholder="Enter a topic for discussion..."
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Participants
                </span>
                <div className="flex flex-wrap gap-3">
                  {PARTICIPANT_OPTIONS.map(participant => (
                    <label key={participant} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(participant)}
                        disabled={isConversationActive}
                        onChange={(event) => handleParticipantToggle(participant, event.target.checked)}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className={`px-2 py-1 border rounded ${participantBadgeClassMap[participant]}`}>
                        {participant}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleStartConversation}
              disabled={!canStartConversation}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {apiLoading ? 'Starting…' : 'Start Conversation'}
            </button>
          </div>

          {isConversationActive && (
            <div className="border-t pt-4 mt-4 grid gap-4 md:grid-cols-[auto_auto] md:justify-between md:items-center">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handlePauseConversation}
                  disabled={isConversationPaused || apiLoading}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  ⏸️ Pause
                </button>
                <button
                  onClick={handleResumeConversation}
                  disabled={!isConversationPaused || apiLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  ▶️ Resume
                </button>
                <button
                  onClick={handleStopConversation}
                  disabled={apiLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  ⏹️ Stop
                </button>
              </div>

              <div className="flex flex-1 items-center gap-2 md:justify-end">
                <input
                  type="text"
                  value={humanMessage}
                  onChange={(event) => setHumanMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSendHumanMessage();
                    }
                  }}
                  placeholder={
                    isConversationPaused
                      ? 'Inject a human message to steer the discussion…'
                      : 'Pause the conversation to inject a human message…'
                  }
                  disabled={!isConversationPaused}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                />
                <button
                  onClick={handleSendHumanMessage}
                  disabled={!canSendHumanMessage || apiLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Conversation</h2>
            <div className="text-sm text-gray-500">
              Topic: <span className="font-medium text-gray-700">{conversationStatus.topic ?? topic}</span>
              <span className="mx-2">•</span>
              Participants: {currentParticipants.join(', ')}
              <span className="mx-2">•</span>
              Messages: {messages.length}
            </div>
          </div>

          <div className="border rounded-lg p-4 min-h-[380px] max-h-[580px] overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                <p className="italic">Start a conversation to see the multi-agent discussion unfold.</p>
                <div className="text-xs text-gray-400">
                  Alice • Analytical · Bob • Creative · Charlie • Contrarian
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {messages.map(message => {
                  const palette =
                    participantBadgeClassMap[message.participant] ?? 'bg-white border-gray-200 text-gray-800';
                  const avatar = avatarMap[message.participant] ?? avatarMap.System;
                  const timestamp = formatTimestamp(message.timestamp);

                  return (
                    <li
                      key={message.id}
                      className={`flex gap-3 rounded-lg border p-3 ${palette} ${
                        message.isStreaming ? 'ring-1 ring-inset ring-blue-300 animate-pulse' : ''
                      }`}
                    >
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white">
                        <Image
                          src={avatar}
                          alt={`${message.participant} avatar`}
                          width={40}
                          height={40}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-800">
                          <span>{message.participant}</span>
                          {message.isStreaming && (
                            <span className="text-xs font-medium text-blue-600">streaming…</span>
                          )}
                          {timestamp && (
                            <span className="text-xs font-normal text-gray-600">{timestamp}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                          {message.content || '…'}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="text-xs text-gray-500 flex justify-between">
            <span>Backend: {apiBaseUrl}</span>
            <span>Frontend: http://localhost:3000</span>
          </div>
        </section>
      </div>
    </div>
  );
}
