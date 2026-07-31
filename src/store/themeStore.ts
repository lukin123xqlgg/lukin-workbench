import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'pink' | 'mint' | 'sky' | 'lemon';
export type Mascot = 'bear' | 'rabbit' | 'cat' | 'chick' | 'dog' | 'panda' | 'penguin';
export type FontColorName = 'dark' | 'pink' | 'brown' | 'gray' | 'custom';

export const THEMES: Record<ThemeName, {
  name: string; emoji: string; primary: string; secondary: string;
  bg: string; light: string; gradient: string; text: string; textSoft: string;
}> = {
  pink: {
    name: '马卡龙粉紫', emoji: '🌸',
    primary: '#E8A0BF', secondary: '#B9A7D9',
    bg: '#FBF3F6', light: '#FDE8F0',
    gradient: 'linear-gradient(135deg, #FDE8F0 0%, #FBF3F6 50%, #F0EBF7 100%)',
    text: '#5A4A52', textSoft: '#8A7A82',
  },
  mint: {
    name: '薄荷绿', emoji: '🌿',
    primary: '#8BAA8B', secondary: '#A8D8C9',
    bg: '#F5FAF7', light: '#E8F5F0',
    gradient: 'linear-gradient(135deg, #E8F5F0 0%, #F5FAF7 50%, #E0F0F1 100%)',
    text: '#3A4A3E', textSoft: '#7A8A7E',
  },
  sky: {
    name: '天空蓝', emoji: '☁️',
    primary: '#7BA7C9', secondary: '#A5C9E8',
    bg: '#F5F9FC', light: '#EAF2FA',
    gradient: 'linear-gradient(135deg, #EAF2FA 0%, #F5F9FC 50%, #E8EEF1 100%)',
    text: '#3A4252', textSoft: '#7A8290',
  },
  lemon: {
    name: '奶油黄', emoji: '🍋',
    primary: '#D4B85A', secondary: '#F5D982',
    bg: '#FDF9EF', light: '#FDF6E3',
    gradient: 'linear-gradient(135deg, #FDF6E3 0%, #FDF9EF 50%, #FFF8E1 100%)',
    text: '#5A4E2A', textSoft: '#8A7E5A',
  },
};

export const FONT_COLORS: Record<Exclude<FontColorName, 'custom'>, { name: string; color: string; soft: string; preview: string }> = {
  dark:   { name: '深灰',   color: '#3D3D3D', soft: '#6B6B6B', preview: '#3D3D3D' },
  pink:   { name: '粉红',   color: '#7A4A5A', soft: '#B07080', preview: '#D97B9F' },
  brown:  { name: '棕色',   color: '#5A4A3A', soft: '#8A7A6A', preview: '#8B6F47' },
  gray:   { name: '墨灰',   color: '#2D2D3A', soft: '#5D5D6A', preview: '#2D2D3A' },
};

export const MASCOTS: Record<Mascot, { name: string; emoji: string; file: string }> = {
  bear:    { name: '小熊',   emoji: '🐻', file: 'bear.png' },
  rabbit:  { name: '小兔',   emoji: '🐰', file: 'rabbit.png' },
  cat:     { name: '小猫',   emoji: '🐱', file: 'cat.png' },
  chick:   { name: '小鸡',   emoji: '🐥', file: 'chick.png' },
  dog:     { name: '小狗',   emoji: '🐶', file: 'dog.png' },
  panda:   { name: '小熊猫', emoji: '🐼', file: 'panda.png' },
  penguin: { name: '企鹅',   emoji: '🐧', file: 'penguin.png' },
};

interface ThemeState {
  theme: ThemeName;
  mascot: Mascot;
  fontColor: FontColorName;
  customFontColor: string;
  setTheme: (t: ThemeName) => void;
  setMascot: (m: Mascot) => void;
  setFontColor: (f: FontColorName) => void;
  setCustomFontColor: (c: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'pink',
      mascot: 'rabbit',
      fontColor: 'pink',
      customFontColor: '#7A4A5A',
      setTheme: (theme) => set({ theme }),
      setMascot: (mascot) => set({ mascot }),
      setFontColor: (fontColor) => set({ fontColor }),
      setCustomFontColor: (customFontColor) => set({ customFontColor }),
    }),
    { name: 'lukin-theme' }
  )
);

// 获取当前应用的字体颜色
export function getActiveFontColors(state: ThemeState): { color: string; soft: string } {
  if (state.fontColor === 'custom') {
    return { color: state.customFontColor, soft: state.customFontColor + 'AA' };
  }
  const preset = FONT_COLORS[state.fontColor];
  return { color: preset.color, soft: preset.soft };
}