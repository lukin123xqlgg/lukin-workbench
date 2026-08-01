import { useState } from 'react';
import { usePomodoroStore } from '../../store/pomodoroStore';
import { SUBJECTS, SUBJECT_MAP, POMODORO_PRESETS, formatTime } from '../../config/constants';
import type { TimerMode, SubjectId } from '../../config/constants';
import { Button, SubjectTag } from '../common';

// 可复用番茄钟：正向计时 / 倒计时（预设 + 自定义分钟）+ 板块选择
// compact=true 时用于首页卡片（更小的进度环）
export default function PomodoroTimer({ compact = false }: { compact?: boolean }) {
  const {
    isRunning,
    currentSubject,
    currentMode,
    targetSeconds,
    elapsedSeconds,
    start,
    stop,
    reset,
  } = usePomodoroStore();

  const [mode, setMode] = useState<TimerMode>('countdown');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(SUBJECTS[0].id);
  const [presetMinutes, setPresetMinutes] = useState<number>(25);
  const [customMinutes, setCustomMinutes] = useState<string>('');

  // 显示时间
  const displaySeconds =
    mode === 'countdown' && isRunning && currentMode === 'countdown'
      ? Math.max(0, targetSeconds - elapsedSeconds)
      : elapsedSeconds;

  // 进度环比例
  const progress =
    isRunning && currentMode === 'countdown' && targetSeconds > 0
      ? elapsedSeconds / targetSeconds
      : 0;

  const ringSize = compact ? 180 : 280;
  const ringRadius = compact ? 76 : 120;
  const ringCenter = ringSize / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;

  const handleStart = () => {
    if (mode === 'countdown') {
      const mins = customMinutes ? parseInt(customMinutes, 10) : presetMinutes;
      if (!mins || mins <= 0) return;
      start(selectedSubject, 'countdown', mins);
    } else {
      start(selectedSubject, 'stopwatch');
    }
  };

  const activeSubject =
    isRunning && currentSubject ? SUBJECT_MAP[currentSubject as SubjectId] : SUBJECT_MAP[selectedSubject];

  return (
    <div>
      {/* ===== 模式切换 ===== */}
      <div className="flex gap-2 p-1 bg-pink-50 rounded-2xl">
        <button
          onClick={() => !isRunning && setMode('stopwatch')}
          disabled={isRunning}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
            mode === 'stopwatch'
              ? 'bg-white text-pink-500 shadow-cute'
              : 'text-gray-400'
          } ${isRunning ? 'opacity-50' : ''}`}
        >
          ⏱️ 正向计时
        </button>
        <button
          onClick={() => !isRunning && setMode('countdown')}
          disabled={isRunning}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
            mode === 'countdown'
              ? 'bg-white text-pink-500 shadow-cute'
              : 'text-gray-400'
          } ${isRunning ? 'opacity-50' : ''}`}
        >
          ⏰ 倒计时
        </button>
      </div>

      {/* ===== 倒计时时长：预设 + 自定义 ===== */}
      {mode === 'countdown' && !isRunning && (
        <div className="mt-3 animate-fade-in">
          <div className="flex gap-2 mb-2">
            {POMODORO_PRESETS.map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setPresetMinutes(mins);
                  setCustomMinutes('');
                }}
                className={`flex-1 py-2 rounded-2xl text-sm font-bold transition active:scale-95 ${
                  presetMinutes === mins && !customMinutes
                    ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-cute'
                    : 'bg-white text-gray-500 shadow-cute'
                }`}
              >
                {mins}min
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-medium whitespace-nowrap">自定义</span>
            <input
              type="number"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="输入分钟数"
              min={1}
              max={180}
              className="flex-1 px-4 py-2 bg-pink-50/50 border border-pink-100 rounded-2xl text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-pink-300 focus:bg-white transition"
            />
            <span className="text-sm text-gray-400 font-medium">分钟</span>
          </div>
        </div>
      )}

      {/* ===== 圆形进度环 ===== */}
      <div className="flex justify-center py-4">
        <div className="relative">
          <svg width={ringSize} height={ringSize} className="timer-ring">
            <circle
              cx={ringCenter}
              cy={ringCenter}
              r={ringRadius}
              fill="none"
              stroke="#FFE0EC"
              strokeWidth={compact ? 9 : 12}
            />
            {isRunning && currentMode === 'countdown' && (
              <circle
                cx={ringCenter}
                cy={ringCenter}
                r={ringRadius}
                fill="none"
                stroke={`url(#ringGradient${compact ? 'C' : ''})`}
                strokeWidth={compact ? 9 : 12}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            )}
            {isRunning && currentMode === 'stopwatch' && (
              <circle
                cx={ringCenter}
                cy={ringCenter}
                r={ringRadius}
                fill="none"
                stroke={`url(#ringGradient${compact ? 'C' : ''})`}
                strokeWidth={compact ? 9 : 12}
                strokeLinecap="round"
                strokeDasharray={`${ringCircumference * 0.25} ${ringCircumference}`}
                style={{
                  animation: 'spin 3s linear infinite',
                  transformOrigin: `${ringCenter}px ${ringCenter}px`,
                }}
              />
            )}
            <defs>
              <linearGradient id={`ringGradient${compact ? 'C' : ''}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B9D" />
                <stop offset="100%" stopColor="#FFAAA5" />
              </linearGradient>
            </defs>
          </svg>
          {/* 中心内容 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`${compact ? 'text-3xl' : 'text-4xl'} font-bold text-gray-800 tabular-nums`}>
              {formatTime(displaySeconds)}
            </div>
            {isRunning && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-lg">{activeSubject?.emoji}</span>
                <span className="text-sm font-medium" style={{ color: activeSubject?.color }}>
                  {activeSubject?.name}
                </span>
              </div>
            )}
            {!isRunning && (
              <div className="mt-1.5 text-xs text-gray-300 font-medium">
                {mode === 'countdown' ? '准备好了吗？' : '开始专注吧'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 板块选择 ===== */}
      <div className="pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {SUBJECTS.map((subject) => (
            <SubjectTag
              key={subject.id}
              emoji={subject.emoji}
              name={subject.name}
              color={subject.color}
              bg={subject.bg}
              active={isRunning ? currentSubject === subject.id : selectedSubject === subject.id}
              onClick={() => !isRunning && setSelectedSubject(subject.id)}
            />
          ))}
        </div>
      </div>

      {/* ===== 开始/停止按钮 ===== */}
      <div className="flex justify-center items-center gap-4 pb-1">
        <button
          onClick={isRunning ? stop : handleStart}
          className={`${compact ? 'w-16 h-16 text-xl' : 'w-20 h-20 text-2xl'} rounded-full flex items-center justify-center text-white font-bold shadow-cute-lg transition active:scale-90 ${
            isRunning
              ? 'bg-gradient-to-r from-gray-400 to-gray-500'
              : 'bg-gradient-to-r from-pink-400 to-pink-500'
          }`}
        >
          {isRunning ? '⏹' : '▶'}
        </button>
        {isRunning && (
          <Button variant="ghost" size="sm" onClick={reset}>
            重置
          </Button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
