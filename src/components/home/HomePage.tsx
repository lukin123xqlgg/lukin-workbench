     import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Pencil, ChevronRight } from 'lucide-react';
import MascotAvatar from '../common/MascotAvatar';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  onNavigate?: (tab: string) => void;
}

interface ExamDate {
  name: string;
  icon: string;
  date: string; // YYYY-MM-DD
}

const DEFAULT_EXAMS: ExamDate[] = [
  { name: '国考',   icon: '🇨🇳', date: '2026-11-29' },
  { name: '省考',   icon: '🏛️', date: '2026-12-05' },
  { name: '事业编', icon: '🏢', date: '2026-10-17' },
];

const STORAGE_KEY = 'lukin-exam-dates';

function formatDateCN(date: Date) {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
}

function daysUntil(targetDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function HomePage({ onNavigate }: Props) {
  const mascot = useThemeStore((s) => s.mascot);
  const [now, setNow] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [exams, setExams] = useState<ExamDate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_EXAMS;
    } catch {
      return DEFAULT_EXAMS;
    }
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
  }, [exams]);

  const todayStr = useMemo(() => formatDateCN(now), [now]);

  const stats = [
    { value: '0', label: '累计刷题' },
    { value: '0%', label: '正确率' },
    { value: '0', label: '连续打卡' },
  ];

  const handleDateChange = (index: number, newDate: string) => {
    setExams((prev) =>
      prev.map((exam, i) => (i === index ? { ...exam, date: newDate } : exam))
    );
  };

  return (
    <div className="min-h-screen pb-6">
      {/* 顶部渐变卡片 */}
      <div
        className="relative rounded-b-[32px] px-5 pt-6 pb-8 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #B9A7D9 0%, #E8A0BF 55%, #F5C0B8 100%)',
        }}
      >
        {/* 装饰圆形 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute top-20 -right-6 w-24 h-24 rounded-full bg-white/10" />

        {/* 标题区 */}
        <div className="relative flex items-center gap-3 mb-1">
          <span className="text-3xl">🦄</span>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">公考小星球</h1>
        </div>
        <p className="relative text-white/90 text-sm mb-6 pl-1">粉蓝小宇宙，每天进步一点点 ✨</p>

        {/* 日期 & 设置考试时间 */}
        <div className="relative flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white/25 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-white">
            <Calendar size={18} className="text-white" />
            <span className="text-sm font-semibold">{todayStr}</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 bg-white/25 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-white active:scale-95 transition"
          >
            <Clock size={16} />
            <span className="text-sm font-semibold">设置考试时间</span>
            <Pencil size={14} />
          </button>
        </div>

        {/* 倒计时卡片 */}
        <div className="relative grid grid-cols-3 gap-3">
          {exams.map((exam) => {
            const days = daysUntil(exam.date);
            return (
              <div
                key={exam.name}
                className="flex flex-col items-center rounded-2xl bg-white/20 backdrop-blur-sm px-2 py-4 text-white"
              >
                <span className="text-xl mb-1">{exam.icon}</span>
                <span className="text-sm font-medium opacity-95">{exam.name}</span>
                <div className="flex items-baseline gap-0.5 mt-1">
                  <span className="text-3xl font-extrabold">{days}</span>
                  <span className="text-xs opacity-90">天</span>
                </div>
                <span className="text-[10px] opacity-80 mt-1">{exam.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 吉祥物互动区 */}
      <div className="px-5 -mt-2">
        <div className="relative h-28 rounded-2xl overflow-hidden bg-gradient-to-b from-[#E8F4FD] to-[#F0EBF7] shadow-cute">
          <div className="absolute top-3 left-4 text-xl opacity-50 animate-float" style={{ animationDuration: '5s' }}>☁️</div>
          <div className="absolute top-5 right-10 text-lg opacity-40 animate-float" style={{ animationDuration: '6s' }}>☁️</div>
          <div className="absolute top-3 right-24 text-sm opacity-40">☀️</div>
          <div className="absolute bottom-1 left-0 right-0">
            <MascotAvatar mascot={mascot} size={72} />
          </div>
        </div>
      </div>

      {/* 今日概览统计 */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-2xl bg-white px-3 py-4 shadow-cute"
            >
              <span className="text-2xl font-extrabold text-pink-400">{s.value}</span>
              <span className="text-xs text-gray-500 mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 今日学习 */}
      <div className="px-5 mt-4">
        <button
          onClick={() => onNavigate?.('checkin')}
          className="w-full flex items-center justify-between rounded-2xl px-4 py-4 active:scale-[0.98] transition"
          style={{ background: 'linear-gradient(90deg, #FDE8F0 0%, #F0EBF7 100%)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <div className="text-left">
              <div className="text-sm font-bold text-pink-500">今日学习</div>
              <div className="text-xs text-gray-500 mt-0.5">还没打卡哦～点击去打卡</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-extrabold text-pink-500">0m</span>
            <ChevronRight size={16} className="text-pink-400" />
          </div>
        </button>
      </div>

      {/* 占位内容，避免底部导航遮挡 */}
      <div className="h-20" />

      {/* 设置考试时间弹窗 */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-cute-lg animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">设置考试时间</h3>
            <div className="space-y-3">
              {exams.map((exam, index) => (
                <div key={exam.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{exam.icon}</span>
                    <span className="text-sm text-gray-700">{exam.name}</span>
                  </div>
                  <input
                    type="date"
                    value={exam.date}
                    onChange={(e) => handleDateChange(index, e.target.value)}
                    className="text-sm border border-pink-100 rounded-xl px-2 py-1.5 text-gray-700 focus:outline-none focus:border-pink-300"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-400 to-pink-500 text-white text-sm font-bold active:scale-95 transition"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
