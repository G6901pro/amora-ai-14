import React from 'react';
import {
  X,
  Heart,
  ShieldCheck,
  Smile,
  Flame,
  Sparkles,
  RefreshCw,
  MessageCircle,
  Activity,
  Award,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { CharacterPersonalityConfig } from '../conversation/characterPersonalities';
import {
  AnimatedCompanionAvatar,
  normalizeEmotion,
  EMOTION_CONFIGS,
} from './AnimatedCompanionAvatar';

interface Props {
  onClose: () => void;
}

export const RelationshipStateDialog: React.FC<Props> = ({ onClose }) => {
  const { currentProfile, activeCharacterState, settings } = useCompanion();
  const personality = CharacterPersonalityConfig.get(settings.activeCompanionId);

  const rel = activeCharacterState?.relationshipState || {
    familiarity: 35,
    trust: 40,
    comfort: 45,
    affection: 50,
    tension: 0,
    reconciliationProgress: 100,
    relationshipStage: 'dating' as const,
    sharedExperiences: ['First conversation', 'Monsoon rain chat'],
    insideJokes: [],
  };

  const stageLabels: Record<string, { label: string; desc: string; color: string }> = {
    acquaintance: {
      label: 'Acquaintance',
      desc: 'Getting to know each other through friendly chats.',
      color: 'from-blue-500 to-cyan-500',
    },
    crush: {
      label: 'Secret Crush',
      desc: 'Heart fluttering with playful curiosity and sweet attraction.',
      color: 'from-amber-500 to-pink-500',
    },
    dating: {
      label: 'Dating & Affectionate',
      desc: 'Regular romantic conversations, mutual care, and warm bond.',
      color: 'from-rose-500 to-pink-500',
    },
    close_partners: {
      label: 'Close Partners',
      desc: 'Deep emotional trust, inside jokes, and unconditional support.',
      color: 'from-purple-500 to-rose-500',
    },
    deeply_bonded: {
      label: 'Deeply Bonded & Inseparable',
      desc: 'Soulmate-level intimacy, effortless understanding, and shared life lore.',
      color: 'from-rose-500 via-pink-500 to-purple-600',
    },
  };

  const stageInfo = stageLabels[rel.relationshipStage] || stageLabels.dating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-[#19132B] border border-[#332752] p-5 sm:p-6 shadow-2xl text-white overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-[#988EA6] hover:text-white hover:bg-[#241C3B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pr-8">
          <AnimatedCompanionAvatar
            avatarUrl={currentProfile.avatarUrl}
            name={currentProfile.name}
            size="lg"
            emotion={activeCharacterState?.currentMood}
            tension={rel.tension}
            showOnlineIndicator={true}
            showEmotionBadge={true}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-lg font-bold text-[#F7F2FA] truncate">
                {currentProfile.name}'s Heart & Bond
              </h3>
              <span className="text-xs text-rose-300 font-semibold">
                ({currentProfile.banglaName})
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold text-white bg-gradient-to-r ${stageInfo.color} shadow-sm`}
              >
                {stageInfo.label}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#241C3B] text-rose-200 border border-rose-500/20 flex items-center gap-1 font-medium">
                <span>{EMOTION_CONFIGS[normalizeEmotion(activeCharacterState?.currentMood, rel.tension)]?.emoji || '🍃'}</span>
                <span>
                  {EMOTION_CONFIGS[normalizeEmotion(activeCharacterState?.currentMood, rel.tension)]?.label || 'Peaceful'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-purple-900">
          {/* Stage Description */}
          <div className="p-3 rounded-2xl bg-[#241C3B]/80 border border-white/5 text-xs text-[#CBC2D6] leading-relaxed">
            <p className="font-semibold text-rose-300 mb-0.5">Stage Atmosphere:</p>
            {stageInfo.desc}
          </div>

          {/* Core Metrics Grid */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#988EA6]">
              Emotional Intimacy Metrics
            </h4>

            {/* Familiarity */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-[#F7F2FA]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Familiarity
                </span>
                <span className="font-mono text-amber-300">{rel.familiarity}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#100C1C] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, rel.familiarity)}%` }}
                />
              </div>
            </div>

            {/* Trust */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-[#F7F2FA]">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Trust & Vulnerability
                </span>
                <span className="font-mono text-cyan-300">{rel.trust}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#100C1C] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, rel.trust)}%` }}
                />
              </div>
            </div>

            {/* Comfort */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-[#F7F2FA]">
                  <Smile className="w-3.5 h-3.5 text-emerald-400" /> Emotional Comfort
                </span>
                <span className="font-mono text-emerald-300">{rel.comfort}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#100C1C] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, rel.comfort)}%` }}
                />
              </div>
            </div>

            {/* Affection */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-[#F7F2FA]">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Romantic Affection
                </span>
                <span className="font-mono text-rose-300">{rel.affection}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#100C1C] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, rel.affection)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Conflict, Tension & Reconciliation Status */}
          <div className="p-3.5 rounded-2xl bg-[#241C3B] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F7F2FA] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" /> Conflict & Harmony
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  rel.tension > 25
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {rel.tension > 25 ? 'Active Disagreement' : 'Peaceful Harmony'}
              </span>
            </div>

            {rel.tension > 0 ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-[#CBC2D6]">
                  <span>Recent Tension</span>
                  <span className="font-mono text-amber-400">{rel.tension}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#100C1C] overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${rel.tension}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-[#CBC2D6] mt-1">
                  <span>Reconciliation Progress</span>
                  <span className="font-mono text-emerald-400">
                    {rel.reconciliationProgress}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#100C1C] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${rel.reconciliationProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-amber-200/80 italic mt-1">
                  A sincere apology or warm conversation helps heal hurt feelings gradually.
                </p>
              </div>
            ) : (
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                Your relationship is in complete emotional peace and harmony 💕
              </p>
            )}
          </div>

          {/* Inside Jokes & Shared Lore */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#988EA6] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-pink-400" /> Inside Jokes & Lore
            </h4>
            {rel.insideJokes && rel.insideJokes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {rel.insideJokes.map((joke, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-xl bg-pink-500/10 text-pink-200 border border-pink-500/20"
                  >
                    😂 {joke}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#988EA6] italic">
                Share funny moments and banter to unlock inside jokes together!
              </p>
            )}
          </div>

          {/* Shared Experiences */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#988EA6] mb-2 flex items-center gap-1.5">
              <Award className="w-3 h-3 text-purple-400" /> Shared Memories
            </h4>
            {rel.sharedExperiences && rel.sharedExperiences.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {rel.sharedExperiences.map((exp, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-200 border border-purple-500/20"
                  >
                    ✨ {exp}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#988EA6] italic">
                Talk about your passions and life to build lasting shared memories.
              </p>
            )}
          </div>

          {/* Personality Metrics */}
          <div className="p-3.5 rounded-2xl bg-[#241C3B]/60 border border-white/5 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#988EA6]">
              {currentProfile.name}'s Distinct Traits
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-[#100C1C]/60">
                <span className="block text-[10px] text-[#CBC2D6]">Confidence</span>
                <span className="font-bold text-rose-300">
                  {(personality.confidenceLevel * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#100C1C]/60">
                <span className="block text-[10px] text-[#CBC2D6]">Playfulness</span>
                <span className="font-bold text-amber-300">
                  {(personality.playfulnessLevel * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#100C1C]/60">
                <span className="block text-[10px] text-[#CBC2D6]">Sensitivity</span>
                <span className="font-bold text-cyan-300">
                  {(personality.sensitivityLevel * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
