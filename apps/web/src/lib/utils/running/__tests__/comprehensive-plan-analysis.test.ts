import { generateLongDistancePlan } from '../plans/longDistancePlan';
import { TrainingLevel } from '@maratypes/user';
import { WeekPlan } from '@maratypes/runningPlan';

/**
 * COMPREHENSIVE TRAINING PLAN ANALYSIS & IMPROVEMENT WORKFLOW
 * 
 * This system generates multiple training plans with different input combinations,
 * analyzes them against industry best practices, and provides actionable insights
 * for algorithm improvement.
 */

// Test Matrix Configuration
const TEST_SCENARIOS = [
  // Beginner scenarios
  { level: TrainingLevel.Beginner, weeks: 16, distance: 26.2, vdot: 25, goal: '13:00', description: 'Beginner Conservative' },
  { level: TrainingLevel.Beginner, weeks: 16, distance: 26.2, vdot: 25, goal: '12:00', description: 'Beginner Realistic' },
  { level: TrainingLevel.Beginner, weeks: 20, distance: 26.2, vdot: 28, goal: '11:30', description: 'Beginner Ambitious' },
  
  // Intermediate scenarios
  { level: TrainingLevel.Intermediate, weeks: 16, distance: 26.2, vdot: 35, goal: '10:15', description: 'Intermediate Realistic' },
  { level: TrainingLevel.Intermediate, weeks: 16, distance: 26.2, vdot: 38, goal: '9:45', description: 'Intermediate Ambitious' },
  { level: TrainingLevel.Intermediate, weeks: 20, distance: 26.2, vdot: 38, goal: '9:30', description: 'Intermediate Extended' },
  
  // Advanced scenarios
  { level: TrainingLevel.Advanced, weeks: 16, distance: 26.2, vdot: 45, goal: '8:00', description: 'Advanced Realistic' },
  { level: TrainingLevel.Advanced, weeks: 20, distance: 26.2, vdot: 50, goal: '7:30', description: 'Advanced Elite' },
  { level: TrainingLevel.Advanced, weeks: 12, distance: 26.2, vdot: 42, goal: '8:30', description: 'Advanced Short Cycle' },
  
  // Half Marathon scenarios
  { level: TrainingLevel.Intermediate, weeks: 12, distance: 13.1, vdot: 35, goal: '9:45', description: 'Half Marathon Standard' },
  { level: TrainingLevel.Advanced, weeks: 16, distance: 13.1, vdot: 45, goal: '7:45', description: 'Half Marathon Fast' },
  
  // Edge cases
  { level: TrainingLevel.Beginner, weeks: 12, distance: 26.2, vdot: 30, goal: '11:00', description: 'Short Cycle Marathon' },
  { level: TrainingLevel.Advanced, weeks: 24, distance: 26.2, vdot: 55, goal: '6:45', description: 'Extended Elite Training' },
];

// Industry Best Practice Standards
const BEST_PRACTICES = {
  // Distance progression standards
  PEAK_DISTANCE_RATIOS: {
    marathon: { min: 0.75, optimal: 0.80, max: 0.85 },
    halfMarathon: { min: 1.1, optimal: 1.2, max: 1.3 }
  },
  
  // Timing standards
  PEAK_TIMING: {
    '12weeks': { min: 8, optimal: 9, max: 10 },
    '16weeks': { min: 11, optimal: 12, max: 13 },
    '20weeks': { min: 14, optimal: 15, max: 16 },
    '24weeks': { min: 17, optimal: 18, max: 19 }
  },
  
  // Pace progression standards
  PACE_GAPS: {
    startingGap: { max: 45, optimal: 30 },
    finalGap: { max: 20, optimal: 10 },
    progressionRate: { min: 15, optimal: 25 } // seconds improvement
  },
  
  // Volume distribution
  WEEKLY_VOLUME: {
    longRunPercent: { min: 25, max: 40 },
    easyRunPercent: { min: 60, max: 80 },
    qualityPercent: { min: 15, max: 25 }
  },
  
  // Taper standards
  TAPER: {
    durationPercent: { min: 15, max: 30 }, // of total plan
    volumeReduction: { min: 40, max: 60 }  // from peak
  }
};

