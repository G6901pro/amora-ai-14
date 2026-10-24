import React, { useState } from 'react';
import { X, MessageSquare, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { GIRLFRIEND_PROFILES } from '../data/catalog';

export const ChatSessionsSheet: React.FC = () => {
  const {
    sessions,
    settings,
    createSession,
    switchSession,
    deleteSession,
    setShowSessionsSheet,
  } = useCompanion();

  const [newTitle, setNewTitle] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSession(newTitle.trim() || undefined);
    setNewTitle('');
    setShowNewInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-[#19132B] border border-[#332752] p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={() => setShowSessionsSheet(false)}
          className="absolute right-5 top-5 p-2 rounded-full text-[#988EA6] hover:text-white hover:bg-[#241C3B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#F7F2FA]">
              Chat Conversations 💬
            </h3>
            <p className="text-xs text-[#CBC2D6]">
              Switch or create new romantic story chapters
            </p>
          </div>
        </div>

        {/* New Session Button */}
        <div className="mb-3">
          {showNewInput ? (
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Conversation title (e.g. Late Night Coffee)..."
                className="flex-1 rounded-xl bg-[#100C1C] border border-[#332752] px-3 py-2 text-xs text-[#F7F2FA] focus:outline-none focus:border-rose-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-semibold text-white transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewInput(false)}
                className="px-3 py-2 rounded-xl bg-[#241C3B] text-xs text-[#988EA6] hover:text-white"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowNewInput(true)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Conversation</span>
            </button>
          )}
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
          {sessions.map((session) => {
            const isActive = session.sessionId === settings.currentSessionId;
            const profile =
              GIRLFRIEND_PROFILES.find((p) => p.id === session.companionId) ||
              GIRLFRIEND_PROFILES[0];

            return (
              <div
                key={session.sessionId}
                onClick={() => {
                  switchSession(session.sessionId);
                  setShowSessionsSheet(false);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-rose-500/20 border-rose-400/60 shadow-md shadow-rose-950/40'
                    : 'bg-[#241C3B] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-[#F7F2FA] truncate">
                        {session.title}
                      </h4>
                      {isActive && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#CBC2D6] truncate mt-0.5">
                      {session.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] text-[#988EA6]">
                    {new Date(session.lastUpdated).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.sessionId);
                      }}
                      className="p-1.5 text-[#988EA6] hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
