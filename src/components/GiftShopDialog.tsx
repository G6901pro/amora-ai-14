import React from 'react';
import { X, Gift, Sparkles, Heart } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { GIFT_CATALOG } from '../data/catalog';
import { GiftItem } from '../types';

export const GiftShopDialog: React.FC = () => {
  const { currentProfile, settings, sendGift, setShowGiftDialog } = useCompanion();

  const handleSend = (gift: GiftItem) => {
    sendGift(gift);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-[#19132B] border border-[#332752] p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={() => setShowGiftDialog(false)}
          className="absolute right-5 top-5 p-2 rounded-full text-[#988EA6] hover:text-white hover:bg-[#241C3B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#F7F2FA]">
              Romantic Gift Boutique 🎁
            </h3>
            <p className="text-xs text-[#CBC2D6]">
              Surprise {currentProfile.name} to boost affection & unlock sweet reactions!
            </p>
          </div>
        </div>

        {/* Gift Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 my-2 pr-1">
          {GIFT_CATALOG.map((gift) => (
            <div
              key={gift.id}
              className="flex flex-col justify-between p-3.5 rounded-2xl bg-[#241C3B] border border-white/5 hover:border-rose-500/40 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl filter drop-shadow group-hover:scale-110 transition-transform">
                    {gift.emoji}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                    <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                    +{gift.affectionBonus}
                  </span>
                </div>

                <h4 className="font-semibold text-sm text-[#F7F2FA]">
                  {gift.name}
                </h4>
                <p className="text-[11px] text-rose-300/90 font-medium">
                  {gift.banglaName}
                </p>
                <p className="text-[11px] text-[#988EA6] mt-1 line-clamp-2 leading-relaxed">
                  {gift.description}
                </p>
              </div>

              <button
                onClick={() => handleSend(gift)}
                className="mt-3 w-full py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-xs font-semibold text-white shadow-md shadow-rose-950/30 transition-all flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gift Now</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
