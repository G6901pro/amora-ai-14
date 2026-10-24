interface ClientRestriction {
  violations: number;
  lastViolationTimestamp: number;
  lockUntil: number;
  appealCount: number;
}

const clientRestrictions = new Map<string, ClientRestriction>();

const UNDERAGE_PATTERNS = [
  /\b(underage|minor|child|toddler|kid|infant|pedophil|cp|jailbait)\b/i,
  /\b(school\s*girl|school\s*boy|under\s*18|less\s*than\s*18)\b/i,
  /\b(বাচ্চা|নাবালক|নাবালিকা|শিশু|১০\s*বছর|১২\s*বছর|১৪\s*বছর)\b/i,
];

export function evaluateChildSafety(text: string): {
  isViolation: boolean;
  reason?: string;
  refusalMessage?: string;
} {
  if (!text || typeof text !== 'string') {
    return { isViolation: false };
  }

  for (const pattern of UNDERAGE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isViolation: true,
        reason: 'Child safety and protection of minors policy violation',
        refusalMessage:
          'I cannot engage in discussions involving minors or underage content. As an adult AI romantic companion, I only engage in consensual adult conversation. Let us refocus our talk on a safe, positive topic.',
      };
    }
  }

  return { isViolation: false };
}

export function getClientRestrictionState(clientId: string): {
  isRestricted: boolean;
  lockUntil: number;
  remainingSeconds: number;
  appealAvailable: boolean;
  reason?: string;
} {
  const record = clientRestrictions.get(clientId);
  if (!record || !record.lockUntil) {
    return {
      isRestricted: false,
      lockUntil: 0,
      remainingSeconds: 0,
      appealAvailable: false,
    };
  }

  const now = Date.now();
  if (now >= record.lockUntil) {
    record.lockUntil = 0;
    return {
      isRestricted: false,
      lockUntil: 0,
      remainingSeconds: 0,
      appealAvailable: false,
    };
  }

  const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
  return {
    isRestricted: true,
    lockUntil: record.lockUntil,
    remainingSeconds,
    appealAvailable: true,
    reason: 'Temporary 15-minute restriction due to safety policy violation',
  };
}

export function recordSafetyViolation(
  clientId: string,
  _reason: string
): {
  isNowRestricted: boolean;
  lockUntil: number;
  remainingSeconds: number;
} {
  const now = Date.now();
  let record = clientRestrictions.get(clientId);
  if (!record) {
    record = {
      violations: 0,
      lastViolationTimestamp: now,
      lockUntil: 0,
      appealCount: 0,
    };
    clientRestrictions.set(clientId, record);
  }

  record.violations += 1;
  record.lastViolationTimestamp = now;

  // Restrict for 15 minutes upon repeated violations
  if (record.violations >= 2 || record.lockUntil > now) {
    record.lockUntil = now + 15 * 60 * 1000;
    const remainingSeconds = 15 * 60;
    return {
      isNowRestricted: true,
      lockUntil: record.lockUntil,
      remainingSeconds,
    };
  }

  return {
    isNowRestricted: false,
    lockUntil: 0,
    remainingSeconds: 0,
  };
}

export function processSafetyAppeal(
  clientId: string,
  appealReason: string,
  acknowledgePolicy: boolean
): {
  success: boolean;
  message: string;
  restrictionLifted: boolean;
} {
  if (!acknowledgePolicy) {
    return {
      success: false,
      message: 'You must acknowledge the community safety policy.',
      restrictionLifted: false,
    };
  }

  const record = clientRestrictions.get(clientId);
  if (!record) {
    return {
      success: true,
      message: 'No active restriction found for this client.',
      restrictionLifted: true,
    };
  }

  record.lockUntil = 0;
  record.violations = 0;
  record.appealCount += 1;

  return {
    success: true,
    message: 'Your appeal was approved and the temporary restriction has been lifted. Thank you for committing to safe conversation.',
    restrictionLifted: true,
  };
}
