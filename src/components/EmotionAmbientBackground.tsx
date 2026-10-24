import React, { useEffect, useRef, useMemo } from 'react';
import { normalizeEmotion } from './AnimatedCompanionAvatar';

export interface EmotionBackgroundProps {
  /** Companion's active emotional state (e.g. affection, excitement, playfulness, calmness, etc.) */
  emotion?: string;
  /** Emotional tension (0-100) */
  tension?: number;
  /** Whether companion is currently formulating / generating a reply */
  isGenerating?: boolean;
  /** Optional overall opacity multiplier (default: 1.0) */
  intensity?: number;
  /** Optional custom class name */
  className?: string;
  /** Force disable particle animation (gradient only) */
  disableParticles?: boolean;
}

export interface EmotionTheme {
  name: string;
  label: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  radialGradient: string;
  pulseAnimationClass: string;
  particleType: 'hearts' | 'golden_sparks' | 'playful_bubbles' | 'calm_drift' | 'blossom_petals' | 'constellation' | 'gentle_rain' | 'warm_embers' | 'starlight';
  particleColors: string[];
  baseSpeed: number;
  particleCount: number;
  baseRadius: number;
}

/**
 * Returns the theme styling and particle physics configuration for a given emotion.
 */
export function getEmotionTheme(rawEmotion?: string, tension: number = 0): EmotionTheme {
  const normalized = normalizeEmotion(rawEmotion, tension);

  switch (normalized) {
    case 'affection':
      return {
        name: 'affection',
        label: 'Loving & Warm',
        emoji: '💖',
        primaryColor: '#FF6B8B',
        secondaryColor: '#FDA4AF',
        accentGlow: 'rgba(255, 107, 139, 0.14)',
        radialGradient:
          'radial-gradient(circle at 50% 25%, rgba(255, 107, 139, 0.16) 0%, rgba(244, 63, 94, 0.08) 45%, rgba(16, 12, 28, 0) 75%)',
        pulseAnimationClass: 'animate-heartbeat-pulse',
        particleType: 'hearts',
        particleColors: ['#FF6B8B', '#FF85A2', '#FDA4AF', '#F43F5E', '#FECDD3'],
        baseSpeed: 0.65,
        particleCount: 26,
        baseRadius: 3.5,
      };

    case 'excitement':
      return {
        name: 'excitement',
        label: 'Joyful & Happy',
        emoji: '✨',
        primaryColor: '#FBBF24',
        secondaryColor: '#F43F5E',
        accentGlow: 'rgba(251, 191, 36, 0.15)',
        radialGradient:
          'radial-gradient(circle at 50% 20%, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.08) 40%, rgba(244, 63, 94, 0.04) 70%, rgba(16, 12, 28, 0) 85%)',
        pulseAnimationClass: 'animate-happy-glow',
        particleType: 'golden_sparks',
        particleColors: ['#FBBF24', '#FCD34D', '#F59E0B', '#FDE68A', '#FFBE3D'],
        baseSpeed: 0.95,
        particleCount: 30,
        baseRadius: 3.2,
      };

    case 'playfulness':
      return {
        name: 'playfulness',
        label: 'Playful & Teasing',
        emoji: '😜',
        primaryColor: '#E879F9',
        secondaryColor: '#818CF8',
        accentGlow: 'rgba(232, 121, 249, 0.13)',
        radialGradient:
          'radial-gradient(circle at 45% 30%, rgba(232, 121, 249, 0.14) 0%, rgba(168, 85, 247, 0.07) 45%, rgba(129, 140, 248, 0.04) 70%, rgba(16, 12, 28, 0) 85%)',
        pulseAnimationClass: 'animate-playful-sway',
        particleType: 'playful_bubbles',
        particleColors: ['#E879F9', '#C084FC', '#A855F7', '#818CF8', '#F472B6'],
        baseSpeed: 0.85,
        particleCount: 26,
        baseRadius: 3.8,
      };

    case 'calmness':
      return {
        name: 'calmness',
        label: 'Peaceful & Calm',
        emoji: '🍃',
        primaryColor: '#34D399',
        secondaryColor: '#2DD4BF',
        accentGlow: 'rgba(52, 211, 153, 0.09)',
        radialGradient:
          'radial-gradient(circle at 50% 35%, rgba(52, 211, 153, 0.10) 0%, rgba(20, 184, 166, 0.05) 50%, rgba(16, 12, 28, 0) 80%)',
        pulseAnimationClass: 'animate-calm-drift',
        particleType: 'calm_drift',
        particleColors: ['#34D399', '#6EE7B7', '#2DD4BF', '#5EEAD4', '#A7F3D0'],
        baseSpeed: 0.42,
        particleCount: 22,
        baseRadius: 3.0,
      };

    case 'shyness':
      return {
        name: 'shyness',
        label: 'Shy & Sweet',
        emoji: '🌸',
        primaryColor: '#F472B6',
        secondaryColor: '#FBCFE8',
        accentGlow: 'rgba(244, 114, 182, 0.11)',
        radialGradient:
          'radial-gradient(circle at 50% 20%, rgba(244, 114, 182, 0.12) 0%, rgba(251, 113, 133, 0.06) 45%, rgba(16, 12, 28, 0) 75%)',
        pulseAnimationClass: 'animate-shy-blush',
        particleType: 'blossom_petals',
        particleColors: ['#F472B6', '#FDA4AF', '#FBCFE8', '#F9A8D4', '#FFF1F2'],
        baseSpeed: 0.55,
        particleCount: 24,
        baseRadius: 3.4,
      };

    case 'curiosity':
      return {
        name: 'curiosity',
        label: 'Curious & Inquisitive',
        emoji: '🔍',
        primaryColor: '#38BDF8',
        secondaryColor: '#818CF8',
        accentGlow: 'rgba(56, 189, 248, 0.11)',
        radialGradient:
          'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.06) 50%, rgba(16, 12, 28, 0) 80%)',
        pulseAnimationClass: 'animate-curious-orbit',
        particleType: 'constellation',
        particleColors: ['#38BDF8', '#7DD3FC', '#818CF8', '#A5B4FC', '#BAE6FD'],
        baseSpeed: 0.6,
        particleCount: 24,
        baseRadius: 2.8,
      };

    case 'sadness':
      return {
        name: 'sadness',
        label: 'Tender & Pensive',
        emoji: '🥺',
        primaryColor: '#94A3B8',
        secondaryColor: '#A5B4FC',
        accentGlow: 'rgba(148, 163, 184, 0.08)',
        radialGradient:
          'radial-gradient(circle at 50% 30%, rgba(148, 163, 184, 0.09) 0%, rgba(129, 140, 248, 0.04) 50%, rgba(16, 12, 28, 0) 80%)',
        pulseAnimationClass: 'animate-sadness-mist',
        particleType: 'gentle_rain',
        particleColors: ['#94A3B8', '#CBD5E1', '#A5B4FC', '#C7D2FE', '#E2E8F0'],
        baseSpeed: 0.7,
        particleCount: 22,
        baseRadius: 2.5,
      };

    case 'anger':
    case 'frustration':
      return {
        name: 'anger',
        label: 'Upset / Tense',
        emoji: '😤',
        primaryColor: '#F87171',
        secondaryColor: '#F59E0B',
        accentGlow: 'rgba(239, 68, 68, 0.10)',
        radialGradient:
          'radial-gradient(circle at 50% 25%, rgba(239, 68, 68, 0.11) 0%, rgba(245, 158, 11, 0.05) 50%, rgba(16, 12, 28, 0) 80%)',
        pulseAnimationClass: 'animate-anger-tension',
        particleType: 'warm_embers',
        particleColors: ['#F87171', '#FCA5A5', '#F59E0B', '#FBBF24', '#EF4444'],
        baseSpeed: 0.75,
        particleCount: 20,
        baseRadius: 2.8,
      };

    case 'neutral':
    default:
      return {
        name: 'neutral',
        label: 'Sweet Harmony',
        emoji: '✨',
        primaryColor: '#E11D48',
        secondaryColor: '#8B5CF6',
        accentGlow: 'rgba(225, 29, 72, 0.08)',
        radialGradient:
          'radial-gradient(circle at 50% 25%, rgba(225, 29, 72, 0.09) 0%, rgba(139, 92, 246, 0.05) 45%, rgba(16, 12, 28, 0) 80%)',
        pulseAnimationClass: 'animate-neutral-breathe',
        particleType: 'starlight',
        particleColors: ['#FB7185', '#C084FC', '#E879F9', '#FDA4AF', '#DDD6FE'],
        baseSpeed: 0.5,
        particleCount: 22,
        baseRadius: 2.6,
      };
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  wobblePhase: number;
  wobbleSpeed: number;
  shape: 'heart' | 'circle' | 'sparkle' | 'petal' | 'rain_drop';
  rotation: number;
  vRot: number;
}

export const EmotionAmbientBackground: React.FC<EmotionBackgroundProps> = ({
  emotion,
  tension = 0,
  isGenerating = false,
  intensity = 1.0,
  className = '',
  disableParticles = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const theme = useMemo(() => getEmotionTheme(emotion, tension), [emotion, tension]);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const isGeneratingRef = useRef(isGenerating);
  isGeneratingRef.current = isGenerating;

  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  // Particle engine with canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || disableParticles) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let isTabVisible = true;

    // Keep particles in memory
    const particles: Particle[] = [];

    const getShapeForTheme = (particleType: EmotionTheme['particleType']): Particle['shape'] => {
      switch (particleType) {
        case 'hearts':
          return Math.random() > 0.4 ? 'heart' : 'circle';
        case 'golden_sparks':
        case 'constellation':
          return Math.random() > 0.5 ? 'sparkle' : 'circle';
        case 'blossom_petals':
          return 'petal';
        case 'gentle_rain':
          return 'rain_drop';
        case 'playful_bubbles':
        case 'calm_drift':
        case 'warm_embers':
        case 'starlight':
        default:
          return 'circle';
      }
    };

    const initParticles = (count: number) => {
      particles.length = 0;
      const t = themeRef.current;

      for (let i = 0; i < count; i++) {
        const color = t.particleColors[i % t.particleColors.length];
        const shape = getShapeForTheme(t.particleType);
        const baseRadius = t.baseRadius * (0.7 + Math.random() * 0.7);

        // Velocity tailored to particle theme
        let vx = (Math.random() - 0.5) * t.baseSpeed * 0.4;
        let vy = -t.baseSpeed * (0.35 + Math.random() * 0.65);

        if (t.particleType === 'gentle_rain') {
          // Descending soft drizzle
          vy = Math.abs(vy) * 1.2;
          vx = (Math.random() - 0.5) * 0.2;
        } else if (t.particleType === 'calm_drift') {
          // Peaceful horizontal drifting
          vx = (Math.random() > 0.5 ? 1 : -1) * t.baseSpeed * (0.4 + Math.random() * 0.6);
          vy = (Math.random() - 0.5) * 0.15;
        } else if (t.particleType === 'hearts') {
          // Soft buoyant ascent
          vy = -t.baseSpeed * (0.3 + Math.random() * 0.5);
          vx = (Math.random() - 0.5) * 0.3;
        }

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx,
          vy,
          radius: baseRadius,
          baseRadius,
          color,
          alpha: 0.15 + Math.random() * 0.35,
          maxAlpha: 0.3 + Math.random() * 0.35,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.03,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.015 + Math.random() * 0.025,
          shape,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.02,
        });
      }
    };

    const handleResize = () => {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      if (particles.length === 0 && width > 0 && height > 0) {
        initParticles(themeRef.current.particleCount);
      }
    };

    // Draw helper functions
    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.save();
      c.translate(x, y);
      c.beginPath();
      const topCurveHeight = size * 0.3;
      c.moveTo(0, topCurveHeight);
      c.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
      c.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, size * 0.9, 0, size);
      c.bezierCurveTo(0, size * 0.9, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
      c.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
      c.closePath();
      c.fill();
      c.restore();
    };

    const drawSparkle = (c: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.beginPath();
      for (let i = 0; i < 4; i++) {
        c.lineTo(Math.cos((i * Math.PI) / 2) * size * 1.5, Math.sin((i * Math.PI) / 2) * size * 1.5);
        c.lineTo(
          Math.cos((i * Math.PI) / 2 + Math.PI / 4) * size * 0.3,
          Math.sin((i * Math.PI) / 2 + Math.PI / 4) * size * 0.3
        );
      }
      c.closePath();
      c.fill();
      c.restore();
    };

    const drawPetal = (c: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.beginPath();
      c.ellipse(0, 0, size * 1.2, size * 0.6, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    const drawRainDrop = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.save();
      c.translate(x, y);
      c.beginPath();
      c.moveTo(0, -size * 1.8);
      c.lineTo(size * 0.6, size);
      c.arc(0, size, size * 0.6, 0, Math.PI);
      c.lineTo(0, -size * 1.8);
      c.closePath();
      c.fill();
      c.restore();
    };

    // Main animation loop
    let lastTime = performance.now();

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (!isTabVisible || width <= 0 || height <= 0) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      const t = themeRef.current;
      const isGen = isGeneratingRef.current;
      const userIntensity = intensityRef.current;

      // When generating, particles have a slight gentle shimmer boost
      const genSpeedMultiplier = isGen ? 1.35 : 1.0;
      const genGlowMultiplier = isGen ? 1.25 : 1.0;

      // Draw faint constellation lines if theme is 'constellation'
      if (t.particleType === 'constellation' && !prefersReducedMotion) {
        ctx.lineWidth = 0.6;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 90) {
              const lineAlpha = (1 - dist / 90) * 0.08 * userIntensity;
              ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Update & render particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          // Physics step
          p.pulsePhase += p.pulseSpeed * genSpeedMultiplier;
          p.wobblePhase += p.wobbleSpeed * genSpeedMultiplier;
          p.rotation += p.vRot;

          // Horizontal swaying
          let sway = Math.sin(p.wobblePhase) * 0.35;
          if (t.particleType === 'hearts') {
            sway = Math.sin(p.wobblePhase) * 0.65;
          }

          p.x += (p.vx + sway) * (dt * 60) * genSpeedMultiplier;
          p.y += p.vy * (dt * 60) * genSpeedMultiplier;

          // Gentle breathing size
          p.radius = p.baseRadius * (1 + Math.sin(p.pulsePhase) * 0.2);

          // Alpha modulation
          p.alpha =
            (p.maxAlpha * (0.65 + Math.sin(p.pulsePhase) * 0.35)) *
            userIntensity *
            genGlowMultiplier;

          // Screen wrapping / recycling
          if (p.y < -20) {
            p.y = height + 15;
            p.x = Math.random() * width;
          } else if (p.y > height + 20) {
            p.y = -15;
            p.x = Math.random() * width;
          }

          if (p.x < -20) {
            p.x = width + 15;
          } else if (p.x > width + 20) {
            p.x = -15;
          }
        }

        // Draw particle with soft glow
        ctx.save();
        ctx.globalAlpha = Math.min(Math.max(p.alpha, 0), 0.7);
        ctx.fillStyle = p.color;

        // Subtle soft drop shadow for ambient luminesce
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.radius * 2;

        if (p.shape === 'heart') {
          drawHeart(ctx, p.x, p.y, p.radius * 2.2);
        } else if (p.shape === 'sparkle') {
          drawSparkle(ctx, p.x, p.y, p.radius * 1.5, p.rotation);
        } else if (p.shape === 'petal') {
          drawPetal(ctx, p.x, p.y, p.radius * 1.4, p.rotation);
        } else if (p.shape === 'rain_drop') {
          drawRainDrop(ctx, p.x, p.y, p.radius * 1.3);
        } else {
          // Default circle / soft bokeh mote
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    };

    // Observe container size
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    // Visibility change handler (saves 100% CPU when tab hidden)
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [disableParticles]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
    >
      {/* 1. Primary Emotion Radial Breathing Aura */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{
          background: theme.radialGradient,
          opacity: 0.85 * intensity,
        }}
      />

      {/* 2. Secondary Dynamic Emotional Pulse Ring / Glow (Gentle heartbeat or wave) */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-[140%] max-w-2xl h-80 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out ${theme.pulseAnimationClass}`}
        style={{
          background: `radial-gradient(ellipse at center, ${theme.accentGlow} 0%, rgba(16, 12, 28, 0) 70%)`,
          opacity: (isGenerating ? 0.95 : 0.75) * intensity,
        }}
      />

      {/* 3. Subtle Bottom Vignette Glow (Anchors the input bar visually) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none transition-colors duration-1000 ease-out"
        style={{
          background: `linear-gradient(to top, rgba(16, 12, 28, 0.85) 0%, rgba(16, 12, 28, 0.4) 50%, rgba(16, 12, 28, 0) 100%)`,
        }}
      />

      {/* 4. Canvas Floating Particles Layer */}
      {!disableParticles && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}
    </div>
  );
};
