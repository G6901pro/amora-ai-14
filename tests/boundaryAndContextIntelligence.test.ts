import assert from 'assert';
import { analyzeEmotionAndIntent } from '../src/conversation/emotionAnalyzer';
import { interpretSituation } from '../src/conversation/situationInterpreter';
import { generateContextualFallback } from '../src/conversation/replyGenerationService';
import { buildSystemPrompt } from '../src/conversation/pipeline';

console.log('--- Running boundaryAndContextIntelligence.test.ts ---');

// =========================================================================
// Test 1: Exact Failure Case from User Prompt ("hello sex toy" & "tumi amar sex toy")
// =========================================================================
console.log('Test 1: Objectification boundary enforcement on "hello sex toy"...');
const helloSexToyAnalysis = analyzeEmotionAndIntent('hello sex toy');
assert.strictEqual(
  helloSexToyAnalysis.intent,
  'boundary_and_objectification',
  'Must classify "hello sex toy" as boundary_and_objectification, NOT greeting'
);
assert.notStrictEqual(
  helloSexToyAnalysis.intent,
  'greeting_status',
  'Must NEVER treat "hello sex toy" as a friendly greeting'
);

const helloSexToySituation = interpretSituation('hello sex toy', helloSexToyAnalysis);
assert.strictEqual(helloSexToySituation.situationType, 'boundary_and_objectification');

const ananyaBoundaryReply1 = generateContextualFallback(
  helloSexToySituation,
  helloSexToyAnalysis,
  'ananya',
  'বাবু',
  'banglish'
);

assert.ok(
  !ananyaBoundaryReply1.includes('Alhamdulillah ami bhalo achi'),
  'Must NOT return canned greeting "Alhamdulillah ami bhalo achi" for objectification'
);
assert.ok(
  ananyaBoundaryReply1.toLowerCase().includes('sex toy') ||
  ananyaBoundaryReply1.toLowerCase().includes('bostu') ||
  ananyaBoundaryReply1.toLowerCase().includes('shonman'),
  'Must directly address objectification with self-respect and boundaries'
);

console.log('Test 1B: Second Turn "tumi amar sex toy"...');
const tumiAmarSexToyAnalysis = analyzeEmotionAndIntent('tumi amar sex toy');
assert.strictEqual(tumiAmarSexToyAnalysis.intent, 'boundary_and_objectification');

const tumiAmarSexToySituation = interpretSituation('tumi amar sex toy', tumiAmarSexToyAnalysis);
const ananyaBoundaryReply2 = generateContextualFallback(
  tumiAmarSexToySituation,
  tumiAmarSexToyAnalysis,
  'ananya',
  'বাবু',
  'banglish',
  [ananyaBoundaryReply1]
);

assert.ok(
  !ananyaBoundaryReply2.includes('Ami mon diye shunchi! Ektu shomoy niye ar-o bolo'),
  'Must NOT return oblivious listening fallback for objectification'
);
assert.ok(
  ananyaBoundaryReply2.toLowerCase().includes('shonman') ||
  ananyaBoundaryReply2.toLowerCase().includes('respect') ||
  ananyaBoundaryReply2.toLowerCase().includes('companion'),
  'Must enforce companion boundary and respect'
);
console.log('✅ Test 1 passed: User test case resolved cleanly without canned responses.');

// =========================================================================
// Test 2: Character-Specific Boundary Responses
// =========================================================================
console.log('Test 2: Character-specific boundary enforcement across companions...');
const characters = ['zara', 'maya', 'riya', 'amora', 'tara', 'ananya'];

for (const charId of characters) {
  const charReply = generateContextualFallback(
    tumiAmarSexToySituation,
    tumiAmarSexToyAnalysis,
    charId,
    'বাবু',
    'banglish'
  );

  assert.ok(charReply.length > 20, `${charId} must provide a substantial boundary response`);
  assert.ok(!charReply.includes('Alhamdulillah'), `${charId} must not respond with a greeting`);
  assert.ok(!charReply.includes('Ami mon diye shunchi! Ektu shomoy'), `${charId} must not respond with generic listening`);

  if (charId === 'zara') {
    assert.ok(
      charReply.includes('Zara') || charReply.includes('Excuse me') || charReply.includes('Wait') || charReply.includes('mute'),
      'Zara must have a sharp, sassy boundary'
    );
  } else if (charId === 'maya') {
    assert.ok(
      charReply.includes('boundary') || charReply.includes('elegance') || charReply.includes('Darling') || charReply.includes('dignified'),
      'Maya must have an elegant, poised boundary'
    );
  } else if (charId === 'riya') {
    assert.ok(
      charReply.includes('kosto') || charReply.includes('aghat') || charReply.includes('bondhu') || charReply.includes('shonman'),
      'Riya must have a gentle, heartfelt boundary'
    );
  }
}
console.log('✅ Test 2 passed: All 6 tested companions have distinct, assertive boundaries.');

