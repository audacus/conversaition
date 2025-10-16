'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TranscriptMetadata {
  filename: string;
  topic: string;
  participants: string[];
  message_count: number;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
}

interface OngoingConversation {
  conversation_id: string;
  topic: string;
  participants: string[];
  active: boolean;
  paused: boolean;
  turn_count: number;
  message_count: number;
  started_at: string | null;
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
  const [ongoingConversation, setOngoingConversation] = useState<OngoingConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTopic, setSearchTopic] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [allParticipants, setAllParticipants] = useState<string[]>([]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [transcriptsRes, summaryRes, snapshotRes] = await Promise.all([
          fetch(`${apiBaseUrl}/transcripts?limit=50`),
          fetch(`${apiBaseUrl}/analytics/conversations/summary?limit=100`),
          fetch(`${apiBaseUrl}/conversation/snapshot`).catch(() => null), // Don't fail if no active conversation
        ]);

        if (!transcriptsRes.ok || !summaryRes.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const transcriptsData = await transcriptsRes.json();
        const summaryData = await summaryRes.json();
        const transcripts = transcriptsData.transcripts || [];

        // Extract all unique participants
        const participants = new Set<string>();
        transcripts.forEach((t: TranscriptMetadata) => {
          t.participants.forEach((p) => participants.add(p));
        });
        setAllParticipants(Array.from(participants).sort());

        setTranscripts(transcripts);
        setSummary(summaryData);

        // Check for ongoing conversation
        if (snapshotRes && snapshotRes.ok) {
          const snapshotData = await snapshotRes.json();
          if (snapshotData.active) {
            setOngoingConversation(snapshotData);
          } else {
            setOngoingConversation(null);
          }
        } else {
          setOngoingConversation(null);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [apiBaseUrl]);

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

  // Filter transcripts based on search and selected participants
  const filteredTranscripts = transcripts.filter((transcript) => {
    const topicMatch =
      !searchTopic ||
      (transcript.topic?.toLowerCase().includes(searchTopic.toLowerCase()) ?? false);

    const participantMatch =
      selectedParticipants.length === 0 ||
      selectedParticipants.some((p) => transcript.participants.includes(p));

    return topicMatch && participantMatch;
  });

  const toggleParticipant = (participant: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participant)
        ? prev.filter((p) => p !== participant)
        : [...prev, participant]
    );
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

        {/* Search and Filters */}
        {!loading && (
          <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-200 mb-2">Search by Topic</label>
              <input
                type="text"
                placeholder="Search transcripts..."
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {allParticipants.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">Filter by Participant</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {allParticipants.map((participant) => (
                    <button
                      key={participant}
                      onClick={() => toggleParticipant(participant)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedParticipants.includes(participant)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {participant}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

            {/* Distribution Charts */}
            {filteredTranscripts.length > 0 && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Message Distribution */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Message Distribution</h3>
                  <div className="space-y-2">
                    {filteredTranscripts.slice(0, 5).map((transcript) => {
                      const maxMessages = Math.max(...filteredTranscripts.map((t) => t.message_count));
                      const percentage = (transcript.message_count / maxMessages) * 100;
                      return (
                        <div key={transcript.filename}>
                          <div className="flex justify-between text-xs text-gray-300 mb-1">
                            <span>{transcript.topic || 'Untitled'}</span>
                            <span>{transcript.message_count}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded h-2 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Distribution */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Duration Distribution</h3>
                  <div className="space-y-2">
                    {filteredTranscripts.slice(0, 5).map((transcript) => {
                      const maxDuration = Math.max(...filteredTranscripts.map((t) => t.duration_seconds || 0));
                      const percentage = transcript.duration_seconds ? (transcript.duration_seconds / maxDuration) * 100 : 0;
                      return (
                        <div key={transcript.filename}>
                          <div className="flex justify-between text-xs text-gray-300 mb-1">
                            <span>{transcript.topic || 'Untitled'}</span>
                            <span>{formatDuration(transcript.duration_seconds)}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded h-2 overflow-hidden">
                            <div
                              className="bg-green-500 h-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {/* Ongoing Conversation Row */}
                    {ongoingConversation && (
                      <tr className="bg-green-950 hover:bg-green-900 transition-colors border-l-4 border-green-500">
                        <td className="px-6 py-4 text-sm text-gray-100 font-medium">{ongoingConversation.topic}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {ongoingConversation.participants.join(', ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{ongoingConversation.message_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <span className="text-green-400">In progress</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {formatDateTime(ongoingConversation.started_at)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-green-900 text-green-200 rounded-full text-xs font-medium">
                            {ongoingConversation.paused ? '⏸️ Paused' : '▶️ Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <Link
                            href={`/?conversation=${ongoingConversation.conversation_id}`}
                            className="px-3 py-1 bg-green-700 hover:bg-green-600 text-green-100 rounded transition-colors font-medium"
                          >
                            Rejoin
                          </Link>
                        </td>
                      </tr>
                    )}

                    {/* Completed Conversations */}
                    {filteredTranscripts.length === 0 && !ongoingConversation ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                          {transcripts.length === 0 ? 'No transcripts found' : 'No transcripts match your filters'}
                        </td>
                      </tr>
                    ) : (
                      filteredTranscripts.map((transcript) => (
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
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded-full text-xs">
                              Completed
                            </span>
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