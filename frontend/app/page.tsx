'use client';

import { useState } from 'react';
import { useConversationApi } from './hooks/useConversationApi';
import { useSSEStream } from './hooks/useSSEStream';
import { useAISDKAdapter } from './hooks/useAISDKAdapter';

export default function Home() {
  const [topic, setTopic] = useState('Should AI have creative rights?');
  const [humanMessage, setHumanMessage] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState(['Alice', 'Bob', 'Charlie']);

  const {
    loading: apiLoading,
    error: apiError,
    startConversation,
    pauseConversation,
    resumeConversation,
    sendMessage,
  } = useConversationApi();

  const {
    isStreaming,
    connectionStatus,
    startStream,
    stopStream,
  } = useSSEStream();
  const {
    messages,
    status: conversationStatus,
    handleStreamEvent,
    applyStatus,
    reset,
  } = useAISDKAdapter();

  const handleStartConversation = async () => {
    try {
      stopStream();
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
      startStream(handleStreamEvent);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handlePauseConversation = async () => {
    try {
      await pauseConversation();
      applyStatus({ paused: true, active: true });
    } catch (error) {
      console.error('Failed to pause conversation:', error);
    }
  };

  const handleResumeConversation = async () => {
    try {
      await resumeConversation();
      applyStatus({ paused: false, active: true });
    } catch (error) {
      console.error('Failed to resume conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!humanMessage.trim()) return;

    try {
      await sendMessage(humanMessage.trim());
      setHumanMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStopConversation = () => {
    stopStream();
    applyStatus({ active: false, paused: false });
  };

  const getParticipantColor = (participant?: string) => {
    switch (participant) {
      case 'Alice': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'Bob': return 'bg-green-100 border-green-300 text-green-800';
      case 'Charlie': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'Human': return 'bg-orange-100 border-orange-300 text-orange-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const isConversationActive = conversationStatus.active || isStreaming;
  const isConversationPaused = conversationStatus.paused || false;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Conversaition - Multi-AI Conversation Platform
        </h1>

        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {connectionStatus === 'connected' ? '🟢 Connected' :
                 connectionStatus === 'connecting' ? '🟡 Connecting' :
                 '🔴 Disconnected'}
              </div>

              {isConversationActive && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isConversationPaused ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {isConversationPaused ? '⏸️ Paused' : '▶️ Active'}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600">
              Messages: {messages.length}
            </div>
          </div>

          {apiError && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-700 rounded">
              Error: {apiError}
            </div>
          )}
        </div>

        {/* Conversation Setup */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Start New Conversation</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isConversationActive}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900 disabled:text-gray-600"
              placeholder="Enter a topic for discussion..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Participants
            </label>
            <div className="flex space-x-4">
              {['Alice', 'Bob', 'Charlie'].map((participant) => (
                <label key={participant} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(participant)}
                    disabled={isConversationActive}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedParticipants(prev => [...prev, participant]);
                      } else {
                        setSelectedParticipants(prev => prev.filter(p => p !== participant));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className={`px-2 py-1 rounded text-sm ${getParticipantColor(participant)}`}>
                    {participant}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartConversation}
            disabled={isConversationActive || apiLoading || selectedParticipants.length === 0}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {apiLoading ? 'Starting...' : 'Start Conversation'}
          </button>
        </div>

        {/* Conversation Controls */}
        {isConversationActive && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Conversation Controls</h2>

            <div className="flex space-x-4 mb-4">
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
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                ⏹️ Stop
              </button>
            </div>

            {/* Human Message Input */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inject Human Message
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={humanMessage}
                  onChange={(e) => setHumanMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Type your message to inject into the conversation..."
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!humanMessage.trim() || apiLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Display */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Conversation</h2>

          <div className="border rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 italic">
                  Start a conversation to see messages from AI participants
                </p>
                <div className="mt-4 text-sm text-gray-400">
                  <p><strong>Alice:</strong> Analytical, fact-focused responses</p>
                  <p><strong>Bob:</strong> Creative, empathetic responses</p>
                  <p><strong>Charlie:</strong> Contrarian, devil&apos;s advocate responses</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${getParticipantColor(message.participant)} ${
                      !message.complete ? 'animate-pulse' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">
                        {message.participant || 'Unknown'}
                      </span>
                      {message.timestamp && (
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-800">
                      {message.content}
                      {!message.complete && <span className="ml-1 animate-pulse">|</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600 flex justify-between">
            <span><strong>Backend:</strong> http://localhost:8000</span>
            <span><strong>Frontend:</strong> http://localhost:3000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
