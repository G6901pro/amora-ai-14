import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Gift,
  Send,
  Languages,
  Calendar,
  Brain,
  MessageSquare,
  Sparkles,
  Heart,
  Copy,
  Check,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  ShieldAlert,
  Activity,
  ArrowLeft,
  Search,
  Plus,
  Compass,
  MoreVertical,
  CheckCheck,
  Mic,
  MicOff,
  Radio,
  Smile,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useCompanion } from '../context/CompanionContext';
import { getRelationshipLevel, GIRLFRIEND_PROFILES } from '../data/catalog';
import { ConversationMode, ChatSession, GirlfriendProfile } from '../types';
import {
  AnimatedCompanionAvatar,
  normalizeEmotion,
  EMOTION_CONFIGS,
} from '../components/AnimatedCompanionAvatar';
import {
  EmotionAmbientBackground,
  getEmotionTheme,
} from '../components/EmotionAmbientBackground';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { CharacterBioDialog } from '../components/CharacterBioDialog';
import { SafetyAppealDialog } from '../components/SafetyAppealDialog';

interface Props {
  onNavigateToDiscover?: () => void;
}

function formatChatTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ChatScreen: React.FC<Props> = ({ onNavigateToDiscover }) => {
  const {
    currentProfile,
    settings,
    messages,
    sessions,
    isGenerating,
    activeCharacterState,
    sendMessage,
    retryMessage,
    deleteMessage,
    toggleMessageReaction,
    deleteSession,
    selectOrOpenCharacter,
    updateSettings,
    setShowGiftDialog,
    setShowCheckInDialog,
    setShowMemorySheet,
    setShowSessionsSheet,
    setShowRelationshipDialog,
    safetyRestriction,
    showSafetyAppealDialog,
    setShowSafetyAppealDialog,
    providerHealth,
    isCheckingHealth,
    checkProviderHealth,
  } = useCompanion();

  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'inbox' | 'chat'>('chat');
  const [selectedBioProfile, setSelectedBioProfile] = useState<GirlfriendProfile | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const longPressTimerRef = useRef<any>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const REACTION_EMOJIS = useMemo(
    () => [
      { emoji: '❤️', label: 'Love' },
      { emoji: '⭐', label: 'Star' },
      { emoji: '🥰', label: 'Adore' },
      { emoji: '✨', label: 'Sparkle' },
      { emoji: '🌸', label: 'Sweet' },
      { emoji: '🔥', label: 'Passion' },
      { emoji: '🥺', label: 'Touched' },
      { emoji: '😆', label: 'Haha' },
    ],
    []
  );

  const startLongPress = (msgId: string, clientX?: number, clientY?: number) => {
    if (clientX !== undefined && clientY !== undefined) {
      touchStartPosRef.current = { x: clientX, y: clientY };
    }
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setActiveReactionMsgId(msgId);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch {}
      }
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPosRef.current && e.touches[0]) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
      if (dx > 12 || dy > 12) {
        cancelLongPress();
      }
    }
  };

  const handleSelectReaction = (msgId: string, emoji: string) => {
    toggleMessageReaction(msgId, emoji);
    setActiveReactionMsgId(null);

    // Burst confetti when reacting with love or stars
    if (['❤️', '⭐', '✨', '🥰'].includes(emoji)) {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#FF6E91', '#FFD700', '#FF4081', '#E0A8FF'],
      });
    }
  };

  // Close reaction picker on outside click or tap
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.reaction-picker-container')) {
        setActiveReactionMsgId(null);
      }
    };
    if (activeReactionMsgId) {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      return () => {
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('touchstart', handleOutsideClick);
      };
    }
  }, [activeReactionMsgId]);

  // If there are no sessions at all, stay on inbox view on mobile
  useEffect(() => {
    if (sessions.length === 0) {
      setMobileView('inbox');
    }
  }, [sessions.length]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Permanently disable all speech synthesis output
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Voice is permanently disabled
      }
    }
  }, []);

  const relationship = getRelationshipLevel(settings.affectionPoints);

  const handleVoiceSend = useCallback(
    (spokenText: string) => {
      if (safetyRestriction?.isRestricted) {
        setShowSafetyAppealDialog(true);
        stopListening();
        return;
      }
      if (!spokenText.trim() || isGenerating) return;
      setInput('');
      sendMessage(spokenText.trim());
    },
    [safetyRestriction?.isRestricted, isGenerating, sendMessage, setShowSafetyAppealDialog]
  );

  // Web Speech API Voice-to-Text input
  const {
    isSupported: isSpeechSupported,
    isListening,
    speechLang,
    setSpeechLang,
    errorMessage: speechError,
    interimText,
    clearError: clearSpeechError,
    startListening,
    stopListening,
    toggleListening,
  } = useVoiceInput({
    initialLang: settings.languageMode === 'en' ? 'en-US' : 'bn-BD',
    handsFree: Boolean(settings.handsFreeVoiceMode),
    autoSendSilenceMs: 1800,
    onTranscript: (newText) => {
      setInput(newText);
    },
    onSpeechFinalized: (finalText) => {
      handleVoiceSend(finalText);
    },
  });

  // Hands-free auto-resume loop: when companion finishes replying, resume listening automatically
  const prevGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    if (prevGeneratingRef.current && !isGenerating) {
      if (settings.handsFreeVoiceMode && !safetyRestriction?.isRestricted) {
        const timer = setTimeout(() => {
          startListening('');
        }, 900);
        return () => clearTimeout(timer);
      }
    }
    prevGeneratingRef.current = isGenerating;
  }, [isGenerating, settings.handsFreeVoiceMode, safetyRestriction?.isRestricted, startListening]);

  const toggleHandsFree = () => {
    const nextMode = !settings.handsFreeVoiceMode;
    updateSettings({ handsFreeVoiceMode: nextMode });
    if (nextMode && !isListening) {
      startListening(input);
    }
  };

  // Derived emotional state for avatar animations
  const latestBotMsg = [...messages].reverse().find((m) => !m.isUser);
  const activeEmotion =
    activeCharacterState?.currentMood ||
    (latestBotMsg as any)?.emotionAnalysis?.primaryEmotion ||
    'neutral';
  const activeTension = activeCharacterState?.relationshipState?.tension || 0;
  const currentEmotionKey = normalizeEmotion(activeEmotion, activeTension);
  const currentEmotionConfig =
    EMOTION_CONFIGS[currentEmotionKey] || EMOTION_CONFIGS.neutral;

  const characterAnimation = useCharacterAnimation(
    activeEmotion,
    isGenerating,
    activeTension
  );

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isListening) {
      stopListening();
    }
    if (safetyRestriction?.isRestricted) {
      setShowSafetyAppealDialog(true);
      return;
    }
    if (!input.trim() || isGenerating) return;
    const textToSend = input;
    setInput('');
    sendMessage(textToSend);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleLanguage = () => {
    const nextLang =
      settings.languageMode === 'bn'
        ? 'en'
        : settings.languageMode === 'en'
        ? 'both'
        : 'bn';
    updateSettings({ languageMode: nextLang });
  };

  const samplePhotoDate = () => {
    sendMessage(
      'Sent you a photo memory from our virtual coffee date! ☕📸',
      currentProfile.avatarUrl
    );
  };

  // Sort sessions: Newest conversation activity first
  const sortedSessions = useMemo(() => {
    const list = [...sessions];
    list.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((s) => {
      const char = GIRLFRIEND_PROFILES.find((p) => p.id === s.companionId);
      return (
        s.title.toLowerCase().includes(q) ||
        s.lastMessage?.toLowerCase().includes(q) ||
        char?.name.toLowerCase().includes(q) ||
        char?.banglaName.includes(q)
      );
    });
  }, [sessions, searchQuery]);

  const handleOpenConversation = (companionId: string) => {
    selectOrOpenCharacter(companionId);
    setMobileView('chat');
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteSession(sessionId);
  };

  // Clean roleplay message preview for inbox list
  const formatPreviewMessage = (text: string) => {
    if (!text) return 'Start chatting...';
    // Remove markdown asterisks for clean display
    return text.replace(/\*/g, '').trim();
  };

  return (
    <div className="flex h-full w-full bg-[#100C1C] text-white overflow-hidden">
      {/* ========================================================== */}
      {/* 1. CHATS / INBOX COLUMN (Always visible on desktop, toggled on mobile) */}
      {/* ========================================================== */}
      <aside
        className={`w-full md:w-80 lg:w-96 shrink-0 bg-[#140F24] border-r border-[#332752] flex flex-col h-full z-10 transition-all duration-200 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Inbox Top Bar */}
        <div className="shrink-0 p-4 bg-[#19132B] border-b border-[#332752] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-950/40">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F7F2FA] flex items-center gap-2">
                <span>Chats</span>
                {sessions.length > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                    {sessions.length}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Quick Discover Button */}
          {onNavigateToDiscover && (
            <button
              onClick={onNavigateToDiscover}
              className="px-2.5 py-1.5 rounded-xl bg-[#241C3B] hover:bg-rose-500/20 text-[#CBC2D6] hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Discover new AI characters"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Discover</span>
            </button>
          )}
        </div>

        {/* Search Input in Inbox */}
        <div className="p-3 border-b border-white/5 bg-[#140F24]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#988EA6] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#100C1C] border border-[#332752] text-xs text-white placeholder-[#988EA6] focus:outline-none focus:border-rose-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#988EA6] hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Serial-by-Serial Conversation Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-300">
                <Heart className="w-7 h-7 fill-rose-500/20 text-rose-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Your Inbox is Empty</h3>
              <p className="text-xs text-[#CBC2D6] leading-relaxed max-w-[220px]">
                You haven't started chatting with any AI girlfriends yet. Discover your match!
              </p>
              {onNavigateToDiscover && (
                <button
                  onClick={onNavigateToDiscover}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-xs font-bold text-white shadow-lg shadow-rose-950/40 transition-all flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  <span>Discover Companions</span>
                </button>
              )}
            </div>
          ) : (
            sortedSessions.map((session) => {
              const profile = GIRLFRIEND_PROFILES.find((p) => p.id === session.companionId);
              const isSelected = settings.activeCompanionId === session.companionId;

              return (
                <div
                  key={session.sessionId}
                  onClick={() => handleOpenConversation(session.companionId)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all relative group ${
                    isSelected
                      ? 'bg-[#241C3B] border-l-4 border-l-rose-500'
                      : 'hover:bg-[#1C1630]'
                  }`}
                >
                  {/* Character Avatar with online indicator */}
                  <div className="relative shrink-0">
                    <img
                      src={profile?.avatarUrl || '/assets/img_ananya_avatar.jpg'}
                      alt={profile?.name || 'Companion'}
                      className="w-12 h-12 rounded-full object-cover border border-rose-500/30"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#140F24]" />
                  </div>

                  {/* Character & Message Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-white truncate">
                          {profile?.name || session.title}
                        </span>
                        {profile?.banglaName && (
                          <span className="text-[11px] text-rose-300 font-medium shrink-0">
                            ({profile.banglaName})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#988EA6] shrink-0 font-medium">
                        {formatChatTime(session.lastUpdated)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-[#CBC2D6] truncate leading-tight flex-1">
                        {formatPreviewMessage(session.lastMessage)}
                      </p>

                      {session.unread && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}

                      {/* Delete icon button on hover */}
                      <button
                        onClick={(e) => handleDeleteSession(e, session.sessionId)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#988EA6] hover:text-rose-400 hover:bg-rose-500/10 transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inbox Bottom Bar */}
        {onNavigateToDiscover && (
          <div className="p-3 border-t border-[#332752] bg-[#19132B] flex items-center justify-between text-xs">
            <span className="text-[#988EA6] text-[11px]">Looking for more?</span>
            <button
              onClick={onNavigateToDiscover}
              className="text-rose-300 hover:text-rose-200 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Explore All Models</span>
              <Compass className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </aside>

      {/* ========================================================== */}
      {/* 2. INDIVIDUAL CHAT VIEW (Active conversation) */}
      {/* ========================================================== */}
      <main
        className={`flex-1 flex flex-col h-full bg-[#100C1C] relative overflow-hidden ${
          mobileView === 'inbox' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* If no session is active and sessions exist, show select prompt */}
        {!settings.currentSessionId || sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Select a Conversation</h2>
            <p className="text-xs text-[#CBC2D6] max-w-sm leading-relaxed">
              Choose a girlfriend from your Chats inbox on the left, or discover new AI companions to begin a heartwarming conversation.
            </p>
            {onNavigateToDiscover && (
              <button
                onClick={onNavigateToDiscover}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-xs font-bold text-white shadow-lg shadow-rose-950/40 transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Discover AI Companions</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Top Navigation Bar of Active Chat */}
            <header className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#19132B] border-b border-[#332752] shadow-sm z-10">
              {/* Back navigation on Mobile & Companion info */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Back Button (returns to inbox) */}
                <button
                  onClick={() => setMobileView('inbox')}
                  className="md:hidden p-1.5 -ml-1 rounded-full text-[#CBC2D6] hover:text-white hover:bg-white/10 transition-colors"
                  title="Back to Chats list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Animated Companion Avatar */}
                <motion.div
                  whileHover={characterAnimation.whileHover}
                  animate={characterAnimation.animate}
                  transition={characterAnimation.transition}
                  className="shrink-0 cursor-pointer"
                  onClick={() => setSelectedBioProfile(currentProfile)}
                  title="View Character Biography"
                >
                  <AnimatedCompanionAvatar
                    avatarUrl={currentProfile.avatarUrl}
                    name={currentProfile.name}
                    size="md"
                    emotion={activeEmotion}
                    tension={activeTension}
                    isGenerating={isGenerating}
                    showOnlineIndicator={true}
                    showEmotionBadge={true}
                  />
                </motion.div>

                {/* Character Name & Status */}
                <div className="min-w-0">
                  <div
                    className="flex items-center gap-1.5 cursor-pointer truncate"
                    onClick={() => setSelectedBioProfile(currentProfile)}
                  >
                    <h2 className="font-bold text-xs sm:text-sm text-[#F7F2FA] truncate">
                      {currentProfile.name}
                    </h2>
                    <span className="text-[11px] sm:text-xs text-rose-300 font-medium shrink-0">
                      ({currentProfile.banglaName})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    {/* Relationship Level Badge */}
                    <button
                      onClick={() => setShowRelationshipDialog(true)}
                      className="text-[10px] text-rose-300 hover:text-rose-200 flex items-center gap-1 font-semibold truncate transition-colors bg-rose-500/10 hover:bg-rose-500/20 px-1.5 py-0.5 rounded-md border border-rose-500/20"
                      title="View Evolving Chemistry"
                    >
                      <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400 shrink-0" />
                      <span className="truncate capitalize">
                        {activeCharacterState?.relationshipState?.relationshipStage
                          ? activeCharacterState.relationshipState.relationshipStage.replace('_', ' ')
                          : relationship.stageName}
                      </span>
                    </button>

                    {/* Mood badge */}
                    <button
                      onClick={() => setShowRelationshipDialog(true)}
                      className="text-[10px] text-rose-200/90 hover:text-white flex items-center gap-1 font-medium bg-[#241C3B] hover:bg-[#2F244C] px-1.5 py-0.5 rounded-md border border-rose-500/20 shrink-0"
                    >
                      <span>{currentEmotionConfig.emoji}</span>
                      <span className="hidden sm:inline text-[10px]">
                        {currentEmotionConfig.label}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Send Gift Button */}
                <button
                  onClick={() => setShowGiftDialog(true)}
                  className="px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                  title="Send Romantic Gift"
                >
                  <Gift className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Gift</span>
                </button>


                {/* Language Mode Toggle */}
                <button
                  onClick={toggleLanguage}
                  className="px-2 py-1.5 rounded-xl bg-[#241C3B] hover:bg-[#2F244C] border border-white/5 text-[11px] font-bold text-rose-300 transition-colors"
                  title={`Language: ${settings.languageMode.toUpperCase()} (Click to toggle)`}
                >
                  {settings.languageMode === 'bn'
                    ? 'বাংলা'
                    : settings.languageMode === 'en'
                    ? 'ENG'
                    : 'BOTH'}
                </button>

                {/* Daily Check-In */}
                <button
                  onClick={() => setShowCheckInDialog(true)}
                  className="p-1.5 sm:p-2 rounded-xl bg-[#241C3B] hover:bg-[#2F244C] border border-white/5 text-[#CBC2D6] hover:text-white transition-colors"
                  title="Daily Mood Check-in"
                >
                  <Calendar className="w-4 h-4 text-purple-300" />
                </button>
              </div>
            </header>

            {/* Scrollable Message History Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Encrypted Session Notice */}
              <div className="flex justify-center my-2">
                <div className="px-3 py-1 rounded-full bg-[#19132B]/80 border border-[#332752] text-[10px] text-[#988EA6] flex items-center gap-1.5 shadow-sm">
                  <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                  <span>Private romantic roleplay session with {currentProfile.name}</span>
                </div>
              </div>

              {messages.map((msg, index) => {
                const isUser = msg.isUser;
                const isCopied = copiedId === msg.id;

                return (
                  <div
                    key={msg.id || index}
                    className={`flex items-end gap-2 group ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Companion Avatar on left */}
                    {!isUser && (
                      <div className="shrink-0 mb-1">
                        <img
                          src={currentProfile.avatarUrl}
                          alt={currentProfile.name}
                          className="w-7 h-7 rounded-full object-cover border border-rose-500/20"
                        />
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id);
                      }}
                      onTouchStart={(e) => startLongPress(msg.id, e.touches[0]?.clientX, e.touches[0]?.clientY)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={cancelLongPress}
                      onMouseDown={(e) => {
                        if (e.button === 0) {
                          startLongPress(msg.id, e.clientX, e.clientY);
                        }
                      }}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md relative transition-transform cursor-pointer select-none sm:select-text ${
                        isUser
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-sm'
                          : msg.isError
                          ? 'bg-red-950/60 border border-red-500/40 text-red-200 rounded-bl-sm'
                          : 'bg-[#19132B] border border-[#332752] text-[#F7F2FA] rounded-bl-sm'
                      }`}
                    >
                      {/* Floating Long-Press Reaction Picker Bar */}
                      <AnimatePresence>
                        {activeReactionMsgId === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 5 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className={`reaction-picker-container absolute -top-11 ${
                              isUser ? 'right-0' : 'left-0'
                            } z-30 p-1 px-1.5 rounded-full bg-[#1A142E] border border-rose-500/40 shadow-2xl shadow-rose-950/80 backdrop-blur-md flex items-center gap-1`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {REACTION_EMOJIS.map(({ emoji, label }) => {
                              const isSelected =
                                msg.reaction === emoji || msg.reactions?.includes(emoji);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectReaction(msg.id, emoji);
                                  }}
                                  className={`p-1 text-base sm:text-lg rounded-full transition-transform hover:scale-130 active:scale-95 ${
                                    isSelected
                                      ? 'bg-rose-500/30 ring-1 ring-rose-400 scale-110'
                                      : 'hover:bg-white/10'
                                  }`}
                                  title={`${label} (${emoji})`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Photo memory attachment */}
                      {msg.photoUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden max-h-48 border border-white/10">
                          <img
                            src={msg.photoUrl}
                            alt="Shared memory"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Message text with roleplay styling */}
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-text">
                        {isUser
                          ? msg.text
                          : msg.text.split(/(\*[^*]+\*)/g).map((part, i) => {
                              if (part.startsWith('*') && part.endsWith('*')) {
                                return (
                                  <span
                                    key={i}
                                    className="italic text-rose-300/90 font-medium font-serif"
                                  >
                                    {part}{' '}
                                  </span>
                                );
                              }
                              return <span key={i}>{part}</span>;
                            })}
                      </p>

                      {/* Footer: Time & Action controls */}
                      <div className="flex items-center justify-between gap-3 mt-1 text-[10px]">
                        <span
                          className={`${
                            isUser ? 'text-rose-100/80' : 'text-[#988EA6]'
                          }`}
                        >
                          {msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Reaction picker toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id);
                            }}
                            className="text-[#988EA6] hover:text-rose-300 transition-colors"
                            title="React with emojis (or long-press bubble)"
                          >
                            <Smile className="w-3 h-3" />
                          </button>

                          {/* Copy button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(msg.id, msg.text);
                            }}
                            className="text-[#988EA6] hover:text-white"
                            title="Copy text"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>

                          {/* Retry on error */}
                          {msg.isError && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                retryMessage(msg.id);
                              }}
                              className="text-red-400 hover:text-red-300 font-bold flex items-center gap-0.5"
                              title="Retry message"
                            >
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Retry</span>
                            </button>
                          )}

                          {/* Delete message */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(msg.id);
                            }}
                            className="text-[#988EA6] hover:text-rose-400"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Attached Reaction Badge */}
                      {(msg.reaction || (msg.reactions && msg.reactions.length > 0)) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id);
                          }}
                          className={`absolute -bottom-2.5 ${
                            isUser ? 'right-2' : 'left-2'
                          } z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#241C3B] border border-rose-500/40 shadow-lg text-xs hover:scale-110 active:scale-95 transition-all cursor-pointer`}
                          title="Click to change or add reaction"
                        >
                          {msg.reactions && msg.reactions.length > 0 ? (
                            msg.reactions.map((r, i) => <span key={i}>{r}</span>)
                          ) : (
                            <span>{msg.reaction}</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Realistic Companion Typing Animation Indicator */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-end gap-2.5 my-1"
                >
                  {/* Companion Avatar */}
                  <div className="shrink-0 mb-1 relative">
                    <img
                      src={currentProfile.avatarUrl}
                      alt={currentProfile.name}
                      className="w-7 h-7 rounded-full object-cover border border-rose-500/40 shadow-sm"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 border border-[#100C1C]" />
                  </div>

                  {/* Typing Bubble with animated bouncing dots */}
                  <div className="rounded-2xl rounded-bl-sm bg-[#1D1730] border border-[#332752] px-3.5 py-2.5 shadow-md flex items-center gap-2.5">
                    {/* Bouncing Dots Wave */}
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-rose-400 to-pink-400 animate-bounce [animation-delay:-0.32s]" />
                      <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-rose-400 to-pink-400 animate-bounce [animation-delay:-0.16s]" />
                      <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-rose-400 to-pink-400 animate-bounce" />
                    </div>

                    {/* Status note */}
                    <div className="flex items-center gap-1 text-[11px] text-[#CBC2D6] font-medium border-l border-white/10 pl-2">
                      <Sparkles className="w-3 h-3 text-pink-400 animate-pulse shrink-0" />
                      <span>
                        {settings.languageMode === 'bn'
                          ? `${currentProfile.banglaName || currentProfile.name} ভাবছে ও লিখছে...`
                          : `${currentProfile.name} is typing...`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Safety Restriction Lockout Banner */}
            {safetyRestriction?.isRestricted && (
              <div className="shrink-0 mx-3 sm:mx-4 mb-2 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 flex items-center justify-between gap-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span>Temporary Messaging Restriction</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300">
                        15-min lock
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-200/90 mt-0.5">
                      Server-side child safety protection is active. New messages are temporarily locked.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSafetyAppealDialog(true)}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-950/50 transition-all"
                >
                  Appeal / Unlock
                </button>
              </div>
            )}

            {/* Active Speech Recognition Banner */}
            {isListening && (
              <div className="shrink-0 mx-3 sm:mx-4 mb-2 p-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-950/90 via-[#241C3B]/95 to-purple-950/90 border border-rose-500/50 text-xs text-rose-200 flex items-center justify-between gap-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  <div className="min-w-0">
                    <span className="font-semibold text-white text-xs">
                      Listening... speak into your microphone
                    </span>
                    <span className="text-[11px] text-rose-200/80 hidden sm:inline sm:ml-2">
                      (Appends speech directly into text)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSpeechLang(speechLang === 'bn-BD' ? 'en-US' : 'bn-BD')}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#19132B] hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
                    title="Switch voice recognition language"
                  >
                    {speechLang === 'bn-BD' ? '🇧🇩 বাংলা (Click for EN)' : '🇺🇸 EN (Click for বাংলা)'}
                  </button>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-rose-500/30 hover:bg-rose-500/50 text-white border border-rose-500/30 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Speech Recognition Error Notice */}
            {speechError && (
              <div className="shrink-0 mx-3 sm:mx-4 mb-2 p-2 px-3 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center justify-between gap-2 shadow-md">
                <span className="text-[11px]">{speechError}</span>
                <button
                  type="button"
                  onClick={clearSpeechError}
                  className="text-[10px] font-semibold text-rose-300 hover:text-white px-2 py-0.5 rounded bg-black/30"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Live Speech Voice HUD Banner when Listening */}
            {isListening && (
              <div className="shrink-0 mx-3 sm:mx-4 mb-2 p-3 rounded-2xl bg-[#19132B]/95 border border-rose-500/40 shadow-xl shadow-rose-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Pulsing Audio Waveform Equalizer */}
                  <div className="flex items-center gap-1 shrink-0 px-2 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <span className="w-1 h-3 bg-rose-400 rounded-full animate-pulse" />
                    <span className="w-1 h-5 bg-pink-400 rounded-full animate-pulse [animation-delay:150ms]" />
                    <span className="w-1 h-4 bg-rose-400 rounded-full animate-pulse [animation-delay:300ms]" />
                    <span className="w-1 h-6 bg-pink-300 rounded-full animate-pulse [animation-delay:450ms]" />
                    <span className="w-1 h-2 bg-rose-400 rounded-full animate-pulse [animation-delay:200ms]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
                        Listening...
                      </span>
                      {settings.handsFreeVoiceMode && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Hands-Free (Auto-Sends on Pause)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#F7F2FA] font-medium truncate mt-0.5">
                      {input ? `"${input}"` : interimText ? `"${interimText}"` : 'Speak naturally now...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  {/* Language switch button */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextLang = speechLang === 'bn-BD' ? 'en-US' : 'bn-BD';
                      setSpeechLang(nextLang);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#241C3B] hover:bg-rose-500/20 text-rose-200 text-xs font-semibold border border-white/5 transition-colors"
                    title="Switch voice recognition language"
                  >
                    {speechLang === 'bn-BD' ? 'বাংলা (BD)' : 'English (US)'}
                  </button>

                  {/* Send Now Button */}
                  {input.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      className="px-3 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold hover:brightness-110 shadow-sm transition-all"
                    >
                      Send Now
                    </button>
                  )}

                  {/* Stop/Done Button */}
                  <button
                    type="button"
                    onClick={stopListening}
                    className="p-1.5 rounded-xl bg-[#241C3B] hover:bg-white/10 text-[#CBC2D6] hover:text-white transition-colors"
                    title="Stop listening"
                  >
                    <MicOff className="w-4 h-4 text-rose-300" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Form Bar */}
            <form
              onSubmit={handleSend}
              className="shrink-0 p-3 sm:p-4 bg-[#19132B] border-t border-[#332752] flex items-center gap-2 relative z-10"
            >
              {/* Send Gift Shortcut */}
              <button
                type="button"
                onClick={() => setShowGiftDialog(true)}
                className="p-2.5 rounded-xl bg-[#241C3B] hover:bg-rose-500/20 text-[#CBC2D6] hover:text-rose-300 transition-colors"
                title="Send a gift"
                disabled={Boolean(safetyRestriction?.isRestricted)}
              >
                <Gift className="w-4 h-4" />
              </button>

              {/* Coffee Date Memory Photo */}
              <button
                type="button"
                onClick={samplePhotoDate}
                className="hidden sm:flex p-2.5 rounded-xl bg-[#241C3B] hover:bg-rose-500/20 text-[#CBC2D6] hover:text-rose-300 transition-colors"
                title="Share photo memory"
                disabled={Boolean(safetyRestriction?.isRestricted)}
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Hands-Free Voice-to-Text Microphone Button */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => toggleListening(input)}
                  className={`p-2.5 rounded-xl transition-all relative flex items-center justify-center ${
                    isListening
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/50 ring-4 ring-rose-400/40 animate-pulse'
                      : 'bg-[#241C3B] hover:bg-rose-500/20 text-[#CBC2D6] hover:text-rose-300 border border-white/5'
                  }`}
                  title={
                    !isSpeechSupported
                      ? 'Voice input is not supported in this browser (Chrome / Edge / Safari recommended)'
                      : isListening
                      ? `Listening in ${speechLang === 'bn-BD' ? 'Bengali' : 'English'}. Click to stop.`
                      : `Click to talk hands-free with ${currentProfile.name} (${speechLang === 'bn-BD' ? 'Bengali' : 'English'})`
                  }
                  disabled={Boolean(safetyRestriction?.isRestricted)}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  {settings.handsFreeVoiceMode && !isListening && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#19132B]" />
                  )}
                </button>
              </div>

              {/* Hands-Free Mode Toggle Button */}
              <button
                type="button"
                onClick={toggleHandsFree}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                  settings.handsFreeVoiceMode
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-[#241C3B] border-white/5 text-[#988EA6] hover:text-[#CBC2D6]'
                }`}
                title="Toggle Hands-Free mode: Speak continuously and auto-send on speech pause"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    settings.handsFreeVoiceMode ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                  }`}
                />
                <span>Hands-Free</span>
              </button>

              {/* Message Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onClick={() => {
                  if (safetyRestriction?.isRestricted) {
                    setShowSafetyAppealDialog(true);
                  }
                }}
                placeholder={
                  safetyRestriction?.isRestricted
                    ? 'Messaging restricted for 15 minutes. Tap Appeal / Unlock to review.'
                    : `Write or speak to ${currentProfile.name}...`
                }
                className={`flex-1 bg-[#100C1C] border rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white transition-all ${
                  safetyRestriction?.isRestricted
                    ? 'border-rose-500/50 placeholder-rose-300/80 cursor-pointer'
                    : 'border-[#332752] placeholder-[#988EA6] focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                }`}
                disabled={isGenerating || Boolean(safetyRestriction?.isRestricted)}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isGenerating || Boolean(safetyRestriction?.isRestricted)}
                className={`p-2.5 sm:px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                  input.trim() && !isGenerating && !safetyRestriction?.isRestricted
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-950/50 scale-100 hover:scale-105 active:scale-95'
                    : 'bg-[#241C3B] text-[#988EA6] cursor-not-allowed opacity-50'
                }`}
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </>
        )}
      </main>

      {/* Character Bio Modal */}
      {selectedBioProfile && (
        <CharacterBioDialog
          profile={selectedBioProfile}
          onClose={() => setSelectedBioProfile(null)}
          onSelectCompanion={() => {
            selectOrOpenCharacter(selectedBioProfile.id);
            setSelectedBioProfile(null);
            setMobileView('chat');
          }}
        />
      )}

      {/* Child Safety Lock Appeal Modal */}
      <SafetyAppealDialog
        isOpen={showSafetyAppealDialog}
        onClose={() => setShowSafetyAppealDialog(false)}
      />
    </div>
  );
};
