import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';
import { LaneIndex } from '../types/game';

interface TouchControlsHUDProps {
  currentLane: LaneIndex;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
}

export const TouchControlsHUD: React.FC<TouchControlsHUDProps> = ({
  currentLane,
  onMoveLeft,
  onMoveRight,
  onJump,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2.5 z-20 flex flex-col items-center px-3">
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="pointer-events-auto mb-1 flex items-center gap-1 rounded-t-xl bg-slate-900/85 border border-slate-600/50 px-3 py-0.5 text-[11px] font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
      >
        {collapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Kontrol Gerak</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Sembunyikan</span>
          </>
        )}
      </button>

      {!collapsed && (
        <div className="pointer-events-auto flex items-center justify-center gap-2.5 sm:gap-4 rounded-2xl bg-[#1e2530]/90 border border-slate-500/50 px-3.5 py-2 shadow-2xl">
          <button
            type="button"
            onClick={onMoveLeft}
            disabled={currentLane === 0}
            aria-label="Pindah Jalur Kiri"
            className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:translate-y-0.5 disabled:opacity-40 text-white font-display font-bold text-xs sm:text-sm border-b-4 border-sky-800 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Kiri</span>
          </button>

          <button
            type="button"
            onClick={onJump}
            aria-label="Lompat"
            className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-slate-950 font-display font-extrabold text-xs sm:text-sm border-b-4 border-amber-700 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span>Lompat</span>
          </button>

          <button
            type="button"
            onClick={onMoveRight}
            disabled={currentLane === 3}
            aria-label="Pindah Jalur Kanan"
            className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:translate-y-0.5 disabled:opacity-40 text-white font-display font-bold text-xs sm:text-sm border-b-4 border-sky-800 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Kanan</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
