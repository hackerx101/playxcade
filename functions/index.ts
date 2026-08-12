// @ts-nocheck
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

// Cloud function to auto-suspend users for suspicious activity (e.g. brute force, rapid API hits)
export const detectSuspiciousActivity = functions.https.onCall(async (data, context) => {
  const { userId, reason, deviceFingerprint } = data;

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with one arguments "userId".');
  }

  const db = admin.firestore();
  
  // Log the activity
  await db.collection('security_logs').add({
    userId,
    reason,
    deviceFingerprint,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    action: 'auto_suspended'
  });

  // Temporarily suspend the user
  await db.collection('profiles').doc(userId).update({
    account_status: 'suspended',
    suspension_reason: reason || 'Automated Suspension: Suspicious Activity Detected'
  });

  return { success: true, message: 'User suspended for suspicious activity' };
});

/**
 * Cloud Function: evaluateReport
 * Evaluates reported content against community guidelines using context-aware analysis.
 * Differentiates actual threats vs gaming/business metaphors (e.g., "killing a deal", "slaying it", "clutching").
 * Protects self-referential speech and limits false positives.
 */
export const evaluateReport = functions.https.onCall(async (data, context) => {
  const { reportId, reportedText, category, targetUserId, reporterId } = data;

  if (!reportedText) {
    throw new functions.https.HttpsError('invalid-argument', 'reportedText is required.');
  }

  const db = admin.firestore();

  // Common harmless gaming & business idioms check (on-device/fast path evaluation)
  const harmlessIdioms = [
    'killing a deal', 'killing it', 'killed the game', 'slaying', 'clutching',
    'destroyed the opponent', 'destroying them in cod', 'destroyed that match',
    'im dead', 'dead laughing', 'dead 💀', 'i died', 'dying of laughter',
    'bombed the test', 'shot a video', 'headshot in game', 'got sniped'
  ];

  const lowerText = reportedText.toLowerCase();
  const isIdiomMatch = harmlessIdioms.some(idiom => lowerText.includes(idiom));

  let isViolation = false;
  let severity = 'none'; // 'none' | 'minor' | 'severe'
  let rationale = '';

  if (isIdiomMatch) {
    isViolation = false;
    rationale = 'Filtered by context analyzer: Common gaming/business metaphor or harmless self-referential expression.';
  } else {
    // Basic severity check for actual severe threats
    const severeThreatKeywords = ['doxx', 'home address is', 'social security', 'im going to bomb', 'real name is', 'creed threat'];
    const containsSevereThreat = severeThreatKeywords.some(kw => lowerText.includes(kw));

    if (containsSevereThreat) {
      isViolation = true;
      severity = 'severe';
      rationale = 'Confirmed severe violation: Doxxing, real-world threat, or exploitation.';
    } else if (lowerText.includes('hate') || lowerText.includes('idiot') || lowerText.includes('harass') || category === 'Harassment & Bullying') {
      isViolation = true;
      severity = 'minor';
      rationale = 'Minor guideline violation: Targeted harassment or inappropriate language.';
    } else {
      isViolation = false;
      rationale = 'No violation found. Speech permitted under free expression and context guidelines.';
    }
  }

  // Update report in Firestore
  if (reportId) {
    await db.collection('reports').doc(reportId).update({
      status: isViolation ? 'approved' : 'rejected',
      evaluated_at: admin.firestore.FieldValue.serverTimestamp(),
      evaluation_rationale: rationale,
      severity
    });
  }

  // If a minor or severe violation occurred, record in user's violations log
  if (isViolation && targetUserId) {
    const violationDoc = {
      userId: targetUserId,
      guideline: category || 'Harassment & Bullying',
      violatingContent: reportedText,
      severity,
      appealStatus: 'none', // 'none' | 'pending' | 'approved' | 'rejected'
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    await db.collection('violations').add(violationDoc);

    if (severity === 'severe') {
      await db.collection('profiles').doc(targetUserId).update({
        account_status: 'suspended',
        suspension_reason: `Severe Guideline Violation: ${category}`
      });
    }
  }

  return {
    success: true,
    isViolation,
    severity,
    rationale
  };
});

