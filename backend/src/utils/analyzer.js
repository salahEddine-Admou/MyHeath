/**
 * Menstrual cycle analyzer & anomaly detection (PCOS / endometriosis red flags).
 */

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;
const IRREGULARITY_THRESHOLD_DAYS = 7;
const SEVERE_PAIN_THRESHOLD = 7;
const MIN_CYCLES_FOR_ANALYSIS = 2;

function analyzeCycle(cycles = [], symptomLogs = []) {
  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );

  const cycleLengths = [];
  for (let i = 1; i < sortedCycles.length; i++) {
    const prev = new Date(sortedCycles[i - 1].startDate);
    const curr = new Date(sortedCycles[i].startDate);
    const length = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (length > 0 && length < 90) cycleLengths.push(length);
  }

  const avgCycleLength =
    cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((s, n) => s + n, 0) / cycleLengths.length)
      : DEFAULT_CYCLE_LENGTH;

  const lastCycle = sortedCycles[sortedCycles.length - 1];
  const lastStart = lastCycle ? new Date(lastCycle.startDate) : new Date();

  const nextPeriodDate = new Date(lastStart);
  nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycleLength);

  const ovulationDate = new Date(nextPeriodDate);
  ovulationDate.setDate(ovulationDate.getDate() - 14);
  const ovulationWindowStart = new Date(ovulationDate);
  ovulationWindowStart.setDate(ovulationWindowStart.getDate() - 2);
  const ovulationWindowEnd = new Date(ovulationDate);
  ovulationWindowEnd.setDate(ovulationWindowEnd.getDate() + 2);

  const fertileWindow = {
    start: ovulationWindowStart.toISOString().slice(0, 10),
    end: ovulationWindowEnd.toISOString().slice(0, 10),
    peak: ovulationDate.toISOString().slice(0, 10),
  };

  const anomalies = detectAnomalies(cycleLengths, symptomLogs, avgCycleLength);

  return {
    averageCycleLength: avgCycleLength,
    cyclesAnalyzed: cycleLengths.length,
    nextPeriodPrediction: nextPeriodDate.toISOString().slice(0, 10),
    ovulationWindow: fertileWindow,
    currentPhase: estimateCurrentPhase(lastStart, avgCycleLength),
    anomalies,
    recommendConsultation: anomalies.some((a) => a.severity === 'high'),
    chartData: buildChartData(sortedCycles, cycleLengths),
  };
}

function estimateCurrentPhase(lastStart, avgCycleLength) {
  const today = new Date();
  const dayInCycle =
    Math.floor((today - new Date(lastStart)) / (1000 * 60 * 60 * 24)) + 1;
  const day = ((dayInCycle - 1) % avgCycleLength) + 1;

  if (day <= DEFAULT_PERIOD_LENGTH) return { name: 'menstrual', day };
  if (day <= avgCycleLength - 14 - 2) return { name: 'follicular', day };
  if (day <= avgCycleLength - 14 + 2) return { name: 'ovulatory', day };
  return { name: 'luteal', day };
}

function detectAnomalies(cycleLengths, symptomLogs, avgCycleLength) {
  const anomalies = [];

  if (cycleLengths.length >= MIN_CYCLES_FOR_ANALYSIS) {
    const mean = avgCycleLength;
    const variance =
      cycleLengths.reduce((s, l) => s + (l - mean) ** 2, 0) / cycleLengths.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev >= IRREGULARITY_THRESHOLD_DAYS) {
      anomalies.push({
        code: 'IRREGULAR_CYCLES',
        severity: 'high',
        title: 'Highly irregular cycles',
        message:
          'Your cycle variability exceeds 7 days (high standard deviation). This can be an early PCOS signal. A medical consultation is recommended.',
        metric: { stdDev: Math.round(stdDev * 10) / 10, mean },
      });
    }

    if (mean < 21 || mean > 35) {
      anomalies.push({
        code: 'ABNORMAL_CYCLE_LENGTH',
        severity: mean < 21 || mean > 40 ? 'high' : 'medium',
        title: 'Cycle length outside typical range',
        message: `Your average cycle is ${mean} days (clinical norm: 21–35 days).`,
        metric: { mean },
      });
    }
  }

  const recentLogs = symptomLogs.slice(-90);
  const severePainLogs = recentLogs.filter(
    (l) => (l.painLevel || 0) >= SEVERE_PAIN_THRESHOLD
  );
  if (severePainLogs.length >= 3) {
    anomalies.push({
      code: 'RECURRING_SEVERE_PAIN',
      severity: 'high',
      title: 'Recurring severe pain',
      message:
        'Several pain episodes ≥ 7/10 were logged. This may suggest endometriosis or another gynecological condition. Please book a doctor visit.',
      metric: { severeEpisodes: severePainLogs.length },
    });
  }

  const sopkKeywords = ['acne', 'hirsutism', 'weight gain', 'fatigue'];
  const sopkHits = recentLogs.filter((l) => {
    const symptoms = (l.symptoms || []).map((s) => String(s).toLowerCase());
    return sopkKeywords.some((k) => symptoms.some((s) => s.includes(k)));
  });
  if (sopkHits.length >= 4 && cycleLengths.length >= MIN_CYCLES_FOR_ANALYSIS) {
    anomalies.push({
      code: 'PCOS_RISK_SIGNALS',
      severity: 'medium',
      title: 'PCOS-compatible signals',
      message:
        'Combination of symptoms (acne, hirsutism, weight changes) with cycle irregularity. This is not a diagnosis — talk to a clinician.',
      metric: { symptomHits: sopkHits.length },
    });
  }

  return anomalies;
}

function buildChartData(sortedCycles, cycleLengths) {
  return sortedCycles.slice(1).map((cycle, i) => ({
    label: new Date(cycle.startDate).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    }),
    cycleLength: cycleLengths[i] || DEFAULT_CYCLE_LENGTH,
    startDate: new Date(cycle.startDate).toISOString().slice(0, 10),
  }));
}

module.exports = {
  analyzeCycle,
  detectAnomalies,
  DEFAULT_CYCLE_LENGTH,
};
