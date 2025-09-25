'use client';

import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = async () => {
    setIsStreaming(true);
    setMessages([]);

    try {
      const eventSource = new EventSource('http://localhost:8000/stream');

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'text-delta') {
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length === 0) {
              newMessages.push(data.data.textDelta);
            } else {
              newMessages[newMessages.length - 1] += data.data.textDelta;
            }
            return newMessages;
          });
        } else if (data.type === 'text-done') {
          setIsStreaming(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setIsStreaming(false);
        eventSource.close();
      };

    } catch (error) {
      console.error('Error starting stream:', error);
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Conversaition - SSE Test
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <button
              onClick={startStream}
              disabled={isStreaming}
              className={`px-6 py-2 rounded-lg font-medium ${
                isStreaming
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isStreaming ? 'Streaming...' : 'Start Stream'}
            </button>
          </div>

          <div className="border rounded-lg p-4 min-h-[200px] bg-gray-50">
            <h3 className="font-medium mb-2">Streamed Messages:</h3>
            {messages.length === 0 ? (
              <p className="text-gray-500 italic">
                Click "Start Stream" to receive messages from the backend
              </p>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="mb-2 p-2 bg-white rounded border">
                  {message}
                </div>
              ))
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Backend:</strong> http://localhost:8000</p>
            <p><strong>Frontend:</strong> http://localhost:3000</p>
          </div>
        </div>
      </div>
    </div>
  );
}