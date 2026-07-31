import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mascot } from './themeStore';

// 食物类型
export interface Food {
  id: string;
  name: string;
  emoji: string;
  price: number;
  exp: number;       // 喂食获得的经验
  mood: number;      // 心情值增加
  desc: string;
  favorites?: Mascot[]; // 哪些动物最爱吃（1.5倍经验）
}

export const FOODS: Food[] = [
  { id: 'carrot',    name: '胡萝卜',   emoji: '🥕', price: 5,  exp: 3,  mood: 5,  desc: '脆甜胡萝卜，小兔最爱', favorites: ['rabbit'] },
  { id: 'corn',      name: '玉米',     emoji: '🌽', price: 5,  exp: 3,  mood: 5,  desc: '金黄玉米粒，香香甜甜', favorites: ['chick'] },
  { id: 'fish',      name: '小鱼干',   emoji: '🐟', price: 8,  exp: 5,  mood: 8,  desc: '鲜美小鱼干，小猫最爱', favorites: ['cat'] },
  { id: 'honey',     name: '蜂蜜',     emoji: '🍯', price: 10, exp: 6,  mood: 10, desc: '甜甜蜂蜜，小熊最爱', favorites: ['bear'] },
  { id: 'meat',      name: '肉骨头',   emoji: '🦴', price: 12, exp: 8,  mood: 12, desc: '大根肉骨头，能量满满' },
  { id: 'dogfood',   name: '狗粮',     emoji: '🥘', price: 6,  exp: 4,  mood: 6,  desc: '营养均衡的狗粮' },
  { id: 'milk',      name: '牛奶',     emoji: '🥛', price: 7,  exp: 4,  mood: 7,  desc: '温热牛奶，好喝补钙' },
  { id: 'cake',      name: '小蛋糕',   emoji: '🍰', price: 15, exp: 10, mood: 15, desc: '精致小蛋糕，豪华大餐' },
  { id: 'apple',     name: '苹果',     emoji: '🍎', price: 4,  exp: 2,  mood: 4,  desc: '新鲜红苹果' },
  { id: 'berry',     name: '草莓',     emoji: '🍓', price: 8,  exp: 5,  mood: 9,  desc: '甜甜小草莓' },
];

// 成长等级
export const LEVELS = [
  { lv: 1, name: '幼崽',   minExp: 0,   emoji: '🥚' },
  { lv: 2, name: '幼年',   minExp: 20,  emoji: '🐣' },
  { lv: 3, name: '少年',   minExp: 50,  emoji: '🐤' },
  { lv: 4, name: '成年',   minExp: 100, emoji: '🐥' },
  { lv: 5, name: '壮年',   minExp: 180, emoji: '🐰' },
  { lv: 6, name: '成熟',   minExp: 300, emoji: '🐇' },
  { lv: 7, name: '大师',   minExp: 500, emoji: '👑' },
];

export function getLevel(exp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (exp >= l.minExp) current = l;
  }
  const next = LEVELS.find((l) => l.minExp > exp);
  return {
    ...current,
    next,
    progress: next
      ? Math.min(100, ((exp - current.minExp) / (next.minExp - current.minExp)) * 100)
      : 100,
  };
}

// 金币获取规则
export const COIN_REWARDS = {
  checkin:   { amount: 5, label: '每日打卡' },
  planDone:  { amount: 3, label: '完成计划' },
  pomodoro:  { amount: 2, label: '番茄钟完成' },
  practice:  { amount: 2, label: '刷题记录' },
  review:    { amount: 2, label: '完成复盘' },
};

// 库存里的食物
interface FoodStock {
  [foodId: string]: number;
}

interface PetState {
  exp: number;
  mood: number;       // 0-100
  coins: number;
  stock: FoodStock;
  totalFed: number;
  lastFedAt: string | null;

  earnCoins: (type: keyof typeof COIN_REWARDS) => void;
  buyFood: (foodId: string, qty?: number) => boolean;
  feed: (foodId: string, mascot: Mascot) => boolean;
  getLevel: () => ReturnType<typeof getLevel>;
  spendCoins: (amount: number) => boolean;
}

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      exp: 0,
      mood: 50,
      coins: 20,
      stock: {},
      totalFed: 0,
      lastFedAt: null,

      earnCoins: (type) => {
        const amount = COIN_REWARDS[type]?.amount || 0;
        if (amount <= 0) return;
        set((s) => ({ coins: s.coins + amount }));
      },

      buyFood: (foodId, qty = 1) => {
        const food = FOODS.find((f) => f.id === foodId);
        if (!food) return false;
        const cost = food.price * qty;
        if (get().coins < cost) return false;
        set((s) => ({
          coins: s.coins - cost,
          stock: { ...s.stock, [foodId]: (s.stock[foodId] || 0) + qty },
        }));
        return true;
      },

      feed: (foodId, mascot) => {
        const food = FOODS.find((f) => f.id === foodId);
        if (!food) return false;
        const have = get().stock[foodId] || 0;
        if (have <= 0) return false;
        // 最爱食物 1.5 倍经验
        const isFav = food.favorites?.includes(mascot);
        const expGain = Math.floor(food.exp * (isFav ? 1.5 : 1));
        const moodGain = Math.min(100, food.mood * (isFav ? 1.2 : 1));
        set((s) => ({
          stock: { ...s.stock, [foodId]: have - 1 },
          exp: s.exp + expGain,
          mood: Math.min(100, s.mood + moodGain),
          totalFed: s.totalFed + 1,
          lastFedAt: new Date().toISOString(),
        }));
        return true;
      },

      getLevel: () => getLevel(get().exp),

      spendCoins: (amount) => {
        if (get().coins < amount) return false;
        set((s) => ({ coins: s.coins - amount }));
        return true;
      },
    }),
    { name: 'lukin-pet' }
  )
);