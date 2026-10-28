import { LEVELS, LevelConfig, MathChoice, MathQuestion, BadgeAward } from '../types/game';

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generates 3 unique, plausible wrong answers for Grade 2 multiplication
 * so that there is strictly 1 correct answer among the 4 options.
 */
function generateDistractors(a: number, b: number, correctAnswer: number, maxFactor: number): number[] {
  const candidates = new Set<number>();

  // Plausible Grade 2 mistakes: adjacent multiples, addition instead of multiplication, off-by-1/2
  const potentialValues = [
    a * (b + 1),
    a * Math.max(1, b - 1),
    (a + 1) * b,
    Math.max(1, a - 1) * b,
    a + b,
    correctAnswer + 1,
    correctAnswer - 1,
    correctAnswer + 2,
    correctAnswer - 2,
    correctAnswer + a,
    correctAnswer + b,
    correctAnswer + 10,
    Math.max(1, correctAnswer - 3),
    Math.max(2, correctAnswer + 4),
    Math.max(1, correctAnswer - a),
  ];

  const shuffledCandidates = shuffleArray(potentialValues);

  for (const val of shuffledCandidates) {
    if (val > 0 && val !== correctAnswer && !candidates.has(val)) {
      candidates.add(val);
    }
    if (candidates.size === 3) break;
  }

  // Fallback loop if we still need more unique positive distractors
  let offset = 1;
  while (candidates.size < 3) {
    const fallbackVal = correctAnswer + offset;
    if (fallbackVal > 0 && fallbackVal !== correctAnswer && !candidates.has(fallbackVal)) {
      candidates.add(fallbackVal);
    }
    const maxPossible = Math.max(12, maxFactor * 10);
    const randomVal = Math.floor(Math.random() * maxPossible) + 1;
    if (randomVal !== correctAnswer && !candidates.has(randomVal) && candidates.size < 3) {
      candidates.add(randomVal);
    }
    offset++;
  }

  return Array.from(candidates).slice(0, 3);
}

/**
 * Generates 10 unique multiplication questions for the given level.
 * Level 1: Perkalian 1–3
 * Level 2: Perkalian 1–4
 * Level 3: Perkalian 1–6
 * Level 4: Perkalian 1–8
 * Level 5: Perkalian 1–10
 */
export function generateLevelQuestions(levelId: number): MathQuestion[] {
  const levelConfig: LevelConfig = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
  const maxM = levelConfig.maxMultiplier;
  const totalNeeded = levelConfig.totalQuestions;

  // Build pool of unique pairs (factorA from 1..10, factorB from 1..maxM, or vice versa)
  // For Grade 2 SD Indonesia, multiplication tables 1..maxM against 1..10 give a rich pool of at least 30 unique pairs even on Level 1!
  const pairPool: Array<{ a: number; b: number }> = [];

  for (let b = 1; b <= maxM; b++) {
    for (let a = 1; a <= 10; a++) {
      // Emphasize factors within the level's focus range while keeping variety
      pairPool.push({ a, b });
    }
  }

  // Prioritize pairs that match the level progression so higher levels include their new multipliers prominently
  const priorityPairs = pairPool.filter(
    (p) => p.b >= Math.max(1, maxM - 2) && p.a >= 2 && p.a <= 9
  );
  const remainingPairs = pairPool.filter(
    (p) => !(p.b >= Math.max(1, maxM - 2) && p.a >= 2 && p.a <= 9)
  );

  const selectedPairs: Array<{ a: number; b: number }> = [];
  const usedKeys = new Set<string>();

  const shuffledPriority = shuffleArray(priorityPairs);
  const shuffledRemaining = shuffleArray(remainingPairs);

  for (const pair of [...shuffledPriority, ...shuffledRemaining]) {
    if (selectedPairs.length >= totalNeeded) break;
    // Randomly swap display order (e.g., 7 x 2 or 2 x 7) while keeping pair unique
    const swap = Math.random() > 0.35;
    const factorA = swap ? pair.a : pair.b;
    const factorB = swap ? pair.b : pair.a;
    const key = `${factorA}x${factorB}`;
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      selectedPairs.push({ a: factorA, b: factorB });
    }
  }

  const finalPairs = shuffleArray(selectedPairs);
  const labels: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const colors: Array<'red' | 'blue' | 'green' | 'yellow'> = ['red', 'blue', 'green', 'yellow'];

  return finalPairs.map((pair, idx) => {
    const correctAnswer = pair.a * pair.b;
    const distractors = generateDistractors(pair.a, pair.b, correctAnswer, maxM);
    const allValues = shuffleArray([correctAnswer, ...distractors]);

    const choices: MathChoice[] = allValues.map((val, cIdx) => ({
      label: labels[cIdx],
      value: val,
      color: colors[cIdx],
    }));

    const correctChoice = choices.find((c) => c.value === correctAnswer) || choices[0];

    return {
      id: `L${levelId}-Q${idx + 1}-${pair.a}x${pair.b}`,
      factorA: pair.a,
      factorB: pair.b,
      correctAnswer,
      choices,
      correctLabel: correctChoice.label,
    };
  });
}

/**
 * Evaluates learning performance based on accuracy (not just speed)
 */
export function calculateBadgeAward(
  correctCount: number,
  totalQuestions: number,
  levelConfig: LevelConfig
): BadgeAward {
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  if (accuracy >= 90) {
    return {
      tier: 'GOLD',
      title: `Lencana Emas: ${levelConfig.badgeTitle}`,
      description: 'Luar biasa! Kamu menguasai perkalian di level ini dengan sangat tepat!',
      stars: 3,
    };
  }
  if (accuracy >= 70) {
    return {
      tier: 'SILVER',
      title: `Lencana Perak: ${levelConfig.badgeTitle}`,
      description: 'Hebat sekali! Pemahaman perkalianmu sudah sangat bagus, terus berlatih!',
      stars: 2,
    };
  }
  if (accuracy >= 50) {
    return {
      tier: 'BRONZE',
      title: `Lencana Perunggu: ${levelConfig.badgeTitle}`,
      description: 'Bagus! Kamu sudah berani mencoba dan menyelesaikan seluruh lintasan!',
      stars: 1,
    };
  }
  return {
    tier: 'PARTICIPANT',
    title: 'Lencana Pelari Pantang Menyerah',
    description: 'Tetap semangat belajar! Coba lagi level ini agar makin mahir perkalian!',
    stars: 1,
  };
}
