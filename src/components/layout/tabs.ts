import { Home, ListChecks, BarChart3, FileText, AlertCircle, BookMarked, Wallet } from 'lucide-react';

export type TabKey = 'home' | 'plan' | 'stats' | 'paper' | 'mistake' | 'collection' | 'finance';

export const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'home',       label: '首页',   icon: Home },
  { key: 'plan',       label: '计划',   icon: ListChecks },
  { key: 'stats',      label: '统计',   icon: BarChart3 },
  { key: 'paper',      label: '试卷',   icon: FileText },
  { key: 'mistake',    label: '错题',   icon: AlertCircle },
  { key: 'collection', label: '积累',   icon: BookMarked },
  { key: 'finance',    label: '理财',   icon: Wallet },
];
