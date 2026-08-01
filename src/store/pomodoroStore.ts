import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PomodoroSession } from '../types';
import { genId } from '../config/constants';
import { useCheckinStore } from './checkinStore';

interface PomodoroState {
  sessions: PomodoroSession[];
  // 运行时状态（不持久化）
  isRunning: boolean;
  currentSubject: string | null;
  currentMode: 'countdown' | 'stopwatch';
  startTime: number | null;     // timestamp
  targetSeconds: number;        // 倒计时目标秒数
  elapsedSeconds: number;       // 已过秒数（用于显示）
  // actions
  start: (subject: string, mode: 'countdown' | 'stopwatch', minutes?: number) => void;
  stop: () => PomodoroSession | null;
  tick: () => void;
  reset: () => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      sessions: [],
      isRunning: false,
      currentSubject: null,
      currentMode: 'stopwatch',
      startTime: null,
      targetSeconds: 0,
      elapsedSeconds: 0,

      start: (subject, mode, minutes) => {
        const targetSeconds = mode === 'countdown' && minutes ? minutes * 60 : 0;
        set({
          isRunning: true,
          currentSubject: subject,
          currentMode: mode,
          startTime: Date.now(),
          targetSeconds,
          elapsedSeconds: 0,
        });
      },

      stop: () => {
        const state = get();
        if (!state.isRunning || !state.startTime) return null;

        const endedAt = new Date();
        const startedAt = new Date(state.startTime);
        const duration = Math.floor((endedAt.getTime() - state.startTime) / 1000);
        const date = startedAt.toISOString().slice(0, 10);

        const session: PomodoroSession = {
          id: genId(),
          subject: state.currentSubject as any,
          mode: state.currentMode,
          duration,
          date,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          createdAt: endedAt.toISOString(),
          updatedAt: endedAt.toISOString(),
        };

        set((s) => ({ sessions: [...s.sessions, session] }));

        // 联动打卡日历 —— 自动累计时长
        const durationMinutes = duration / 60;
        const checkinStore = useCheckinStore.getState();
        checkinStore.addAutoDuration(date, durationMinutes);

        // 重置运行时状态
        set({
          isRunning: false,
          currentSubject: null,
          startTime: null,
          targetSeconds: 0,
          elapsedSeconds: 0,
        });

        return session;
      },

      tick: () => {
        const state = get();
        if (!state.isRunning || !state.startTime) return;
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        set({ elapsedSeconds: elapsed });

        // 倒计时模式到点自动停止
        if (state.currentMode === 'countdown' && state.targetSeconds > 0 && elapsed >= state.targetSeconds) {
          get().stop();
        }
      },

      reset: () =>
        set({
          isRunning: false,
          currentSubject: null,
          startTime: null,
          targetSeconds: 0,
          elapsedSeconds: 0,
        }),
    }),
    {
      name: 'lukin-pomodoro',
      partialize: (s) => ({ sessions: s.sessions }) as any,
    }
  )
);
