import React from 'react';
import {
  Play,
  Layers,
  BookOpen,
  Settings,
  Trophy,
  Coins,
  Star,
  Volume2,
  VolumeX,
  Music,
  RotateCcw,
  Home,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { LEVELS, LevelConfig, ModalType, SavedProgress } from '../types/game';

interface MainMenuOverlayProps {
  selectedLevel: LevelConfig;
  progress: SavedProgress;
  onStartGame: (levelId?: number) => void;
  onOpenModal: (modal: ModalType) => void;
}

export const MainMenuOverlay: React.FC<MainMenuOverlayProps> = ({
  selectedLevel,
  progress,
  onStartGame,
  onOpenModal,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
      {/* Top Bar: Progress Stats (High Score, Coins, Completed Levels) */}
      <header className="pointer-events-auto w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900/92 border-2 border-slate-700 px-5 py-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-display font-extrabold text-xl shadow">
            ×
          </div>
          <div>
            <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-white block leading-none">
              MATH ADVENTURE
            </span>
            <span className="text-xs font-semibold text-amber-300">
              Edukasi Matematika Kelas 2 SD · Perkalian
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm font-bold">
          <div className="flex items-center gap-1.5 text-white">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Skor Terbaik:</span>
            <strong className="text-amber-300 tabular-nums">{progress.highScore}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-white">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Total Koin:</span>
            <strong className="text-amber-300 tabular-nums">{progress.totalCoins}</strong>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="tabular-nums">{progress.completedLevels.length} / 5 Level Selesai</span>
          </div>
        </div>
      </header>

      {/* Center Hero Title & Main Menu Action Card */}
      <main className="pointer-events-auto my-auto w-full max-w-xl mx-auto rounded-3xl bg-slate-900/95 border-4 border-amber-400 p-6 sm:p-8 shadow-2xl text-center">
        <p className="text-xs sm:text-sm font-extrabold text-sky-300 tracking-wider mb-1">
          PETUALANGAN KERETA MATEMATIKA 3D
        </p>
        <h1
          className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight"
          style={{ textWrap: 'balance' }}
        >
          MATH ADVENTURE: <span className="text-amber-400">SUBWAY RUNNER</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 font-medium">
          Berlari di lintasan kereta 3 jalur, kumpulkan koin emas, dan jawab soal perkalian dengan tepat!
        </p>

        {/* Active Level Preview */}
        <div className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm text-slate-200 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2">
          <span>Level Aktif:</span>
          <strong className="text-amber-300">{selectedLevel.name}</strong>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-300 font-bold">{selectedLevel.subtitle}</span>
        </div>

        {/* 4 Main Menu Buttons */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onStartGame(selectedLevel.id)}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:translate-y-0.5 text-slate-950 font-display text-xl sm:text-2xl font-extrabold border-b-4 border-emerald-700 shadow-lg transition-all cursor-pointer"
          >
            <Play className="w-7 h-7 fill-slate-950" />
            <span>MULAI BERMAIN</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1">
            <button
              type="button"
              onClick={() => onOpenModal('LEVEL_SELECT')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:translate-y-0.5 text-white font-display font-bold text-base border-b-4 border-sky-800 transition-all cursor-pointer whitespace-nowrap"
            >
              <Layers className="w-5 h-5" />
              <span>PILIH LEVEL</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('INSTRUCTIONS')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-slate-950 font-display font-bold text-base border-b-4 border-amber-700 transition-all cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-5 h-5" />
              <span>PETUNJUK</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('SETTINGS')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 active:translate-y-0.5 text-white font-display font-bold text-base border-b-4 border-slate-900 transition-all cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-5 h-5" />
              <span>PENGATURAN</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="pointer-events-auto text-center text-xs text-slate-900 font-bold bg-white/85 px-4 py-1.5 rounded-xl mx-auto shadow">
        Gunakan Tombol Panah (← ↑ →) atau Sentuh Layar untuk Berpindah Jalur & Melompat
      </footer>
    </div>
  );
};

interface ModalDialogProps {
  activeModal: ModalType;
  selectedLevelId: number;
  progress: SavedProgress;
  onClose: () => void;
  onSelectLevelAndPlay: (levelId: number) => void;
  onSelectLevelOnly: (levelId: number) => void;
  onUpdateProgress: (updated: Partial<SavedProgress>) => void;
  onResetProgress: () => void;
  onResumeGame: () => void;
  onRestartLevel: () => void;
  onBackToMenu: () => void;
}

export const GameModals: React.FC<ModalDialogProps> = ({
  activeModal,
  selectedLevelId,
  progress,
  onClose,
  onSelectLevelAndPlay,
  onSelectLevelOnly,
  onUpdateProgress,
  onResetProgress,
  onResumeGame,
  onRestartLevel,
  onBackToMenu,
}) => {
  if (activeModal === 'NONE') return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 overflow-y-auto">
      {/* 1. LEVEL SELECT MODAL */}
      {activeModal === 'LEVEL_SELECT' && (
        <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border-4 border-sky-400 p-6 shadow-2xl text-white">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Pilih Level Petualangan
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Setiap level berisi 10 soal perkalian untuk siswa Kelas 2 SD
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 max-h-[62vh] overflow-y-auto pr-1">
            {LEVELS.map((lvl) => {
              const stars = progress.levelStars[lvl.id] || 0;
              const best = progress.levelBestScores[lvl.id] || 0;
              const isSelected = lvl.id === selectedLevelId;
              const isCompleted = progress.completedLevels.includes(lvl.id);

              return (
                <div
                  key={lvl.id}
                  onClick={() => onSelectLevelOnly(lvl.id)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-display text-2xl font-extrabold text-white shrink-0"
                      style={{ backgroundColor: lvl.themeColor }}
                    >
                      {lvl.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-extrabold text-white">
                          {lvl.name}
                        </h3>
                        {isCompleted && (
                          <span className="text-xs font-bold text-emerald-400">· Selesai</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-amber-300">{lvl.subtitle}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span>10 Soal</span>
                        <span aria-hidden="true">·</span>
                        <span>Waktu {lvl.timePerQuestion} dtk/soal</span>
                        {best > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-sky-300 font-semibold tabular-nums">
                              Skor Terbaik: {best}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {/* Stars earned */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${
                            s <= stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700 fill-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLevelAndPlay(lvl.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-sm border-b-2 border-emerald-700 cursor-pointer whitespace-nowrap"
                    >
                      Mainkan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. INSTRUCTIONS MODAL (PETUNJUK) */}
      {activeModal === 'INSTRUCTIONS' && (
        <div className="w-full max-w-xl rounded-3xl bg-slate-900 border-4 border-amber-400 p-6 shadow-2xl text-white">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-amber-400">
              Cara Bermain
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-sm sm:text-base text-slate-200">
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <h3 className="font-display font-bold text-white text-lg mb-1">
                1. Jawab Soal Perkalian di Atas Layar
              </h3>
              <p className="text-slate-300">
                Lihat soal perkalian yang muncul (contoh: <strong>7 × 2 = ?</strong>). Pilih tombol jawaban{' '}
                <strong className="text-red-400">A</strong>,{' '}
                <strong className="text-sky-400">B</strong>,{' '}
                <strong className="text-emerald-400">C</strong>, atau{' '}
                <strong className="text-amber-300">D</strong> yang benar sebelum waktu habis!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <h3 className="font-display font-bold text-white text-lg mb-1">
                2. Kendalikan Karakter Pelari 3D
              </h3>
              <p className="text-slate-300">
                Gunakan tombol panah <strong>Kiri (←)</strong> dan <strong>Kanan (→)</strong> untuk berpindah jalur rel, serta <strong>Panah Atas (↑) / Spasi</strong> untuk melompat dan mengumpulkan koin emas! Di tablet/HP, gunakan tombol di bawah layar atau usap layar.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <h3 className="font-display font-bold text-white text-lg mb-1">
                3. Kumpulkan Skor & Lencana Juara
              </h3>
              <p className="text-slate-300">
                Jawaban benar menambah <strong>+100 Skor</strong> dan <strong>+10 Koin</strong>. Jangan takut salah—kamu tetap bisa menyelesaikan semua 10 soal sampai garis akhir dan meraih Lencana Penghargaan!
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-base border-b-4 border-emerald-700 cursor-pointer"
            >
              Mengerti, Ayo Main!
            </button>
          </div>
        </div>
      )}

      {/* 3. SETTINGS MODAL (PENGATURAN) */}
      {activeModal === 'SETTINGS' && (
        <div className="w-full max-w-lg rounded-3xl bg-slate-900 border-4 border-slate-600 p-6 shadow-2xl text-white">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Pengaturan Permainan
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {/* Sound Effects Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700">
              <div className="flex items-center gap-3">
                {progress.soundEnabled ? (
                  <Volume2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <VolumeX className="w-6 h-6 text-slate-400" />
                )}
                <div>
                  <div className="font-bold text-white">Efek Suara</div>
                  <div className="text-xs text-slate-400">Suara koin, lompatan, dan jawaban</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateProgress({ soundEnabled: !progress.soundEnabled })}
                className={`px-4 py-2 rounded-xl font-bold text-sm cursor-pointer ${
                  progress.soundEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {progress.soundEnabled ? 'AKTIF' : 'MATI'}
              </button>
            </div>

            {/* Adventure Background Music Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700">
              <div className="flex items-center gap-3">
                <Music
                  className={`w-6 h-6 ${
                    progress.musicEnabled ? 'text-amber-400' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="font-bold text-white">Musik Petualangan</div>
                  <div className="text-xs text-slate-400">Musik latar ceria saat berlari</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateProgress({ musicEnabled: !progress.musicEnabled })}
                className={`px-4 py-2 rounded-xl font-bold text-sm cursor-pointer ${
                  progress.musicEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {progress.musicEnabled ? 'AKTIF' : 'MATI'}
              </button>
            </div>

            {/* Visual Helper Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700">
              <div className="flex items-center gap-3">
                <Sparkles
                  className={`w-6 h-6 ${
                    progress.showVisualHelper ? 'text-sky-400' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="font-bold text-white">Bantuan Penjumlahan Berulang</div>
                  <div className="text-xs text-slate-400">Tampilkan petunjuk untuk Kelas 2 SD</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateProgress({ showVisualHelper: !progress.showVisualHelper })}
                className={`px-4 py-2 rounded-xl font-bold text-sm cursor-pointer ${
                  progress.showVisualHelper
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {progress.showVisualHelper ? 'AKTIF' : 'MATI'}
              </button>
            </div>

            {/* Character Outfit Color Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700">
              <div className="font-bold text-white mb-2">Warna Kostum Pelari 3D</div>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'red', label: 'Merah', bg: 'bg-red-500' },
                    { id: 'blue', label: 'Biru', bg: 'bg-blue-500' },
                    { id: 'emerald', label: 'Hijau', bg: 'bg-emerald-500' },
                    { id: 'amber', label: 'Kuning', bg: 'bg-amber-500' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onUpdateProgress({ runnerOutfit: item.id })}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 border-2 cursor-pointer ${
                      progress.runnerOutfit === item.id
                        ? 'border-white bg-slate-700 text-white'
                        : 'border-transparent bg-slate-900 text-slate-300'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full ${item.bg}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Data */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onResetProgress}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Atur Ulang Data Progres
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold text-sm cursor-pointer"
              >
                Simpan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PAUSE MODAL (JEDA PERMAINAN) */}
      {activeModal === 'PAUSE' && (
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-4 border-amber-400 p-6 shadow-2xl text-center text-white">
          <h2 className="font-display text-3xl font-extrabold text-amber-400">Permainan Dijeda</h2>
          <p className="mt-1 text-sm text-slate-300">
            Istirahat sejenak! Siap melanjutkan petualangan perkalianmu?
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onResumeGame}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-lg border-b-4 border-emerald-700 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>LANJUTKAN</span>
            </button>

            <button
              type="button"
              onClick={onRestartLevel}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-display font-bold text-base border-b-4 border-sky-800 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>ULANGI LEVEL</span>
            </button>

            <button
              type="button"
              onClick={onBackToMenu}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-display font-bold text-base border-b-4 border-slate-900 cursor-pointer"
            >
              <Home className="w-5 h-5" />
              <span>KEMBALI KE MENU</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
