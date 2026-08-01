import { usePomodoroStore } from '../../store/pomodoroStore';
import { SUBJECT_MAP, formatTime } from '../../config/constants';
import { Card, EmptyState } from '../common';
import PomodoroTimer from '../common/PomodoroTimer';
import PomodoroStats from './PomodoroStats';
import { todayStr } from '../../hooks';

export default function TimerPage() {
  const sessions = usePomodoroStore((s) => s.sessions);

  // 今天的会话列表
  const today = todayStr();
  const todaySessions = sessions.filter((s) => s.date === today);

  return (
    <div className="min-h-screen pb-8">
      {/* ===== 番茄钟本体 ===== */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-800 mb-1">番茄钟 🍅</h1>
        <p className="text-xs text-gray-400">正向计时 / 倒计时自由切换，时间可以自定义哦</p>
      </div>
      <div className="px-5">
        <Card>
          <PomodoroTimer />
        </Card>
      </div>

      {/* ===== 今日番茄钟会话列表 ===== */}
      <div className="px-5 mt-5">
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

      {/* ===== 记录统计：日/周/月/年 + 饼图/条形图/折线图 ===== */}
      <div className="px-5 mt-6">
        <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>📊</span>
          <span>专注统计</span>
        </h2>
        <PomodoroStats />
      </div>
    </div>
  );
}
