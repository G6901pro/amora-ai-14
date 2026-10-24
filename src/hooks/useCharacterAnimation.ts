import { useMemo } from 'react';
import type { TargetAndTransition, Transition } from 'framer-motion';
import {
  normalizeEmotion,
  EMOTION_CONFIGS,
  EmotionVisualConfig,
} from '../components/AnimatedCompanionAvatar';

export interface UseCharacterAnimationOptions {
  emotion?: string;
  isGenerating?: boolean;
  tension?: number;
}

export interface CharacterAnimationResult {
  /** Framer Motion whileHover animation target */
  whileHover: TargetAndTransition;
  /** Framer Motion animate keyframe target */
  animate: TargetAndTransition;
  /** Framer Motion transition options */
  transition: Transition;
  /** Normalized emotion key */
  emotionKey: string;
  /** Display label for the current emotion */
  label: string;
  /** Emoji symbol for the current emotion */
  emoji: string;
  /** CSS filter string reflecting current emotion (desaturation, saturation, brightness) */
  filter: string;
  /** Accent border color reflecting the emotion */
  borderColor: string;
  /** Raw emotion visual config */
  config: EmotionVisualConfig;
}

/**
 * Pure calculation function that determines dynamic animation targets
 * based on emotion, generating state, and tension.
 */
export function getCharacterAnimation(
  emotionOrOptions?: string | UseCharacterAnimationOptions,
  maybeIsGenerating?: boolean,
  maybeTension?: number
): CharacterAnimationResult {
  const options: UseCharacterAnimationOptions =
    typeof emotionOrOptions === 'object' && emotionOrOptions !== null
      ? emotionOrOptions
      : {
          emotion: typeof emotionOrOptions === 'string' ? emotionOrOptions : undefined,
          isGenerating: maybeIsGenerating,
          tension: maybeTension,
        };

  const { emotion, isGenerating = false, tension = 0 } = options;
  const emotionKey = normalizeEmotion(emotion, tension);
  const config = EMOTION_CONFIGS[emotionKey] || EMOTION_CONFIGS.neutral;

  // Dynamic whileHover target
  const whileHover: TargetAndTransition = {
    scale: 1.07,
    filter: 'brightness(1.08) saturate(1.1)',
    transition: {
      duration: 0.22,
      ease: 'easeOut',
    },
  };

  // Dynamic animate target reflecting character's emotion
  let animate: TargetAndTransition;
  let transition: Transition;

  if (isGenerating) {
    // Companion is thinking / generating response
    animate = {
      scale: [1, 1.045, 1],
      opacity: [0.92, 1, 0.92],
      boxShadow: [
        '0 0 6px rgba(244,63,94,0.3)',
        '0 0 16px rgba(244,63,94,0.7)',
        '0 0 6px rgba(244,63,94,0.3)',
      ],
    };
    transition = {
      duration: 1.4,
      repeat: Infinity,
      ease: 'easeInOut',
    };
  } else {
    switch (emotionKey) {
      case 'excitement':
        // Scale pulsing for joy / excitement
        animate = {
          scale: [1, 1.06, 0.99, 1.05, 1],
          opacity: [1, 1, 1],
          boxShadow: [
            '0 0 4px rgba(251,191,36,0.2)',
            '0 0 18px rgba(251,191,36,0.7)',
            '0 0 8px rgba(244,63,94,0.4)',
            '0 0 18px rgba(251,191,36,0.7)',
            '0 0 4px rgba(251,191,36,0.2)',
          ],
        };
        transition = {
          duration: 2.1,
          repeat: Infinity,
          ease: 'easeInOut',
        };
        break;

      case 'sadness':
        // Opacity changes and desaturation / sink for sadness
        animate = {
          scale: [0.98, 0.965, 0.98],
          opacity: [0.82, 0.95, 0.82],
          y: [0, 2.2, 0],
          boxShadow: [
            '0 0 4px rgba(148,163,184,0.2)',
            '0 0 12px rgba(100,116,139,0.45)',
            '0 0 4px rgba(148,163,184,0.2)',
          ],
        };
        transition = {
          duration: 4.2,
          repeat: Infinity,
          ease: 'easeInOut',
        };
        break;

      case 'anger':
      case 'frustration':
        // Micro-jitter / tension vibration
        animate = {
          scale: [1, 1.03, 1, 1.02, 1],
          x: [0, -1.2, 1.2, -0.6, 0.6, 0],
          rotate: [0, -1.2, 1.2, -0.6, 0],
          boxShadow: [
            '0 0 6px rgba(239,68,68,0.4)',
            '0 0 16px rgba(239,68,68,0.65)',
            '0 0 6px rgba(239,68,68,0.4)',
          ],
        };
        transition = {
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        };
        break;

      case 'affection':
        // Heartbeat pulse for love / affection
        animate = {
          scale: [1, 1.055, 1.015, 1.045, 1],
          boxShadow: [
            '0 0 6px rgba(244,63,94,0.3)',
            '0 0 18px rgba(244,63,94,0.7)',
            '0 0 10px rgba(244,63,94,0.4)',
            '0 0 18px rgba(244,63,94,0.7)',
            '0 0 6px rgba(244,63,94,0.3)',
          ],
        };
        transition = {
          duration: 2.6,
          repeat: Infinity,
          ease: 'easeInOut',
        };
        break;

      case 'playfulness':
        // Playful tilt and bounce
        animate = {
          scale: [1, 1.04, 0.99, 1.03, 1],
          rotate: [0, -2.5, 2.5, -1, 0],
          boxShadow: [
            '0 0 6px rgba(217,70,239,0.3)',
            '0 0 15px rgba(217,70,239,0.6)',
            '0 0 6px rgba(217,70,239,0.3)',
          ],
        };
        transition = {
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        };
        break;

      case 'shyness':
        // Soft breathing and subtle shy drop
        animate = {
          scale: [1, 0.97, 0.995, 0.975, 1],
          opacity: [0.9, 1, 0.9],
          y: [0, 1.2, 0],
          boxShadow: [
            '0 0 6px rgba(251,113,133,0.3)',
            '0 0 14px rgba(251,113,133,0.5)',
            '0 0 6px rgba(251,113,133,0.3)',
          ],
        };
        transition = {
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        };
        break;

      case 'curiosity':
        // Curious head tilt
        animate = {
          scale: [1, 1.03, 1],
          rotate: [0, 2.8, 0, -1.5, 0],
          y: [0, -1.8, 0],
          boxShadow: [
            '0 0 6px rgba(56,189,248,0.3)',
            '0 0 14px rgba(56,189,248,0.55)',
            '0 0 6px rgba(56,189,248,0.3)',
          ],
        };
        transition = {
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        };
        break;

      case 'calmness':
        // Deep slow peaceful breath
        animate = {
          scale: [1, 1.022, 1],
          opacity: [0.96, 1, 0.96],
          boxShadow: [
            '0 0 4px rgba(52,211,153,0.25)',
            '0 0 10px rgba(52,211,153,0.45)',
            '0 0 4px rgba(52,211,153,0.25)',
          ],
        };
        transition = {
          duration: 4.8,
          repeat: Infinity,
          ease: 'easeInOut',
        };
        break;

      case 'neutral':
      default:
        // Subtle lifelike breathing
        animate = {
          scale: [1, 1.018, 1],
          opacity: [0.98, 1, 0.98],
          boxShadow: [
            '0 0 4px rgba(244,63,94,0.2)',
            '0 0 10px rgba(244,63,94,0.35)',
            '0 0 4px rgba(244,63,94,0.2)',
          ],
        };
        transition = {
          duration: 4.0,
          repeat: Infinity,
          ease: 'easeInOut',
        };
        break;
    }
  }

  return {
    whileHover,
    animate,
    transition,
    emotionKey,
    label: config.label,
    emoji: config.emoji,
    filter: config.filter,
    borderColor: config.borderColor,
    config,
  };
}

