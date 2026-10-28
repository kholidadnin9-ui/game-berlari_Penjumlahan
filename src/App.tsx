import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  LEVELS,
  LevelConfig,
  GameScreen,
  ModalType,
  LaneIndex,
  MathQuestion,
  QuestionHistoryItem,
  SavedProgress,
} from './types/game';
import { generateLevelQuestions, calculateBadgeAward } from './utils/mathGenerator';
import { loadProgress, saveProgress } from './utils/storage';
import { soundManager } from './utils/soundManager';
import { SubwayRunnerCanvas } from './components/SubwayRunnerCanvas';
import { MathQuizHUD } from './components/MathQuizHUD';
import { TouchControlsHUD } from './components/TouchControlsHUD';
import { MainMenuOverlay, GameModals } from './components/GameModals';
import { ResultsScreen } from './components/ResultsScreen';

const PRAISE_MESSAGES = [
  'HEBAT! Tabrakan Jawaban Tepat!',
  'LUAR BIASA! Jalurmu Benar!',
  'PINTAR SEKALI! Keren!',
  'MANTAP! Kamu Jago Perkalian!',
];

const ENCOURAGE_MESSAGES = [
  'Ayo coba lagi! Pilih jalur yang tepat!',
  'Tetap semangat! Jangan menyerah!',
  'Hampir tepat! Perhatikan jalur angkanya!',
];