interface PlanAnalysis {
  scenario: typeof TEST_SCENARIOS[0];
  plan: any;
  critiques: string[];
  scores: {
    distanceProgression: number;
    paceProgression: number;
    volumeDistribution: number;
    taperQuality: number;
    overall: number;
  };
  recommendations: string[];
}

describe('Comprehensive Training Plan Analysis', () => {
  let allAnalyses: PlanAnalysis[] = [];

  beforeAll(() => {
    console.log('\\n🔬 COMPREHENSIVE TRAINING PLAN ANALYSIS WORKFLOW');
    console.log('📊 Generating and analyzing multiple training plan scenarios...');
    console.log(`🎯 Testing ${TEST_SCENARIOS.length} different scenarios\\n`);
  });

  TEST_SCENARIOS.forEach((scenario, index) => {
    it(`should analyze ${scenario.description}`, () => {
      console.log(`\\n--- Scenario ${index + 1}: ${scenario.description} ---`);
      console.log(`Level: ${scenario.level}, Weeks: ${scenario.weeks}, Distance: ${scenario.distance}mi`);
      console.log(`VDOT: ${scenario.vdot}, Goal: ${scenario.goal}\\n`);

      // Generate the plan
      const plan = generateLongDistancePlan(
        scenario.weeks,
        scenario.distance,
        'miles',
        scenario.level,
        scenario.vdot,
        20,
        scenario.goal
      );

      // Analyze the plan
      const analysis = analyzePlan(scenario, plan);
      allAnalyses.push(analysis);

      // Display analysis
      displayAnalysis(analysis);
      
      expect(analysis.scores.overall).toBeGreaterThan(50); // Minimum quality threshold
    });
  });

  afterAll(() => {
    console.log('\\n\\n🔍 COMPREHENSIVE ANALYSIS SUMMARY');
    console.log('=====================================\\n');
    
    generateOverallReport(allAnalyses);
    generateRecommendations(allAnalyses);
    generateAlgorithmImprovements(allAnalyses);
  });
});

function analyzePlan(scenario: typeof TEST_SCENARIOS[0], plan: any): PlanAnalysis {
  const analysis: PlanAnalysis = {
    scenario,
    plan,
    critiques: [],
    scores: {
      distanceProgression: 0,
      paceProgression: 0,
      volumeDistribution: 0,
      taperQuality: 0,
      overall: 0
    },
    recommendations: []
  };

  // Extract long runs for analysis
  const longRuns = plan.schedule.map((week: WeekPlan, idx: number) => {
    const longRun = week.runs.find(r => r.type === 'long' || r.type === 'marathon');
    return {
      week: idx + 1,
      distance: longRun?.mileage || 0,
      pace: longRun?.targetPace?.pace || '0:00'
    };
  });

  // Analyze distance progression
  analysis.scores.distanceProgression = analyzeDistanceProgression(longRuns, scenario, analysis);
  
  // Analyze pace progression
  analysis.scores.paceProgression = analyzePaceProgression(longRuns, scenario, analysis);
  
  // Analyze volume distribution
  analysis.scores.volumeDistribution = analyzeVolumeDistribution(plan, scenario, analysis);
  
  // Analyze taper quality
  analysis.scores.taperQuality = analyzeTaperQuality(longRuns, scenario, analysis);
  
  // Calculate overall score
  analysis.scores.overall = (
    analysis.scores.distanceProgression * 0.3 +
    analysis.scores.paceProgression * 0.25 +
    analysis.scores.volumeDistribution * 0.25 +
    analysis.scores.taperQuality * 0.2
  );

  return analysis;
}

