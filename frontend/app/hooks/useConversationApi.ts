'use client';

import { useCallback, useState } from 'react';

export interface ConversationStatus {
  active: boolean;
  paused: boolean;
  participants: string[];
  current_topic?: string;
}

export interface ConversationMessage {
  content: string;
  sender?: string;
}

const API_BASE = 'http://localhost:8000';

export const useConversationApi = () => {
  const [status, setStatus] = useState<ConversationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = useCallback(async (
    url: string,
    options?: RequestInit
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}${url}`, {
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
  }, []);

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
    sendMessage,
    getStatus,
  };
};