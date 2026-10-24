import assert from 'assert';
import { normalizeEmotion, EMOTION_CONFIGS } from '../src/components/AnimatedCompanionAvatar';

console.log('--- Running avatarAnimation.test.ts ---');

// Test 1: Normalize emotions
assert.strictEqual(normalizeEmotion('happy'), 'excitement');
assert.strictEqual(normalizeEmotion('joy'), 'excitement');
assert.strictEqual(normalizeEmotion('love'), 'affection');
assert.strictEqual(normalizeEmotion('sadness'), 'sadness');
assert.strictEqual(normalizeEmotion('playful'), 'playfulness');
assert.strictEqual(normalizeEmotion('blush'), 'shyness');
assert.strictEqual(normalizeEmotion(undefined), 'neutral');

// Test 2: Tension overrides
assert.strictEqual(normalizeEmotion('calm', 30), 'frustration');
assert.strictEqual(normalizeEmotion('neutral', 40), 'frustration');
// Explicit strong emotions resist mild tension
assert.strictEqual(normalizeEmotion('joy', 30), 'excitement');

// Test 3: EMOTION_CONFIGS contains all essential emotions
const requiredEmotions = ['excitement', 'sadness', 'anger', 'affection', 'playfulness', 'shyness', 'neutral'];
for (const emotion of requiredEmotions) {
  assert.ok(EMOTION_CONFIGS[emotion], `Missing emotion config for: ${emotion}`);
  assert.ok(EMOTION_CONFIGS[emotion].emoji, `Missing emoji for: ${emotion}`);
  assert.ok(EMOTION_CONFIGS[emotion].label, `Missing label for: ${emotion}`);
}

console.log('✅ avatarAnimation.test.ts passed all tests successfully!');
