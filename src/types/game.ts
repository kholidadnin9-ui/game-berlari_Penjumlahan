export type GameScreen = 'MENU' | 'PLAYING' | 'RESULTS';

export type ModalType = 'NONE' | 'LEVEL_SELECT' | 'INSTRUCTIONS' | 'SETTINGS' | 'PAUSE';

// 4 Lanes corresponding to the 4 tracks: 0 (A - Red), 1 (B - Blue), 2 (C - Green), 3 (D - Yellow)
export type LaneIndex = 0 | 1 | 2 | 3;

export interface MathChoice {
  label: 'A' | 'B' | 'C' | 'D';
  value: number;
  color: 'red' | 'blue' | 'green' | 'yellow';
}

export interface MathQuestion {
  id: string;
  factorA: number;
  factorB: number;
  correctAnswer: number;
  choices: MathChoice[];
  correctLabel: 'A' | 'B' | 'C' | 'D';
}

export interface QuestionHistoryItem {
  question: MathQuestion;
  selectedValue: number | null;
  isCorrect: boolean;
  timeOut: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  minMultiplier: number;
  maxMultiplier: number;
  totalQuestions: number;
  timePerQuestion: number; // Seconds for the answer gate to reach the runner
  baseSpeed: number;
  themeColor: string;
  badgeTitle: string;
}

export interface BadgeAward {
  tier: 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTICIPANT';
  title: string;
  description: string;
  stars: number;
}

export interface SavedProgress {
  highScore: number;
  totalCoins: number;
  completedLevels: number[];
  levelBestScores: Record<number, number>;
  levelStars: Record<number, number>;
  soundEnabled: boolean;
  musicEnabled: boolean;
  runnerOutfit: 'red' | 'blue' | 'emerald' | 'amber';
  showVisualHelper: boolean;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Level 1: Stasiun Awal',
    subtitle: 'Perkalian 1 – 3',
    minMultiplier: 1,
    maxMultiplier: 3,
    totalQuestions: 10,
    timePerQuestion: 9.0,
    baseSpeed: 15,
    themeColor: '#10B981',
    badgeTitle: 'Penjelajah Perkalian 1–3',
  },
  {
    id: 2,
    name: 'Level 2: Jalur Kota',
    subtitle: 'Perkalian 1 – 4',
    minMultiplier: 1,
    maxMultiplier: 4,
    totalQuestions: 10,
    timePerQuestion: 8.5,
    baseSpeed: 16.5,
    themeColor: '#3B82F6',
    badgeTitle: 'Kapten Rel Perkalian 1–4',
  },
  {
    id: 3,
    name: 'Level 3: Jembatan Taman',
    subtitle: 'Perkalian 1 – 6',
    minMultiplier: 1,
    maxMultiplier: 6,
    totalQuestions: 10,
    timePerQuestion: 8.0,
    baseSpeed: 18,
    themeColor: '#F59E0B',
    badgeTitle: 'Bintang Cepat Perkalian 1–6',
  },
  {
    id: 4,
    name: 'Level 4: Terowongan Cahaya',
    subtitle: 'Perkalian 1 – 8',
    minMultiplier: 1,
    maxMultiplier: 8,
    totalQuestions: 10,
    timePerQuestion: 7.5,
    baseSpeed: 19.5,
    themeColor: '#8B5CF6',
    badgeTitle: 'Ksatria Angka Perkalian 1–8',
  },
  {
    id: 5,
    name: 'Level 5: Stasiun Juara',
    subtitle: 'Perkalian 1 – 10',
    minMultiplier: 1,
    maxMultiplier: 10,
    totalQuestions: 10,
    timePerQuestion: 7.0,
    baseSpeed: 21,
    themeColor: '#EF4444',
    badgeTitle: 'Grandmaster Perkalian 1–10',
  },
];
