import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Exam } from '../types';
import { genId } from '../config/constants';

interface ExamState {
  exams: Exam[];
  addExam: (data: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExam: (id: string, data: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      exams: [],
      addExam: (data) =>
        set((s) => ({
          exams: [
            ...s.exams,
            { ...data, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        })),
      updateExam: (id, data) =>
        set((s) => ({
          exams: s.exams.map((e) =>
            e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
          ),
        })),
      deleteExam: (id) =>
        set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),
    }),
    { name: 'lukin-exams' }
  )
);
