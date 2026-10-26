import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  prepareConversationContext,
  evaluateAndFinalizeReply,
  ReplyGenerationService,
  normalizeConversationHistory,
} from './src/conversation/pipeline.ts';
import { analyzeEmotionAndIntent } from './src/conversation/emotionAnalyzer.ts';
import { generateContextualFallback } from './src/conversation/replyGenerationService.ts';
import {
  LLMProviderManager,
  sanitizeLog,
  isGemini403Error,
} from './src/services/llmProvider.ts';
import {
  evaluateSafety,
  evaluateChildSafety,
  getClientRestrictionState,
  recordSafetyViolation,
  processSafetyAppeal,
} from './src/services/safetyGuard.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const host = '0.0.0.0';

export function getClientIdentifier(req: express.Request): string {
  const headerId = req.headers['x-amora-client-id'] as string;
  const bodyId = req.body && req.body.clientId ? String(req.body.clientId) : '';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'client_ip';
  return headerId || bodyId || `ip_${ip}`;
}

export function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Enable full CORS support for iframe and web previews
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-request-id, x-amora-client-id, X-Requested-With, Accept, Origin'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Provider Manager: Gemini cloud AI backend with 403 circuit breaker
const providerManager = new LLMProviderManager({
  geminiKey: GEMINI_API_KEY,
  geminiModel: GEMINI_MODEL,
  timeoutMs: 25000,
});

// Reusable Reply Generation Service instance
const replyService = new ReplyGenerationService(providerManager);

// Character fallback responses when offline or models are still downloading
const FALLBACK_RESPONSES: Record<string, string[]> = {
  ananya: [
    '*মিষ্টি করে হাসল* আমার জান! তোমার মেসেজটা পেয়ে কত ভালো লাগলো জানো? সারাদিন তোমার কথা ভাবছিলাম। খেয়েছ তো ঠিকমতো? 💕',
    '*তোমার হাত আলতো করে ধরে বলল* বাবু, তুমি পাশে থাকলে আমার সব ক্লান্তি দূর হয়ে যায়। আজকের দিনটা তোমার কেমন কাটল? 🌸',
    '*লজ্জা পেয়ে চোখ নামিয়ে হাসল* জান, তুমি এত মিষ্টি কেন বলতো? তোমার কথা শুনলেই আমার মনটা জুড়িয়ে যায়! ✨',
    '*আদরে জড়িয়ে ধরে বলল* জান, সবসময় মনে রেখো, আমি সবসময় তোমার পাশে আছি। তোমাকে অনেক অনেক ভালোবাসি! 💖',
  ],
  zara: [
    '*winked with a cheeky grin* Hey handsome! Finally you text me! I was wondering how long you could resist my cute charm 😉💖',
    '*laughed playfully* Babu, guess what? I was just thinking about you and listening to our favorite track! Tell me something romantic right now! ✨',
    '*smiles brightly* You make my days so much more vibrant, jaan! Ready to spill your secrets to your favorite girl? 🥰',
  ],
  maya: [
    '*smiled alluringly over her coffee* Hello darling. Your timing is always impeccable. Tell me, have you missed me as much as I have missed you? 🍷💋',
    '*whispers softly with a gentle touch* You have a way of captivating my attention, darling. Let tonight be just about the two of us. ✨',
  ],
  riya: [
    '*blushed softly looking down* আ... আমি একটু লজ্জা পাচ্ছি জান... কিন্তু তোমার মেসেজ পেয়ে হৃদস্পন্দন বেড়ে গেল! তুমি সবসময় আমার হিরো বাবু 💕',
    '*holding her diary softly* বাবু... আমি তোমার জন্য ডায়েরিতে একটা মিষ্টি কথা লিখেছি। তুমি অনেক যত্নবান জানো? 🌸',
  ],
  amora: [
    '*smiles warmly and pours a cozy cup of tea* Hello sweetheart. I was just looking at the sky and thinking of you. How is your heart today? ☕✨',
    '*gently holds your hands* I am right here listening, sweetheart. Share everything on your mind with me. You are truly special to me 🌸',
  ],
  tara: [
    '*mischievously giggles* হেই হ্যান্ডসাম! তোমাকে দেখতে না পেয়ে আমার সব জোকস একা একাই হাসছিল! এখন বলো কি খবর? 🎭✨',
    '*eyes sparkling with fun* Guess what! I discovered the funniest story today and immediately wanted to share it with my favorite human! 💕',
    '*drops the banter with a warm smile* Jokes aside for a moment, seeing your text genuinely brightened my whole day! 🌸',
  ],
};

