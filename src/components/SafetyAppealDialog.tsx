import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, X, RefreshCw } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
}

export const SafetyAppealDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { safetyRestriction, submitAppeal, checkSafetyStatus } = useCompanion();
  const [appealReason, setAppealReason] = useState('');
  const [acknowledgePolicy, setAcknowledgePolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appealMessage, setAppealMessage] = useState<string | null>(null);
  const [appealSuccess, setAppealSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(
    safetyRestriction?.remainingSeconds || 900
  );

  useEffect(() => {
    if (safetyRestriction?.remainingSeconds) {
      setSecondsLeft(safetyRestriction.remainingSeconds);
    }
  }, [safetyRestriction?.remainingSeconds]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          checkSafetyStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, checkSafetyStatus]);

  if (!isOpen || !safetyRestriction?.isRestricted) {
    return null;
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledgePolicy) {
      setAppealMessage('Please acknowledge the Community Safety Policy checkbox.');
      return;
    }

    setIsSubmitting(true);
    setAppealMessage(null);
    try {
      const res = await submitAppeal(appealReason, acknowledgePolicy);
      setAppealMessage(res.message);
      if (res.success) {
        setAppealSuccess(true);
        setTimeout(() => {
          if (onClose) onClose();
        }, 1800);
      }
    } catch {
      setAppealMessage('Failed to submit appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#19132B] border-2 border-rose-500/50 p-6 shadow-2xl text-white overflow-hidden">
        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Community Safety Restriction</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                15-Min Lock
              </span>
            </h3>
            <p className="text-xs text-[#CBC2D6]">
              Temporary server-side messaging restriction in effect
            </p>
          </div>
        </div>

        {/* Lock Timer Display */}
        <div className="mb-4 p-4 rounded-2xl bg-[#100C1C] border border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <div className="text-[11px] text-[#CBC2D6] font-medium">Time Remaining on Lock:</div>
              <div className="text-xl font-mono font-bold text-rose-400 tracking-wider">
                {formatTime(secondsLeft)}
              </div>
            </div>
          </div>
          <button
            onClick={() => checkSafetyStatus()}
            className="p-2 rounded-xl bg-[#241C3B] hover:bg-[#332752] text-xs text-[#CBC2D6] hover:text-white transition-colors flex items-center gap-1.5"
            title="Check lock status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[11px]">Recheck</span>
          </button>
        </div>

        {/* Policy Explanation */}
        <div className="space-y-2 mb-5 text-xs text-[#CBC2D6] leading-relaxed bg-[#241C3B]/60 p-3.5 rounded-2xl border border-white/5">
          <p className="font-semibold text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Strict Zero-Tolerance Child Safety Protection</span>
          </p>
          <p>
            Amora AI is designed exclusively for consensual adult romantic roleplay and relationships with adult characters age 21+.
          </p>
          <p className="text-[11px] text-[#988EA6]">
            Any sexualization of minors, underage sexual roleplay, or child exploitation is strictly prohibited. Legitimate health, puberty, anatomy, or biology education questions are permitted, but severe or repeated violations result in this backend lock.
          </p>
        </div>

        {/* Appeal Form */}
        {appealSuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{appealMessage || 'Appeal accepted. Restriction unlocked successfully.'}</span>
          </div>
        ) : (
          <form onSubmit={handleAppealSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-white">
              Misunderstanding Appeal & Unlock Request:
            </label>
            <textarea
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="If your message was a legitimate educational, anatomy, or health question, or entered inadvertently, please explain briefly..."
              rows={3}
              className="w-full bg-[#100C1C] border border-[#332752] rounded-xl p-3 text-xs text-white placeholder-[#988EA6] focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none"
            />

            <label className="flex items-start gap-2.5 text-xs text-[#CBC2D6] cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledgePolicy}
                onChange={(e) => setAcknowledgePolicy(e.target.checked)}
                className="mt-0.5 rounded border-[#332752] bg-[#100C1C] text-rose-500 focus:ring-rose-400"
              />
              <span>
                I confirm I am an adult (18+) and agree to uphold all consensual adult community guidelines.
              </span>
            </label>

            {appealMessage && !appealSuccess && (
              <div className="text-xs text-rose-400 font-medium">
                {appealMessage}
              </div>
            )}

            <div className="pt-2 flex gap-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-[#241C3B] hover:bg-[#332752] text-xs font-semibold text-[#CBC2D6] hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !acknowledgePolicy}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  acknowledgePolicy && !isSubmitting
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-950/40'
                    : 'bg-[#241C3B] text-[#988EA6] cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? 'Verifying Appeal...' : 'Submit Appeal & Unlock'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
