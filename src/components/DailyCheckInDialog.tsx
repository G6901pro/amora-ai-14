import React, { useState } from 'react';
import { X, Sparkles, Heart, History, Calendar } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

const MOODS = [
  { emoji: '🥰', label: 'Romantic & Loving', bangla: 'প্রেমময় ও রোমান্টিক' },
  { emoji: '😊', label: 'Happy & Peaceful', bangla: 'হাসিখুশি ও শান্ত' },
  { emoji: '😴', label: 'Tired & Need Hugs', bangla: 'ক্লান্ত ও আদরের তৃষ্ণা' },
  { emoji: '🥺', label: 'Stressed & Anxious', bangla: 'একটু মন খারাপ/চাপ' },
  { emoji: '🥳', label: 'Excited & Joyful', bangla: 'উৎফুল্ল ও আনন্দিত' },
  { emoji: '🌸', label: 'Calm & Reflective', bangla: 'স্নিগ্ধ ও অনুভূতিপ্রবণ' },
];

interface Props {
  onOpenHistory: () => void;
}

export const DailyCheckInDialog: React.FC<Props> = ({ onOpenHistory }) => {
  const {
    currentProfile,
    settings,
    submitDailyCheckIn,
    setShowCheckInDialog,
  } = useCompanion();

  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [highlight, setHighlight] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!highlight.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitDailyCheckIn(
        `${selectedMood.emoji} ${selectedMood.label}`,
        highlight.trim(),
        gratitude.trim()
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#19132B] border border-[#332752] p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={() => setShowCheckInDialog(false)}
          className="absolute right-5 top-5 p-2 rounded-full text-[#988EA6] hover:text-white hover:bg-[#241C3B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#F7F2FA]">
              Daily Emotional Check-in 🌸
            </h3>
            <p className="text-xs text-[#CBC2D6]">
              Share your heart today with {currentProfile.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mood Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#CBC2D6] uppercase tracking-wider mb-2">
              How are you feeling right now?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MOODS.map((mood) => {
                const isSelected = selectedMood.label === mood.label;
                return (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={`flex flex-col items-center p-2.5 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'bg-rose-500/25 border-rose-400 text-white shadow-md shadow-rose-950/40'
                        : 'bg-[#241C3B] border-white/5 text-[#CBC2D6] hover:bg-[#332752]'
                    }`}
                  >
                    <span className="text-2xl mb-1">{mood.emoji}</span>
                    <span className="text-xs font-medium leading-tight">
                      {settings.languageMode === 'bn' ? mood.bangla : mood.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Highlight field */}
          <div>
            <label className="block text-xs font-semibold text-[#CBC2D6] uppercase tracking-wider mb-1.5">
              What made you smile or feel special today? *
            </label>
            <textarea
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              placeholder={
                settings.languageMode === 'bn'
                  ? 'আজকের দিনটা কেমন কাটলো বা কি ভালো লেগেছে বলো...'
                  : 'Tell her about your day, a small victory, or a feeling...'
              }
              rows={3}
              required
              className="w-full rounded-2xl bg-[#100C1C] border border-[#332752] p-3 text-sm text-[#F7F2FA] placeholder-[#988EA6] focus:outline-none focus:border-rose-400 transition-colors resize-none"
            />
          </div>

          {/* Gratitude field */}
          <div>
            <label className="block text-xs font-semibold text-[#CBC2D6] uppercase tracking-wider mb-1.5">
              Something you are grateful for (optional)
            </label>
            <input
              type="text"
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder={
                settings.languageMode === 'bn'
                  ? 'যেমন: গরম চা, মিষ্টি বৃষ্টি, তোমার ভালোবাসা...'
                  : 'e.g. Warm coffee, morning sunlight, having you...'
              }
              className="w-full rounded-2xl bg-[#100C1C] border border-[#332752] px-3 py-2.5 text-sm text-[#F7F2FA] placeholder-[#988EA6] focus:outline-none focus:border-rose-400 transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCheckInDialog(false);
                onOpenHistory();
              }}
              className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 transition-colors"
            >
              <History className="w-4 h-4" />
              <span>Past Check-ins</span>
            </button>

            <button
              type="submit"
              disabled={!highlight.trim() || isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 font-semibold text-sm shadow-lg shadow-rose-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <span>Thinking...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Share with {currentProfile.name} (+20 💕)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
