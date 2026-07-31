import { useEffect, useState } from 'react';
import { usePomodoroStore } from '../../store/pomodoroStore';
import { SUBJECTS, SUBJECT_MAP, POMODORO_PRESETS, formatTime } from '../../config/constants';
import type { TimerMode, SubjectId } from '../../config/constants';
import { Card, Button, SubjectTag, EmptyState } from '../common';
import { todayStr } from '../../hooks';

export default function TimerPage() {
  const {
    sessions,
    isRunning,
    currentSubject,
    currentMode,
    targetSeconds,
    elapsedSeconds,
    start,
    stop,
    tick,
    reset,
  } = usePomodoroStore();

  // 本地 UI 状态
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(SUBJECTS[0].id);
  const [presetMinutes, setPresetMinutes] = useState<number>(25);
  const [customMinutes, setCustomMinutes] = useState<string>('');

  // 挂载时启动 1 秒 interval 调用 tick()
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

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

  const ringRadius = 120;
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

  const handleStop = () => {
    stop();
  };

  // 今天的会话列表
  const today = todayStr();
  const todaySessions = sessions.filter((s) => s.date === today);

  // 当前选中板块信息
  const activeSubject =
    isRunning && currentSubject ? SUBJECT_MAP[currentSubject as SubjectId] : SUBJECT_MAP[selectedSubject];

  return (
    <div className="min-h-screen pb-8">
      {/* ===== 顶部：模式切换 ===== */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex gap-2 p-1 bg-pink-50 rounded-2xl">
          <button
            onClick={() => !isRunning && setMode('stopwatch')}
            disabled={isRunning}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
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
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              mode === 'countdown'
                ? 'bg-white text-pink-500 shadow-cute'
                : 'text-gray-400'
            } ${isRunning ? 'opacity-50' : ''}`}
          >
            ⏰ 倒计时
          </button>
        </div>
      </div>

      {/* ===== 倒计时时长预设 ===== */}
      {mode === 'countdown' && !isRunning && (
        <div className="px-5 pb-4 animate-fade-in">
          <div className="flex gap-2 mb-3">
            {POMODORO_PRESETS.map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setPresetMinutes(mins);
                  setCustomMinutes('');
                }}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition active:scale-95 ${
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
              className="flex-1 px-4 py-2.5 bg-pink-50/50 border border-pink-100 rounded-2xl text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-pink-300 focus:bg-white transition"
            />
            <span className="text-sm text-gray-400 font-medium">分钟</span>
          </div>
        </div>
      )}

      {/* ===== 圆形进度环 ===== */}
      <div className="flex justify-center py-6">
        <div className="relative">
          <svg width="280" height="280" className="timer-ring">
            {/* 底环 */}
            <circle
              cx="140"
              cy="140"
              r={ringRadius}
              fill="none"
              stroke="#FFE0EC"
              strokeWidth="12"
            />
            {/* 进度环 */}
            {isRunning && currentMode === 'countdown' && (
              <circle
                cx="140"
                cy="140"
                r={ringRadius}
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            )}
            {/* 正向计时模式：装饰环 */}
            {isRunning && currentMode === 'stopwatch' && (
              <circle
                cx="140"
                cy="140"
                r={ringRadius}
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${ringCircumference * 0.25} ${ringCircumference}`}
                style={{
                  animation: 'spin 3s linear infinite',
                  transformOrigin: '140px 140px',
                }}
              />
            )}
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B9D" />
                <stop offset="100%" stopColor="#FFAAA5" />
              </linearGradient>
            </defs>
          </svg>
          {/* 中心内容 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-800 tabular-nums">
              {formatTime(displaySeconds)}
            </div>
            {isRunning && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-lg">{activeSubject?.emoji}</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: activeSubject?.color }}
                >
                  {activeSubject?.name}
                </span>
              </div>
            )}
            {!isRunning && (
              <div className="mt-2 text-xs text-gray-300 font-medium">
                {mode === 'countdown' ? '准备好了吗？' : '开始专注吧'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 板块选择 ===== */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {SUBJECTS.map((subject) => (
            <SubjectTag
              key={subject.id}
              emoji={subject.emoji}
              name={subject.name}
              color={subject.color}
              bg={subject.bg}
              active={
                isRunning
                  ? currentSubject === subject.id
                  : selectedSubject === subject.id
              }
              onClick={() => !isRunning && setSelectedSubject(subject.id)}
            />
          ))}
        </div>
      </div>

      {/* ===== 开始/停止按钮 ===== */}
      <div className="flex justify-center pb-8">
        <button
          onClick={isRunning ? handleStop : handleStart}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-cute-lg transition active:scale-90 ${
            isRunning
              ? 'bg-gradient-to-r from-gray-400 to-gray-500'
              : 'bg-gradient-to-r from-pink-400 to-pink-500'
          }`}
        >
          {isRunning ? '⏹' : '▶'}
        </button>
      </div>

      {/* 重置按钮（运行时显示） */}
      {isRunning && (
        <div className="flex justify-center pb-4">
          <Button variant="ghost" size="sm" onClick={reset}>
            重置
          </Button>
        </div>
      )}

      {/* ===== 今日番茄钟会话列表 ===== */}
      <div className="px-5">
        <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>🍅</span>
          <span>今日专注</span>
          {todaySessions.length > 0 && (
            <span className="text-xs text-pink-400 bg-pink-50 px-2 py-0.5 rounded-full">
              {todaySessions.length} 次
            </span>
          )}
        </h2>

        {todaySessions.length === 0 ? (
          <Card className="gradient-bubble">
            <EmptyState emoji="🌱" text="今天还没有专注记录，开始第一个番茄钟吧！" />
          </Card>
        ) : (
          <div className="space-y-2">
            {todaySessions
              .slice()
              .reverse()
              .map((session) => {
                const subject = SUBJECT_MAP[session.subject];
                const timeStr = new Date(session.startedAt).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <Card key={session.id} className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: subject?.bg }}
                    >
                      {subject?.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 text-sm truncate">
                        {subject?.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {timeStr} · {session.mode === 'countdown' ? '倒计时' : '正向'}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-pink-500 flex-shrink-0 tabular-nums">
                      {formatTime(session.duration)}
                    </div>
                  </Card>
                );
              })}
          </div>
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