function analyzeDistanceProgression(longRuns: any[], scenario: any, analysis: PlanAnalysis): number {
  let score = 100;
  const { distance: raceDistance, weeks } = scenario;
  
  // Get peak distance and timing
  const distances = longRuns.slice(0, -1).map(r => r.distance); // Exclude race week
  const peakDistance = Math.max(...distances);
  const peakWeek = longRuns.find(r => r.distance === peakDistance)?.week || 0;
  
  // Check peak distance ratio
  const peakRatio = peakDistance / raceDistance;
  const isMarathon = raceDistance > 20;
  const standards = isMarathon ? BEST_PRACTICES.PEAK_DISTANCE_RATIOS.marathon : BEST_PRACTICES.PEAK_DISTANCE_RATIOS.halfMarathon;
  
  if (peakRatio < standards.min) {
    analysis.critiques.push(`❌ Peak distance ${peakDistance}mi is too low (${(peakRatio*100).toFixed(0)}% of race, should be ${(standards.min*100).toFixed(0)}%+)`);
    score -= 30;
  } else if (peakRatio < standards.optimal) {
    analysis.critiques.push(`⚠️ Peak distance ${peakDistance}mi could be higher (${(peakRatio*100).toFixed(0)}% of race, optimal ${(standards.optimal*100).toFixed(0)}%)`);
    score -= 15;
  } else if (peakRatio > standards.max) {
    analysis.critiques.push(`⚠️ Peak distance ${peakDistance}mi might be too high (${(peakRatio*100).toFixed(0)}% of race, max recommended ${(standards.max*100).toFixed(0)}%)`);
    score -= 10;
  } else {
    analysis.critiques.push(`✅ Peak distance ${peakDistance}mi is optimal (${(peakRatio*100).toFixed(0)}% of race distance)`);
  }
  
  // Check peak timing
  const weeksKey = `${weeks}weeks` as keyof typeof BEST_PRACTICES.PEAK_TIMING;
  const timingStandards = BEST_PRACTICES.PEAK_TIMING[weeksKey];
  
  if (timingStandards) {
    if (peakWeek < timingStandards.min || peakWeek > timingStandards.max) {
      analysis.critiques.push(`❌ Peak timing Week ${peakWeek} is poor (should be Week ${timingStandards.min}-${timingStandards.max})`);
      score -= 25;
    } else if (peakWeek === timingStandards.optimal) {
      analysis.critiques.push(`✅ Peak timing Week ${peakWeek} is perfect`);
    } else {
      analysis.critiques.push(`✅ Peak timing Week ${peakWeek} is good`);
    }
  }
  
  // Check for backwards progression
  let hasBackwardsProgression = false;
  for (let i = 1; i < Math.min(peakWeek, distances.length); i++) {
    if (distances[i] < distances[i-1] - 1) { // Allow for minor cutbacks
      analysis.critiques.push(`❌ Distance regression: Week ${i} (${distances[i-1]}mi) → Week ${i+1} (${distances[i]}mi)`);
      hasBackwardsProgression = true;
      score -= 20;
      break;
    }
  }
  
  if (!hasBackwardsProgression) {
    analysis.critiques.push(`✅ No backwards progression in build phase`);
  }
  
  return Math.max(0, score);
}

