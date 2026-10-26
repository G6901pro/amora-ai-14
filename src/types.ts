export type PrimaryEmotionType =
  | 'happiness'
  | 'sadness'
  | 'anger'
  | 'stress'
  | 'playfulness'
  | 'confusion'
  | 'neutral'
  | 'affection'
  | 'jealousy'
  | 'disappointment'
  | 'excitement'
  | 'shyness'
  | 'curiosity'
  | 'calmness'
  | 'frustration'
  | 'loneliness'
  | 'tender_melancholy'
  | 'cheerful_warmth'
  | 'calm_grounding'
  | 'shy_soft'
  | 'soothing_comfort'
  | 'natural_companion';

export type LanguageCode = 'bn' | 'banglish' | 'en' | 'both';

export interface EmotionIntentAnalysis {
  primaryEmotion: PrimaryEmotionType;
  intensity: number;
  intent: string;
  confidence: number;
  contextSummary: string;
  responseStrategy: string;
  isUncertain?: boolean;
  possibleInterpretations?: string[];
  detectedLanguage?: 'bn' | 'banglish' | 'en';
  requestedLanguage?: 'bn' | 'banglish' | 'en';
  semanticGlossBengali?: string;
}

export interface SituationDecision {
  userCoreMessage: string;
  userGoal: string;
  situationType: string;
  responseStyle: string;
  mustAnswerDirectly: boolean;
  prohibitedRepetitions: string[];
  shouldAskFollowupQuestion: boolean;
  recommendedLength: 'concise' | 'medium' | 'detailed';
}

export interface CharacterPersonality {
  id: string;
  name: string;
  banglaName: string;
  archetype:
    | 'warm_caring'
    | 'playful_teasing'
    | 'confident_bold'
    | 'shy_sweet'
    | 'calm_mature'
    | 'funny_spontaneous'
    | 'intellectual_curious'
    | 'artistic_poetic'
    | 'ambitious_sharp'
    | 'spirited_creative'
    | string;
  appearance?: string;
  age?: number;
  profession?: string;
  location?: string;
  boundaryLevel?: BoundaryLevel;
  romanticPreferences?: RomanticPreferences;
  traits: string[];
  vocabularyStyle: string;
  speakingRhythm: string;
  expressiveness: number;
  flirtTendency: number;
  humorTendency: number;
  humorStyle: string;
  affectionStyle: string;
  confidenceLevel: number;
  playfulnessLevel: number;
  sensitivityLevel: number;
  personalPreferences: {
    loves: string[];
    dislikes: string[];
    petPeeves: string[];
  };
  boundaryStyle: string;
  reconciliationStyle: string;
  emotionalReactions: Record<string, string>;
  backstoryContext?: string;
  dialogueGuidance?: {
    bengali: string;
    english: string;
  };
}

export interface CharacterMemory {
  id: string;
  companionId: string;
  memoryCategory: string;
  memoryKey?: string;
  memoryContent: string;
  timestamp: number;
  enabled?: boolean;
}

export type RelationshipStage =
  | 'strangers'
  | 'acquaintances'
  | 'acquaintance'
  | 'friends'
  | 'crush'
  | 'dating'
  | 'close_partners'
  | 'in_love'
  | 'deeply_bonded';

export interface CharacterDynamicState {
  companionId?: string;
  sessionId?: string;
  interactionCount: number;
  unresolvedQuestion?: string;
  relationshipState?: {
    familiarity: number;
    trust: number;
    comfort: number;
    affection: number;
    tension: number;
    reconciliationProgress: number;
    relationshipStage: RelationshipStage;
    sharedExperiences: string[];
    insideJokes: string[];
  };
  rejectedReplies?: string[];
  recentAssistantReplies?: string[];
  recentAssistantOpenings?: string[];
  recentAssistantClosings?: string[];
  recentThemes?: string[];
  recentJokes?: string[];
  exhaustedTopics?: string[];
  activeTopic?: string;
  currentMood?: PrimaryEmotionType | string;
  lastInteractionTimestamp?: number;
  streakDays?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  photoUrl?: string;
  companionId: string;
  sessionId: string;
  status?: 'sending' | 'sent' | 'error' | 'pending';
  providerUsed?: string;
  modelUsed?: string;
  isError?: boolean;
  errorReason?: string;
  canRetry?: boolean;
  error?: string;
  emotionAnalysis?: any;
  giftEmoji?: string;
  giftName?: string;
  reaction?: string;
  reactions?: string[];
}

