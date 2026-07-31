import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 树的成长阶段
export type TreeStage = 'seed' | 'sprout' | 'seedling' | 'small' | 'medium' | 'large' | 'bloom';

export const TREE_STAGES: Record<TreeStage, {
  name: string; emoji: string; minGrowth: number; description: string;
}> = {
  seed:     { name: '种子',   emoji: '🌱', minGrowth: 0,   description: '刚种下的小种子，等待发芽~' },
  sprout:   { name: '发芽',   emoji: '🌿', minGrowth: 5,   description: '冒出嫩绿的小芽！' },
  seedling: { name: '小苗',   emoji: '☘️', minGrowth: 15,  description: '长出几片叶子了~' },
  small:    { name: '小树',   emoji: '🌳', minGrowth: 30,  description: '已经有小树的模样！' },
  medium:   { name: '中树',   emoji: '🌲', minGrowth: 60,  description: '枝叶越来越茂盛~' },
  large:    { name: '大树',   emoji: '🌴', minGrowth: 100, description: '参天大树，好壮观！' },
  bloom:    { name: '开花树', emoji: '🌸', minGrowth: 150, description: '开满鲜花的最美时刻！' },
};

// 营养液获取规则
export const REWARDS = {
  planDone: { amount: 2, label: '完成计划' },
  pomodoro: { amount: 1, label: '番茄钟完成' },
  checkin: { amount: 3, label: '每日打卡' },
  review: { amount: 1, label: '完成复盘' },
  practice: { amount: 1, label: '刷题记录' },
};

interface TreeState {
  growth: number;          // 成长值
  nutrient: number;        // 营养液余额
  totalWatered: number;    // 累计浇水次数
  totalEarned: number;     // 累计获得营养液
  plantedAt: string | null; // 种下日期
  lastWaterAt: string | null; // 上次浇水日期

  // 动作
  earnNutrient: (type: keyof typeof REWARDS) => void;
  water: () => boolean;  // 浇水，消耗 1 营养液，返回是否成功
  getStage: () => TreeStage;
  resetTree: () => void;
}

export const useTreeStore = create<TreeState>()(
  persist(
    (set, get) => ({
      growth: 0,
      nutrient: 0,
      totalWatered: 0,
      totalEarned: 0,
      plantedAt: new Date().toISOString().slice(0, 10),
      lastWaterAt: null,

      earnNutrient: (type) => {
        const amount = REWARDS[type]?.amount || 0;
        if (amount <= 0) return;
        set((s) => ({
          nutrient: s.nutrient + amount,
          totalEarned: s.totalEarned + amount,
          plantedAt: s.plantedAt || new Date().toISOString().slice(0, 10),
        }));
      },

      water: () => {
        const { nutrient } = get();
        if (nutrient <= 0) return false;
        set((s) => ({
          nutrient: s.nutrient - 1,
          growth: s.growth + 1,
          totalWatered: s.totalWatered + 1,
          lastWaterAt: new Date().toISOString().slice(0, 10),
        }));
        return true;
      },

      getStage: () => {
        const { growth } = get();
        const stages = Object.entries(TREE_STAGES) as [TreeStage, typeof TREE_STAGES[TreeStage]][];
        let current: TreeStage = 'seed';
        for (const [key, val] of stages) {
          if (growth >= val.minGrowth) current = key;
        }
        return current;
      },

      resetTree: () => set({
        growth: 0,
        nutrient: 0,
        totalWatered: 0,
        totalEarned: 0,
        plantedAt: new Date().toISOString().slice(0, 10),
        lastWaterAt: null,
      }),
    }),
    { name: 'lukin-tree' }
  )
);