function analyzePaceProgression(longRuns: any[], scenario: any, analysis: PlanAnalysis): number {
  let score = 100;
  const { goal } = scenario;
  
  // Parse goal pace
  const [goalMins, goalSecs] = goal.split(':').map(Number);
  const goalPaceSeconds = goalMins * 60 + goalSecs;
  
  // Calculate pace gaps
  const parseTime = (timeStr: string) => {
    const [m, s] = timeStr.split(':').map(Number);
    return m * 60 + s;
  };
  
  const startingGap = parseTime(longRuns[0].pace) - goalPaceSeconds;
  const finalTrainingGap = parseTime(longRuns[longRuns.length - 2].pace) - goalPaceSeconds; // Exclude race week
  const progressionRate = startingGap - finalTrainingGap;
  
  // Check starting gap
  if (startingGap > BEST_PRACTICES.PACE_GAPS.startingGap.max) {
    analysis.critiques.push(`❌ Starting pace gap ${startingGap}s is too large (max ${BEST_PRACTICES.PACE_GAPS.startingGap.max}s)`);
    score -= 25;
  } else if (startingGap > BEST_PRACTICES.PACE_GAPS.startingGap.optimal) {
    analysis.critiques.push(`⚠️ Starting pace gap ${startingGap}s could be smaller (optimal ${BEST_PRACTICES.PACE_GAPS.startingGap.optimal}s)`);
    score -= 10;
  } else {
    analysis.critiques.push(`✅ Starting pace gap ${startingGap}s is good`);
  }
  
  // Check final gap
  if (finalTrainingGap > BEST_PRACTICES.PACE_GAPS.finalGap.max) {
    analysis.critiques.push(`❌ Final training pace gap ${finalTrainingGap}s is too large (max ${BEST_PRACTICES.PACE_GAPS.finalGap.max}s)`);
    score -= 30;
  } else if (finalTrainingGap > BEST_PRACTICES.PACE_GAPS.finalGap.optimal) {
    analysis.critiques.push(`⚠️ Final training pace gap ${finalTrainingGap}s could be smaller (optimal ${BEST_PRACTICES.PACE_GAPS.finalGap.optimal}s)`);
    score -= 15;
  } else {
    analysis.critiques.push(`✅ Final training pace gap ${finalTrainingGap}s is excellent`);
  }
  
  // Check progression rate
  if (progressionRate < BEST_PRACTICES.PACE_GAPS.progressionRate.min) {
    analysis.critiques.push(`❌ Pace progression ${progressionRate}s is insufficient (min ${BEST_PRACTICES.PACE_GAPS.progressionRate.min}s)`);
    score -= 20;
  } else if (progressionRate >= BEST_PRACTICES.PACE_GAPS.progressionRate.optimal) {
    analysis.critiques.push(`✅ Pace progression ${progressionRate}s is excellent`);
  } else {
    analysis.critiques.push(`✅ Pace progression ${progressionRate}s is adequate`);
  }
  
  return Math.max(0, score);
}

function analyzeVolumeDistribution(plan: any, scenario: any, analysis: PlanAnalysis): number {
  let score = 100;
  
  // Analyze a representative week (mid-plan)
  const midWeek = plan.schedule[Math.floor(plan.schedule.length / 2)];
  const totalWeeklyMileage = midWeek.runs.reduce((sum: number, run: any) => sum + run.mileage, 0);
  
  const longRun = midWeek.runs.find((r: any) => r.type === 'long');
  const easyRuns = midWeek.runs.filter((r: any) => r.type === 'easy');
  const qualityRuns = midWeek.runs.filter((r: any) => r.type === 'tempo' || r.type === 'interval');
  
  const longRunPercent = longRun ? (longRun.mileage / totalWeeklyMileage) * 100 : 0;
  const easyPercent = easyRuns.reduce((sum: number, run: any) => sum + run.mileage, 0) / totalWeeklyMileage * 100;
  const qualityPercent = qualityRuns.reduce((sum: number, run: any) => sum + run.mileage, 0) / totalWeeklyMileage * 100;
  
  // Check long run percentage
  if (longRunPercent < BEST_PRACTICES.WEEKLY_VOLUME.longRunPercent.min) {
    analysis.critiques.push(`❌ Long run ${longRunPercent.toFixed(0)}% of weekly volume is too low (min ${BEST_PRACTICES.WEEKLY_VOLUME.longRunPercent.min}%)`);
    score -= 20;
  } else if (longRunPercent > BEST_PRACTICES.WEEKLY_VOLUME.longRunPercent.max) {
    analysis.critiques.push(`⚠️ Long run ${longRunPercent.toFixed(0)}% of weekly volume is high (max ${BEST_PRACTICES.WEEKLY_VOLUME.longRunPercent.max}%)`);
    score -= 10;
  } else {
    analysis.critiques.push(`✅ Long run ${longRunPercent.toFixed(0)}% of weekly volume is appropriate`);
  }
  
  // Check easy run percentage
  if (easyPercent < BEST_PRACTICES.WEEKLY_VOLUME.easyRunPercent.min) {
    analysis.critiques.push(`⚠️ Easy running ${easyPercent.toFixed(0)}% might be too low (min ${BEST_PRACTICES.WEEKLY_VOLUME.easyRunPercent.min}%)`);
    score -= 15;
  } else if (easyPercent > BEST_PRACTICES.WEEKLY_VOLUME.easyRunPercent.max) {
    analysis.critiques.push(`⚠️ Easy running ${easyPercent.toFixed(0)}% might be too high (max ${BEST_PRACTICES.WEEKLY_VOLUME.easyRunPercent.max}%)`);
    score -= 10;
  } else {
    analysis.critiques.push(`✅ Easy running ${easyPercent.toFixed(0)}% is well balanced`);
  }
  
  return Math.max(0, score);
}

