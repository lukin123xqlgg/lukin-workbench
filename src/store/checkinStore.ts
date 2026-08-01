import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Checkin } from '../types';
import { genId } from '../config/constants';

interface CheckinState {
  checkins: Checkin[];
  addManualDuration: (date: string, minutes: number) => void;
  addAutoDuration: (date: string, minutes: number) => void;
  setManualDuration: (date: string, minutes: number) => void;
  getCheckin: (date: string) => Checkin | undefined;
  getMonthCheckins: (yearMonth: string) => Checkin[];
  toggleCheckin: (date: string) => void;
  deleteCheckin: (date: string) => void;
}

export const useCheckinStore = create<CheckinState>()(
  persist(
    (set, get) => ({
      checkins: [],

      addManualDuration: (date, minutes) =>
        set((s) => {
          const existing = s.checkins.find((c) => c.date === date);
          if (existing) {
            return {
              checkins: s.checkins.map((c) =>
                c.id === existing.id
                  ? { ...c, manualDuration: c.manualDuration + minutes, updatedAt: new Date().toISOString() }
                  : c
              ),
            };
          }
          const newCheckin: Checkin = {
            id: genId(),
            date,
            manualDuration: minutes,
            autoDuration: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { checkins: [...s.checkins, newCheckin] };
        }),

      addAutoDuration: (date, minutes) =>
        set((s) => {
          const existing = s.checkins.find((c) => c.date === date);
          if (existing) {
            return {
              checkins: s.checkins.map((c) =>
                c.id === existing.id
                  ? { ...c, autoDuration: c.autoDuration + minutes, updatedAt: new Date().toISOString() }
                  : c
              ),
            };
          }
          const newCheckin: Checkin = {
            id: genId(),
            date,
            manualDuration: 0,
            autoDuration: minutes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { checkins: [...s.checkins, newCheckin] };
        }),

      setManualDuration: (date, minutes) =>
        set((s) => {
          const existing = s.checkins.find((c) => c.date === date);
          if (existing) {
            return {
              checkins: s.checkins.map((c) =>
                c.id === existing.id
                  ? { ...c, manualDuration: minutes, updatedAt: new Date().toISOString() }
                  : c
              ),
            };
          }
          const newCheckin: Checkin = {
            id: genId(),
            date,
            manualDuration: minutes,
            autoDuration: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { checkins: [...s.checkins, newCheckin] };
        }),

      getCheckin: (date) => get().checkins.find((c) => c.date === date),

      getMonthCheckins: (yearMonth) =>
        get().checkins.filter((c) => c.date.startsWith(yearMonth)),

      toggleCheckin: (date) =>
        set((s) => {
          const existing = s.checkins.find((c) => c.date === date);
          if (existing) {
            // 如果有学习时长，不删除，只在无时长时删除
            if (existing.manualDuration === 0 && existing.autoDuration === 0) {
              return { checkins: s.checkins.filter((c) => c.id !== existing.id) };
            }
            return s;
          }
          const newCheckin: Checkin = {
            id: genId(),
            date,
            manualDuration: 0,
            autoDuration: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { checkins: [...s.checkins, newCheckin] };
        }),

      deleteCheckin: (date) =>
        set((s) => ({ checkins: s.checkins.filter((c) => c.date !== date) })),
    }),
    { name: 'lukin-checkins' }
  )
);
