import { SavedProgress } from '../types/game';

const STORAGE_KEY = 'math_adventure_subway_runner_v1';

const DEFAULT_PROGRESS: SavedProgress = {
  highScore: 0,
  totalCoins: 0,
  completedLevels: [],
  levelBestScores: {},
  levelStars: {},
  soundEnabled: true,
  musicEnabled: true,
  runnerOutfit: 'red',
  showVisualHelper: true,
};

export function loadProgress(): SavedProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
      levelBestScores: parsed.levelBestScores || {},
      levelStars: parsed.levelStars || {},
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: SavedProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors in restricted frames
  }
}