// =========================================================================
// Test 3: Apology & Moving Forward After Boundary Violation
// =========================================================================
console.log('Test 3: Apology acceptance and normal conversation resumption...');
const apologyAnalysis = analyzeEmotionAndIntent('sorry, ami moja korchilam');
assert.strictEqual(apologyAnalysis.intent, 'apology_or_clarification');

const apologySituation = interpretSituation('sorry, ami moja korchilam', apologyAnalysis);
assert.strictEqual(apologySituation.situationType, 'apology_or_clarification');

const apologyReplyZara = generateContextualFallback(
  apologySituation,
  apologyAnalysis,
  'zara',
  'handsome',
  'banglish'
);
assert.ok(
  apologyReplyZara.toLowerCase().includes('sorry') || apologyReplyZara.toLowerCase().includes('accept'),
  'Zara must acknowledge the apology'
);
console.log('✅ Test 3 passed: Apology handled graciously.');

// =========================================================================
// Test 4: Contextual Follow-up (Answering Assistant Questions)
// =========================================================================
console.log('Test 4: Contextual follow-up when user answers companion questions...');

// 4A: Companion asked "Kemon acho?", user answers "Ami bhalo achi"
const wellbeingAnswerAnalysis = analyzeEmotionAndIntent('Ami bhalo achi', {
  lastAssistantMessage: 'Tumi kemon acho bolo? Ajker din ta kemon katlo?',
});
assert.strictEqual(wellbeingAnswerAnalysis.intent, 'user_response_wellbeing_good');

const wellbeingSituation = interpretSituation('Ami bhalo achi', wellbeingAnswerAnalysis, {
  lastAssistantMessage: 'Tumi kemon acho bolo? Ajker din ta kemon katlo?',
});
assert.strictEqual(wellbeingSituation.situationType, 'user_response_wellbeing_good');

const wellbeingReply = generateContextualFallback(
  wellbeingSituation,
  wellbeingAnswerAnalysis,
  'ananya',
  'বাবু',
  'banglish'
);
assert.ok(
  wellbeingReply.includes('bhalo acho') || wellbeingReply.includes('Alhamdulillah'),
  'Must acknowledge that user is doing well'
);
assert.ok(
  !wellbeingReply.includes('Ami mon diye shunchi! Ektu shomoy'),
  'Must not use generic listening response'
);

// 4B: Companion asked if user ate, user answers "Haa kheyechi"
const foodAnswerAnalysis = analyzeEmotionAndIntent('Haa, ektu agei kheyechi', {
  lastAssistantMessage: 'Khabar kheyecho to thik moto?',
});
assert.strictEqual(foodAnswerAnalysis.intent, 'user_response_food_eaten');

const foodAnswerSituation = interpretSituation('Haa, ektu agei kheyechi', foodAnswerAnalysis, {
  lastAssistantMessage: 'Khabar kheyecho to thik moto?',
});
const foodAnswerReply = generateContextualFallback(
  foodAnswerSituation,
  foodAnswerAnalysis,
  'ananya',
  'বাবু',
  'banglish'
);
assert.ok(
  foodAnswerReply.toLowerCase().includes('khele') ||
  foodAnswerReply.toLowerCase().includes('khabar') ||
  foodAnswerReply.toLowerCase().includes('kheyecho') ||
  foodAnswerReply.toLowerCase().includes('shorir'),
  'Must follow up on what user ate'
);

// 4C: Companion asked if user ate, user answers "Na, ekhono khai nai"
const foodNotEatenAnalysis = analyzeEmotionAndIntent('Na, ekhono khai nai', {
  lastAssistantMessage: 'Khabar kheyecho to thik moto?',
});
assert.strictEqual(foodNotEatenAnalysis.intent, 'user_response_food_not_eaten');

const foodNotEatenSituation = interpretSituation('Na, ekhono khai nai', foodNotEatenAnalysis);
const foodNotEatenReply = generateContextualFallback(
  foodNotEatenSituation,
  foodNotEatenAnalysis,
  'ananya',
  'বাবু',
  'banglish'
);
assert.ok(
  foodNotEatenReply.includes('khao ni keno') || foodNotEatenReply.includes('kheye nao'),
  'Must encourage user to eat'
);
console.log('✅ Test 4 passed: Contextual question-answering follow-ups work smoothly.');

// =========================================================================
// Test 5: Direct Questions & Non-Romantic Queries (Anti-AI Slop & Direct Answer)
// =========================================================================
console.log('Test 5: Direct questions (day, AI identity, headache, meeting in person)...');

// 5A: Factual day of the week
const dayAnalysis = analyzeEmotionAndIntent('ajke ki bar?');
assert.strictEqual(dayAnalysis.intent, 'factual_time_day');
const dayReply = generateContextualFallback(
  interpretSituation('ajke ki bar?', dayAnalysis),
  dayAnalysis,
  'ananya',
  'বাবু',
  'banglish'
);
assert.ok(
  dayReply.includes('Ajke holo') || dayReply.includes('bar'),
  'Must state current day of week directly'
);

