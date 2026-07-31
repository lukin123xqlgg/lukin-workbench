import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'pink' | 'mint' | 'sky' | 'lemon';
export type Mascot = 'bear' | 'rabbit' | 'cat' | 'chick';

export const THEMES: Record<ThemeName, { name: string; emoji: string; primary: string; secondary: string; bg: string; light: string; gradient: string }> = {
  pink:  { name: '马卡龙粉紫', emoji: '🌸', primary: '#E8A0BF', secondary: '#B9A7D9', bg: '#FBF3F6', light: '#FDE8F0', gradient: 'linear-gradient(135deg, #FDE8F0 0%, #FBF3F6 50%, #F0EBF7 100%)' },
  mint:  { name: '薄荷绿',     emoji: '🌿', primary: '#8BAA8B', secondary: '#A8D8C9', bg: '#F5FAF7', light: '#E8F5F0', gradient: 'linear-gradient(135deg, #E8F5F0 0%, #F5FAF7 50%, #E0F0F1 100%)' },
  sky:   { name: '天空蓝',     emoji: '☁️', primary: '#7BA7C9', secondary: '#A5C9E8', bg: '#F5F9FC', light: '#EAF2FA', gradient: 'linear-gradient(135deg, #EAF2FA 0%, #F5F9FC 50%, #E8EEF1 100%)' },
  lemon: { name: '奶油黄',     emoji: '🍋', primary: '#D4B85A', secondary: '#F5D982', bg: '#FDF9EF', light: '#FDF6E3', gradient: 'linear-gradient(135deg, #FDF6E3 0%, #FDF9EF 50%, #FFF8E1 100%)' },
};

export const MASCOTS: Record<Mascot, { name: string; emoji: string }> = {
  bear:   { name: '小熊', emoji: '🐻' },
  rabbit: { name: '小兔', emoji: '🐰' },
  cat:    { name: '小猫', emoji: '🐱' },
  chick:  { name: '小鸡', emoji: '🐥' },
};

interface ThemeState {
  theme: ThemeName;
  mascot: Mascot;
  setTheme: (t: ThemeName) => void;
  setMascot: (m: Mascot) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'pink',
      mascot: 'rabbit',
      setTheme: (theme) => set({ theme }),
      setMascot: (mascot) => set({ mascot }),
    }),
    { name: 'lukin-theme' }
  )
);
