import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PracticeRecord, Plan, Mistake, Review, Paper, DailyCheckpoint, FinanceRecord, UserSettings, CollectionItem, CollectionGoal, NoteItem } from '../types';
import { genId, type SubjectId } from '../config/constants';

// ===== 做题统计 =====
interface PracticeState {
  records: PracticeRecord[];
  addRecord: (data: Omit<PracticeRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteRecord: (id: string) => void;
}
export const usePracticeStore = create<PracticeState>()(
  persist((set) => ({
    records: [],
    addRecord: (data) =>
      set((s) => ({
        records: [...s.records, { ...data, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      })),
    deleteRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
  }), { name: 'lukin-practice' })
);

// ===== 学习计划 =====
interface PlanState {
  plans: Plan[];
  addPlan: (data: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  togglePlan: (id: string) => void;
  deletePlan: (id: string) => void;
  reorderPlans: (id: string, direction: 'up' | 'down') => void;
}
export const usePlanStore = create<PlanState>()(
  persist((set) => ({
    plans: [],
    addPlan: (data) =>
      set((s) => ({
        plans: [...s.plans, { ...data, id: genId(), order: s.plans.length, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      })),
    togglePlan: (id) =>
      set((s) => ({
        plans: s.plans.map((p) => (p.id === id ? { ...p, done: !p.done, updatedAt: new Date().toISOString() } : p)),
      })),
    deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
    reorderPlans: (id, direction) =>
      set((s) => {
        const sorted = [...s.plans].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((p) => p.id === id);
        if (idx < 0) return s;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return s;
        [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
        sorted.forEach((p, i) => (p.order = i));
        return { plans: sorted };
      }),
  }), { name: 'lukin-plans' })
);

// ===== 错题记录 =====
interface MistakeState {
  mistakes: Mistake[];
  addMistake: (data: Omit<Mistake, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteMistake: (id: string) => void;
  updateMistake: (id: string, data: Partial<Mistake>) => void;
}
export const useMistakeStore = create<MistakeState>()(
  persist((set) => ({
    mistakes: [],
    addMistake: (data) =>
      set((s) => ({
        mistakes: [{ ...data, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...s.mistakes],
      })),
    deleteMistake: (id) => set((s) => ({ mistakes: s.mistakes.filter((m) => m.id !== id) })),
    updateMistake: (id, data) =>
      set((s) => ({
        mistakes: s.mistakes.map((m) => (m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m)),
      })),
  }), { name: 'lukin-mistakes' })
);

// ===== 每日复盘 =====
interface ReviewState {
  reviews: Review[];
  addReview: (data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteReview: (id: string) => void;
}
export const useReviewStore = create<ReviewState>()(
  persist((set) => ({
    reviews: [],
    addReview: (data) =>
      set((s) => ({
        reviews: [{ ...data, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...s.reviews],
      })),
    deleteReview: (id) => set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),
  }), { name: 'lukin-reviews' })
);

// ===== 试卷分析 =====
interface PaperState {
  papers: Paper[];
  addPaper: (data: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deletePaper: (id: string) => void;
  updatePaper: (id: string, data: Partial<Paper>) => void;
}
export const usePaperStore = create<PaperState>()(
  persist((set) => ({
    papers: [],
    addPaper: (data) =>
      set((s) => ({
        papers: [...s.papers, { ...data, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      })),
    deletePaper: (id) => set((s) => ({ papers: s.papers.filter((p) => p.id !== id) })),
    updatePaper: (id, data) =>
      set((s) => ({
        papers: s.papers.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)),
      })),
  }), { name: 'lukin-papers' })
);

// ===== 每日考点 =====
interface CheckpointState {
  customCheckpoints: DailyCheckpoint[];  // 用户自定义的覆盖
  getCheckpoint: (date: string, examType: string, subject: string) => DailyCheckpoint;
  setCustomCheckpoint: (data: DailyCheckpoint) => void;
}
export const useCheckpointStore = create<CheckpointState>()(
  persist((set, get) => ({
    customCheckpoints: [],
    getCheckpoint: (date, examType, subject) => {
      const custom = get().customCheckpoints.find(
        (c) => c.date === date && c.examType === examType && c.subject === subject
      );
      if (custom) return custom;
      return { date, examType: examType as any, subject: subject as any, content: '', isCustom: false };
    },
    setCustomCheckpoint: (data) =>
      set((s) => {
        const idx = s.customCheckpoints.findIndex(
          (c) => c.date === data.date && c.examType === data.examType && c.subject === data.subject
        );
        if (idx >= 0) {
          const updated = [...s.customCheckpoints];
          updated[idx] = { ...data, isCustom: true };
          return { customCheckpoints: updated };
        }
        return { customCheckpoints: [...s.customCheckpoints, { ...data, isCustom: true }] };
      }),
  }), { name: 'lukin-checkpoints' })
);

// ===== 理财 =====
interface FinanceState {
  records: FinanceRecord[];
  addRecord: (data: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteRecord: (id: string) => void;
  updateRecord: (id: string, data: Partial<FinanceRecord>) => void;
}
export const useFinanceStore = create<FinanceState>()(
  persist((set) => ({
    records: [],
    addRecord: (data) =>
      set((s) => ({
        records: [...s.records, { ...data, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      })),
    deleteRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
    updateRecord: (id, data) =>
      set((s) => ({
        records: s.records.map((r) => (r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r)),
      })),
  }), { name: 'lukin-finance' })
);

// ===== 积累板块 =====
interface CollectionState {
  items: CollectionItem[];
  goals: CollectionGoal[];
  addItems: (items: Omit<CollectionItem, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  toggleItemDone: (id: string, date: string) => void;
  toggleFavorite: (id: string) => void;
  deleteItem: (id: string) => void;
  deleteFolder: (folderName: string) => void;
  setGoal: (folderName: string, type: CollectionItem['type'], dailyGoal: number) => void;
  getGoal: (folderName: string) => number;
}
export const useCollectionStore = create<CollectionState>()(
  persist((set, get) => ({
    items: [],
    goals: [],
    addItems: (newItems) =>
      set((s) => ({
        items: [
          ...s.items,
          ...newItems.map((item, i) => ({
            ...item,
            id: genId(),
            order: s.items.filter((it) => it.folderName === item.folderName).length + i,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        ],
      })),
    toggleItemDone: (id, date) =>
      set((s) => ({
        items: s.items.map((it) =>
          it.id === id
            ? { ...it, done: !it.done, doneDate: !it.done ? date : undefined, updatedAt: new Date().toISOString() }
            : it
        ),
      })),
    toggleFavorite: (id) =>
      set((s) => ({
        items: s.items.map((it) =>
          it.id === id
            ? { ...it, favorite: !it.favorite, updatedAt: new Date().toISOString() }
            : it
        ),
      })),
    deleteItem: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
    deleteFolder: (folderName) =>
      set((s) => ({
        items: s.items.filter((it) => it.folderName !== folderName),
        goals: s.goals.filter((g) => g.folderName !== folderName),
      })),
    setGoal: (folderName, type, dailyGoal) =>
      set((s) => {
        const idx = s.goals.findIndex((g) => g.folderName === folderName);
        if (idx >= 0) {
          const updated = [...s.goals];
          updated[idx] = { ...updated[idx], type, dailyGoal, updatedAt: new Date().toISOString() };
          return { goals: updated };
        }
        return {
          goals: [...s.goals, { folderName, type, dailyGoal, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        };
      }),
    getGoal: (folderName) => get().goals.find((g) => g.folderName === folderName)?.dailyGoal ?? 10,
  }), { name: 'lukin-collection' })
);

// ===== 用户设置 =====
interface SettingsState {
  settings: UserSettings;
  updateSettings: (data: Partial<UserSettings>) => void;
}
export const useSettingsStore = create<SettingsState>()(
  persist((set) => ({
    settings: {
      pomodoroDefaultMinutes: 25,
      pomodoroDefaultMode: 'countdown',
      dailyGoalMinutes: 180,
      examDateAlarm: true,
    },
    updateSettings: (data) =>
      set((s) => ({ settings: { ...s.settings, ...data } })),
  }), { name: 'lukin-settings' })
);

// ===== 笔记本 =====
interface NoteState {
  notes: NoteItem[];
  addNote: (data: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, data: Partial<Omit<NoteItem, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
}
export const useNoteStore = create<NoteState>()(
  persist((set) => ({
    notes: [],
    addNote: (data) =>
      set((s) => ({
        notes: [{ ...data, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...s.notes],
      })),
    updateNote: (id, data) =>
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n)),
      })),
    deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
  }), { name: 'lukin-notes' })
);

// ===== 错题小类（分类管理） =====
export const DEFAULT_SUBCATEGORIES: Record<SubjectId, string[]> = {
  verbal:   ['逻辑填空', '片段阅读', '语句表达'],
  logic:    ['图形推理', '定义判断', '类比推理', '逻辑判断'],
  quantity: ['工程问题', '行程问题', '排列组合', '概率问题', '几何问题'],
  data:     ['增长', '比重', '平均数', '倍数'],
  politics: ['政治理论', '法律', '经济', '历史人文', '科技常识'],
  essay:    ['归纳概括', '综合分析', '提出对策', '贯彻执行', '大作文'],
  current:  ['国内时政', '国际时政'],
  science:  ['数字推理', '数学运算', '科学推理'],
};

interface SubCategoryState {
  custom: Partial<Record<SubjectId, string[]>>;   // 用户自定义小类（按大类 id）
  addSubCategory: (subject: SubjectId, name: string) => void;
  removeSubCategory: (subject: SubjectId, name: string) => void;
}
export const useSubCategoryStore = create<SubCategoryState>()(
  persist((set) => ({
    custom: {},
    addSubCategory: (subject, name) =>
      set((s) => {
        const trimmed = name.trim();
        if (!trimmed) return s;
        const existing = s.custom[subject] || [];
        if (existing.includes(trimmed) || DEFAULT_SUBCATEGORIES[subject].includes(trimmed)) return s;
        return { custom: { ...s.custom, [subject]: [...existing, trimmed] } };
      }),
    removeSubCategory: (subject, name) =>
      set((s) => ({
        custom: {
          ...s.custom,
          [subject]: (s.custom[subject] || []).filter((n) => n !== name),
        },
      })),
  }), { name: 'lukin-subcategories' })
);

// 获取某大类的全部小类（默认 + 自定义）
export function getSubCategories(subject: SubjectId, custom: Partial<Record<SubjectId, string[]>>): string[] {
  return [...DEFAULT_SUBCATEGORIES[subject], ...(custom[subject] || [])];
}