export default function App() {
  const [progress, setProgress] = useState<SavedProgress>(() => loadProgress());
  const [screen, setScreen] = useState<GameScreen>('MENU');
  const [activeModal, setActiveModal] = useState<ModalType>('NONE');

  // Level & Question State
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const currentLevel: LevelConfig =
    LEVELS.find((l) => l.id === selectedLevelId) || LEVELS[0];

  const [questions, setQuestions] = useState<MathQuestion[]>(() =>
    generateLevelQuestions(1)
  );
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(currentLevel.timePerQuestion);

  // Player Session Stats
  const [score, setScore] = useState<number>(0);
  const [sessionCoins, setSessionCoins] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(3);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [history, setHistory] = useState<QuestionHistoryItem[]>([]);

  // Feedback & Transition State
  const [feedbackState, setFeedbackState] = useState<{
    type: 'CORRECT' | 'WRONG' | 'TIMEOUT' | null;
    message: string;
    detail?: string;
  }>({ type: null, message: '' });

  // 3D Runner Controls State (Default Lane 1 = Blue Track B, matching the user's screenshot)
  const [lane, setLane] = useState<LaneIndex>(1);
  const [jumpTrigger, setJumpTrigger] = useState<number>(0);
  const [celebrateTrigger, setCelebrateTrigger] = useState<number>(0);
  const [stumbleTrigger, setStumbleTrigger] = useState<number>(0);

  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    soundManager.setSettings(progress.soundEnabled, progress.musicEnabled);
    saveProgress(progress);
  }, [progress]);

  const updateProgress = useCallback((partial: Partial<SavedProgress>) => {
    setProgress((prev) => ({
      ...prev,
      ...partial,
    }));
  }, []);

  const handleResetProgress = useCallback(() => {
    const fresh: SavedProgress = {
      highScore: 0,
      totalCoins: 0,
      completedLevels: [],
      levelBestScores: {},
      levelStars: {},
      soundEnabled: progress.soundEnabled,
      musicEnabled: progress.musicEnabled,
      runnerOutfit: progress.runnerOutfit,
      showVisualHelper: true,
    };
    setProgress(fresh);
    saveProgress(fresh);
    setActiveModal('NONE');
  }, [progress.musicEnabled, progress.runnerOutfit, progress.soundEnabled]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        clearTimeout(transitionTimerRef.current);
      }
      soundManager.stopMusic();
    };
  }, []);

  const startGameSession = useCallback(
    (levelIdToStart?: number) => {
      const targetId = levelIdToStart ?? selectedLevelId;
      const lvl = LEVELS.find((l) => l.id === targetId) || LEVELS[0];
      if (transitionTimerRef.current !== null) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }

      setSelectedLevelId(lvl.id);
      const freshQuestions = generateLevelQuestions(lvl.id);
      setQuestions(freshQuestions);
      setQuestionIndex(0);
      setTimeLeft(lvl.timePerQuestion);
      setScore(0);
      setSessionCoins(0);
      setHearts(3);
      setCorrectCount(0);
      setWrongCount(0);
      setHistory([]);
      setFeedbackState({ type: null, message: '' });
      setLane(1); // Start on Track B (Blue)
      setActiveModal('NONE');
      setScreen('PLAYING');

      soundManager.startMusic();
    },
    [selectedLevelId]
  );

  const finishLevel = useCallback(
    (
      finalScore: number,
      finalCoins: number,
      finalCorrect: number,
      finalHistory: QuestionHistoryItem[]
    ) => {
      soundManager.stopMusic();
      soundManager.playVictory();

      const badge = calculateBadgeAward(
        finalCorrect,
        currentLevel.totalQuestions,
        currentLevel
      );

      setProgress((prev) => {
        const newHighScore = Math.max(prev.highScore, finalScore);
        const newTotalCoins = prev.totalCoins + finalCoins;
        const completedSet = new Set(prev.completedLevels);
        completedSet.add(currentLevel.id);

        const prevBest = prev.levelBestScores[currentLevel.id] || 0;
        const prevStars = prev.levelStars[currentLevel.id] || 0;

        return {
          ...prev,
          highScore: newHighScore,
          totalCoins: newTotalCoins,
          completedLevels: Array.from(completedSet),
          levelBestScores: {
            ...prev.levelBestScores,
            [currentLevel.id]: Math.max(prevBest, finalScore),
          },
          levelStars: {
            ...prev.levelStars,
            [currentLevel.id]: Math.max(prevStars, badge.stars),
          },
        };
      });

      setHistory(finalHistory);
      setScreen('RESULTS');

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti errors
      }
    },
    [currentLevel]
  );

  const scheduleNextQuestion = useCallback(
    (
      nextScore: number,
      nextCoins: number,
      nextCorrect: number,
      nextHistory: QuestionHistoryItem[],
      delayMs: number
    ) => {
      if (transitionTimerRef.current !== null) {
        clearTimeout(transitionTimerRef.current);
      }

      transitionTimerRef.current = window.setTimeout(() => {
        transitionTimerRef.current = null;
        if (questionIndex + 1 >= questions.length) {
          finishLevel(nextScore, nextCoins, nextCorrect, nextHistory);
        } else {
          setQuestionIndex((prev) => prev + 1);
          setTimeLeft(currentLevel.timePerQuestion);
          setFeedbackState({ type: null, message: '' });
        }
      }, delayMs);
    },
    [currentLevel.timePerQuestion, finishLevel, questionIndex, questions.length]
  );

  // Triggered when the 3D running character physically collides with the Answer Gate on `hitLane`!
  const handleHitAnswerGate = useCallback(
    (hitLane: LaneIndex) => {
      if (
        screen !== 'PLAYING' ||
        activeModal !== 'NONE' ||
        feedbackState.type !== null
      ) {
        return;
      }

      const currentQ = questions[questionIndex];
      if (!currentQ) return;

      const hitChoice = currentQ.choices[hitLane] || currentQ.choices[0];
      const isCorrect = hitChoice.value === currentQ.correctAnswer;

      const updatedHistory: QuestionHistoryItem[] = [
        ...history,
        {
          question: currentQ,
          selectedValue: hitChoice.value,
          isCorrect,
          timeOut: false,
        },
      ];
      setHistory(updatedHistory);

      if (isCorrect) {
        const addedScore = 100;
        const addedCoins = 10;
        const nextScore = score + addedScore;
        const nextCoins = sessionCoins + addedCoins;
        const nextCorrect = correctCount + 1;

        setScore(nextScore);
        setSessionCoins(nextCoins);
        setCorrectCount(nextCorrect);
        setCelebrateTrigger((c) => c + 1);

        soundManager.playCorrect();
        soundManager.playCoin();

        const praise =
          PRAISE_MESSAGES[(questionIndex + nextCorrect) % PRAISE_MESSAGES.length];
        setFeedbackState({
          type: 'CORRECT',
          message: praise,
          detail: `Jalur ${hitChoice.label} (${hitChoice.value}) Benar! +${addedScore} Skor · +${addedCoins} Koin`,
        });

        try {
          confetti({
            particleCount: 28,
            spread: 55,
            origin: { y: 0.35 },
          });
        } catch {
          // Ignore confetti errors
        }

        scheduleNextQuestion(nextScore, nextCoins, nextCorrect, updatedHistory, 1200);
      } else {
        const nextWrong = wrongCount + 1;
        setWrongCount(nextWrong);
        setStumbleTrigger((s) => s + 1);
        soundManager.playWrong();

        const remainingHearts = hearts - 1;
        const encourage =
          ENCOURAGE_MESSAGES[nextWrong % ENCOURAGE_MESSAGES.length];

        if (remainingHearts <= 0) {
          setHearts(1);
          setFeedbackState({
            type: 'WRONG',
            message: encourage,
            detail: `Jawaban benar: Jalur ${currentQ.correctLabel} (${currentQ.factorA} × ${currentQ.factorB} = ${currentQ.correctAnswer}) · Nyawa Semangat Dipulihkan!`,
          });
        } else {
          setHearts(remainingHearts);
          setFeedbackState({
            type: 'WRONG',
            message: encourage,
            detail: `Jawaban benar: Jalur ${currentQ.correctLabel} (${currentQ.factorA} × ${currentQ.factorB} = ${currentQ.correctAnswer})`,
          });
        }

        scheduleNextQuestion(score, sessionCoins, correctCount, updatedHistory, 1600);
      }
    },
    [
      activeModal,
      correctCount,
      feedbackState.type,
      hearts,
      history,
      questionIndex,
      questions,
      scheduleNextQuestion,
      score,
      screen,
      sessionCoins,
      wrongCount,
    ]
  );

  // Steer character to a specific lane (0=A, 1=B, 2=C, 3=D) without immediately submitting
  const steerToLane = useCallback((targetLane: LaneIndex) => {
    setLane((prev) => {
      if (prev !== targetLane) {
        soundManager.playLaneSwitch();
      }
      return targetLane;
    });
  }, []);

  const moveLeft = useCallback(() => {
    setLane((prev) => {
      if (prev > 0) {
        soundManager.playLaneSwitch();
        return (prev - 1) as LaneIndex;
      }
      return prev;
    });
  }, []);

  const moveRight = useCallback(() => {
    setLane((prev) => {
      if (prev < 3) {
        soundManager.playLaneSwitch();
        return (prev + 1) as LaneIndex;
      }
      return prev;
    });
  }, []);

  const triggerJump = useCallback(() => {
    soundManager.playJump();
    setJumpTrigger((j) => j + 1);
  }, []);

  const handleSwipeLane = useCallback(
    (direction: 'LEFT' | 'RIGHT') => {
      if (direction === 'LEFT') moveLeft();
      else moveRight();
    },
    [moveLeft, moveRight]
  );

  const handleCollectTrackCoin = useCallback(() => {
    soundManager.playCoin();
    setSessionCoins((c) => c + 1);
    setScore((s) => s + 10);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'PLAYING') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveModal((prev) => (prev === 'PAUSE' ? 'NONE' : 'PAUSE'));
        return;
      }

      if (activeModal !== 'NONE') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveRight();
      } else if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        triggerJump();
      } else if (e.key === '1' || e.key.toLowerCase() === 'a') {
        steerToLane(0);
      } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
        steerToLane(1);
      } else if (e.key === '3' || e.key.toLowerCase() === 'c') {
        steerToLane(2);
      } else if (e.key === '4' || e.key.toLowerCase() === 'd') {
        steerToLane(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, moveLeft, moveRight, screen, steerToLane, triggerJump]);

  const currentQuestion = questions[questionIndex] || questions[0];
  const isRunnerActive = screen === 'PLAYING' && activeModal === 'NONE';
  const isGateApproaching = isRunnerActive && feedbackState.type === null;
  const badgeAward = calculateBadgeAward(
    correctCount,
    currentLevel.totalQuestions,
    currentLevel
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Subway Runner Viewport */}
      <SubwayRunnerCanvas
        lane={lane}
        question={currentQuestion}
        questionDuration={currentLevel.timePerQuestion}
        isGateActive={isGateApproaching}
        jumpTrigger={jumpTrigger}
        celebrateTrigger={celebrateTrigger}
        stumbleTrigger={stumbleTrigger}
        isRunning={isRunnerActive}
        baseSpeed={currentLevel.baseSpeed}
        runnerOutfit={progress.runnerOutfit}
        onGateTimeUpdate={setTimeLeft}
        onHitAnswerGate={handleHitAnswerGate}
        onCollectTrackCoin={handleCollectTrackCoin}
        onSwipeLane={handleSwipeLane}
        onSwipeJump={triggerJump}
      />

      {/* PAGE 1: MENU UTAMA */}
      {screen === 'MENU' && (
        <MainMenuOverlay
          selectedLevel={currentLevel}
          progress={progress}
          onStartGame={startGameSession}
          onOpenModal={(modal) => setActiveModal(modal)}
        />
      )}

      {/* PAGE 2: HALAMAN PERMAINAN */}
      {screen === 'PLAYING' && currentQuestion && (
        <>
          <MathQuizHUD
            level={currentLevel}
            question={currentQuestion}
            questionIndex={questionIndex}
            totalQuestions={questions.length}
            timeLeft={timeLeft}
            maxTime={currentLevel.timePerQuestion}
            score={score}
            coins={sessionCoins}
            hearts={hearts}
            currentLane={lane}
            soundEnabled={progress.soundEnabled}
            showVisualHelper={progress.showVisualHelper}
            feedbackState={feedbackState}
            onSteerToLane={steerToLane}
            onTogglePause={() => setActiveModal('PAUSE')}
            onToggleSound={() =>
              updateProgress({
                soundEnabled: !progress.soundEnabled,
                musicEnabled: !progress.soundEnabled,
              })
            }
          />

          <TouchControlsHUD
            currentLane={lane}
            onMoveLeft={moveLeft}
            onMoveRight={moveRight}
            onJump={triggerJump}
          />
        </>
      )}

      {/* PAGE 3: HALAMAN HASIL */}
      {screen === 'RESULTS' && (
        <ResultsScreen
          level={currentLevel}
          score={score}
          coinsEarned={sessionCoins}
          correctCount={correctCount}
          wrongCount={wrongCount}
          history={history}
          badge={badgeAward}
          onPlayAgain={() => startGameSession(currentLevel.id)}
          onNextLevel={(nextId) => startGameSession(nextId)}
          onBackToMenu={() => {
            soundManager.stopMusic();
            setActiveModal('NONE');
            setScreen('MENU');
          }}
        />
      )}

      {/* MODALS */}
      <GameModals
        activeModal={activeModal}
        selectedLevelId={selectedLevelId}
        progress={progress}
        onClose={() => setActiveModal('NONE')}
        onSelectLevelOnly={(lvlId) => setSelectedLevelId(lvlId)}
        onSelectLevelAndPlay={(lvlId) => startGameSession(lvlId)}
        onUpdateProgress={updateProgress}
        onResetProgress={handleResetProgress}
        onResumeGame={() => setActiveModal('NONE')}
        onRestartLevel={() => startGameSession(currentLevel.id)}
        onBackToMenu={() => {
          soundManager.stopMusic();
          setActiveModal('NONE');
          setScreen('MENU');
        }}
      />
    </div>
  );
}