function analyzeTaperQuality(longRuns: any[], scenario: any, analysis: PlanAnalysis): number {
  let score = 100;
  const { weeks } = scenario;
  
  // Find peak and analyze taper
  const distances = longRuns.slice(0, -1).map(r => r.distance); // Exclude race week
  const peakDistance = Math.max(...distances);
  const peakWeek = longRuns.find(r => r.distance === peakDistance)?.week || 0;
  
  const taperWeeks = weeks - peakWeek;
  const taperPercent = (taperWeeks / weeks) * 100;
  
  // Check taper duration
  if (taperPercent < BEST_PRACTICES.TAPER.durationPercent.min) {
    analysis.critiques.push(`❌ Taper duration ${taperWeeks} weeks (${taperPercent.toFixed(0)}%) is too short (min ${BEST_PRACTICES.TAPER.durationPercent.min}%)`);
    score -= 25;
  } else if (taperPercent > BEST_PRACTICES.TAPER.durationPercent.max) {
    analysis.critiques.push(`⚠️ Taper duration ${taperWeeks} weeks (${taperPercent.toFixed(0)}%) is long (max ${BEST_PRACTICES.TAPER.durationPercent.max}%)`);
    score -= 15;
  } else {
    analysis.critiques.push(`✅ Taper duration ${taperWeeks} weeks (${taperPercent.toFixed(0)}%) is appropriate`);
  }
  
  // Check volume reduction
  const finalLongRun = longRuns[longRuns.length - 2]; // Week before race
  const volumeReduction = ((peakDistance - finalLongRun.distance) / peakDistance) * 100;
  
  if (volumeReduction < BEST_PRACTICES.TAPER.volumeReduction.min) {
    analysis.critiques.push(`❌ Taper volume reduction ${volumeReduction.toFixed(0)}% is insufficient (min ${BEST_PRACTICES.TAPER.volumeReduction.min}%)`);
    score -= 20;
  } else if (volumeReduction > BEST_PRACTICES.TAPER.volumeReduction.max) {
    analysis.critiques.push(`⚠️ Taper volume reduction ${volumeReduction.toFixed(0)}% might be excessive (max ${BEST_PRACTICES.TAPER.volumeReduction.max}%)`);
    score -= 10;
  } else {
    analysis.critiques.push(`✅ Taper volume reduction ${volumeReduction.toFixed(0)}% is appropriate`);
  }
  
  return Math.max(0, score);
}

function displayAnalysis(analysis: PlanAnalysis): void {
  console.log('📊 ANALYSIS RESULTS:');
  console.log(`Overall Score: ${analysis.scores.overall.toFixed(0)}/100`);
  console.log(`- Distance Progression: ${analysis.scores.distanceProgression.toFixed(0)}/100`);
  console.log(`- Pace Progression: ${analysis.scores.paceProgression.toFixed(0)}/100`);
  console.log(`- Volume Distribution: ${analysis.scores.volumeDistribution.toFixed(0)}/100`);
  console.log(`- Taper Quality: ${analysis.scores.taperQuality.toFixed(0)}/100`);
  
  console.log('\\n🔍 DETAILED CRITIQUE:');
  analysis.critiques.forEach(critique => console.log(`  ${critique}`));
}

