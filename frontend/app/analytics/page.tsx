'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TranscriptMetadata {
  filename: string;
  topic: string;
  participants: string[];
  message_count: number;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
}

interface AnalyticsSummary {
  total_conversations: number;
  total_messages: number;
  total_duration_seconds: number;
  avg_messages_per_conversation: number;
  avg_duration_seconds: number;
}

export default function AnalyticsPage() {
  const [transcripts, setTranscripts] = useState<TranscriptMetadata[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [transcriptsRes, summaryRes] = await Promise.all([
          fetch(`${apiBaseUrl}/transcripts?limit=50`),
          fetch(`${apiBaseUrl}/analytics/conversations/summary?limit=100`),
        ]);

        if (!transcriptsRes.ok || !summaryRes.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const transcriptsData = await transcriptsRes.json();
        const summaryData = await summaryRes.json();

        setTranscripts(transcriptsData.transcripts || []);
        setSummary(summaryData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [apiBaseUrl]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-100 mb-2">Analytics</h1>
            <p className="text-gray-400">Conversation transcripts and insights</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors"
          >
            ← Back to Conversations
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
          <div className="text-center text-gray-400 py-12">Loading analytics...</div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Total Conversations</div>
                  <div className="text-2xl font-bold text-gray-100">{summary.total_conversations}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Total Messages</div>
                  <div className="text-2xl font-bold text-gray-100">{summary.total_messages}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Total Duration</div>
                  <div className="text-2xl font-bold text-gray-100">
                    {formatDuration(summary.total_duration_seconds)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Avg Messages</div>
                  <div className="text-2xl font-bold text-gray-100">
                    {(summary.avg_messages_per_conversation ?? 0).toFixed(1)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Avg Duration</div>
                  <div className="text-2xl font-bold text-gray-100">
                    {formatDuration(Math.round(summary.avg_duration_seconds ?? 0))}
                  </div>
                </div>
              </div>
            )}

            {/* Transcripts Table */}
            <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Recent Conversations</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700 border-b border-gray-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Topic</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Participants</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Messages</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Duration</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Started</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {transcripts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                          No transcripts found
                        </td>
                      </tr>
                    ) : (
                      transcripts.map((transcript) => (
                        <tr key={transcript.filename} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-100">{transcript.topic}</td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {transcript.participants.join(', ')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">{transcript.message_count}</td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {formatDuration(transcript.duration_seconds)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {formatDateTime(transcript.started_at)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <Link
                              href={`/analytics/${transcript.filename}`}
                              className="px-3 py-1 bg-indigo-900 hover:bg-indigo-800 text-indigo-200 rounded transition-colors"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}