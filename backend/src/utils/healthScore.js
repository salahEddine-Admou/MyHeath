/**
 * Deterministic daily wellness / diabetes risk score (0-100).
 * Not a medical diagnosis — screening-style signal for the patient dashboard.
 */

const MOOD_SCORE = { great: 10, good: 8, ok: 6, low: 4, bad: 2, '': 5 };

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreSleep(hours, quality) {
  // Ideal ~7-9h
  let h = 10;
  if (hours < 5 || hours > 10) h = 3;
  else if (hours < 6 || hours > 9.5) h = 6;
  else if (hours >= 7 && hours <= 9) h = 10;
  else h = 8;
  return (h + (quality || 5)) / 2;
}

function scoreGlucose(fasting, postMeal, hasDiabetes) {
  if (!hasDiabetes && fasting == null && postMeal == null) return null;

  let points = 10;
  if (fasting != null) {
    // mg/dL typical guidance bands (educational)
    if (fasting < 70) points -= 4; // hypo risk
    else if (fasting <= 99) points -= 0;
    else if (fasting <= 125) points -= 3; // pre-range
    else points -= 6; // high
  }
  if (postMeal != null) {
    if (postMeal < 70) points -= 3;
    else if (postMeal <= 140) points -= 0;
    else if (postMeal <= 180) points -= 3;
    else points -= 5;
  }
  return clamp(points, 0, 10);
}

/**
 * @param {object} log DailyHealthLog-like
 * @param {{ gender?: string, hasDiabetes?: boolean }} profile
 */
function computeHealthScore(log, profile = {}) {
  const hasDiabetes = Boolean(profile.hasDiabetes);
  const gender = profile.gender || 'woman';

  const sleep = scoreSleep(Number(log.sleepHours) || 0, Number(log.sleepQuality) || 5);
  const energy = Number(log.energy) ?? 5;
  const stressInv = 10 - (Number(log.stress) ?? 5); // lower stress = better
  const mood = MOOD_SCORE[log.mood] ?? 5;
  const water = clamp(((Number(log.waterLiters) || 0) / 2.5) * 10, 0, 10);
  const activity = clamp(
    ((Number(log.exerciseMinutes) || 0) / 45) * 10 +
      ((Number(log.steps) || 0) / 8000) * 5,
    0,
    10
  );

  let weighted =
    sleep * 1.4 +
    energy * 1.2 +
    stressInv * 1.3 +
    mood * 1.1 +
    water * 0.8 +
    activity * 1.2;

  let maxW = 1.4 + 1.2 + 1.3 + 1.1 + 0.8 + 1.2;

  if (gender === 'man') {
    const recovery = Number(log.recovery) ?? 5;
    const intensityPenalty =
      (Number(log.workoutIntensity) || 0) > 8 && recovery < 4 ? 3 : 0;
    weighted += recovery * 1.0 - intensityPenalty;
    maxW += 1.0;
  }

  const glucose = scoreGlucose(log.fastingGlucose, log.postMealGlucose, hasDiabetes);
  if (glucose != null) {
    weighted += glucose * 1.6;
    maxW += 1.6;
    if (hasDiabetes && !log.tookMedication) {
      weighted -= 2;
    }
  } else if (hasDiabetes) {
    // Diabetes profile but no readings today — mild penalty
    weighted -= 1.5;
  }

  const symptomPenalty = Math.min(4, (log.symptoms || []).length * 0.8);
  weighted -= symptomPenalty;

  const score = clamp(Math.round((weighted / maxW) * 100), 0, 100);

  let label = 'fair';
  if (score >= 85) label = 'excellent';
  else if (score >= 70) label = 'good';
  else if (score >= 50) label = 'fair';
  else if (score >= 30) label = 'poor';
  else label = 'critical';

  const tips = [];
  if ((Number(log.sleepHours) || 0) < 6) tips.push('Aim for at least 7 hours of sleep tonight.');
  if ((Number(log.stress) || 0) >= 7) tips.push('Stress is elevated — try a short walk or breathing break.');
  if ((Number(log.waterLiters) || 0) < 1.5) tips.push('Increase water intake toward ~2L if medically appropriate.');
  if ((Number(log.exerciseMinutes) || 0) < 20 && (Number(log.steps) || 0) < 4000) {
    tips.push('Add light activity today (walk 20–30 minutes).');
  }
  if (glucose != null && glucose <= 5) {
    tips.push('Glucose readings look off-range — follow your care plan and contact your clinician if needed.');
  }
  if (hasDiabetes && !log.tookMedication) {
    tips.push('Medication adherence was not logged — check your prescribed routine.');
  }
  if (gender === 'man' && (Number(log.workoutIntensity) || 0) >= 8 && (Number(log.recovery) || 5) <= 4) {
    tips.push('High training load with low recovery — prioritize rest and protein/hydration.');
  }
  if (!tips.length) tips.push('Keep the consistency — your daily pattern looks supportive.');

  return {
    score,
    label,
    isGoodHealth: score >= 70,
    tips,
    factors: {
      sleep: Math.round(sleep * 10) / 10,
      energy,
      stress: Number(log.stress) ?? 5,
      mood,
      activity: Math.round(activity * 10) / 10,
      glucose,
    },
  };
}

function summarizeTrend(logs = []) {
  if (!logs.length) {
    return { average: null, trend: 'insufficient_data', goodDays: 0, total: 0 };
  }
  const scores = logs.map((l) => l.healthScore).filter((s) => s != null);
  const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const recent = scores.slice(-3);
  const earlier = scores.slice(0, Math.max(1, scores.length - 3));
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  let trend = 'stable';
  if (recentAvg - earlierAvg >= 5) trend = 'improving';
  if (earlierAvg - recentAvg >= 5) trend = 'declining';
  return {
    average,
    trend,
    goodDays: scores.filter((s) => s >= 70).length,
    total: scores.length,
  };
}

module.exports = { computeHealthScore, summarizeTrend, scoreGlucose };