/**
 * Custom React hook for dynamic Framer Motion character avatar animations.
 * Responds to emotional state from the relationship model:
 * - Joy / Excitement: Scale pulsing & vibrancy boost
 * - Sadness / Loneliness: Opacity changes, desaturation, subtle vertical sink
 * - Affection / Love: Double-heartbeat rhythmic pulsing & romantic warm glow
 * - Anger / Frustration: Micro-jitter displacement & high-tension alerts
 * - Shyness: Soft breathing & blushing scale
 * - Playfulness: Playful tilt and bounce
 * - Curiosity: Inquisitive head tilt
 * - Calmness / Neutral: Subtle lifelike breathing
 *
 * Supports both argument signatures:
 *   useCharacterAnimation(emotion, isGenerating, tension)
 *   useCharacterAnimation({ emotion, isGenerating, tension })
 */
export function useCharacterAnimation(
  emotionOrOptions?: string | UseCharacterAnimationOptions,
  maybeIsGenerating?: boolean,
  maybeTension?: number
): CharacterAnimationResult {
  const emotion =
    typeof emotionOrOptions === 'object' && emotionOrOptions !== null
      ? emotionOrOptions.emotion
      : typeof emotionOrOptions === 'string'
      ? emotionOrOptions
      : undefined;

  const isGenerating =
    typeof emotionOrOptions === 'object' && emotionOrOptions !== null
      ? emotionOrOptions.isGenerating
      : maybeIsGenerating;

  const tension =
    typeof emotionOrOptions === 'object' && emotionOrOptions !== null
      ? emotionOrOptions.tension
      : maybeTension;

  return useMemo(
    () => getCharacterAnimation(emotion, isGenerating, tension),
    [emotion, isGenerating, tension]
  );
}
