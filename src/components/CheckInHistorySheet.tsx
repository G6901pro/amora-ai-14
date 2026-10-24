import React from 'react';
import { X, Calendar, MessageCircleHeart } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

interface Props {
  onClose: () => void;
  onOpenCheckIn: () => void;
}

export const CheckInHistorySheet: React.FC<Props> = ({
  onClose,
  onOpenCheckIn,
}) => {
  const { checkIns, currentProfile } = useCompanion();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-[#19132B] border border-[#332752] p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-[#988EA6] hover:text-white hover:bg-[#241C3B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#F7F2FA]">
              Check-in Memory Log 📖
            </h3>
            <p className="text-xs text-[#CBC2D6]">
              {checkIns.length} recorded emotional moments with {currentProfile.name}
            </p>
          </div>
        </div>

        {/* List of check-ins */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
          {checkIns.length === 0 ? (
            <div className="py-12 text-center text-[#CBC2D6]">
              <p className="text-sm">No check-ins yet!</p>
              <p className="text-xs text-[#988EA6] mt-1">
                Take a moment to record your feelings with {currentProfile.name}.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenCheckIn();
                }}
                className="mt-4 px-4 py-2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30 transition-all"
              >
                Start First Check-in 🌸
              </button>
            </div>
          ) : (
            checkIns.map((ci) => (
              <div
                key={ci.id}
                className="rounded-2xl bg-[#241C3B] border border-white/5 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-300 px-2.5 py-1 rounded-full bg-rose-500/15">
                    {ci.mood}
                  </span>
                  <span className="text-[#988EA6]">{ci.displayDate}</span>
                </div>

                <p className="text-xs text-[#F7F2FA] leading-relaxed">
                  "{ci.highlightText}"
                </p>

                {ci.gratitudeText && (
                  <p className="text-[11px] text-amber-200/90 italic">
                    🌸 Grateful for: {ci.gratitudeText}
                  </p>
                )}

                {ci.amoraReply && (
                  <div className="pt-2 border-t border-white/5 flex gap-2">
                    <MessageCircleHeart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-200/90 leading-relaxed italic">
                      {ci.amoraReply}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
