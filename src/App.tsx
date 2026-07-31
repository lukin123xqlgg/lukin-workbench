import { useState, useEffect } from 'react';
import { BottomNav } from './components/layout/BottomNav';
import type { TabKey } from './components/layout/tabs';
import HomePage from './components/home/HomePage';
import PlanPage from './components/plan/PlanPage';
import StatsPage from './components/stats/StatsPage';
import PaperPage from './components/paper/PaperPage';
import MistakePage from './components/mistake/MistakePage';
import CollectionPage from './components/collection/CollectionPage';
import FinancePage from './components/finance/FinancePage';
import TimerPage from './components/timer/TimerPage';
import CheckinPage from './components/checkin/CheckinPage';
import { usePomodoroStore } from './store/pomodoroStore';
import { useThemeStore, THEMES, getActiveFontColors } from './store/themeStore';

type PageKey = TabKey | 'timer' | 'checkin';

function App() {
  const [activeTab, setActiveTab] = useState<PageKey>('home');
  const tick = usePomodoroStore((s) => s.tick);
  const theme = useThemeStore((s) => s.theme);
  const fontColor = useThemeStore((s) => s.fontColor);
  const customFontColor = useThemeStore((s) => s.customFontColor);
  const themeConfig = THEMES[theme];

  // 番茄钟计时 tick —— 全局运行
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // 通过 CSS 变量动态注入主题色 + 字体颜色
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-bg', themeConfig.bg);
    root.style.setProperty('--app-bg-light', themeConfig.light);
    root.style.setProperty('--app-primary', themeConfig.primary);
    root.style.setProperty('--app-secondary', themeConfig.secondary);
    root.style.setProperty('--app-gradient', themeConfig.gradient);

    const fontState = {
      theme, fontColor, customFontColor,
      mascot: 'bear', setTheme: () => {}, setMascot: () => {},
      setFontColor: () => {}, setCustomFontColor: () => {},
    } as any;
    const { color, soft } = getActiveFontColors(fontState);
    root.style.setProperty('--app-text', color);
    root.style.setProperty('--app-text-soft', soft);
  }, [theme, fontColor, customFontColor, themeConfig]);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as PageKey);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'plan':
        return <PlanPage />;
      case 'stats':
        return <StatsPage />;
      case 'paper':
        return <PaperPage />;
      case 'mistake':
        return <MistakePage />;
      case 'collection':
        return <CollectionPage />;
      case 'finance':
        return <FinancePage />;
      case 'timer':
        return <TimerPage />;
      case 'checkin':
        return <CheckinPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div
      className="min-h-screen max-w-[480px] mx-auto relative transition-colors duration-300"
      style={{ backgroundColor: 'var(--app-bg)', color: 'var(--app-text)' }}
    >
      <main
        className="min-h-screen"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        {renderPage()}
      </main>
      <BottomNav active={activeTab as TabKey} onChange={setActiveTab} />
    </div>
  );
}

export default App;