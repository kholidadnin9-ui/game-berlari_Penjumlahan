import React from 'react';
import {
  Trophy,
  Star,
  CheckCircle2,
  XCircle,
  Coins,
  RotateCcw,
  Home,
  ArrowRight,
  Award,
} from 'lucide-react';
import { BadgeAward, LEVELS, LevelConfig, QuestionHistoryItem } from '../types/game';

interface ResultsScreenProps {
  level: LevelConfig;
  score: number;
  coinsEarned: number;
  correctCount: number;
  wrongCount: number;
  history: QuestionHistoryItem[];
  badge: BadgeAward;
  onPlayAgain: () => void;
  onNextLevel: (nextLevelId: number) => void;
  onBackToMenu: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  level,
  score,
  coinsEarned,
  correctCount,
  wrongCount,
  history,
  badge,
  onPlayAgain,
  onNextLevel,
  onBackToMenu,
}) => {
  const totalQuestions = correctCount + wrongCount;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const hasNextLevel = level.id < LEVELS.length;

  const badgeColors: Record<BadgeAward['tier'], string> = {
    GOLD: 'from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-amber-200',
    SILVER: 'from-slate-200 via-white to-slate-300 text-slate-950 border-white',
    BRONZE: 'from-orange-400 via-amber-500 to-orange-600 text-slate-950 border-orange-200',
    PARTICIPANT: 'from-sky-400 via-sky-300 to-blue-500 text-slate-950 border-sky-200',
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 overflow-y-auto">
      <div className="my-auto w-full max-w-3xl rounded-3xl bg-slate-900 border-4 border-amber-400 p-5 sm:p-8 shadow-2xl text-white">
        {/* Header & Stars */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-emerald-400 tracking-wider uppercase">
            <span>GARIS AKHIR STASIUN TERCAPAI!</span>
            <span aria-hidden="true">·</span>
            <span>{level.name}</span>
          </div>

          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold text-white">
            Selamat! Level Selesai!
          </h1>

          {/* 3 Star Rating */}
          <div className="mt-3 flex items-center justify-center gap-3">
            {[1, 2, 3].map((starIdx) => (
              <Star
                key={starIdx}
                className={`w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-300 ${
                  starIdx <= badge.stars
                    ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow'
                    : 'text-slate-700 fill-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Badge Award Banner */}
        <div
          className={`mt-5 rounded-2xl bg-gradient-to-r ${
            badgeColors[badge.tier]
          } border-2 p-4 shadow-lg flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left`}
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-950/15 flex items-center justify-center shrink-0">
            <Award className="w-9 h-9 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider opacity-80">
              Lencana Penghargaan Hasil Belajar
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold">{badge.title}</h2>
            <p className="text-xs sm:text-sm font-semibold opacity-90">{badge.description}</p>
          </div>
        </div>

        {/* 4 Key Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-slate-800/90 border border-slate-700 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Skor Akhir</span>
            </div>
            <div className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-amber-300 tabular-nums">
              {score}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800/90 border border-slate-700 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Jawaban Benar</span>
            </div>
            <div className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums">
              {correctCount}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800/90 border border-slate-700 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Jawaban Salah</span>
            </div>
            <div className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-rose-400 tabular-nums">
              {wrongCount}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800/90 border border-slate-700 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Ketepatan & Koin</span>
            </div>
            <div className="mt-1 font-display text-xl sm:text-2xl font-extrabold text-sky-300 tabular-nums">
              {accuracy}% · +{coinsEarned}
            </div>
          </div>
        </div>

        {/* Learning Review Table (Ringkasan Soal Perkalian) */}
        {history.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Ringkasan Hasil Belajar Perkalian (10 Soal)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1">
              {history.map((item, idx) => (
                <div
                  key={item.question.id}
                  className={`rounded-xl px-2.5 py-2 border text-xs font-bold flex items-center justify-between tabular-nums ${
                    item.isCorrect
                      ? 'bg-emerald-950/60 border-emerald-700/70 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-700/70 text-rose-200'
                  }`}
                >
                  <span>
                    {idx + 1}. {item.question.factorA}×{item.question.factorB}={item.question.correctAnswer}
                  </span>
                  <span>{item.isCorrect ? '✓' : '✗'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: MAIN LAGI, LEVEL BERIKUTNYA, KEMBALI KE MENU */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-lg border-b-4 border-emerald-700 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>MAIN LAGI</span>
          </button>

          {hasNextLevel && (
            <button
              type="button"
              onClick={() => onNextLevel(level.id + 1)}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold text-lg border-b-4 border-amber-700 cursor-pointer"
            >
              <span>LEVEL {level.id + 1}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={onBackToMenu}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-display font-bold text-base border-b-4 border-slate-900 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>KEMBALI KE MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
