import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'pink' | 'mint' | 'sky' | 'lemon' | 'teal' | 'custom';
export type Mascot = 'bear' | 'rabbit' | 'cat' | 'chick' | 'dog' | 'panda' | 'penguin';
export type FontColorName = 'dark' | 'pink' | 'brown' | 'gray' | 'custom';

export interface ThemeConfig {
  name: string; emoji: string; primary: string; secondary: string;
  bg: string; light: string; gradient: string; text: string; textSoft: string;
}

// 颜色混合工具：把 hex 颜色与白色按比例混合（用于自定义主题生成浅色背景）
function mixWithWhite(hex: string, ratio: number): string {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * ratio);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

// 颜色调暗（用于自定义主题生成文字色）
function darken(hex: string, ratio: number): string {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const dim = (c: number) => Math.round(c * (1 - ratio));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(dim(r))}${toHex(dim(g))}${toHex(dim(b))}`;
}

// 根据用户自选颜色生成一整套主题
export function buildCustomTheme(primary: string): ThemeConfig {
  const secondary = mixWithWhite(primary, 0.25);
  const light = mixWithWhite(primary, 0.86);
  const bg = mixWithWhite(primary, 0.94);
  return {
    name: '自定义', emoji: '🎨',
    primary,
    secondary,
    bg,
    light,
    gradient: `linear-gradient(135deg, ${light} 0%, ${bg} 50%, ${mixWithWhite(primary, 0.9)} 100%)`,
    text: darken(primary, 0.45),
    textSoft: mixWithWhite(darken(primary, 0.3), 0.35),
  };
}

export const THEMES: Record<Exclude<ThemeName, 'custom'>, ThemeConfig> = {
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
  teal: {
    name: '海盐蓝绿', emoji: '🐬',
    primary: '#5AAFAA', secondary: '#8FD0C8',
    bg: '#F2FAF9', light: '#E3F4F2',
    gradient: 'linear-gradient(135deg, #E3F4F2 0%, #F2FAF9 50%, #E0F0FA 100%)',
    text: '#3A5250', textSoft: '#7A9290',
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
  customThemeColor: string;
  setTheme: (t: ThemeName) => void;
  setMascot: (m: Mascot) => void;
  setFontColor: (f: FontColorName) => void;
  setCustomFontColor: (c: string) => void;
  setCustomThemeColor: (c: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'pink',
      mascot: 'rabbit',
      fontColor: 'pink',
      customFontColor: '#7A4A5A',
      customThemeColor: '#E8A0BF',
      setTheme: (theme) => set({ theme }),
      setMascot: (mascot) => set({ mascot }),
      setFontColor: (fontColor) => set({ fontColor }),
      setCustomFontColor: (customFontColor) => set({ customFontColor }),
      setCustomThemeColor: (customThemeColor) => set({ customThemeColor }),
    }),
    { name: 'lukin-theme' }
  )
);

// 获取当前生效的主题配置（预设 + 自定义）
export function getActiveTheme(state: Pick<ThemeState, 'theme' | 'customThemeColor'>): ThemeConfig {
  if (state.theme === 'custom') {
    return buildCustomTheme(state.customThemeColor);
  }
  return THEMES[state.theme];
}

// 获取当前应用的字体颜色
export function getActiveFontColors(state: ThemeState): { color: string; soft: string } {
  if (state.fontColor === 'custom') {
    return { color: state.customFontColor, soft: state.customFontColor + 'AA' };
  }
  const preset = FONT_COLORS[state.fontColor];
  return { color: preset.color, soft: preset.soft };
}