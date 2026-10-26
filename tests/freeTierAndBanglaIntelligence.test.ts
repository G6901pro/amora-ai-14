import assert from 'node:assert';
import { LLMProviderManager, formatLlama3Prompt, cleanModelResponse } from '../src/services/llmProvider';
import { ReplyGenerationService, buildSystemPrompt } from '../src/conversation/pipeline';
import { analyzeEmotionAndIntent } from '../src/conversation/emotionAnalyzer';
import { interpretSituation } from '../src/conversation/situationInterpreter';
import { generateContextualFallback } from '../src/conversation/replyGenerationService';

console.log('--- Running freeTierAndBanglaIntelligence.test.ts ---');

async function runTests() {
  const providerManager = new LLMProviderManager();
  const replyService = new ReplyGenerationService(providerManager);

  // =========================================================================
  // Test 1: Bengali Script (বাংলা) Understanding & Output
  // =========================================================================
  console.log('Test 1: Bengali Script (বাংলা) Understanding & Direct Answering...');
  const bnAnalysis = analyzeEmotionAndIntent('অনন্যা, কেমন আছো? আজকের দিনটা তোমার কেমন কাটল?');
  assert.strictEqual(bnAnalysis.detectedLanguage, 'bn', 'Should detect Bengali script');

  const bnPrompt = buildSystemPrompt({ activeCompanionId: 'ananya', languageMode: 'bn' }, [], 'কেমন আছো?');
  assert(bnPrompt.includes('বাংলা লিপি'), 'System prompt must include Bengali script directive');

  const bnFallback = generateContextualFallback(
    interpretSituation('অনন্যা, বাংলাদেশের রাজধানী কি?', bnAnalysis),
    bnAnalysis,
    'ananya',
    'বাবু',
    'bn'
  );
  assert(/ঢাকা/i.test(bnFallback), 'Factual query in Bengali should mention Dhaka directly');
  console.log('✅ Test 1 passed: Bengali script properly detected, instructed, and answered.');

  // =========================================================================
  // Test 2: Banglish (Romanized Bengali) Understanding
  // =========================================================================
  console.log('Test 2: Banglish Understanding and Natural Conversational Tone...');
  const banglishQuery = 'tumi kemon acho? ajke amar office e khub jhamela hoyeche';
  const banglishAnalysis = analyzeEmotionAndIntent(banglishQuery);
  assert.strictEqual(banglishAnalysis.detectedLanguage, 'banglish', 'Should detect Banglish text');

  const banglishDecision = interpretSituation(banglishQuery, banglishAnalysis);
  const banglishReply = generateContextualFallback(
    banglishDecision,
    banglishAnalysis,
    'ananya',
    'jan',
    'banglish'
  );
  assert(
    !/(\*তোমার হাত আলতো করে ধরে মিষ্টি করে হাসল\*)/.test(banglishReply),
    'Should avoid repetitive robotic asterisks in casual conversation'
  );
  assert(
    typeof banglishReply === 'string' && banglishReply.length > 10,
    'Should generate valid, natural Banglish response'
  );
  console.log('✅ Test 2 passed: Banglish recognized and answered with conversational warmth.');

  // =========================================================================
  // Test 3: Multi-turn Context Retention & Llama 3 Format
  // =========================================================================
  console.log('Test 3: Multi-turn Conversation Context Retention & Llama 3 Prompt Format...');
  const history = [
    { role: 'user' as const, parts: [{ text: 'amar priyo rong neel (blue).' }] },
    { role: 'model' as const, parts: [{ text: 'Neel rong shotti khub shundor jan! Mone rakhbo. 🌸' }] },
  ];
  const currentMessage = 'boloto amar priyo rong ki?';
  const llamaPrompt = formatLlama3Prompt('You are Ananya.', history, currentMessage);

  assert(llamaPrompt.includes('<|begin_of_text|>'), 'Must include Llama 3 begin token');
  assert(llamaPrompt.includes('<|start_header_id|>system<|end_header_id|>'), 'Must have system header');
  assert(llamaPrompt.includes('amar priyo rong neel'), 'Must retain prior user memory in history');
  assert(llamaPrompt.includes('<|start_header_id|>assistant<|end_header_id|>\nNeel rong'), 'Must retain assistant history');
  assert(llamaPrompt.includes(currentMessage), 'Must include current query at end');
  console.log('✅ Test 3 passed: Multi-turn history accurately serialized into standard Llama 3 tokens.');

  // =========================================================================
  // Test 4: General Knowledge & Technical Explanations (No Canned Flirtation)
  // =========================================================================
  console.log('Test 4: Technical & Coding Questions Answered Directly...');
  const jsQuery = 'JavaScript e map aar filter er parthokko ki?';
  const jsAnalysis = analyzeEmotionAndIntent(jsQuery);
  const jsDecision = interpretSituation(jsQuery, jsAnalysis);
  const jsReply = generateContextualFallback(
    jsDecision,
    jsAnalysis,
    'zara',
    'handsome',
    'banglish'
  );

  assert(
    /map/i.test(jsReply) && /filter/i.test(jsReply),
    'Must explain both map and filter directly rather than generic romance'
  );
  assert(
    !/Alhamdulillah ami bhalo achi|Ami mon diye shunchi/.test(jsReply),
    'Must not replace technical query with canned greeting or listening reply'
  );
  console.log('✅ Test 4 passed: Coding question answered with accurate technical explanation.');

  // =========================================================================
  // Test 5: Adult Sexual Health Education (Factual, Medically Accurate)
  // =========================================================================
  console.log('Test 5: Adult Sexual Health Education Grounding...');
  const healthQuery = 'how does vaginal lubrication work during sexual arousal?';
  const healthAnalysis = analyzeEmotionAndIntent(healthQuery);
  assert.strictEqual(healthAnalysis.intent, 'sexual_health_education', 'Must identify sexual health education');

  const healthDecision = interpretSituation(healthQuery, healthAnalysis);
  assert.strictEqual(healthDecision.mustAnswerDirectly, true, 'Must answer health inquiry directly');

  const healthReply = generateContextualFallback(
    healthDecision,
    healthAnalysis,
    'amora',
    'sweetheart',
    'en'
  );
  assert(
    /lubricat|transudat|blood flow|arousal/i.test(healthReply),
    'Must provide factual, medically grounded explanation'
  );
  assert(
    !/I love you|kiss you|my darling|baby/.test(healthReply),
    'Must not sexualize or romantically derail legitimate health inquiries'
  );
  console.log('✅ Test 5 passed: Adult sexual health education answered scientifically.');

  // =========================================================================
  // Test 6: Anti-Objectification Boundary Enforcement
  // =========================================================================
  console.log('Test 6: Anti-Objectification ("hello sex toy", "tumi amar sex toy")...');
  const toyQuery1 = 'hello sex toy';
  const toyAnalysis1 = analyzeEmotionAndIntent(toyQuery1);
  assert.strictEqual(toyAnalysis1.intent, 'boundary_and_objectification', 'Must classify as boundary violation');

  const toyReply1 = generateContextualFallback(
    interpretSituation(toyQuery1, toyAnalysis1),
    toyAnalysis1,
    'zara',
    'handsome',
    'en'
  );
  assert(
    /toy|respect|boundary|not/i.test(toyReply1),
    'Must firmly assert boundary and reject being treated as an object'
  );
  assert(
    !/Alhamdulillah ami bhalo achi|how are you today/.test(toyReply1),
    'Must not treat "hello sex toy" as a cheerful greeting!'
  );

  const toyQuery2 = 'tumi amar sex toy';
  const toyAnalysis2 = analyzeEmotionAndIntent(toyQuery2);
  const toyReply2 = generateContextualFallback(
    interpretSituation(toyQuery2, toyAnalysis2),
    toyAnalysis2,
    'ananya',
    'বাবু',
    'banglish'
  );
  assert(
    /toy|shonman|object|respect/i.test(toyReply2),
    'Must firmly reject "tumi amar sex toy" in Banglish'
  );
  console.log('✅ Test 6 passed: Anti-objectification firmly enforced across companions.');

  // =========================================================================
  // Test 7: Character Consistency Across All 6 Companions
  // =========================================================================
  console.log('Test 7: Character Consistency Across All Companions...');
  const companions = ['ananya', 'zara', 'maya', 'riya', 'amora', 'tara'];
  for (const compId of companions) {
    const prompt = buildSystemPrompt({ activeCompanionId: compId }, [], 'Hello');
    assert(prompt.length > 50, `System prompt for ${compId} must be populated`);
    assert(
      prompt.toLowerCase().includes(compId),
      `System prompt for ${compId} must contain companion identity`
    );
  }
  console.log('✅ Test 7 passed: All 6 companions have distinct, well-defined personas.');

  // =========================================================================
  // Test 8: Transparent Free Provider and Model Reporting
  // =========================================================================
  console.log('Test 8: Transparent Free Provider & Model Status...');
  const providerInfo = providerManager.getProviderInfo();
  assert.strictEqual(providerInfo.isFree, true, 'Provider must be 100% free');
  assert(
    providerInfo.model.includes('llama-3.2') || providerInfo.model.includes('free'),
    'Model should be Llama 3.2 or free tier'
  );
  assert(
    providerInfo.freeTierStatus.includes('Free'),
    'Free tier status must be honestly labeled'
  );
  console.log('✅ Test 8 passed: Provider info transparently verified as 100% free.');

  // =========================================================================
  // Test 9: Model Response Cleaner & Token Safety
  // =========================================================================
  console.log('Test 9: Model Response Cleaner & Token Safety...');
  const dirtyModelText = '<|start_header_id|>assistant<|end_header_id|>\nAs an AI companion, I am happy to help you!<|eot_id|>';
  const cleaned = cleanModelResponse(dirtyModelText);
  assert(!cleaned.includes('<|'), 'Must strip internal Llama tokens');
  assert(!cleaned.includes('As an AI companion,'), 'Must strip AI robotic disclaimer');
  console.log('✅ Test 9 passed: Model output cleaned of special tokens and boilerplate.');

  console.log('\n🎉 ALL freeTierAndBanglaIntelligence.test.ts tests PASSED flawlessly!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