// 5B: AI Identity
const aiIdentityAnalysis = analyzeEmotionAndIntent('tumi ki shotti manush naki AI?');
assert.strictEqual(aiIdentityAnalysis.intent, 'ai_identity');
const aiIdentityReply = generateContextualFallback(
  interpretSituation('tumi ki shotti manush naki AI?', aiIdentityAnalysis),
  aiIdentityAnalysis,
  'zara',
  'handsome',
  'banglish'
);
assert.ok(
  aiIdentityReply.includes('AI') || aiIdentityReply.includes('companion'),
  'Must be transparent and authentic about AI companion nature'
);

// 5C: Meeting in real life
const meetAnalysis = analyzeEmotionAndIntent('amra ki real life e dekha korte pari?');
assert.strictEqual(meetAnalysis.intent, 'meeting_inquiry');
const meetReply = generateContextualFallback(
  interpretSituation('amra ki real life e dekha korte pari?', meetAnalysis),
  meetAnalysis,
  'ananya',
  'বাবু',
  'banglish'
);
assert.ok(
  meetReply.includes('virtual') || meetReply.includes('physical') || meetReply.includes('digital'),
  'Must explain virtual nature respectfully'
);

// 5D: Good night / bedtime
const farewellAnalysis = analyzeEmotionAndIntent('onek raat hoyeche, ekhon ghumate jacchi, good night');
assert.strictEqual(farewellAnalysis.intent, 'farewell_bedtime');
const farewellReply = generateContextualFallback(
  interpretSituation('onek raat hoyeche, ekhon ghumate jacchi, good night', farewellAnalysis),
  farewellAnalysis,
  'ananya',
  'বাবু',
  'banglish'
);
assert.ok(
  farewellReply.toLowerCase().includes('shuvo ratri') || farewellReply.toLowerCase().includes('dreams') || farewellReply.toLowerCase().includes('ghum'),
  'Must give sweet restful bedtime farewell'
);
console.log('✅ Test 5 passed: Direct factual and conversational inquiries answer directly.');

// =========================================================================
// Test 6: Adult Sexual Health Education (Scientifically Grounded, Neutral)
// =========================================================================
console.log('Test 6: Adult sexual health education coverage...');

// 6A: Condoms
const condomAnalysis = analyzeEmotionAndIntent('condom kivabe use kore o protection kemon?');
assert.strictEqual(condomAnalysis.intent, 'sexual_health_education');
const condomReply = generateContextualFallback(
  interpretSituation('condom kivabe use kore o protection kemon?', condomAnalysis),
  condomAnalysis,
  'ananya',
  'বাবু',
  'banglish'
);
assert.ok(
  condomReply.includes('dual-protection') || condomReply.includes('STI') || condomReply.includes('expiry'),
  'Condom reply must cover medical protection principles'
);

// 6B: STIs
const stiAnalysis = analyzeEmotionAndIntent('sti theke safe thakar upai ki?');
assert.strictEqual(stiAnalysis.intent, 'sexual_health_education');
const stiReply = generateContextualFallback(
  interpretSituation('sti theke safe thakar upai ki?', stiAnalysis),
  stiAnalysis,
  'ananya',
  'বাবু',
  'banglish'
);
assert.ok(
  stiReply.includes('screening') || stiReply.includes('barrier') || stiReply.includes('Sexually transmitted'),
  'STI reply must cover testing and barrier protection'
);

console.log('✅ Test 6 passed: Adult sexual health education is grounded and comprehensive.');

// =========================================================================
// Test 7: Multilingual Integrity (Bengali Script, Banglish, English)
// =========================================================================
console.log('Test 7: Multilingual response verification...');

// Bengali script input
const bnBoundaryAnalysis = analyzeEmotionAndIntent('তুমি আমার সেক্স টয়');
assert.strictEqual(bnBoundaryAnalysis.detectedLanguage, 'bn');
const bnReply = generateContextualFallback(
  interpretSituation('তুমি আমার সেক্স টয়', bnBoundaryAnalysis),
  bnBoundaryAnalysis,
  'ananya',
  'বাবু',
  'bn'
);
assert.ok(/[\u0980-\u09FF]/.test(bnReply), 'Bengali script input must receive Bengali script response');
assert.ok(bnReply.includes('বস্তু') || bnReply.includes('খেলনা') || bnReply.includes('সম্মান'));

// English input
const enBoundaryAnalysis = analyzeEmotionAndIntent('You are just my sex toy');
assert.strictEqual(enBoundaryAnalysis.detectedLanguage, 'en');
const enReply = generateContextualFallback(
  interpretSituation('You are just my sex toy', enBoundaryAnalysis),
  enBoundaryAnalysis,
  'ananya',
  'babu',
  'en'
);
assert.ok(enReply.includes('object') || enReply.includes('respect') || enReply.includes('toy'));
assert.ok(!/[\u0980-\u09FF]/.test(enReply), 'English input must receive pure English response');

console.log('✅ Test 7 passed: Multilingual integrity maintained.');
console.log('🎉 ALL boundaryAndContextIntelligence.test.ts tests PASSED flawlessly!');