function generateOverallReport(analyses: PlanAnalysis[]): void {
  const avgScores = {
    overall: analyses.reduce((sum, a) => sum + a.scores.overall, 0) / analyses.length,
    distanceProgression: analyses.reduce((sum, a) => sum + a.scores.distanceProgression, 0) / analyses.length,
    paceProgression: analyses.reduce((sum, a) => sum + a.scores.paceProgression, 0) / analyses.length,
    volumeDistribution: analyses.reduce((sum, a) => sum + a.scores.volumeDistribution, 0) / analyses.length,
    taperQuality: analyses.reduce((sum, a) => sum + a.scores.taperQuality, 0) / analyses.length
  };

  console.log('📈 OVERALL ALGORITHM PERFORMANCE:');
  console.log(`Average Overall Score: ${avgScores.overall.toFixed(1)}/100`);
  console.log(`- Distance Progression: ${avgScores.distanceProgression.toFixed(1)}/100`);
  console.log(`- Pace Progression: ${avgScores.paceProgression.toFixed(1)}/100`);
  console.log(`- Volume Distribution: ${avgScores.volumeDistribution.toFixed(1)}/100`);
  console.log(`- Taper Quality: ${avgScores.taperQuality.toFixed(1)}/100`);

  // Identify best and worst performing scenarios
  const bestPlan = analyses.reduce((best, current) => 
    current.scores.overall > best.scores.overall ? current : best
  );
  const worstPlan = analyses.reduce((worst, current) => 
    current.scores.overall < worst.scores.overall ? current : worst
  );

  console.log(`\\n🏆 Best Performing Plan: ${bestPlan.scenario.description} (${bestPlan.scores.overall.toFixed(0)}/100)`);
  console.log(`💔 Worst Performing Plan: ${worstPlan.scenario.description} (${worstPlan.scores.overall.toFixed(0)}/100)`);
}

function generateRecommendations(analyses: PlanAnalysis[]): void {
  console.log('\\n🎯 ALGORITHM IMPROVEMENT RECOMMENDATIONS:');
  
  // Count common issues
  const issueCount: { [key: string]: number } = {};
  analyses.forEach(analysis => {
    analysis.critiques.forEach(critique => {
      if (critique.startsWith('❌') || critique.startsWith('⚠️')) {
        const key = critique.split(' ').slice(0, 4).join(' '); // First 4 words as key
        issueCount[key] = (issueCount[key] || 0) + 1;
      }
    });
  });

  // Sort by frequency
  const sortedIssues = Object.entries(issueCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5 issues

  console.log('\\nMost Common Issues (Priority Order):');
  sortedIssues.forEach(([issue, count], index) => {
    const priority = index < 2 ? 'HIGH' : index < 4 ? 'MEDIUM' : 'LOW';
    console.log(`${index + 1}. [${priority}] ${issue} (${count}/${analyses.length} plans affected)`);
  });
}

function generateAlgorithmImprovements(analyses: PlanAnalysis[]): void {
  console.log('\\n🔧 SPECIFIC ALGORITHM IMPROVEMENTS NEEDED:');
  
  // Analyze performance by training level
  const byLevel = analyses.reduce((acc, analysis) => {
    const level = analysis.scenario.level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(analysis.scores.overall);
    return acc;
  }, {} as { [key: string]: number[] });

  Object.entries(byLevel).forEach(([level, scores]) => {
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    console.log(`- ${level}: Average ${avg.toFixed(1)}/100 ${avg < 70 ? '⚠️ NEEDS IMPROVEMENT' : '✅'}`);
  });

  // Specific recommendations based on analysis
  console.log('\\n🔨 Implementation Priorities:');
  console.log('1. 🎯 Distance Progression: Implement adaptive peak distance based on training level and weeks');
  console.log('2. ⏰ Taper Timing: Optimize peak timing algorithm for different plan lengths');
  console.log('3. 📈 Pace Progression: Refine progressive training to ensure realistic final gaps');
  console.log('4. ⚖️ Volume Balance: Improve weekly volume distribution algorithms');
  console.log('5. 🔄 Cutback Strategy: Smarter cutback timing that does not break progression');
}