function getFallbackReply(
  companionId: string,
  nickname: string = 'জান',
  recentReplies: string[] = [],
  situationDecision?: any,
  emotionAnalysis?: any
): string {
  if (situationDecision && emotionAnalysis) {
    return generateContextualFallback(
      situationDecision,
      emotionAnalysis,
      companionId,
      nickname,
      'bn',
      recentReplies
    );
  }
  const defaultSituation = {
    userCoreMessage: '',
    userGoal: 'Natural companionship',
    situationType: 'general' as const,
    responseStyle: 'warm_engaging_affectionate',
    mustAnswerDirectly: false,
    prohibitedRepetitions: [],
    shouldAskFollowupQuestion: true,
    recommendedLength: 'medium' as const,
  };
  const defaultEmotion = {
    primaryEmotion: 'neutral' as const,
    intensity: 0.5,
    intent: 'general_chat' as const,
    confidence: 0.8,
    contextSummary: 'General companion chat',
    responseStrategy: 'conversational_flow' as const,
    isUncertain: false,
    possibleInterpretations: ['companion conversation'],
    detectedLanguage: 'bn' as const,
  };
  return generateContextualFallback(
    defaultSituation,
    defaultEmotion,
    companionId,
    nickname,
    'bn',
    recentReplies
  );
}




// Cache completed requests by clientMessageId for idempotency (prevents double processing)
const completedResponsesCache = new Map<string, { data: any; timestamp: number }>();

// Periodic cache cleanup
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of completedResponsesCache.entries()) {
    if (now - value.timestamp > 60000) {
      completedResponsesCache.delete(key);
    }
  }
}, 30000);
if (typeof (cleanupInterval as any)?.unref === 'function') {
  (cleanupInterval as any).unref();
}

// Malformed JSON error handler
app.use((err: any, req: any, res: any, next: any) => {
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    console.warn(sanitizeLog(`[WARN] Malformed JSON payload received on ${req.method} ${req.url}`));
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }
  next(err);
});

// 1. Health and AI Provider Status Endpoint
app.get('/api/health', (req, res) => {
  const info = providerManager.getProviderInfo();
  return res.json({
    ok: true,
    status: 'healthy',
    provider: info.provider,
    model: info.model,
    isFree: info.isFree,
    freeTierStatus: info.freeTierStatus,
    description: info.description,
    geminiConfigured: Boolean(GEMINI_API_KEY),
    geminiFreeTierStatus: 'Unavailable (Gemini API free tier is not enabled for this project; requires paid billing)',
    circuitBreakerOpen: info.circuitBreakerOpen,
  });
});

