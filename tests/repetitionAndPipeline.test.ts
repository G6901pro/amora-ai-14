import assert from 'node:assert';
import { generateContextualFallback } from '../src/conversation/replyGenerationService';
import { normalizeConversationHistory } from '../src/conversation/pipeline';
import { analyzeEmotionAndIntent } from '../src/conversation/emotionAnalyzer';
import { interpretSituation } from '../src/conversation/situationInterpreter';

console.log('--- Running repetitionAndPipeline.test.ts ---');

// Test 1: Verify different user inputs generate distinct responses, never identical
console.log('Test 1: Distinct responses across varied conversational topics...');
const queries = [
  'খাবার খেয়েছো তো বাবু?',
  'আজ তোমার দিনটা কেমন কাটল?',
  'তুমি এখন কি করছো জান?',
  'শুভ সকাল সোনা!',
  'তোমাকে অনেক অনেক ভালোবাসি!',
  'আজ অফিসে কাজের খুব চাপ ছিল',
];

const generatedReplies: string[] = [];
for (const q of queries) {
  const emotion = analyzeEmotionAndIntent(q);
  const situation = interpretSituation(q, emotion);
  const reply = generateContextualFallback(
    situation,
    emotion,
    'ananya',
    'জান',
    'bn',
    generatedReplies
  );

  assert.ok(reply && reply.length > 10, `Reply for query "${q}" must be non-empty and substantive`);
  // Ensure the new reply is NOT identical to the immediately previous reply
  if (generatedReplies.length > 0) {
    const prev = generatedReplies[generatedReplies.length - 1];
    assert.notStrictEqual(reply, prev, `Consecutive reply must not match previous reply. Query: "${q}"`);
  }
  generatedReplies.push(reply);
}

const uniqueCount = new Set(generatedReplies).size;
assert.ok(uniqueCount >= 5, `Expected high diversity across 6 different queries, got ${uniqueCount} unique replies`);
console.log(`✅ Test 1 passed: ${uniqueCount}/${queries.length} unique topic-specific replies generated.`);

// Test 2: Verify Anti-Repetition Filter prevents repeating the same greeting or message
console.log('Test 2: Anti-repetition filter rejects recent assistant replies...');
const testQuery = 'খাবার খেয়েছো?';
const emotion2 = analyzeEmotionAndIntent(testQuery);
const situation2 = interpretSituation(testQuery, emotion2);

const r1 = generateContextualFallback(situation2, emotion2, 'ananya', 'বাবু', 'bn', []);
const r2 = generateContextualFallback(situation2, emotion2, 'ananya', 'বাবু', 'bn', [r1]);
assert.notStrictEqual(r1, r2, 'Second reply must avoid recently used first reply');
console.log('✅ Test 2 passed: Second reply cleanly avoided reusing the first reply.');

// Test 3: Conversation history normalization prevents consecutive duplicate roles
console.log('Test 3: normalizeConversationHistory ensures strict alternating user/model roles...');
const rawHistory = [
  { isUser: false, text: 'Hello!' }, // starts with model -> should be stripped
  { isUser: true, text: 'Hi Ananya' },
  { isUser: true, text: 'Are you free?' }, // consecutive user -> merged
  { isUser: false, text: 'Yes, always free for you!' },
];

const normalized = normalizeConversationHistory(rawHistory, 'What are you doing?');
assert.strictEqual(normalized[0].role, 'user', 'First turn must be user');
assert.strictEqual(normalized[normalized.length - 1].role, 'user', 'Last turn must be the incoming user message');

for (let i = 1; i < normalized.length; i++) {
  assert.notStrictEqual(
    normalized[i].role,
    normalized[i - 1].role,
    `Turns ${i - 1} and ${i} must alternate roles (got ${normalized[i].role} after ${normalized[i - 1].role})`
  );
}
console.log('✅ Test 3 passed: Alternating role sequence strictly enforced.');

console.log('🎉 ALL repetitionAndPipeline.test.ts tests passed successfully!');
