import React, { useState } from 'react';
import { X, Brain, Trash2, Plus, Sparkles, Edit2, Check, Eye, EyeOff } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

export const CharacterMemorySheet: React.FC = () => {
  const {
    memories,
    currentProfile,
    settings,
    addMemory,
    updateMemory,
    toggleMemoryEnabled,
    deleteMemory,
    setShowMemorySheet,
  } = useCompanion();

  const [category, setCategory] = useState('Personal Fact');
  const [content, setContent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const companionMemories = memories.filter(
    (m) => m.companionId === settings.activeCompanionId
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addMemory(category, content.trim());
    setContent('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-[#19132B] border border-[#332752] p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={() => setShowMemorySheet(false)}
          className="absolute right-5 top-5 p-2 rounded-full text-[#988EA6] hover:text-white hover:bg-[#241C3B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#F7F2FA]">
              {currentProfile.name}'s Memory Vault 🧠
            </h3>
            <p className="text-xs text-[#CBC2D6]">
              Personal details, favorites & facts remembered about you
            </p>
          </div>
        </div>

        {/* Action Button: Add Memory */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#988EA6]">
            {companionMemories.length} saved memories
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel' : 'Teach Memory'}</span>
          </button>
        </div>

        {/* Add Memory Form */}
        {showAddForm && (
          <form
            onSubmit={handleAdd}
            className="mb-4 p-4 rounded-2xl bg-[#241C3B] border border-white/10 space-y-3 animate-in fade-in"
          >
            <div>
              <label className="block text-[11px] font-semibold text-[#CBC2D6] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-[#100C1C] border border-[#332752] px-3 py-2 text-xs text-[#F7F2FA] focus:outline-none focus:border-rose-400"
              >
                <option value="Personal Fact">Personal Fact</option>
                <option value="Favorite">Favorite (Food, Music, Place)</option>
                <option value="Dream">Dream & Aspiration</option>
                <option value="Milestone">Milestone & Date</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#CBC2D6] uppercase tracking-wider mb-1">
                Memory / Detail
              </label>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="e.g. Loves listening to acoustic songs when working late..."
                required
                className="w-full rounded-xl bg-[#100C1C] border border-[#332752] px-3 py-2 text-xs text-[#F7F2FA] focus:outline-none focus:border-rose-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-xs font-semibold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Save to Memory</span>
            </button>
          </form>
        )}

        {/* Memory Items List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1">
          {companionMemories.length === 0 ? (
            <div className="py-10 text-center text-[#988EA6]">
              <p className="text-xs">No memories recorded yet.</p>
              <p className="text-[11px] text-[#CBC2D6] mt-1">
                Chat naturally with {currentProfile.name} or click "Teach Memory" to add things she should remember!
              </p>
            </div>
          ) : (
            companionMemories.map((mem) => {
              const isEnabled = mem.enabled !== false;
              const isEditing = editingId === mem.id;

              return (
                <div
                  key={mem.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isEnabled
                      ? 'bg-[#241C3B] border-white/5 hover:border-white/10'
                      : 'bg-[#181226] border-dashed border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15">
                        {mem.memoryCategory}
                      </span>
                      <button
                        onClick={() => toggleMemoryEnabled(mem.id)}
                        className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1 ${
                          isEnabled
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                            : 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/40'
                        }`}
                        title={isEnabled ? 'Click to disable' : 'Click to enable'}
                      >
                        {isEnabled ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                        <span>{isEnabled ? 'Active' : 'Disabled'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => {
                              if (editText.trim()) {
                                updateMemory(mem.id, editText);
                              }
                              setEditingId(null);
                            }}
                            className="p-1 text-emerald-300 hover:bg-white/10 rounded-lg transition-colors"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-zinc-400 hover:bg-white/10 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(mem.id);
                            setEditText(mem.memoryContent);
                          }}
                          className="p-1 text-[#988EA6] hover:text-purple-300 hover:bg-white/5 rounded-lg transition-colors"
                          title="Correct/edit memory"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteMemory(mem.id)}
                        className="p-1 text-[#988EA6] hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                        title="Forget memory"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full rounded-xl bg-[#100C1C] border border-purple-500/40 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <p className={`text-xs mt-1 leading-relaxed ${isEnabled ? 'text-[#F7F2FA]' : 'text-zinc-400 line-through'}`}>
                      {mem.memoryContent}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
