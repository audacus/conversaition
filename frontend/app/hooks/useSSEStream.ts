'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AISDKEventHandler, AISDKStreamEvent } from '../types/ai-sdk';
import { ConnectionStatus } from '../types/sse';

interface UseSSEStreamOptions {
  url?: string;
  onError?: (error: Event) => void;
}

const DEFAULT_STREAM_URL = 'http://localhost:8000/conversation/stream';

export const useSSEStream = (options: UseSSEStreamOptions = {}) => {
  const { url = DEFAULT_STREAM_URL, onError } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isStreaming, setIsStreaming] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const handlerRef = useRef<AISDKEventHandler | null>(null);
  const connectingRef = useRef(false);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    connectingRef.current = false;
    handlerRef.current = null;
    setIsStreaming(false);
    setConnectionStatus('disconnected');
  }, []);

  const startStream = useCallback((handler?: AISDKEventHandler) => {
    if (handler) {
      handlerRef.current = handler;
    }

    if (connectingRef.current) {
      return;
    }

    if (eventSourceRef.current) {
      setIsStreaming(true);
      setConnectionStatus('connected');
      return;
    }

    connectingRef.current = true;
    setConnectionStatus('connecting');
    setIsStreaming(true);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      connectingRef.current = false;
      setConnectionStatus('connected');
    };

    eventSource.onmessage = (event: MessageEvent<string>) => {
      if (!handlerRef.current) {
        return;
      }

      try {
        const parsedEvent: AISDKStreamEvent = JSON.parse(event.data);
        handlerRef.current(parsedEvent);
      } catch (parseError) {
        console.error('Error parsing SSE data:', parseError, event.data);
      }
    };

    eventSource.onerror = (error: Event) => {
      console.error('SSE connection error:', error);
      stopStream();

      if (onError) {
        onError(error);
      }
    };
  }, [onError, stopStream, url]);

  const updateHandler = useCallback((handler: AISDKEventHandler | null) => {
    handlerRef.current = handler;
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    startStream,
    stopStream,
    updateHandler,
    connectionStatus,
    isStreaming,
  };
};
