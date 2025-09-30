'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParticipantsApi, ParticipantSummary, ParticipantDetail, CreateParticipantRequest } from '../hooks/useParticipantsApi';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantDetail | null>(null);
  const [formData, setFormData] = useState<CreateParticipantRequest>({
    id: '',
    name: '',
    provider: 'openai',
    model: '',
    temperature: 0.7,
    max_tokens: 256,
    system_prompt: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const { listParticipants, getParticipant, createParticipant, updateParticipant, deleteParticipant, loading, error } = useParticipantsApi();

  const loadParticipants = useCallback(async () => {
    try {
      const data = await listParticipants();
      setParticipants(data);
    } catch (err) {
      console.error('Failed to load participants:', err);
    }
  }, [listParticipants]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const handleCreate = () => {
    setFormData({
      id: '',
      name: '',
      provider: 'openai',
      model: '',
      temperature: 0.7,
      max_tokens: 256,
      system_prompt: '',
    });
    setFormErrors([]);
    setSelectedParticipant(null);
    setModalMode('create');
  };

  const handleEdit = async (participant: ParticipantSummary) => {
    try {
      const detail = await getParticipant(participant.id);
      setSelectedParticipant(detail);
      setFormData({
        id: detail.id,
        name: detail.name,
        provider: detail.provider,
        model: detail.model,
        temperature: detail.temperature,
        max_tokens: detail.max_tokens,
        system_prompt: detail.system_prompt,
      });
      setFormErrors([]);
      setModalMode('edit');
    } catch (err) {
      console.error('Failed to load participant details:', err);
    }
  };

  const handleDelete = (participant: ParticipantSummary) => {
    setSelectedParticipant(participant as ParticipantDetail);
    setModalMode('delete');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedParticipant(null);
    setFormErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    try {
      if (modalMode === 'create') {
        await createParticipant(formData);
      } else if (modalMode === 'edit' && selectedParticipant) {
        await updateParticipant(selectedParticipant.id, formData);
      }
      await loadParticipants();
      handleCloseModal();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Operation failed';
      setFormErrors([errorMsg]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedParticipant) return;

    try {
      await deleteParticipant(selectedParticipant.id);
      await loadParticipants();
      handleCloseModal();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Delete failed';
      setFormErrors([errorMsg]);
    }
  };

  const providerOptions = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'gemini', label: 'Google Gemini' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-100 mb-2">Participants</h1>
            <p className="text-gray-400">Manage AI participants for conversations</p>
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

        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
            disabled={loading}
          >
            + Create Participant
          </button>
        </div>

        {/* Participants Table */}
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700 border-b border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Provider</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Model</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Temperature</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Max Tokens</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    {loading ? 'Loading participants...' : 'No participants found'}
                  </td>
                </tr>
              ) : (
                participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-100">{participant.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300 capitalize">{participant.provider}</td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">{participant.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{participant.temperature?.toFixed(1) ?? 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{participant.max_tokens ?? 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => handleEdit(participant)}
                        className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-blue-200 rounded transition-colors"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(participant)}
                        className="px-3 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded transition-colors"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-100">
                    {modalMode === 'create' && 'Create Participant'}
                    {modalMode === 'edit' && 'Edit Participant'}
                    {modalMode === 'delete' && 'Delete Participant'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-200 text-2xl"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>

                {/* Error Display */}
                {formErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-950 border border-red-800 text-red-300 rounded text-sm">
                    {formErrors.map((err, idx) => (
                      <div key={idx}>{err}</div>
                    ))}
                  </div>
                )}

                {/* Delete Confirmation */}
                {modalMode === 'delete' ? (
                  <div>
                    <p className="text-gray-300 mb-6">
                      Are you sure you want to delete <strong>{selectedParticipant?.name}</strong>?
                      This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleCloseModal}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Create/Edit Form */
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      {/* ID */}
                      <div>
                        <label htmlFor="participant-id" className="block text-sm font-medium text-gray-300 mb-1">
                          ID <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="participant-id"
                          type="text"
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                          disabled={modalMode === 'edit'}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-700 bg-gray-700 text-gray-100"
                          required
                        />
                      </div>

                      {/* Name */}
                      <div>
                        <label htmlFor="participant-name" className="block text-sm font-medium text-gray-300 mb-1">
                          Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="participant-name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-gray-100"
                          required
                        />
                      </div>

                      {/* Provider */}
                      <div>
                        <label htmlFor="participant-provider" className="block text-sm font-medium text-gray-300 mb-1">
                          Provider <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="participant-provider"
                          value={formData.provider}
                          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-gray-100"
                          required
                        >
                          {providerOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Model */}
                      <div>
                        <label htmlFor="participant-model" className="block text-sm font-medium text-gray-300 mb-1">
                          Model <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="participant-model"
                          type="text"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-gray-100"
                          placeholder="e.g., gpt-4.1-mini, claude-sonnet-4-20250514"
                          required
                        />
                      </div>

                      {/* Temperature */}
                      <div>
                        <label htmlFor="participant-temperature" className="block text-sm font-medium text-gray-300 mb-1">
                          Temperature (0.0 - 2.0)
                        </label>
                        <input
                          id="participant-temperature"
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={formData.temperature}
                          onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-gray-100"
                        />
                      </div>

                      {/* Max Tokens */}
                      <div>
                        <label htmlFor="participant-max-tokens" className="block text-sm font-medium text-gray-300 mb-1">
                          Max Tokens
                        </label>
                        <input
                          id="participant-max-tokens"
                          type="number"
                          step="1"
                          min="1"
                          value={formData.max_tokens}
                          onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-gray-100"
                        />
                      </div>

                      {/* System Prompt */}
                      <div>
                        <label htmlFor="participant-system-prompt" className="block text-sm font-medium text-gray-300 mb-1">
                          System Prompt <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          id="participant-system-prompt"
                          value={formData.system_prompt}
                          onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-gray-100"
                          placeholder="Define the participant's personality, communication style, and behavior..."
                          required
                        />
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}