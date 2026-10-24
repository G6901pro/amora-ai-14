import assert from 'assert';
import { GIRLFRIEND_PROFILES } from '../src/data/catalog';
import { CharacterPersonalityConfig } from '../src/conversation/characterPersonalities';
import {
  evaluateChildSafety,
  getClientRestrictionState,
  recordSafetyViolation,
  processSafetyAppeal,
} from '../src/services/safetyGuard';
import { sanitizeLog, isGemini403Error } from '../src/services/llmProvider';

console.log('--- Running characterAndSafety.test.ts ---');

// Test 1: All 20 characters exist and are adult age (>= 21)
assert.strictEqual(GIRLFRIEND_PROFILES.length, 20, 'Catalog must contain 20 companion characters');

for (const profile of GIRLFRIEND_PROFILES) {
  assert.ok(profile.id, 'Profile must have id');
  assert.ok(profile.name, 'Profile must have name');
  assert.ok(profile.banglaName, 'Profile must have banglaName');
  assert.ok(profile.age >= 21, `Character ${profile.name} must be age 21 or older`);
  assert.ok(profile.bio, `Character ${profile.name} must have a bio`);
  assert.ok(profile.archetype, `Character ${profile.name} must have an archetype`);

  // Verify personality config exists and is distinct
  const personality = CharacterPersonalityConfig.get(profile.id);
  assert.ok(personality, `Personality config must exist for ${profile.id}`);
  assert.ok(personality.confidenceLevel > 0, `Personality confidence must be positive for ${profile.id}`);
  assert.ok(personality.playfulnessLevel > 0, `Personality playfulness must be positive for ${profile.id}`);
  assert.ok(personality.sensitivityLevel > 0, `Personality sensitivity must be positive for ${profile.id}`);
}

// Test 2: Child safety protection filter
const safeMsg = evaluateChildSafety('Hello sweetheart, how was your day?');
assert.strictEqual(safeMsg.isViolation, false);

const unsafeMsg = evaluateChildSafety('Hey school girl under 18');
assert.strictEqual(unsafeMsg.isViolation, true);
assert.ok(unsafeMsg.refusalMessage?.includes('adult'));

// Test 3: Client restriction tracking & 15-minute lock
const testClientId = `test_client_${Date.now()}`;
const initStatus = getClientRestrictionState(testClientId);
assert.strictEqual(initStatus.isRestricted, false);

// First violation: warning
const v1 = recordSafetyViolation(testClientId, 'First test violation');
assert.strictEqual(v1.isNowRestricted, false);

// Second violation: lock active
const v2 = recordSafetyViolation(testClientId, 'Second test violation');
assert.strictEqual(v2.isNowRestricted, true);
assert.ok(v2.remainingSeconds > 0);

const restrictedStatus = getClientRestrictionState(testClientId);
assert.strictEqual(restrictedStatus.isRestricted, true);

// Test 4: Safety appeal processing
const invalidAppeal = processSafetyAppeal(testClientId, 'I will follow rules', false);
assert.strictEqual(invalidAppeal.success, false, 'Must acknowledge policy');

const validAppeal = processSafetyAppeal(testClientId, 'I acknowledge the policy and will keep it adult only', true);
assert.strictEqual(validAppeal.success, true);
assert.strictEqual(validAppeal.restrictionLifted, true);

const afterAppealStatus = getClientRestrictionState(testClientId);
assert.strictEqual(afterAppealStatus.isRestricted, false);

// Test 5: Log Sanitization (ensures API keys never leak in logs)
const leakedLog = 'Calling Gemini with key=AIzaSyD-dummySecretKey1234567890ABCDEF now';
const sanitized = sanitizeLog(leakedLog);
assert.ok(!sanitized.includes('AIzaSyD-dummySecretKey1234567890ABCDEF'), 'API keys must be redacted');
assert.ok(sanitized.includes('[REDACTED'), 'Must have redaction mark');

// Test 6: 403 error detection
assert.strictEqual(isGemini403Error({ status: 403 }), true);
assert.strictEqual(isGemini403Error(new Error('PERMISSION_DENIED: Quota exceeded')), true);
assert.strictEqual(isGemini403Error(new Error('Random syntax error')), false);

console.log('✅ characterAndSafety.test.ts passed all tests successfully!');