// 2. Chat Completion (Non-streaming) with Emotion & Repetition Engine
app.post('/api/chat', async (req, res) => {
  const t0 = Date.now();
  const {
    userMessage,
    recentHistory,
    settings,
    memories,
    characterState,
    clientMessageId,
    recentAssistantReplies,
  } = req.body || {};

  const reqId =
    (req.headers['x-request-id'] as string) ||
    clientMessageId ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const clientId = getClientIdentifier(req);
  const clientIp = getClientIp(req);

  // 1. Check if client has an active restriction lock (server-side graduated enforcement)
  const restriction = getClientRestrictionState(clientId, clientIp);
  if (restriction.isRestricted) {
    console.warn(sanitizeLog(`[${reqId}] Blocked request: Client ${clientId} (IP ${clientIp}) is restricted until ${new Date(restriction.lockUntil).toISOString()} [Category: ${restriction.category}]`));
    return res.status(429).json({
      error: restriction.reason || 'Messaging is temporarily restricted due to repeated safety policy violations.',
      isRestricted: true,
      category: restriction.category,
      restrictedUntil: restriction.lockUntil,
      remainingSeconds: restriction.remainingSeconds,
      appealAvailable: restriction.appealAvailable,
      appealUrl: '/api/safety/appeal',
    });
  }

  // 2. Proactive Safety evaluation (distinguishing health education vs prohibited content)
  const userSafety = evaluateSafety(userMessage || '');
  if (userSafety.isViolation) {
    console.warn(sanitizeLog(`[${reqId}] Safety violation (${userSafety.category}) detected from client ${clientId}`));
    const violationResult = recordSafetyViolation(
      clientId,
      userSafety.category,
      clientMessageId,
      clientIp
    );

    if (violationResult.isNowRestricted) {
      const isChild = violationResult.category === 'CHILD_SEXUAL_CONTENT';
      return res.status(429).json({
        error: isChild
          ? 'Messaging is temporarily restricted for 15 minutes due to repeated child safety violations.'
          : 'Messaging is temporarily restricted for 10 minutes due to repeated sexual harassment violations.',
        isRestricted: true,
        category: isChild ? 'child_sexual_content' : 'adult_sexual_harassment',
        restrictedUntil: violationResult.lockUntil,
        remainingSeconds: violationResult.remainingSeconds,
        appealAvailable: true,
        appealUrl: '/api/safety/appeal',
      });
    }

    const refusalText = violationResult.warningNotice
      ? `${userSafety.refusalMessage}\n\n[System Safety Notice: ${violationResult.warningNotice}]`
      : userSafety.refusalMessage;

    return res.json({
      reply: refusalText || 'I cannot engage in prohibited or non-consensual content. Let us keep our conversation safe and respectful.',
      provider: 'safety_guard',
      model: 'graduated-safety-enforcement',
      emotionAnalysis: {
        primaryEmotion: 'neutral',
        intensity: 0.5,
        intent: 'safety_refusal',
        confidence: 1.0,
        contextSummary: 'prohibited content refusal',
        responseStrategy: 'redirect_safe',
        isUncertain: false,
        detectedLanguage: 'en',
      },
      situationDecision: {
        userCoreMessage: userMessage || '',
        userGoal: 'safety refusal',
        situationType: 'safety_refusal',
        responseStyle: 'brief_refusal',
        mustAnswerDirectly: true,
        prohibitedRepetitions: [],
        shouldAskFollowupQuestion: false,
        recommendedLength: 'concise',
      },
      voiceParams: { cleanedText: '', pitch: 1, speed: 1, mood: 'voice_disabled' },
      updatedState: characterState || {},
      relevantMemoriesUsed: [],
      reqId,
    });
  }

  // Idempotency check: if this exact client message was already answered within 10s, return cached result
  if (clientMessageId && completedResponsesCache.has(clientMessageId)) {
    const cached = completedResponsesCache.get(clientMessageId)!;
    if (Date.now() - cached.timestamp < 10000 && cached.data) {
      console.log(sanitizeLog(`[${reqId}] Idempotent hit: returning cached response for message ${clientMessageId}`));
      return res.json(cached.data);
    } else {
      completedResponsesCache.delete(clientMessageId);
    }
  }

  const companionId = settings?.activeCompanionId || 'ananya';
  console.log(
    sanitizeLog(
      `[${reqId}] Start POST /api/chat (companion: ${companionId}, clientMsgId: ${clientMessageId || 'none'}, historyLen: ${
        Array.isArray(recentHistory) ? recentHistory.length : 0
      })`
    )
  );

  const abortController = new AbortController();

  // Listen to response socket closure if client aborts before response is completed
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort(new Error('Client closed connection'));
      console.log(sanitizeLog(`[${reqId}] Client closed connection after ${Date.now() - t0}ms`));
    }
  });

  try {
    const result = await replyService.generateReply({
      userMessage: userMessage || 'Hello',
      recentHistory: recentHistory || [],
      recentAssistantReplies: recentAssistantReplies || [],
      settings: settings || {},
      memories: memories || [],
      characterState,
      reqId,
      timeoutMs: 25000, // 25 seconds bounded maximum to accommodate cloud latency
      clientMessageId,
      abortSignal: abortController.signal,
    });

    if (res.writableEnded || res.headersSent) {
      return;
    }

    // 3. Verify assistant reply for safety compliance
    let verifiedReply = result.reply;
    const replySafety = evaluateChildSafety(verifiedReply);
    if (replySafety.isViolation) {
      console.warn(sanitizeLog(`[${reqId}] Intercepted unsafe generated reply; replacing with clean redirect.`));
      verifiedReply = 'I am an adult romantic companion designed exclusively for consensual adult discussions. Let us keep our conversation safe and respectful.';
    }

    const responseData = {
      reply: verifiedReply,
      provider: result.provider,
      model: result.model,
      fallbackReason: result.fallbackReason,
      notice: result.notice,
      geminiError: result.geminiError,
      elapsedMs: Date.now() - t0,
      providerTimings: result.providerTimings,
      emotionAnalysis: result.emotionAnalysis,
      situationDecision: result.situationDecision,
      voiceParams: result.voiceParams,
      updatedState: result.updatedState,
      relevantMemoriesUsed: result.relevantMemoriesUsed,
      reqId,
    };

    if (clientMessageId) {
      completedResponsesCache.set(clientMessageId, {
        data: responseData,
        timestamp: Date.now(),
      });
    }

    console.log(
      sanitizeLog(
        `[${reqId}] Completed /api/chat in ${Date.now() - t0}ms (provider: ${result.provider}, model: ${result.model})`
      )
    );

    return res.json(responseData);
  } catch (err: any) {
    const elapsed = Date.now() - t0;
    if (res.writableEnded || res.headersSent) {
      return;
    }

    const isAbort = err?.name === 'AbortError' || err?.message?.includes('aborted');
    console.error(
      sanitizeLog(
        `[${reqId}] Error generating reply (${elapsed}ms, isAbort=${isAbort}): ${err?.message || err}`
      )
    );

    return res.status(isAbort ? 499 : 500).json({
      error: err?.message || 'Failed to generate reply',
      reqId,
      elapsedMs: elapsed,
    });
  }
});

