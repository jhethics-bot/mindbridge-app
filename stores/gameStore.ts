/**
 * gameStore - NeuBridge Game State (Zustand)
 *
 * Tracks in-progress game sessions: current difficulty params,
 * score, adaptive hints, and session analytics.
 * The adaptive difficulty hook reads from this store to calibrate.
 */
import { create } from 'zustand';
import type { ActivityType, DiseaseStage } from '../types';

export interface GameSession {
  activity: ActivityType;
  stage: DiseaseStage;
  startTime: Date;
  correctCount: number;
  attemptCount: number;
  hintCount: number;
  completedRounds: number;
  totalRounds: number;
  difficultyParams: Record<string, unknown>;
}

interface GameState {
  session: GameSession | null;

  // Actions
  startSession: (activity: ActivityType, stage: DiseaseStage, totalRounds: number, difficultyParams: Record<string, unknown>) => void;
  recordCorrect: () => void;
  recordAttempt: () => void;
  recordHint: () => void;
  completeRound: () => void;
  endSession: () => GameSession | null;
  getAccuracy: () => number;
}

export const useGameStore = create<GameState>((set, get) => ({
  session: null,

  startSession: (activity, stage, totalRounds, difficultyParams) => {
    set({
      session: {
        activity,
        stage,
        startTime: new Date(),
        correctCount: 0,
        attemptCount: 0,
        hintCount: 0,
        completedRounds: 0,
        totalRounds,
        difficultyParams,
      },
    });
  },

  recordCorrect: () => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          correctCount: state.session.correctCount + 1,
          attemptCount: state.session.attemptCount + 1,
        },
      };
    });
  },

  recordAttempt: () => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          attemptCount: state.session.attemptCount + 1,
        },
      };
    });
  },

  recordHint: () => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          hintCount: state.session.hintCount + 1,
        },
      };
    });
  },

  completeRound: () => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          completedRounds: state.session.completedRounds + 1,
        },
      };
    });
  },

  endSession: () => {
    const session = get().session;
    set({ session: null });
    return session;
  },

  getAccuracy: () => {
    const { session } = get();
    if (!session || session.attemptCount === 0) return 1;
    return session.correctCount / session.attemptCount;
  },
}));
