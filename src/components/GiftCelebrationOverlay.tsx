import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Sparkles, X } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

export const GiftCelebrationOverlay: React.FC = () => {
  const { celebratingGift, setCelebratingGift, currentProfile } = useCompanion();

  useEffect(() => {
    if (celebratingGift) {
      // Fire confetti bursts
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6E91', '#C7A8FF', '#FFB2A8', '#FF4081', '#FFD700'],
      });

      const timer = setTimeout(() => {
        setCelebratingGift(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [celebratingGift, setCelebratingGift]);

  if (!celebratingGift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto animate-in fade-in zoom-in duration-300">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#241C3B] to-[#19132B] border-2 border-rose-400/50 p-6 shadow-2xl text-center text-white">
        <button
          onClick={() => setCelebratingGift(null)}
          className="absolute right-4 top-4 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative mx-auto w-24 h-24 mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
          <span className="text-6xl filter drop-shadow-xl animate-bounce">
            {celebratingGift.emoji}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-2 border border-rose-500/30">
          <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 animate-pulse" />
          <span>+{celebratingGift.affectionBonus} Affection Points!</span>
        </div>

        <h3 className="text-lg font-bold text-[#F7F2FA]">
          {celebratingGift.name} Received!
        </h3>
        <p className="text-xs text-rose-300 font-medium">
          {celebratingGift.banglaName}
        </p>

        <p className="text-xs text-[#CBC2D6] mt-3 italic bg-[#100C1C]/60 rounded-xl p-3 border border-white/5">
          "{celebratingGift.soundReaction}"
        </p>
      </div>
    </div>
  );
};
