'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface StreamEvent {
  type: string;
  data: any;
}

export interface ConversationMessage {
  id?: string;
  content: string;
  participant?: string;
  timestamp?: string;
  complete?: boolean;
}

export const useSSEStream = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsStreaming(true);
    setConnectionStatus('connecting');
    setMessages([]);

    try {
      const eventSource = new EventSource('http://localhost:8000/conversation/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const eventData: StreamEvent = JSON.parse(event.data);

          switch (eventData.type) {
            case 'text-delta':
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];

                if (lastMessage && !lastMessage.complete) {
                  // Append to existing message
                  lastMessage.content += eventData.data.textDelta || '';
                } else {
                  // Create new message
                  newMessages.push({
                    content: eventData.data.textDelta || '',
                    participant: eventData.data.participant,
                    complete: false,
                  });
                }
                return newMessages;
              });
              break;

            case 'text-done':
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage) {
                  lastMessage.complete = true;
                }
                return newMessages;
              });
              break;

            case 'participant_response':
              // Handle structured participant responses
              setMessages(prev => [...prev, {
                content: eventData.data.content || '',
                participant: eventData.data.participant,
                timestamp: eventData.data.timestamp,
                complete: true,
              }]);
              break;

            case 'conversation_started':
              console.log('Conversation started:', eventData.data);
              break;

            case 'conversation_paused':
              console.log('Conversation paused:', eventData.data);
              break;

            case 'conversation_resumed':
              console.log('Conversation resumed:', eventData.data);
              break;

            case 'human_message':
              setMessages(prev => [...prev, {
                content: eventData.data.content || '',
                participant: 'Human',
                timestamp: eventData.data.timestamp,
                complete: true,
              }]);
              break;

            case 'conversation_status':
              // Handle status updates from backend
              if (eventData.data && typeof eventData.data === 'object') {
                // We'll emit a custom event that the main component can listen to
                const statusEvent = new CustomEvent('conversationStatus', {
                  detail: eventData.data
                });
                window.dispatchEvent(statusEvent);
              }
              break;

            case 'error':
              console.error('Stream error:', eventData.data);
              break;

            default:
              console.log('Unknown event type:', eventData.type, eventData.data);
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err, event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setConnectionStatus('disconnected');
        setIsStreaming(false);
        eventSource.close();
      };

    } catch (error) {
      console.error('Error starting SSE stream:', error);
      setConnectionStatus('disconnected');
      setIsStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    setConnectionStatus('disconnected');
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    connectionStatus,
    startStream,
    stopStream,
    clearMessages,
  };
};