import React from 'react';
import { Heart, Pause, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { LevelConfig, LaneIndex, MathQuestion } from '../types/game';

interface MathQuizHUDProps {
  level: LevelConfig;
  question: MathQuestion;
  questionIndex: number;
  totalQuestions: number;
  timeLeft: number;
  maxTime: number;
  score: number;
  coins: number;
  hearts: number;
  currentLane: LaneIndex;
  soundEnabled: boolean;
  showVisualHelper: boolean;
  feedbackState: {
    type: 'CORRECT' | 'WRONG' | 'TIMEOUT' | null;
    message: string;
    detail?: string;
  };
  onSteerToLane?: (laneIdx: LaneIndex) => void;
  onTogglePause: () => void;
  onToggleSound: () => void;
}

export const MathQuizHUD: React.FC<MathQuizHUDProps> = ({
  question,
  questionIndex,
  totalQuestions,
  timeLeft,
  maxTime,
  score,
  coins,
  hearts,
  soundEnabled,
  feedbackState,
  onTogglePause,
  onToggleSound,
}) => {
  const timePercentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-col items-center px-3 pt-2.5 sm:px-4 sm:pt-3">
      {/* ROW 1: 4 Dark Floating Pill Capsules */}
      <div className="pointer-events-auto w-full max-w-lg flex items-center justify-between gap-1.5 sm:gap-2.5 px-1">
        {/* Capsule 1: Gold Star + Score */}
        <div className="flex items-center gap-2 rounded-full bg-[#2a323d]/90 border border-slate-500/40 px-3.5 py-1.5 shadow-lg min-w-[84px] sm:min-w-[100px]">
          <span className="text-amber-400 text-base sm:text-lg leading-none drop-shadow">★</span>
          <span className="font-display font-extrabold text-white text-sm sm:text-base tabular-nums tracking-tight">
            {score}
          </span>
        </div>

        {/* Capsule 2: Silver Orb + Remaining Questions */}
        <div
          className="flex items-center gap-2 rounded-full bg-[#2a323d]/90 border border-slate-500/40 px-3.5 py-1.5 shadow-lg min-w-[74px] sm:min-w-[88px]"
          title={`Soal ${questionIndex + 1} dari ${totalQuestions} · Koin: ${coins}`}
        >
          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-white via-slate-200 to-slate-400 shadow-inner inline-block shrink-0" />
          <span className="font-display font-extrabold text-white text-sm sm:text-base tabular-nums">
            {totalQuestions - questionIndex}
          </span>
        </div>

        {/* Capsule 3: Three Red Hearts */}
        <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#2a323d]/90 border border-slate-500/40 px-3.5 py-1.5 shadow-lg">
          {[1, 2, 3].map((idx) => {
            const active = idx <= hearts;
            return (
              <Heart
                key={idx}
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-200 ${
                  active
                    ? 'text-red-500 fill-red-500 drop-shadow'
                    : 'text-slate-600 fill-slate-700 opacity-50'
                }`}
              />
            );
          })}
        </div>

        {/* Capsule 4: Sound + Pause Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
            className="flex items-center justify-center rounded-full bg-[#2a323d]/90 hover:bg-[#374151] border border-slate-500/40 p-2 text-white shadow-lg cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            aria-label="Jeda Permainan"
            className="flex items-center justify-center rounded-full bg-[#2a323d]/90 hover:bg-[#374151] border border-slate-500/40 px-3 py-1.5 text-white shadow-lg cursor-pointer"
          >
            <span className="w-5 h-5 rounded-md bg-slate-400/30 flex items-center justify-center">
              <Pause className="w-3.5 h-3.5 fill-white text-white" />
            </span>
          </button>
        </div>
      </div>

      {/* ROW 2: Compact, Proportional Question Panel (without redundant top answer buttons) */}
      <div className="pointer-events-auto relative mt-2 w-full max-w-lg rounded-2xl bg-[#1e2530]/92 border-2 border-slate-500/50 px-4 pt-2.5 pb-2.5 sm:px-5 sm:pt-3 sm:pb-3 shadow-[0_10px_28px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Gold Coin "P" Reward Badge */}
          <div className="flex items-center gap-2 shrink-0 select-none">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 border-2 border-yellow-100 shadow flex items-center justify-center font-display font-extrabold text-amber-950 text-base sm:text-lg">
              P
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-600 border border-rose-300 text-[10px] sm:text-xs font-extrabold text-white shadow">
              Reward {coins > 0 ? `+${coins}` : ''}
            </span>
          </div>

          {/* Center: Big Multiplication Equation ("7 × 2 = ?") */}
          <div className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-wider tabular-nums drop-shadow text-center">
            {question.factorA} × {question.factorB} = ?
          </div>

          {/* Right: Gate Impact Timer ("1.9 dtk") */}
          <div className="shrink-0 text-right">
            <span className="font-mono text-xs sm:text-sm font-bold text-slate-200 tabular-nums tracking-tight">
              {timeLeft.toFixed(1)} dtk
            </span>
          </div>
        </div>

        {/* Bottom Yellow Progress / Gate Approach Bar */}
        <div className="mt-2.5 w-full h-2 sm:h-2.5 bg-slate-950/80 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-75"
            style={{ width: `${timePercentage}%` }}
          />
        </div>
      </div>

      {/* Pop-up Feedback Toast when the character collides with the Answer Gate */}
      {feedbackState.type && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-2 px-4 py-1.5 rounded-2xl border-2 shadow-2xl flex items-center gap-2 transform transition-all duration-200 ${
            feedbackState.type === 'CORRECT'
              ? 'bg-emerald-600/95 border-emerald-200 text-white scale-105'
              : 'bg-amber-600/95 border-amber-200 text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-200 shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <span className="font-display text-xs sm:text-sm font-extrabold tracking-wide">
              {feedbackState.message}
            </span>
            {feedbackState.detail && (
              <span className="text-[11px] sm:text-xs font-bold bg-black/25 px-2 py-0.5 rounded-lg">
                {feedbackState.detail}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