export interface ChatSession {
  sessionId: string;
  companionId: string;
  title: string;
  createdAt: number;
  lastMessage: string;
  lastUpdated: number;
  messageCount: number;
  unread?: boolean;
  unreadCount?: number;
}

export type ConversationMode =
  | 'Normal'
  | 'Playful'
  | 'Deep'
  | 'Romantic'
  | 'Comforting';

export interface CompanionSettings {
  activeCompanionId: string;
  currentSessionId: string;
  languageMode: 'bn' | 'en' | 'both';
  companionName: string;
  userNickname: string;
  persona: string;
  voiceTone: string;
  affectionPoints: number;
  autoVoice: boolean;
  voicePitch: number;
  voiceSpeed: number;
  flirtIntensity: string;
  subscriptionTier: 'FREE' | 'VIP_PRO';
  handsFreeVoiceMode: boolean;
  favorites: string[];
  selectedVoiceURI?: string;
  useStreaming?: boolean;
  conversationMode?: ConversationMode | string;
}

export interface RomanticPreferences {
  pacing: 'slow_burn' | 'balanced' | 'fast_romantic' | 'deep_emotional';
  flirtStyle: string;
  intimacyBoundaries: string;
  favoriteCompliments: string[];
  loveLanguage: string;
  sexualHealthOpenness?: string;
}

export type BoundaryLevel = 'reserved' | 'moderate' | 'open_flirty';

export interface SafetyRestrictionState {
  isRestricted: boolean;
  restrictedUntil?: number;
  remainingSeconds?: number;
  reason?: string;
  category?: 'child_sexual_content' | 'adult_sexual_harassment';
  appealAvailable?: boolean;
}

export interface GirlfriendProfile {
  id: string;
  name: string;
  banglaName: string;
  age: number; // All characters are explicitly age 21 or older
  tagline: string;
  bio: string;
  appearance: string;
  profession?: string;
  location?: string;
  interests: string[];
  relationshipStyle: string;
  avatarUrl: string;
  isVipExclusive?: boolean;
  archetype:
    | 'warm_caring'
    | 'playful_teasing'
    | 'confident_bold'
    | 'shy_sweet'
    | 'calm_mature'
    | 'funny_spontaneous'
    | 'intellectual_curious'
    | 'artistic_poetic'
    | 'ambitious_sharp'
    | 'spirited_creative'
    | string;
  personalityStyle: string;
  voiceTone?: string;
  voicePitch?: number;
  voiceSpeed?: number;
  boundaryLevel: BoundaryLevel;
  romanticPreferences: RomanticPreferences;
  defaultLanguage: 'bn' | 'en' | 'both';
  defaultNickname: string;
  sampleVoicePhrase: string;
  greetingMessage: string;
}

export interface DailyCheckIn {
  id: string;
  date?: string;
  dateString?: string;
  displayDate?: string;
  mood: string;
  highlight?: string;
  highlightText?: string;
  gratitude?: string;
  gratitudeText?: string;
  companionReaction?: string;
  amoraReply?: string;
  timestamp: number;
}

export interface GiftItem {
  id: string;
  name: string;
  banglaName: string;
  emoji: string;
  cost: number;
  affectionBoost: number;
  affectionBonus?: number;
  description: string;
  soundReaction: string;
}

export interface MomentCard {
  id: string;
  companionId: string;
  title: string;
  banglaTitle: string;
  caption: string;
  imageUrl: string;
  unlocked: boolean;
  likes: number;
  liked: boolean;
  date: string;
  likesCount?: number;
}

export interface ProviderHealthState {
  ok: boolean;
  status: 'healthy' | 'degraded' | 'offline';
  provider?: string;
  model?: string;
  isFree?: boolean;
  freeTierStatus?: string;
  description?: string;
  geminiConfigured?: boolean;
  geminiModel?: string;
  geminiFreeTierStatus?: string;
  circuitBreakerOpen?: boolean;
  recentError?: string;
}
