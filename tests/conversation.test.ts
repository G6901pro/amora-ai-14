import assert from 'assert';
import { analyzeEmotionAndIntent } from '../src/conversation/emotionAnalyzer';
import { interpretSituation } from '../src/conversation/situationInterpreter';
import { selectRelevantMemories, extractMemoryFromText } from '../src/conversation/memoryRetriever';
import { buildSystemPrompt, evaluateAndFinalizeReply } from '../src/conversation/pipeline';
import { generateContextualFallback } from '../src/conversation/replyGenerationService';
import { CharacterMemory } from '../src/types';

console.log('--- Running conversation.test.ts ---');

// Test 1: Bengali & Banglish Emotion and Intent Detection
const bengaliAffection = analyzeEmotionAndIntent('আমি তোমাকে অনেক ভালোবাসি জান');
assert.strictEqual(bengaliAffection.primaryEmotion, 'affection');
assert.strictEqual(bengaliAffection.detectedLanguage, 'bn');

const banglishStress = analyzeEmotionAndIntent('ajke office e onek tension ar jhamela');
assert.strictEqual(banglishStress.primaryEmotion, 'stress');
assert.strictEqual(banglishStress.detectedLanguage, 'banglish');

const banglishPlayful = analyzeEmotionAndIntent('haha tumi ekta pagli dustu');
assert.strictEqual(banglishPlayful.primaryEmotion, 'playfulness');

const englishSad = analyzeEmotionAndIntent('I am feeling so sad and lonely tonight');
assert.strictEqual(englishSad.primaryEmotion, 'sadness');
assert.strictEqual(englishSad.detectedLanguage, 'en');

// Test 2: Situation Interpreter & Direct Answer First Rule
const questionSituation = interpretSituation(
  'খাবার খেয়েছো তো বাবু?',
  analyzeEmotionAndIntent('খাবার খেয়েছো তো বাবু?')
);
assert.strictEqual(questionSituation.mustAnswerDirectly, true, 'Questions must require direct answers');
assert.strictEqual(questionSituation.situationType, 'question_answering');

const nonQuestionSituation = interpretSituation(
  'Good morning my love',
  analyzeEmotionAndIntent('Good morning my love')
);
assert.strictEqual(nonQuestionSituation.mustAnswerDirectly, false);

// Test 3: Selective Relevance-based Memory Retrieval
const testMemories: CharacterMemory[] = [
  { id: '1', companionId: 'ananya', memoryCategory: 'Food & Taste', memoryContent: 'Loves spicy kachchi biryani', timestamp: 100 },
  { id: '2', companionId: 'ananya', memoryCategory: 'Work & Studies', memoryContent: 'Works as a software engineer at a startup', timestamp: 200 },
  { id: '3', companionId: 'ananya', memoryCategory: 'Personal Preferences', memoryContent: 'Favorite color is midnight navy blue', timestamp: 300 },
];

// Query about food should retrieve food memory
const foodRelevant = selectRelevantMemories('Where should we eat lunch today? Biryani?', testMemories, 'ananya', 2);
assert.ok(foodRelevant.length > 0);
assert.strictEqual(foodRelevant[0].memoryCategory, 'Food & Taste');

// Query about work should retrieve work memory
const workRelevant = selectRelevantMemories('My boss gave me a huge office project', testMemories, 'ananya', 2);
assert.ok(workRelevant.length > 0);
assert.strictEqual(workRelevant[0].memoryCategory, 'Work & Studies');

// Test 4: Memory Extraction from User Messages
const extractedFood = extractMemoryFromText('আমার পছন্দের খাবার হলো কাচ্চি বিরিয়ানি');
assert.ok(extractedFood);
assert.strictEqual(extractedFood?.memoryCategory, 'Food & Taste');

const extractedWork = extractMemoryFromText('I work as a designer in an agency');
assert.ok(extractedWork);
assert.strictEqual(extractedWork?.memoryCategory, 'Work & Studies');

// Test 5: Distinct Character System Prompts
const ananyaPrompt = buildSystemPrompt({ activeCompanionId: 'ananya', languageMode: 'bn', userNickname: 'বাবু' }, testMemories, 'Hello');
const zaraPrompt = buildSystemPrompt({ activeCompanionId: 'zara', languageMode: 'en', userNickname: 'handsome' }, testMemories, 'Hello');

assert.ok(ananyaPrompt.includes('Poet'), 'Ananya prompt should include literature/poet identity');
assert.ok(ananyaPrompt.includes('অনন্যা'), 'Ananya prompt should include banglaName');
assert.ok(zaraPrompt.includes('Gaming'), 'Zara prompt should include gamer identity');
assert.notStrictEqual(ananyaPrompt, zaraPrompt, 'Companions must not receive identical prompts');
assert.ok(ananyaPrompt.includes('ANSWER FIRST'), 'Prompt must enforce direct answer first directive');

// Test 6: AI Disclaimer Sanitization
const rawAIResponse = 'I am an AI, but *smiles warmly* I love you jaan!';
const cleaned = evaluateAndFinalizeReply(rawAIResponse);
assert.ok(!cleaned.includes('I am an AI'), 'AI disclaimers must be stripped');
assert.ok(cleaned.includes('I love you jaan'), 'Core response must remain intact');

// Test 7: Contextual Fallback Generation
const foodFallback = generateContextualFallback(
  { userCoreMessage: 'খাবার খেয়েছো বাবু?', userGoal: 'inquiry', situationType: 'inquiry', responseStyle: 'direct', mustAnswerDirectly: true, prohibitedRepetitions: [], shouldAskFollowupQuestion: false, recommendedLength: 'medium' },
  analyzeEmotionAndIntent('খাবার খেয়েছো বাবু?'),
  'ananya',
  'বাবু',
  'bn'
);
assert.ok(foodFallback.includes('খেয়ে'), 'Food fallback must answer food questions');

console.log('✅ conversation.test.ts passed all tests successfully!');
