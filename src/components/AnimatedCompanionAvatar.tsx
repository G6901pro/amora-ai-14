import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PrimaryEmotionType } from '../types';

export interface AnimatedAvatarProps {
  avatarUrl: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  emotion?: PrimaryEmotionType | string;
  intensity?: number;
  tension?: number;
  isGenerating?: boolean;
  showOnlineIndicator?: boolean;
  showEmotionBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface EmotionVisualConfig {
  key: string;
  label: string;
  emoji: string;
  borderColor: string;
  filter: string;
  boxShadow: string[];
  scale: number[];
  rotate?: number[];
  x?: number[];
  y?: number[];
  transitionDuration: number;
  badgeBg: string;
}

export function normalizeEmotion(
  rawEmotion?: string,
  tension: number = 0
): string {
  // If tension is high (>25), and character isn't explicitly happy/playful, tension dominates
  if (tension >= 28 && (!rawEmotion || ['neutral', 'calmness', 'calm'].includes(rawEmotion.toLowerCase()))) {
    return 'frustration';
  }

  if (!rawEmotion) return 'neutral';
  const lower = rawEmotion.toLowerCase().trim();

  if (['excited', 'excitement', 'joy', 'happy', 'happiness'].includes(lower)) return 'excitement';
  if (['sad', 'sadness', 'loneliness', 'disappointment', 'hurt'].includes(lower)) return 'sadness';
  if (['anger', 'angry', 'frustration', 'frustrated'].includes(lower)) return 'anger';
  if (['affection', 'love', 'romantic', 'sweet', 'caring'].includes(lower)) return 'affection';
  if (['playful', 'playfulness', 'banter', 'teasing'].includes(lower)) return 'playfulness';
  if (['shy', 'shyness', 'blush', 'embarrassed'].includes(lower)) return 'shyness';
  if (['curious', 'curiosity', 'inquisitive'].includes(lower)) return 'curiosity';
  if (['jealous', 'jealousy', 'envious'].includes(lower)) return 'jealousy';
  if (['calm', 'calmness', 'relaxed', 'peaceful'].includes(lower)) return 'calmness';

  return 'neutral';
}

export const EMOTION_CONFIGS: Record<string, EmotionVisualConfig> = {
  excitement: {
    key: 'excitement',
    label: 'Excited',
    emoji: '✨',
    borderColor: '#fbbf24', // Amber/gold
    filter: 'saturate(1.22) brightness(1.06) contrast(1.02)',
    boxShadow: [
      '0 0 0px rgba(251,191,36,0)',
      '0 0 16px rgba(251,191,36,0.65)',
      '0 0 6px rgba(244,63,94,0.45)',
      '0 0 16px rgba(251,191,36,0.65)',
    ],
    scale: [1, 1.055, 0.985, 1.04, 1],
    transitionDuration: 2.2,
    badgeBg: 'bg-amber-500/25 text-amber-200 border-amber-400/40',
  },
  sadness: {
    key: 'sadness',
    label: 'Sad / Pensive',
    emoji: '🥺',
    borderColor: '#94a3b8', // Slate / muted lavender
    filter: 'grayscale(45%) saturate(0.62) brightness(0.91)',
    boxShadow: [
      '0 0 6px rgba(148,163,184,0.3)',
      '0 0 12px rgba(100,116,139,0.4)',
      '0 0 6px rgba(148,163,184,0.3)',
    ],
    scale: [0.98, 0.97, 0.98],
    y: [0, 1.8, 0],
    transitionDuration: 4.5,
    badgeBg: 'bg-slate-700/50 text-slate-200 border-slate-500/40',
  },
  anger: {
    key: 'anger',
    label: 'Upset / Tense',
    emoji: '😤',
    borderColor: '#f87171', // Red / coral
    filter: 'contrast(1.12) saturate(1.08) brightness(0.98)',
    boxShadow: [
      '0 0 6px rgba(239,68,68,0.4)',
      '0 0 16px rgba(239,68,68,0.65)',
      '0 0 8px rgba(245,158,11,0.4)',
      '0 0 16px rgba(239,68,68,0.65)',
    ],
    scale: [1, 1.02, 1],
    x: [0, -0.8, 0.8, -0.4, 0.4, 0],
    transitionDuration: 1.8,
    badgeBg: 'bg-rose-950/70 text-rose-200 border-rose-500/50',
  },
  affection: {
    key: 'affection',
    label: 'Loving & Warm',
    emoji: '💖',
    borderColor: '#fb7185', // Rose
    filter: 'saturate(1.14) brightness(1.04)',
    boxShadow: [
      '0 0 8px rgba(244,63,94,0.35)',
      '0 0 18px rgba(244,63,94,0.65)',
      '0 0 10px rgba(244,63,94,0.4)',
      '0 0 18px rgba(244,63,94,0.65)',
    ],
    // Subtle rhythmic heartbeat double-pulse
    scale: [1, 1.045, 1.01, 1.035, 1],
    transitionDuration: 2.8,
    badgeBg: 'bg-rose-500/25 text-rose-200 border-rose-400/40',
  },
  playfulness: {
    key: 'playfulness',
    label: 'Playful & Teasing',
    emoji: '😜',
    borderColor: '#e879f9', // Fuchsia
    filter: 'saturate(1.16) brightness(1.03)',
    boxShadow: [
      '0 0 6px rgba(217,70,239,0.35)',
      '0 0 15px rgba(217,70,239,0.6)',
      '0 0 6px rgba(217,70,239,0.35)',
    ],
    rotate: [0, -2.5, 2.5, -1, 0],
    scale: [1, 1.03, 0.99, 1.02, 1],
    transitionDuration: 3.2,
    badgeBg: 'bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-400/40',
  },
  shyness: {
    key: 'shyness',
    label: 'Shy & Blushing',
    emoji: '🌸',
    borderColor: '#fda4af', // Light rose / peach
    filter: 'saturate(1.12) brightness(1.03)',
    boxShadow: [
      '0 0 6px rgba(251,113,133,0.3)',
      '0 0 14px rgba(251,113,133,0.5)',
      '0 0 6px rgba(251,113,133,0.3)',
    ],
    scale: [1, 0.965, 0.99, 0.97, 1],
    y: [0, 1, 0],
    transitionDuration: 3.6,
    badgeBg: 'bg-pink-500/25 text-pink-200 border-pink-300/40',
  },
  curiosity: {
    key: 'curiosity',
    label: 'Curious',
    emoji: '🔍',
    borderColor: '#38bdf8', // Sky
    filter: 'brightness(1.05) contrast(1.04)',
    boxShadow: [
      '0 0 6px rgba(56,189,248,0.35)',
      '0 0 14px rgba(56,189,248,0.55)',
      '0 0 6px rgba(56,189,248,0.35)',
    ],
    rotate: [0, 2.8, 0],
    scale: [1, 1.025, 1],
    transitionDuration: 3.4,
    badgeBg: 'bg-sky-500/25 text-sky-200 border-sky-400/40',
  },
  jealousy: {
    key: 'jealousy',
    label: 'Playfully Jealous',
    emoji: '😒',
    borderColor: '#f59e0b', // Amber
    filter: 'contrast(1.08) saturate(1.08)',
    boxShadow: [
      '0 0 6px rgba(245,158,11,0.35)',
      '0 0 13px rgba(245,158,11,0.55)',
      '0 0 6px rgba(245,158,11,0.35)',
    ],
    rotate: [0, -1.8, 1.5, 0],
    scale: [1, 1.02, 1],
    transitionDuration: 3.0,
    badgeBg: 'bg-amber-600/25 text-amber-200 border-amber-500/40',
  },
  calmness: {
    key: 'calmness',
    label: 'Peaceful & Calm',
    emoji: '🍃',
    borderColor: '#34d399', // Emerald
    filter: 'saturate(1.02) brightness(1.01)',
    boxShadow: [
      '0 0 4px rgba(52,211,153,0.25)',
      '0 0 10px rgba(52,211,153,0.45)',
      '0 0 4px rgba(52,211,153,0.25)',
    ],
    scale: [1, 1.018, 1],
    transitionDuration: 4.8,
    badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  },
  neutral: {
    key: 'neutral',
    label: 'Attentive',
    emoji: '💬',
    borderColor: '#fb7185',
    filter: 'saturate(1) brightness(1)',
    boxShadow: [
      '0 0 4px rgba(244,63,94,0.25)',
      '0 0 10px rgba(244,63,94,0.4)',
      '0 0 4px rgba(244,63,94,0.25)',
    ],
    scale: [1, 1.015, 1],
    transitionDuration: 4.2,
    badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-500/30',
  },
};

const SIZE_STYLES = {
  xs: {
    container: 'w-6 h-6',
    border: 'border',
    onlineDot: 'w-2 h-2',
    badge: 'text-[8px] -bottom-1 -right-1 px-1 py-0',
  },
  sm: {
    container: 'w-8 h-8',
    border: 'border',
    onlineDot: 'w-2.5 h-2.5',
    badge: 'text-[9px] -bottom-1 -right-1 px-1 py-0',
  },
  md: {
    container: 'w-11 h-11 sm:w-12 sm:h-12',
    border: 'border-2',
    onlineDot: 'w-3.5 h-3.5',
    badge: 'text-[10px] -bottom-1 -right-1 px-1.5 py-0.5',
  },
  lg: {
    container: 'w-14 h-14',
    border: 'border-2',
    onlineDot: 'w-4 h-4',
    badge: 'text-[11px] -bottom-1.5 -right-1.5 px-1.5 py-0.5',
  },
  xl: {
    container: 'w-20 h-20',
    border: 'border-2',
    onlineDot: 'w-5 h-5',
    badge: 'text-xs -bottom-2 -right-2 px-2 py-0.5',
  },
};

export const AnimatedCompanionAvatar: React.FC<AnimatedAvatarProps> = ({
  avatarUrl,
  name,
  size = 'md',
  emotion,
  intensity = 0.6,
  tension = 0,
  isGenerating = false,
  showOnlineIndicator = true,
  showEmotionBadge = false,
  className = '',
  onClick,
}) => {
  const normalizedKey = useMemo(
    () => normalizeEmotion(emotion, tension),
    [emotion, tension]
  );

  const config = EMOTION_CONFIGS[normalizedKey] || EMOTION_CONFIGS.neutral;
  const sizeConfig = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div
      className={`relative shrink-0 select-none ${sizeConfig.container} ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
      title={`${name} — Emotion: ${config.label} (${config.emoji})`}
    >
      {/* Outer Motion Wrapper for glow halo and physical transform */}
      <motion.div
        className={`w-full h-full rounded-full ${sizeConfig.border} overflow-hidden bg-[#181128] transition-colors`}
        animate={
          isGenerating
            ? {
                scale: [1, 1.04, 1],
                boxShadow: [
                  '0 0 6px rgba(244,63,94,0.4)',
                  '0 0 16px rgba(244,63,94,0.7)',
                  '0 0 6px rgba(244,63,94,0.4)',
                ],
                borderColor: ['#fb7185', '#fda4af', '#fb7185'],
              }
            : {
                scale: config.scale,
                rotate: config.rotate || 0,
                x: config.x || 0,
                y: config.y || 0,
                boxShadow: config.boxShadow,
                borderColor: config.borderColor,
              }
        }
        transition={{
          duration: isGenerating ? 1.5 : config.transitionDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          borderStyle: 'solid',
        }}
      >
        {/* Inner Motion Image for filter (desaturation for sad, vibrancy for excited, etc.) */}
        <motion.img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover object-top select-none pointer-events-none"
          initial={false}
          animate={{
            filter: isGenerating ? 'brightness(1.05)' : config.filter,
          }}
          transition={{
            duration: 0.8,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Online indicator / Breathing status dot */}
      {showOnlineIndicator && !showEmotionBadge && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-[#19132B] ${sizeConfig.onlineDot} ${
            normalizedKey === 'sadness'
              ? 'bg-slate-400'
              : normalizedKey === 'anger'
              ? 'bg-rose-500 animate-pulse'
              : normalizedKey === 'excitement'
              ? 'bg-amber-400 animate-ping'
              : 'bg-emerald-500 animate-pulse'
          }`}
          title={`${name} is currently connected and active`}
        />
      )}

      {/* Emotion Micro-Badge (when showEmotionBadge is enabled) */}
      <AnimatePresence>
        {showEmotionBadge && (
          <motion.div
            key={config.key}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={`absolute rounded-full border shadow-md flex items-center justify-center font-bold leading-none ${sizeConfig.badge} ${config.badgeBg}`}
            title={`Mood: ${config.label}`}
          >
            <span>{config.emoji}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { useCharacterAnimation } from '../hooks/useCharacterAnimation';
export type {
  UseCharacterAnimationOptions,
  CharacterAnimationResult,
} from '../hooks/useCharacterAnimation';
