'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Message {
  participant: string;
  content: string;
  timestamp: string;
}

interface Transcript {
  topic: string;
  participants: string[];
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  message_count: number;
  messages: Message[];
}

export default function TranscriptDetailPage() {
  const params = useParams();
  const filename = params?.filename as string;
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!filename) return;

    const fetchTranscript = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBaseUrl}/transcripts/${filename}`);
        if (!res.ok) {
          throw new Error('Failed to load transcript');
        }
        const data = await res.json();
        setTranscript(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [filename, apiBaseUrl]);

  const formatDuration = (seconds?: number | null) => {
    if (!seconds || typeof seconds !== 'number' || isNaN(seconds)) {
      return '-';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) {
      return '-';
    }
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleString();
  };

  const participantColors: Record<string, string> = {
    Alice: 'bg-blue-950 border-blue-700 text-blue-200',
    Bob: 'bg-green-950 border-green-700 text-green-200',
    Charlie: 'bg-purple-950 border-purple-700 text-purple-200',
    Human: 'bg-orange-950 border-orange-700 text-orange-200',
    System: 'bg-gray-800 border-gray-600 text-gray-200',
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Transcript Detail</h1>
            {transcript && <p className="text-gray-400">{transcript.topic}</p>}
          </div>
          <Link
            href="/analytics"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors"
          >
            ← Back to Analytics
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading transcript...</div>
        ) : transcript ? (
          <>
            {/* Metadata */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Participants</div>
                  <div className="text-gray-100 font-medium">{transcript.participants.join(', ')}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Messages</div>
                  <div className="text-gray-100 font-medium">{transcript.message_count}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Duration</div>
                  <div className="text-gray-100 font-medium">{formatDuration(transcript.duration_seconds)}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Started</div>
                  <div className="text-gray-100 font-medium">{formatDateTime(transcript.started_at)}</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Conversation</h2>
              <div className="space-y-3">
                {transcript.messages.map((message, idx) => {
                  const colorClass = participantColors[message.participant] || participantColors.System;
                  return (
                    <div key={idx} className={`rounded-lg border p-4 ${colorClass}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{message.participant}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(message.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}