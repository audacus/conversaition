'use client';

import { useCallback, useMemo, useState } from 'react';

export interface ConversationStatus {
  active: boolean;
  paused: boolean;
  participants: string[];
  current_topic?: string;
}

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const useConversationApi = (baseUrl: string = DEFAULT_API_BASE) => {
  const [status, setStatus] = useState<ConversationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedBaseUrl = useMemo(() => {
    if (!baseUrl) {
      return DEFAULT_API_BASE;
    }
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }, [baseUrl]);

  const handleApiCall = useCallback(async (
    url: string,
    options?: RequestInit
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${normalizedBaseUrl}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [normalizedBaseUrl]);

  const startConversation = useCallback(async (
    topic: string,
    participants: string[] = ['Alice', 'Bob', 'Charlie']
  ) => {
    const result = await handleApiCall('/conversation/start', {
      method: 'POST',
      body: JSON.stringify({ topic, participants }),
    });
    return result;
  }, [handleApiCall]);

  const pauseConversation = useCallback(async () => {
    const result = await handleApiCall('/conversation/pause', {
      method: 'POST',
    });
    return result;
  }, [handleApiCall]);

  const resumeConversation = useCallback(async () => {
    const result = await handleApiCall('/conversation/resume', {
      method: 'POST',
    });
    return result;
  }, [handleApiCall]);

  const stopConversation = useCallback(async () => {
    const result = await handleApiCall('/conversation/stop', {
      method: 'POST',
    });
    return result;
  }, [handleApiCall]);

  const sendMessage = useCallback(async (content: string) => {
    const result = await handleApiCall('/conversation/message', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return result;
  }, [handleApiCall]);

  const getStatus = useCallback(async () => {
    const result = await handleApiCall('/conversation/status');
    setStatus(result);
    return result;
  }, [handleApiCall]);

  return {
    // State
    status,
    loading,
    error,

    // Actions
    startConversation,
    pauseConversation,
    resumeConversation,
    stopConversation,
    sendMessage,
    getStatus,
  };
};
