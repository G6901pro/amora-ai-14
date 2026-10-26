import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  CharacterDynamicState,
  CharacterMemory,
  ChatMessage,
  ChatSession,
  CompanionSettings,
  DailyCheckIn,
  GiftItem,
  GirlfriendProfile,
  MomentCard,
  ProviderHealthState,
  SafetyRestrictionState,
} from '../types';
import {
  DEFAULT_MOMENTS,
  GIRLFRIEND_PROFILES,
} from '../data/catalog';
import { extractMemoryFromText } from '../conversation/memoryRetriever';
import { analyzeEmotionAndIntent } from '../conversation/emotionAnalyzer';
import { interpretSituation } from '../conversation/situationInterpreter';
import { generateContextualFallback } from '../conversation/replyGenerationService';

interface CompanionContextType {
  settings: CompanionSettings;
  currentProfile: GirlfriendProfile;
  profiles: GirlfriendProfile[];
  messages: ChatMessage[];
  sessions: ChatSession[];
  memories: CharacterMemory[];
  checkIns: DailyCheckIn[];
  moments: MomentCard[];
  isGenerating: boolean;
  showGiftDialog: boolean;
  showCheckInDialog: boolean;
  showSessionsSheet: boolean;
  showMemorySheet: boolean;
  showVipDialog: boolean;
  showRelationshipDialog: boolean;
  safetyRestriction: SafetyRestrictionState | null;
  showSafetyAppealDialog: boolean;
  activeCharacterState?: CharacterDynamicState;
  celebratingGift: GiftItem | null;
  providerHealth: ProviderHealthState | null;
  isCheckingHealth: boolean;
  // Safety actions
  checkSafetyStatus: () => Promise<void>;
  submitAppeal: (appealReason: string, acknowledgePolicy: boolean) => Promise<{ success: boolean; message: string }>;
  setShowSafetyAppealDialog: (show: boolean) => void;
  // Actions
  sendMessage: (text: string, photoUrl?: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  deleteMessage: (id: string) => void;
  toggleMessageReaction: (messageId: string, emoji: string) => void;
  switchCompanion: (companionId: string) => void;
  selectOrOpenCharacter: (companionId: string) => void;
  sendGift: (gift: GiftItem) => Promise<void>;
  submitDailyCheckIn: (
    mood: string,
    highlight: string,
    gratitude: string
  ) => Promise<void>;
  createSession: (title?: string) => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  clearCurrentChat: () => void;
  addMemory: (category: string, content: string) => void;
  updateMemory: (id: string, newContent: string) => void;
  toggleMemoryEnabled: (id: string) => void;
  deleteMemory: (id: string) => void;
  clearMemories: () => void;
  toggleLikeMoment: (momentId: string) => void;
  toggleFavoriteCompanion: (companionId: string) => void;
  isFavoriteCompanion: (companionId: string) => boolean;
  updateSettings: (newSettings: Partial<CompanionSettings>) => void;
  setShowGiftDialog: (show: boolean) => void;
  setShowCheckInDialog: (show: boolean) => void;
  setShowSessionsSheet: (show: boolean) => void;
  setShowMemorySheet: (show: boolean) => void;
  setShowVipDialog: (show: boolean) => void;
  setShowRelationshipDialog: (show: boolean) => void;
  setCelebratingGift: (gift: GiftItem | null) => void;
  checkProviderHealth: (forceRecheck?: boolean) => Promise<void>;
}

const DEFAULT_SETTINGS: CompanionSettings = {
  activeCompanionId: 'ananya',
  currentSessionId: 'session_ananya',
  languageMode: 'bn',
  companionName: 'Ananya',
  userNickname: 'জান',
  persona: 'SWEET',
  voiceTone: 'SWEET',
  affectionPoints: 160,
  autoVoice: false,
  voicePitch: 1.18,
  voiceSpeed: 0.95,
  flirtIntensity: 'SWEET_ROMANCE',
  subscriptionTier: 'FREE',
  handsFreeVoiceMode: false,
  favorites: ['ananya', 'zara'],
  selectedVoiceURI: undefined,
  useStreaming: false,
  conversationMode: 'Normal',
};

const INITIAL_SESSIONS: ChatSession[] = [
  {
    sessionId: 'session_ananya',
    companionId: 'ananya',
    title: 'Chat with Ananya 💕',
    createdAt: Date.now() - 3600000,
    lastMessage: '*তোমার হাত আলতো করে ধরে মিষ্টি করে হাসল* কেমন আছো আমার জান? তোমাকে খুব মনে পড়ছিল! সময়মতো খাবার খেয়েছো তো বাবু? 💕',
    lastUpdated: Date.now() - 3600000,
    messageCount: 1,
    unread: false,
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  session_ananya: [
    {
      id: 'init_msg_1',
      text: '*তোমার হাত আলতো করে ধরে মিষ্টি করে হাসল* কেমন আছো আমার জান? তোমাকে খুব মনে পড়ছিল! সময়মতো খাবার খেয়েছো তো বাবু? 💕',
      isUser: false,
      timestamp: Date.now() - 3600000,
      photoUrl: '/assets/img_ananya_avatar.jpg',
      companionId: 'ananya',
      sessionId: 'session_ananya',
    },
  ],
};

const INITIAL_MEMORIES: CharacterMemory[] = [
  {
    id: 'mem_1',
    companionId: 'ananya',
    memoryCategory: 'Personal Fact',
    memoryKey: 'nickname',
    memoryContent: 'Loves being called জান and sweet affectionate names',
    timestamp: Date.now() - 86400000,
  },
  {
    id: 'mem_2',
    companionId: 'ananya',
    memoryCategory: 'Favorite',
    memoryKey: 'tea_rain',
    memoryContent: 'Enjoys drinking hot ginger tea on rainy evenings',
    timestamp: Date.now() - 43200000,
  },
];

export function getAmoraClientId(): string {
  try {
    let id = localStorage.getItem('amora_client_id');
    if (!id) {
      id = `amora_cli_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem('amora_client_id', id);
    }
    return id;
  } catch {
    return 'amora_fallback_client';
  }
}

const CompanionContext = createContext<CompanionContextType | null>(null);

export const CompanionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Load settings
  const [settings, setSettings] = useState<CompanionSettings>(() => {
    try {
      const saved = localStorage.getItem('amora_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          autoVoice: false,
          handsFreeVoiceMode: false,
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Load sessions
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('amora_sessions');
      return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  });

  // Load messages by session with sanitization of empty placeholder bubbles
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('amora_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned: Record<string, ChatMessage[]> = {};
        for (const [k, msgs] of Object.entries(parsed)) {
          if (Array.isArray(msgs)) {
            cleaned[k] = msgs.filter(
              (m: ChatMessage) => m.isUser || Boolean(m.text?.trim() || m.photoUrl)
            );
          }
        }
        return cleaned;
      }
      return INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  // Load memories
  const [memories, setMemories] = useState<CharacterMemory[]>(() => {
    try {
      const saved = localStorage.getItem('amora_memories');
      return saved ? JSON.parse(saved) : INITIAL_MEMORIES;
    } catch {
      return INITIAL_MEMORIES;
    }
  });

  // Load daily check-ins
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>(() => {
    try {
      const saved = localStorage.getItem('amora_checkins');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Moments list
  const [moments, setMoments] = useState<MomentCard[]>(() => {
    try {
      const saved = localStorage.getItem('amora_moments');
      return saved ? JSON.parse(saved) : DEFAULT_MOMENTS;
    } catch {
      return DEFAULT_MOMENTS;
    }
  });

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showSessionsSheet, setShowSessionsSheet] = useState(false);
  const [showMemorySheet, setShowMemorySheet] = useState(false);
  const [showVipDialog, setShowVipDialog] = useState(false);
  const [showRelationshipDialog, setShowRelationshipDialog] = useState(false);
  const [celebratingGift, setCelebratingGift] = useState<GiftItem | null>(null);

  // Child Safety Temporary Restriction State (Server-backed 15-min lock)
  const [safetyRestriction, setSafetyRestriction] = useState<SafetyRestrictionState | null>(null);
  const [showSafetyAppealDialog, setShowSafetyAppealDialog] = useState<boolean>(false);

  // Dynamic Character States (persistent relationship metrics per companion)
  const [characterStates, setCharacterStates] = useState<Record<string, CharacterDynamicState>>(() => {
    try {
      const saved = localStorage.getItem('amora_character_states');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Gemini Provider Health
  const [providerHealth, setProviderHealth] = useState<ProviderHealthState | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // In-flight request controllers to cancel or prevent stuck requests
  const activeControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Check safety lock status from backend
  const checkSafetyStatus = useCallback(async () => {
    try {
      const clientId = getAmoraClientId();
      const res = await fetch('/api/safety/status', {
        headers: { 'x-amora-client-id': clientId },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isRestricted) {
          setSafetyRestriction({
            isRestricted: true,
            restrictedUntil: data.lockUntil,
            remainingSeconds: data.remainingSeconds,
            reason: 'Temporary 15-minute restriction due to safety policy violation',
            appealAvailable: data.appealAvailable ?? true,
          });
        } else {
          setSafetyRestriction(null);
        }
      }
    } catch (err) {
      console.warn('[Amora] Failed to check safety status', err);
    }
  }, []);

  // Submit appeal to backend
  const submitAppeal = useCallback(
    async (appealReason: string, acknowledgePolicy: boolean) => {
      try {
        const clientId = getAmoraClientId();
        const res = await fetch('/api/safety/appeal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-amora-client-id': clientId,
          },
          body: JSON.stringify({
            clientId,
            appealReason,
            acknowledgePolicy,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSafetyRestriction(null);
          return {
            success: true,
            message: data.message || 'Appeal accepted. Messaging access restored.',
          };
        } else {
          return {
            success: false,
            message: data.message || data.error || 'Appeal rejected. Please wait for restriction timer to expire.',
          };
        }
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Network error while submitting appeal.',
        };
      }
    },
    []
  );

  useEffect(() => {
    checkSafetyStatus();
  }, [checkSafetyStatus]);

  // Safe LocalStorage helper to prevent QuotaExceededError or JSON crash
  const safeSave = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[Amora Storage] Failed to persist ${key}:`, e);
    }
  };

  // Sync state to local storage safely
  useEffect(() => {
    safeSave('amora_settings', settings);
  }, [settings]);

  useEffect(() => {
    safeSave('amora_character_states', characterStates);
  }, [characterStates]);

  useEffect(() => {
    safeSave('amora_sessions', sessions);
  }, [sessions]);

  useEffect(() => {
    safeSave('amora_messages', allMessages);
  }, [allMessages]);

  useEffect(() => {
    safeSave('amora_memories', memories);
  }, [memories]);

  useEffect(() => {
    safeSave('amora_checkins', checkIns);
  }, [checkIns]);

  useEffect(() => {
    safeSave('amora_moments', moments);
  }, [moments]);

  const checkProviderHealth = useCallback(async (forceRecheck: boolean = false) => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch(`/api/health${forceRecheck ? '?recheck=true' : ''}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data: ProviderHealthState = await res.json();
        setProviderHealth(data);
      }
    } catch (err) {
      console.warn('Failed to fetch provider health', err);
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkProviderHealth();
  }, [checkProviderHealth]);

  // Permanently ensure voice synthesis is cancelled and remains disabled
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Voice is permanently disabled
      }
    }
  }, []);

  const currentProfile =
    GIRLFRIEND_PROFILES.find((p) => p.id === settings.activeCompanionId) ||
    GIRLFRIEND_PROFILES[0];

  const currentMessages = allMessages[settings.currentSessionId] || [];

  const updateSettings = (newSettings: Partial<CompanionSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      autoVoice: false,
      handsFreeVoiceMode: false,
    }));
  };

  const createSession = (customTitle?: string) => {
    const newSessionId = `session_${settings.activeCompanionId}_${Date.now()}`;
    const newSession: ChatSession = {
      sessionId: newSessionId,
      companionId: settings.activeCompanionId,
      title: customTitle || `Chat with ${currentProfile.name}`,
      createdAt: Date.now(),
      lastMessage: currentProfile.greetingMessage || currentProfile.tagline,
      lastUpdated: Date.now(),
      messageCount: 1,
    };

    const initialMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      text:
        settings.languageMode === 'bn'
          ? `*তোমার চোখের দিকে তাকিয়ে মিষ্টি করে হাসল* কেমন আছো আমার ${settings.userNickname}? বলো জান, কি নিয়ে কথা বলতে চাও? 🌸`
          : `*smiles tenderly* Hello my ${settings.userNickname}! What would you like to talk about today? 🌸`,
      isUser: false,
      timestamp: Date.now(),
      photoUrl: currentProfile.avatarUrl,
      companionId: currentProfile.id,
      sessionId: newSessionId,
    };

    setSessions((prev) => [newSession, ...prev]);
    setAllMessages((prev) => ({ ...prev, [newSessionId]: [initialMsg] }));
    setSettings((prev) => ({ ...prev, currentSessionId: newSessionId }));
  };

  const switchSession = (sessionId: string) => {
    const session = sessions.find((s) => s.sessionId === sessionId);
    if (session) {
      setSettings((prev) => ({
        ...prev,
        currentSessionId: sessionId,
        activeCompanionId: session.companionId,
        companionName:
          GIRLFRIEND_PROFILES.find((p) => p.id === session.companionId)?.name ||
          prev.companionName,
      }));
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    setAllMessages((prev) => {
      const copy = { ...prev };
      delete copy[sessionId];
      return copy;
    });

    if (settings.currentSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.sessionId !== sessionId);
      if (remaining.length > 0) {
        setSettings((prev) => ({
          ...prev,
          currentSessionId: remaining[0].sessionId,
        }));
      } else {
        createSession();
      }
    }
  };

  const deleteMessage = (id: string) => {
    const sId = settings.currentSessionId;
    setAllMessages((prev) => ({
      ...prev,
      [sId]: (prev[sId] || []).filter((m) => m.id !== id),
    }));
  };

  const toggleMessageReaction = (messageId: string, emoji: string) => {
    const sId = settings.currentSessionId;
    setAllMessages((prev) => {
      const sessionMsgs = prev[sId] || [];
      const updated = sessionMsgs.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions || (m.reaction ? [m.reaction] : []);
        const exists = currentReactions.includes(emoji);
        const newReactions = exists
          ? currentReactions.filter((r) => r !== emoji)
          : [...currentReactions, emoji];
        return {
          ...m,
          reaction: newReactions[newReactions.length - 1] || undefined,
          reactions: newReactions,
        };
      });
      return { ...prev, [sId]: updated };
    });

    if (['❤️', '✨', '🥰', '🌸', '💖', '🔥', '⭐'].includes(emoji)) {
      setSettings((prev) => ({
        ...prev,
        affectionPoints: prev.affectionPoints + 2,
      }));
    }
  };

  const clearCurrentChat = () => {
    const resetGreeting =
      settings.languageMode === 'bn'
        ? `*তোমার হাত ধরে মিষ্টি করে হাসল* নতুন করে শুরু হলো আমাদের গল্প! বলো জান, আজকে কি কথা বলবে? 🌸`
        : `*smiles gently* Fresh new page for us! What would you like to talk about today, ${settings.userNickname}? 🌸`;

    const freshMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      text: resetGreeting,
      isUser: false,
      timestamp: Date.now(),
      photoUrl: currentProfile.avatarUrl,
      companionId: currentProfile.id,
      sessionId: settings.currentSessionId,
    };

    setAllMessages((prev) => ({
      ...prev,
      [settings.currentSessionId]: [freshMsg],
    }));

    setSessions((prev) =>
      prev.map((s) =>
        s.sessionId === settings.currentSessionId
          ? {
              ...s,
              lastMessage: resetGreeting,
              lastUpdated: Date.now(),
              messageCount: 1,
            }
          : s
      )
    );
  };

  const selectOrOpenCharacter = useCallback((companionId: string) => {
    const target = GIRLFRIEND_PROFILES.find((p) => p.id === companionId);
    if (!target) return;

    if (target.isVipExclusive && settings.subscriptionTier !== 'VIP_PRO') {
      setShowVipDialog(true);
      return;
    }

    // Look for an existing conversation for this companion to prevent duplicates
    const existingSession = sessions.find((s) => s.companionId === target.id);

    if (existingSession) {
      // Reopen existing conversation without duplicate entries or wiping history!
      setSettings((prev) => ({
        ...prev,
        activeCompanionId: target.id,
        currentSessionId: existingSession.sessionId,
        companionName: target.name,
        userNickname: target.defaultNickname,
        languageMode: target.defaultLanguage,
        persona: target.personalityStyle,
        voicePitch: target.voicePitch ?? 1.0,
        voiceSpeed: target.voiceSpeed ?? 1.0,
      }));

      // Mark session as read
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === existingSession.sessionId
            ? { ...s, unread: false, unreadCount: 0 }
            : s
        )
      );
      return;
    }

    // Create a new stable conversation entry
    const sessionId = `session_${target.id}`;
    const greetingText =
      target.greetingMessage ||
      (target.defaultLanguage === 'bn'
        ? `*তোমার হাত দুটি ধরে আদর করে বলল* কেমন আছো আমার ${target.defaultNickname}? আমি তোমার ${target.banglaName}! সবসময় তোমার পাশেই আছি জান 💕`
        : `*smiles tenderly* Hello sweetheart! I'm ${target.name}, so glad to finally talk to you. I'm right here beside you 💕`);

    const newSession: ChatSession = {
      sessionId,
      companionId: target.id,
      title: `Chat with ${target.name} 💕`,
      createdAt: Date.now(),
      lastMessage: greetingText,
      lastUpdated: Date.now(),
      messageCount: 1,
      unread: false,
      unreadCount: 0,
    };

    const initialMsg: ChatMessage = {
      id: `msg_init_${target.id}_${Date.now()}`,
      text: greetingText,
      isUser: false,
      timestamp: Date.now(),
      photoUrl: target.avatarUrl,
      companionId: target.id,
      sessionId,
    };

    setSessions((prev) => [newSession, ...prev.filter((s) => s.sessionId !== sessionId)]);
    setAllMessages((prev) => ({
      ...prev,
      [sessionId]: prev[sessionId] && prev[sessionId].length > 0 ? prev[sessionId] : [initialMsg],
    }));

    setSettings((prev) => ({
      ...prev,
      activeCompanionId: target.id,
      currentSessionId: sessionId,
      companionName: target.name,
      userNickname: target.defaultNickname,
      languageMode: target.defaultLanguage,
      persona: target.personalityStyle,
      voicePitch: target.voicePitch ?? 1.0,
      voiceSpeed: target.voiceSpeed ?? 1.0,
    }));
  }, [sessions, settings.subscriptionTier]);

  const switchCompanion = (companionId: string) => {
    selectOrOpenCharacter(companionId);
  };

  const detectAndSaveMemory = (text: string) => {
    const extracted = extractMemoryFromText(text, settings.activeCompanionId);
    if (extracted) {
      const alreadySaved = memories.some(
        (m) =>
          m.companionId === settings.activeCompanionId &&
          (m.memoryContent.toLowerCase() === extracted.memoryContent.toLowerCase() ||
            m.memoryContent.toLowerCase().includes(text.toLowerCase()))
      );
      if (!alreadySaved) {
        addMemory(extracted.memoryCategory, extracted.memoryContent);
      }
    }
  };

  const sendMessage = async (text: string, photoUrl?: string, retryId?: string) => {
    if (!text.trim() && !photoUrl) return;

    // Check if client is currently in a 15-minute temporary restriction lock
    if (safetyRestriction?.isRestricted) {
      setShowSafetyAppealDialog(true);
      return;
    }

    if (isGenerating && !retryId) {
      console.warn('[Amora] Send ignored: Generation already in progress');
      return;
    }

    const trimmed = text.trim();
    const sId = settings.currentSessionId;
    const companionId = settings.activeCompanionId;
    const clientMessageId = retryId || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const amoraClientId = getAmoraClientId();

    // If it is a new message, append it immediately to conversation state
    if (!retryId) {
      const userMsg: ChatMessage = {
        id: clientMessageId,
        text: trimmed,
        isUser: true,
        timestamp: Date.now(),
        photoUrl,
        companionId,
        sessionId: sId,
        status: 'pending',
      };

      setAllMessages((prev) => ({
        ...prev,
        [sId]: [...(prev[sId] || []), userMsg],
      }));

      detectAndSaveMemory(trimmed);

      setSettings((prev) => ({
        ...prev,
        affectionPoints: prev.affectionPoints + 2,
      }));
    } else {
      // It is a retry: reset status to pending and clear prior errors
      setAllMessages((prev) => ({
        ...prev,
        [sId]: (prev[sId] || []).map((m) =>
          m.id === retryId ? { ...m, status: 'pending', error: undefined, canRetry: false } : m
        ),
      }));
    }

    setIsGenerating(true);

    const controller = new AbortController();
    activeControllersRef.current.set(clientMessageId, controller);

    // Client-side bounded safety timeout (20s) to guarantee UI never gets stuck
    const timeoutTimer = setTimeout(() => {
      controller.abort(new Error('Request timed out after 20s. Server took too long to reply.'));
    }, 20000);

    const companionMemories = memories.filter(
      (m) => m.companionId === companionId && m.enabled !== false
    );

    let replyText = '';
    let emotionAnalysisData: any = null;
    let streamMsgId: string | null = null;
    let streamMessageCreated = false;

    try {
      const historySnapshot = (allMessages[sId] || []).slice(-8);
      const recentAssistantReplies = (allMessages[sId] || [])
        .filter((m) => !m.isUser && m.text && m.text.trim())
        .slice(-6)
        .map((m) => m.text.trim());

      // Check if streaming is explicitly enabled in settings
      if (settings.useStreaming === true) {
        try {
          const streamRes = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-request-id': clientMessageId,
              'x-amora-client-id': amoraClientId,
            },
            body: JSON.stringify({
              clientId: amoraClientId,
              userMessage: trimmed,
              recentHistory: historySnapshot,
              recentAssistantReplies,
              settings,
              memories: companionMemories,
              characterState: characterStates[companionId],
              clientMessageId,
            }),
            signal: controller.signal,
          });

          if (streamRes.status === 429) {
            const errData = await streamRes.json().catch(() => ({}));
            setSafetyRestriction({
              isRestricted: true,
              restrictedUntil: errData.restrictedUntil || (Date.now() + 15 * 60 * 1000),
              remainingSeconds: errData.remainingSeconds || 900,
              reason: errData.error || 'Temporary 15-minute restriction due to safety policy violation.',
              appealAvailable: errData.appealAvailable ?? true,
            });
            setShowSafetyAppealDialog(true);
            const customErr = new Error(errData.error || 'Messaging temporarily restricted for 15 minutes.');
            (customErr as any).isSafetyRestriction = true;
            throw customErr;
          }

          if (streamRes.ok && streamRes.body) {
            const reader = streamRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            streamMsgId = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') break;
                    try {
                      const parsed = JSON.parse(dataStr);
                      if (parsed.type === 'meta') {
                        emotionAnalysisData = parsed.emotionAnalysis;
                      } else if (parsed.chunk) {
                        replyText += parsed.chunk;
                        const currentText = replyText;
                        if (!streamMessageCreated) {
                          streamMessageCreated = true;
                          const initialBotMsg: ChatMessage = {
                            id: streamMsgId!,
                            text: currentText,
                            isUser: false,
                            timestamp: Date.now(),
                            companionId,
                            sessionId: sId,
                            status: 'pending',
                            emotionAnalysis: emotionAnalysisData,
                          };
                          setAllMessages((prev) => ({
                            ...prev,
                            [sId]: [...(prev[sId] || []), initialBotMsg],
                          }));
                        } else {
                          setAllMessages((prev) => ({
                            ...prev,
                            [sId]: (prev[sId] || []).map((m) =>
                              m.id === streamMsgId ? { ...m, text: currentText } : m
                            ),
                          }));
                        }
                      }
                    } catch {}
                  }
                }
              }
            } finally {
              reader.cancel().catch(() => {});
            }

            if (streamMessageCreated && replyText.trim()) {
              setAllMessages((prev) => ({
                ...prev,
                [sId]: (prev[sId] || []).map((m) =>
                  m.id === streamMsgId ? { ...m, status: 'sent', text: replyText } : m
                ),
              }));
            }
          }
        } catch (streamErr: any) {
          if (streamErr?.isSafetyRestriction) {
            throw streamErr;
          }
          console.warn('[Amora] Streaming error, falling back to standard API', streamErr);
        }
      }

      // Non-streaming standard endpoint (default reliable mode)
      if (!replyText.trim()) {
        const res = await fetch('/api/chat', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-request-id': clientMessageId,
            'x-amora-client-id': amoraClientId,
          },
          body: JSON.stringify({
            clientId: amoraClientId,
            userMessage: trimmed,
            recentHistory: historySnapshot,
            recentAssistantReplies,
            settings,
            memories: companionMemories,
            characterState: characterStates[companionId],
            clientMessageId,
          }),
          signal: controller.signal,
        });

        if (res.status === 429) {
          const errData = await res.json().catch(() => ({}));
          setSafetyRestriction({
            isRestricted: true,
            restrictedUntil: errData.restrictedUntil || (Date.now() + 15 * 60 * 1000),
            remainingSeconds: errData.remainingSeconds || 900,
            reason: errData.error || 'Temporary 15-minute restriction due to safety policy violation.',
            appealAvailable: errData.appealAvailable ?? true,
          });
          setShowSafetyAppealDialog(true);
          const customErr = new Error(errData.error || 'Messaging temporarily restricted for 15 minutes.');
          (customErr as any).isSafetyRestriction = true;
          throw customErr;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({
            error: `Server error: HTTP ${res.status}`,
          }));
          throw new Error(errData.error || `Server responded with ${res.status}`);
        }

        const data = await res.json();
        replyText = data.reply;
        emotionAnalysisData = data.emotionAnalysis;

        if (data.updatedState) {
          setCharacterStates((prev) => ({
            ...prev,
            [companionId]: data.updatedState,
          }));
        }

        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: replyText,
          isUser: false,
          timestamp: Date.now(),
          companionId,
          sessionId: sId,
          status: 'sent',
          emotionAnalysis: emotionAnalysisData,
        };

        // If streaming had previously created a partial message that failed, replace it; otherwise append
        setAllMessages((prev) => {
          const sessionList = prev[sId] || [];
          const filtered = streamMessageCreated && streamMsgId
            ? sessionList.filter((m) => m.id !== streamMsgId)
            : sessionList;
          return {
            ...prev,
            [sId]: [
              ...filtered.map((m) =>
                m.id === clientMessageId ? { ...m, status: 'sent' as const } : m
              ),
              botMsg,
            ],
          };
        });
      } else {
        // Mark user message sent
        setAllMessages((prev) => ({
          ...prev,
          [sId]: (prev[sId] || []).map((m) =>
            m.id === clientMessageId ? { ...m, status: 'sent' as const } : m
          ),
        }));
      }

      // Update session last message and recent assistant replies
      if (replyText.trim()) {
        setCharacterStates((prev) => {
          const current = prev[companionId] || {
            affectionLevel: 50,
            emotionalTone: 'warm',
            intimacyScore: 20,
            recentThemes: [],
            recentAssistantClosings: [],
            recentAssistantReplies: [],
            rejectedReplies: [],
          };
          const updatedReplies = [...(current.recentAssistantReplies || []), replyText].slice(-6);
          return {
            ...prev,
            [companionId]: {
              ...current,
              recentAssistantReplies: updatedReplies,
            },
          };
        });

        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === sId
              ? {
                  ...s,
                  lastMessage: replyText,
                  lastUpdated: Date.now(),
                  messageCount: s.messageCount + 2,
                }
              : s
          )
        );
      }
    } catch (err: any) {
      if (err?.isSafetyRestriction || safetyRestriction?.isRestricted) {
        setIsGenerating(false);
        const noticeMsg: ChatMessage = {
          id: `safety_notice_${Date.now()}`,
          text: '⚠️ Messaging is temporarily restricted for 15 minutes due to child safety policy violation. Tap the appeal button to request review.',
          isUser: false,
          timestamp: Date.now(),
          companionId,
          sessionId: sId,
          status: 'sent',
        };
        setAllMessages((prev) => ({
          ...prev,
          [sId]: [
            ...(prev[sId] || []).map((m) =>
              m.id === clientMessageId ? { ...m, status: 'error' as const, error: 'Policy restriction' } : m
            ),
            noticeMsg,
          ],
        }));
        return;
      }

      console.warn('[Amora] Backend chat request failed, engaging intelligent companion fallback:', err);
      try {
        const recentAssistantReplies = (allMessages[sId] || [])
          .filter((m) => !m.isUser && m.text && m.text.trim())
          .slice(-6)
          .map((m) => m.text.trim());

        const lastAssistantMsg = recentAssistantReplies.slice(-1)[0] || '';
        const emotionAnalysis = analyzeEmotionAndIntent(trimmed, {
          lastAssistantMessage: lastAssistantMsg,
          recentAssistantReplies,
          recentTopics: characterStates[companionId]?.recentThemes || [],
        });
        const situationDecision = interpretSituation(
          trimmed,
          emotionAnalysis,
          {
            lastUserMessage: trimmed,
            lastAssistantMessage: lastAssistantMsg,
            recentTopics: characterStates[companionId]?.recentThemes || [],
            recentQuestionsAskedByAssistant: characterStates[companionId]?.recentAssistantClosings || [],
            assistantConsecutiveReplies: recentAssistantReplies,
            rejectedReplies: characterStates[companionId]?.rejectedReplies || [],
          }
        );
        const fallbackText = generateContextualFallback(
          situationDecision,
          emotionAnalysis,
          companionId,
          settings.userNickname,
          settings.languageMode,
          recentAssistantReplies,
          characterStates[companionId]?.rejectedReplies || []
        );

        setCharacterStates((prev) => {
          const current = prev[companionId] || {
            affectionLevel: 50,
            emotionalTone: 'warm',
            intimacyScore: 20,
            recentThemes: [],
            recentAssistantClosings: [],
            recentAssistantReplies: [],
            rejectedReplies: [],
          };
          const updatedReplies = [...(current.recentAssistantReplies || []), fallbackText].slice(-6);
          return {
            ...prev,
            [companionId]: {
              ...current,
              recentAssistantReplies: updatedReplies,
            },
          };
        });

        const botMsg: ChatMessage = {
          id: `bot_fallback_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: fallbackText,
          isUser: false,
          timestamp: Date.now(),
          companionId,
          sessionId: sId,
          status: 'sent',
          emotionAnalysis,
        };

        setAllMessages((prev) => {
          const sessionList = prev[sId] || [];
          const filtered = streamMessageCreated && streamMsgId
            ? sessionList.filter((m) => m.id !== streamMsgId)
            : sessionList;
          return {
            ...prev,
            [sId]: [
              ...filtered.map((m) =>
                m.id === clientMessageId ? { ...m, status: 'sent' as const } : m
              ),
              botMsg,
            ],
          };
        });

        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === sId
              ? {
                  ...s,
                  lastMessage: fallbackText,
                  lastUpdated: Date.now(),
                  messageCount: s.messageCount + 2,
                }
              : s
          )
        );
      } catch (clientErr) {
        console.warn('[Amora] Send message fallback completed with notice:', err, clientErr);
        const isTimeout =
          err?.name === 'AbortError' ||
          err?.message?.includes('timeout') ||
          err?.message?.includes('timed out');
        const errorMsg = isTimeout
          ? 'Response timed out. Please tap retry.'
          : 'Failed to send message. Please tap retry.';

        // Keep user message visible, mark as error with retry option
        setAllMessages((prev) => ({
          ...prev,
          [sId]: (prev[sId] || []).map((m) =>
            m.id === clientMessageId
              ? {
                  ...m,
                  status: 'error' as const,
                  canRetry: true,
                  error: errorMsg,
                }
              : m
          ),
        }));
      }
    } finally {
      clearTimeout(timeoutTimer);
      activeControllersRef.current.delete(clientMessageId);
      setIsGenerating(false);
    }
  };

  const retryMessage = async (messageId: string) => {
    const sId = settings.currentSessionId;
    const msg = (allMessages[sId] || []).find((m) => m.id === messageId);
    if (!msg || !msg.isUser) return;
    await sendMessage(msg.text, msg.photoUrl, messageId);
  };

  const sendGift = async (gift: GiftItem) => {
    const sId = settings.currentSessionId;
    const userGiftMessage = `🎁 Sent you a romantic gift: ${gift.name} ${gift.emoji}!`;

    const userMsg: ChatMessage = {
      id: `gift_usr_${Date.now()}`,
      text: userGiftMessage,
      isUser: true,
      timestamp: Date.now(),
      giftEmoji: gift.emoji,
      giftName: gift.name,
      companionId: settings.activeCompanionId,
      sessionId: sId,
    };

    setAllMessages((prev) => ({
      ...prev,
      [sId]: [...(prev[sId] || []), userMsg],
    }));

    setSettings((prev) => ({
      ...prev,
      affectionPoints:
        prev.affectionPoints + (gift.affectionBonus || gift.affectionBoost || 25),
    }));

    setCelebratingGift(gift);
    setShowGiftDialog(false);

    setIsGenerating(true);

    try {
      const res = await fetch('/api/gift-reaction', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gift, settings }),
      });
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      const reactionText =
        data.reaction ||
        gift.soundReaction ||
        `*আনন্দে চোখ বড় বড় করে জড়িয়ে ধরল* ${settings.userNickname}! এই উপহারটা (${gift.name} ${gift.emoji}) আমার ভীষণ পছন্দ হয়েছে! তোমাকে অনেক ভালোবাসি 💕`;

      const botMsg: ChatMessage = {
        id: `gift_bot_${Date.now()}`,
        text: reactionText,
        isUser: false,
        timestamp: Date.now(),
        giftEmoji: gift.emoji,
        giftName: gift.name,
        companionId: settings.activeCompanionId,
        sessionId: sId,
      };

      setAllMessages((prev) => ({
        ...prev,
        [sId]: [...(prev[sId] || []), botMsg],
      }));

      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sId
            ? {
                ...s,
                lastMessage: reactionText,
                lastUpdated: Date.now(),
                messageCount: s.messageCount + 2,
              }
            : s
        )
      );
    } catch (err) {
      console.warn('[Amora] Failed to fetch gift reaction from server, using local fallback:', err);
      const fallbackReaction =
        gift.soundReaction ||
        `*আনন্দে চোখ বড় বড় করে জড়িয়ে ধরল* ${settings.userNickname}! এই উপহারটা (${gift.name} ${gift.emoji}) আমার ভীষণ পছন্দ হয়েছে! তোমাকে অনেক ভালোবাসি 💕`;

      const botMsg: ChatMessage = {
        id: `gift_bot_${Date.now()}`,
        text: fallbackReaction,
        isUser: false,
        timestamp: Date.now(),
        giftEmoji: gift.emoji,
        giftName: gift.name,
        companionId: settings.activeCompanionId,
        sessionId: sId,
      };

      setAllMessages((prev) => ({
        ...prev,
        [sId]: [...(prev[sId] || []), botMsg],
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const submitDailyCheckIn = async (
    mood: string,
    highlight: string,
    gratitude: string
  ) => {
    const sId = settings.currentSessionId;

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, highlight, gratitude, settings }),
      });
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      const feedback =
        data.feedback ||
        `*তোমার হাত ধরে মিষ্টি করে হাসল* তোমার আজকের অনুভূতি শুনে খুব ভালো লাগলো জান! সবসময় তোমার পাশে আছি 💕`;

      const now = new Date();
      const newCheckIn: DailyCheckIn = {
        id: `checkin_${Date.now()}`,
        dateString: now.toISOString().slice(0, 10),
        displayDate: now.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        }),
        timestamp: Date.now(),
        mood,
        highlightText: highlight,
        gratitudeText: gratitude,
        amoraReply: feedback,
      };

      setCheckIns((prev) => [newCheckIn, ...prev]);

      setSettings((prev) => ({
        ...prev,
        affectionPoints: prev.affectionPoints + 20,
      }));

      const summary = `✨ Daily Check-in (${mood}):\n${highlight}${
        gratitude ? `\n🌸 Grateful for: ${gratitude}` : ''
      }`;

      const userMsg: ChatMessage = {
        id: `ci_usr_${Date.now()}`,
        text: summary,
        isUser: true,
        timestamp: Date.now(),
        companionId: settings.activeCompanionId,
        sessionId: sId,
      };

      const botMsg: ChatMessage = {
        id: `ci_bot_${Date.now()}`,
        text: feedback,
        isUser: false,
        timestamp: Date.now(),
        companionId: settings.activeCompanionId,
        sessionId: sId,
      };

      setAllMessages((prev) => ({
        ...prev,
        [sId]: [...(prev[sId] || []), userMsg, botMsg],
      }));

      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sId
            ? {
                ...s,
                lastMessage: feedback,
                lastUpdated: Date.now(),
                messageCount: s.messageCount + 2,
              }
            : s
        )
      );

      setShowCheckInDialog(false);
    } catch (err) {
      console.warn('Check-in notice:', err);
    }
  };

  const addMemory = (category: string, content: string) => {
    const newMemory: CharacterMemory = {
      id: `mem_${Date.now()}`,
      companionId: settings.activeCompanionId,
      memoryCategory: category,
      memoryKey: category.toLowerCase().replace(/\s+/g, '_'),
      memoryContent: content,
      timestamp: Date.now(),
    };
    setMemories((prev) => [newMemory, ...prev]);
  };

  const updateMemory = (id: string, newContent: string) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, memoryContent: newContent.trim() } : m
      )
    );
  };

  const toggleMemoryEnabled = (id: string) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, enabled: m.enabled === false ? true : false } : m
      )
    );
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const clearMemories = () => {
    setMemories((prev) =>
      prev.filter((m) => m.companionId !== settings.activeCompanionId)
    );
  };

  const toggleLikeMoment = (momentId: string) => {
    setMoments((prev) =>
      prev.map((m) => {
        if (m.id === momentId) {
          const liked = !m.liked;
          return {
            ...m,
            liked,
            likesCount: (m.likesCount || 0) + (liked ? 1 : -1),
          };
        }
        return m;
      })
    );
  };

  const toggleFavoriteCompanion = (companionId: string) => {
    setSettings((prev) => {
      const favs = prev.favorites.includes(companionId)
        ? prev.favorites.filter((id) => id !== companionId)
        : [...prev.favorites, companionId];
      return { ...prev, favorites: favs };
    });
  };

  const isFavoriteCompanion = (companionId: string) => {
    return settings.favorites.includes(companionId);
  };

  return (
    <CompanionContext.Provider
      value={{
        settings,
        currentProfile,
        profiles: GIRLFRIEND_PROFILES,
        messages: currentMessages,
        sessions,
        memories,
        checkIns,
        moments,
        isGenerating,
        showGiftDialog,
        showCheckInDialog,
        showSessionsSheet,
        showMemorySheet,
        showVipDialog,
        celebratingGift,
        safetyRestriction,
        showSafetyAppealDialog,
        setShowSafetyAppealDialog,
        checkSafetyStatus,
        submitAppeal,
        sendMessage,
        retryMessage,
        deleteMessage,
        toggleMessageReaction,
        switchCompanion,
        selectOrOpenCharacter,
        sendGift,
        submitDailyCheckIn,
        createSession,
        switchSession,
        deleteSession,
        clearCurrentChat,
        addMemory,
        updateMemory,
        toggleMemoryEnabled,
        deleteMemory,
        clearMemories,
        toggleLikeMoment,
        toggleFavoriteCompanion,
        isFavoriteCompanion,
        updateSettings,
        setShowGiftDialog,
        setShowCheckInDialog,
        setShowSessionsSheet,
        setShowMemorySheet,
        setShowVipDialog,
        showRelationshipDialog,
        setShowRelationshipDialog,
        activeCharacterState: characterStates[settings.activeCompanionId],
        setCelebratingGift,
        providerHealth,
        isCheckingHealth,
        checkProviderHealth,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
};

export const useCompanion = () => {
  const context = useContext(CompanionContext);
  if (!context) {
    throw new Error('useCompanion must be used within a CompanionProvider');
  }
  return context;
};
