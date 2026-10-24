import React from 'react';
import { X, Crown, Check, Sparkles, Heart, Zap } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

export const VipSubscriptionDialog: React.FC = () => {
  const { settings, updateSettings, setShowVipDialog } = useCompanion();
  const isVip = settings.subscriptionTier === 'VIP_PRO';

  const handleUpgrade = () => {
    updateSettings({ subscriptionTier: 'VIP_PRO' });
    setShowVipDialog(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#241C3B] to-[#19132B] border-2 border-amber-500/40 p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={() => setShowVipDialog(false)}
          className="absolute right-5 top-5 p-2 rounded-full text-[#988EA6] hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crown Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-900/40 mb-3">
            <div className="w-full h-full rounded-2xl bg-[#19132B] flex items-center justify-center text-amber-300">
              <Crown className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 mb-1">
            VIP Passion Pass 👑
          </span>
          <h3 className="text-2xl font-black text-[#F7F2FA]">
            Unlock All Companions
          </h3>
          <p className="text-xs text-[#CBC2D6] mt-1">
            Experience unlimited intimacy, deep conversations, and exclusive lovers
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-6 bg-[#100C1C]/60 rounded-2xl p-4 border border-white/5">
          {[
            'Unlock VIP Exclusive Girlfriend: Maya (মায়া) 💋',
            'Unlimited Deep Romantic Conversations & Stories 💕',
            'Priority Cloud Generation & Fast Responses ⚡',
            'Unlimited Memories in the Vault 🧠',
            'Golden VIP Lover Profile Badge 👑',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-[#F7F2FA]">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing & CTA */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1.5 mb-3">
            <span className="text-3xl font-black text-amber-300">$0 Free</span>
            <span className="text-xs text-[#988EA6]">/ In-App Companion Unlock</span>
          </div>

          {isVip ? (
            <div className="py-2.5 px-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              ✨ VIP Lover Status Active (Maya & Premium Perks Unlocked)
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 font-bold text-sm text-white shadow-xl shadow-amber-900/30 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Unlock Maya & All Features ($0 Free)</span>
            </button>
          )}

          <p className="text-[10px] text-[#988EA6] mt-2">
            100% Free • No credit card, no billing credentials, and no subscriptions required.
          </p>
        </div>
      </div>
    </div>
  );
};
