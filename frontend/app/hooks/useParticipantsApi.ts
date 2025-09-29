'use client';

import { useCallback, useMemo, useState } from 'react';

export interface ParticipantSummary {
  id: string;
  name: string;
  provider: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ParticipantDetail {
  id: string;
  name: string;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
}

export interface CreateParticipantRequest {
  id: string;
  name: string;
  provider: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt: string;
}

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const useParticipantsApi = (baseUrl: string = DEFAULT_API_BASE) => {
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
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
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

  const listParticipants = useCallback(async (): Promise<ParticipantSummary[]> => {
    const result = await handleApiCall('/participants');
    return (result?.participants ?? []) as ParticipantSummary[];
  }, [handleApiCall]);

  const getParticipant = useCallback(async (id: string): Promise<ParticipantDetail> => {
    const result = await handleApiCall(`/participants/${encodeURIComponent(id)}`);
    return result as ParticipantDetail;
  }, [handleApiCall]);

  const createParticipant = useCallback(async (
    data: CreateParticipantRequest
  ): Promise<ParticipantDetail> => {
    const result = await handleApiCall('/participants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.participant as ParticipantDetail;
  }, [handleApiCall]);

  const updateParticipant = useCallback(async (
    id: string,
    data: CreateParticipantRequest
  ): Promise<ParticipantDetail> => {
    const result = await handleApiCall(`/participants/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.participant as ParticipantDetail;
  }, [handleApiCall]);

  const deleteParticipant = useCallback(async (id: string): Promise<void> => {
    await handleApiCall(`/participants/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }, [handleApiCall]);

  return {
    // State
    loading,
    error,

    // Actions
    listParticipants,
    getParticipant,
    createParticipant,
    updateParticipant,
    deleteParticipant,
  };
};