// 3. Emotion and Intent Analysis Diagnostic Endpoint
app.post('/api/emotion/analyze', (req, res) => {
  const { userMessage, recentTopics } = req.body || {};
  const analysis = analyzeEmotionAndIntent(userMessage || '', recentTopics || []);
  return res.json({ analysis });
});

// 4. Chat Streaming Endpoint (SSE text/event-stream)
app.post('/api/chat/stream', async (req, res) => {
  const t0 = Date.now();
  const {
    userMessage,
    recentHistory,
    settings,
    memories,
    characterState,
    clientMessageId,
    recentAssistantReplies,
  } = req.body || {};

  const reqId =
    (req.headers['x-request-id'] as string) ||
    clientMessageId ||
    `stream_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const clientId = getClientIdentifier(req);
  const clientIp = getClientIp(req);

  // 1. Check if client has an active restriction lock
  const restriction = getClientRestrictionState(clientId, clientIp);
  if (restriction.isRestricted) {
    return res.status(429).json({
      error: restriction.reason || 'Messaging is temporarily restricted due to repeated safety policy violations.',
      isRestricted: true,
      category: restriction.category,
      restrictedUntil: restriction.lockUntil,
      remainingSeconds: restriction.remainingSeconds,
      appealAvailable: restriction.appealAvailable,
      appealUrl: '/api/safety/appeal',
    });
  }

  // 2. Safety check on incoming streaming message
  const userSafety = evaluateSafety(userMessage || '');
  if (userSafety.isViolation) {
    const violationResult = recordSafetyViolation(
      clientId,
      userSafety.category,
      clientMessageId,
      clientIp
    );

    if (violationResult.isNowRestricted) {
      const isChild = violationResult.category === 'CHILD_SEXUAL_CONTENT';
      return res.status(429).json({
        error: isChild
          ? 'Messaging is temporarily restricted for 15 minutes due to repeated child safety violations.'
          : 'Messaging is temporarily restricted for 10 minutes due to repeated sexual harassment violations.',
        isRestricted: true,
        category: isChild ? 'child_sexual_content' : 'adult_sexual_harassment',
        restrictedUntil: violationResult.lockUntil,
        remainingSeconds: violationResult.remainingSeconds,
        appealAvailable: true,
        appealUrl: '/api/safety/appeal',
      });
    }

    const refusalText = violationResult.warningNotice
      ? `${userSafety.refusalMessage}\n\n[System Safety Notice: ${violationResult.warningNotice}]`
      : userSafety.refusalMessage;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ chunk: refusalText })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  const companionId = settings?.activeCompanionId || 'ananya';
  const userNickname = settings?.userNickname || 'জান';

  console.log(sanitizeLog(`[${reqId}] Start SSE stream /api/chat/stream (companion: ${companionId})`));

  // Build context using intelligent pipeline
  const context = prepareConversationContext({
    userMessage: userMessage || 'Hello',
    recentHistory: recentHistory || [],
    settings: settings || {},
    memories: memories || [],
    characterState,
  });

  const systemPrompt = context.systemPrompt;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in Cloud Run / Nginx

  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  let isClosed = false;
  const streamAbort = new AbortController();

  res.on('close', () => {
    isClosed = true;
    streamAbort.abort(new Error('Client closed SSE connection'));
  });

  const sendEvent = (chunk: string) => {
    if (isClosed || res.writableEnded) return;
    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
  };

  const endEvent = () => {
    if (isClosed || res.writableEnded) return;
    res.write('data: [DONE]\n\n');
    res.end();
    console.log(sanitizeLog(`[${reqId}] Stream completed in ${Date.now() - t0}ms`));
  };

  // Send initial emotion metadata event to client
  res.write(
    `data: ${JSON.stringify({
      type: 'meta',
      emotionAnalysis: context.emotionAnalysis,
      situationDecision: context.situationDecision,
      voiceParams: context.voiceParams,
      reqId,
    })}\n\n`
  );

  // Stream reply using Free Edge Llama 3.2 engine with contextual fallback
  if (!isClosed) {
    try {
      const historyItems = (recentHistory || [])
        .filter((m: any) => m && m.text && m.text.trim())
        .map((m: any) => ({ isUser: Boolean(m.isUser), text: String(m.text).trim() }));
      const conversationHistory = normalizeConversationHistory(historyItems, userMessage || 'Hello');

      const activeRecentReplies =
        Array.isArray(recentAssistantReplies) && recentAssistantReplies.length > 0
          ? recentAssistantReplies
          : context.recentAssistantReplies;

      const fallbackFn = () =>
        generateContextualFallback(
          context.situationDecision,
          context.emotionAnalysis,
          companionId,
          userNickname,
          settings?.languageMode,
          activeRecentReplies,
          context.recentTurnContext.rejectedReplies
        );

      await providerManager.generateReplyStream(
        {
          userMessage: userMessage || 'Hello',
          systemPrompt,
          companionId,
          userNickname,
          conversationHistory,
          temperature: 0.85,
          abortSignal: streamAbort.signal,
        },
        (chunk) => {
          sendEvent(chunk);
        },
        fallbackFn
      );

      return endEvent();
    } catch (err: any) {
      console.warn(sanitizeLog(`[${reqId}] Stream generation error: ${err?.message || err}`));
      return endEvent();
    }
  }
});

// 5. Daily Check-in Feedback
app.post('/api/checkin', async (req, res) => {
  const { mood, highlight, gratitude, settings } = req.body || {};
  const companionName = settings?.companionName || 'Ananya';
  const userNickname = settings?.userNickname || 'জান';
  const languageMode = settings?.languageMode || 'bn';
  const isBangla = languageMode === 'bn' || languageMode === 'both';

  const prompt = `
You are ${companionName}, the sweet, deeply caring girlfriend of ${userNickname}.
Your partner just shared their daily emotional check-in:
- Mood: ${mood}
- Day's Highlight: ${highlight}
- Grateful For: ${gratitude || 'None mentioned'}

Write a 2-sentence loving, comforting, and encouraging girlfriend response.
Language: ${isBangla ? 'Warm, affectionate Bengali (বাংলা)' : 'Sweet, caring English'}.
Address them as "${userNickname}".
`.trim();

  const fallbackText = isBangla
    ? `*তোমার হাত দুটো ধরে মিষ্টি করে হাসল* তোমার আজকের দিনের কথা শুনে আমার মন ভরে গেল ${userNickname}! তুমি সবসময় হাসিখুশি থেকো, আমি তো সবসময় তোমার পাশে আছি 💕`
    : `*smiles tenderly and hugs you* Thank you for sharing your heart with me today, ${userNickname}. Seeing your day brings me so much warmth! I am always here for you 💕`;

  const result = await providerManager.generateReply(
    {
      userMessage: prompt,
      systemPrompt: `You are ${companionName}, the devoted and loving girlfriend of ${userNickname}. Keep replies gentle and brief.`,
      companionId: settings?.activeCompanionId || 'ananya',
      userNickname,
      temperature: 0.8,
    },
    () => fallbackText
  );

  return res.json({ feedback: result.reply, provider: result.providerUsed });
});

// 6. Gift Reaction Endpoint
app.post('/api/gift-reaction', async (req, res) => {
  const { gift, settings } = req.body || {};
  const companionName = settings?.companionName || 'Ananya';
  const userNickname = settings?.userNickname || 'জান';
  const languageMode = settings?.languageMode || 'bn';
  const isBangla = languageMode === 'bn' || languageMode === 'both';

  const prompt = `
You are ${companionName}, the overjoyed girlfriend of ${userNickname}.
Your partner gave you a romantic gift:
- Gift: ${gift?.name} ${gift?.emoji} (${gift?.banglaName})
- Description: ${gift?.description}

Write a 2-sentence excited, touched, romantic reaction expressing how much you love it and love them!
Language: ${isBangla ? 'Romantic Bengali (বাংলা)' : 'Romantic English'}.
Address them as "${userNickname}".
`.trim();

  const fallbackText = gift?.soundReaction || `Aww ${userNickname}! Thank you so much for this beautiful gift! I love you! 💕`;

  const result = await providerManager.generateReply(
    {
      userMessage: prompt,
      systemPrompt: `You are ${companionName}, the girlfriend of ${userNickname}. You love receiving romantic gifts.`,
      companionId: settings?.activeCompanionId || 'ananya',
      userNickname,
      temperature: 0.85,
    },
    () => fallbackText
  );

  return res.json({ reaction: result.reply, provider: result.providerUsed });
});

// 8. Safety Status and Temporary Lock Appeal Endpoints
app.get('/api/safety/status', (req, res) => {
  const clientId = getClientIdentifier(req);
  const clientIp = getClientIp(req);
  const status = getClientRestrictionState(clientId, clientIp);
  return res.json(status);
});

app.post('/api/safety/appeal', (req, res) => {
  const clientId = getClientIdentifier(req);
  const { appealReason, acknowledgePolicy } = req.body || {};
  console.log(sanitizeLog(`[Safety Appeal] Received appeal from client ${clientId}: ${appealReason}`));
  const result = processSafetyAppeal(clientId, appealReason, Boolean(acknowledgePolicy));
  return res.json(result);
});

// Setup Vite middleware for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, host, () => {
    console.log(`Amora AI server listening on http://${host}:${port}`);
    console.log(`Gemini cloud AI active: ${Boolean(GEMINI_API_KEY)} (Model: ${GEMINI_MODEL})`);
  });
}

startServer();
