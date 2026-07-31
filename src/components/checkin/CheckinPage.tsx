import { useState } from 'react';
import { useCheckinStore } from '../../store/checkinStore';
import { usePomodoroStore } from '../../store/pomodoroStore';
import {
  SUBJECT_MAP,
  formatDuration,
} from '../../config/constants';
import {
  BottomSheet,
  Card,
  Button,
  EmptyState,
} from '../common';
import {
  useCalendar,
  useWheelSelector,
  formatDate,
  todayStr,
} from '../../hooks';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function CheckinPage() {
  const {
    getCheckin,
    getMonthCheckins,
    addManualDuration,
    deleteCheckin,
    toggleCheckin,
  } = useCheckinStore();
  const sessions = usePomodoroStore((s) => s.sessions);

  const [currentDate, setCurrentDate] = useState(new Date());
  const { days, year, month } = useCalendar(currentDate);

  // BottomSheet 状态
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // 滚轴选择器
  const hourWheel = useWheelSelector(0, 0, 12);
  const minuteWheel = useWheelSelector(0, 0, 59);

  const today = todayStr();
  const yearMonth = `${year}-${(month + 1).toString().padStart(2, '0')}`;
  const monthCheckins = getMonthCheckins(yearMonth);

  // 月度统计
  const monthTotalMinutes = monthCheckins.reduce(
    (sum, c) => sum + c.autoDuration + c.manualDuration,
    0
  );
  const monthCheckinDays = monthCheckins.filter(
    (c) => c.autoDuration > 0 || c.manualDuration > 0
  ).length;

  // 月份切换
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 点击日期 —— 所有日期都打开 BottomSheet
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    setSelectedDate(dateStr);
    setSheetOpen(true);
  };

  // 添加手动时长
  const handleAddDuration = () => {
    if (!selectedDate) return;
    const totalMinutes = hourWheel.value * 60 + minuteWheel.value;
    if (totalMinutes <= 0) return;
    addManualDuration(selectedDate, totalMinutes);
    // 重置滚轴
    hourWheel.scrollToValue(0);
    minuteWheel.scrollToValue(0);
  };

  // 添加打卡（空日期）
  const handleAddCheckin = () => {
    if (!selectedDate) return;
    toggleCheckin(selectedDate);
    setSheetOpen(false);
  };

  // 删除打卡
  const handleDeleteCheckin = () => {
    if (!selectedDate) return;
    deleteCheckin(selectedDate);
    setSheetOpen(false);
    setSelectedDate(null);
  };

  // 删除单条番茄钟会话
  const handleDeleteSession = (id: string) => {
    usePomodoroStore.setState((s) => ({
      sessions: s.sessions.filter((x) => x.id !== id),
    }));
  };

  // 当前选中的 checkin
  const selectedCheckin = selectedDate ? getCheckin(selectedDate) : undefined;
  const selectedDateSessions = selectedDate
    ? sessions.filter((s) => s.date === selectedDate)
    : [];

  // 渲染滚轴
  const renderWheel = (
    wheel: ReturnType<typeof useWheelSelector>,
    max: number,
    unit: string
  ) => {
    const items = [];
    for (let i = 0; i <= max; i++) {
      items.push(i);
    }
    return (
      <div className="flex-1">
        <div
          className="wheel-container"
          ref={wheel.containerRef}
          onScroll={wheel.handleScroll}
        >
          {/* 顶部填充 */}
          <div style={{ height: wheel.padding }} />
          {items.map((n) => (
            <div
              key={n}
              className={`wheel-item ${wheel.value === n ? 'active' : ''}`}
            >
              {n}
            </div>
          ))}
          {/* 底部填充 */}
          <div style={{ height: wheel.padding }} />
        </div>
        <div className="wheel-mask" style={{ top: wheel.padding }} />
        <div className="text-center text-xs text-gray-400 mt-1 font-medium">
          {unit}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-8">
      {/* ===== 月份切换 ===== */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-full bg-white shadow-cute flex items-center justify-center active:scale-90 transition"
          >
            <span className="text-gray-400 text-lg">‹</span>
          </button>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              {year}年{month + 1}月
            </div>
            <div className="text-xs text-pink-400 font-medium mt-0.5">
              本月学习 {formatDuration(monthTotalMinutes)} · 打卡 {monthCheckinDays} 天
            </div>
          </div>
          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-full bg-white shadow-cute flex items-center justify-center active:scale-90 transition"
          >
            <span className="text-gray-400 text-lg">›</span>
          </button>
        </div>
      </div>

      {/* ===== 月度统计卡片 ===== */}
      <div className="px-5 pb-4">
        <Card className="gradient-bubble">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-500">
                {formatDuration(monthTotalMinutes)}
              </div>
              <div className="text-xs text-gray-400 mt-1">📅 本月总时长</div>
            </div>
            <div className="w-px h-10 bg-pink-100" />
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-500">
                {monthCheckinDays}
              </div>
              <div className="text-xs text-gray-400 mt-1">✅ 打卡天数</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ===== 日历网格 ===== */}
      <div className="px-5">
        <Card className="!p-3">
          {/* 星期头 */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold text-gray-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>
          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="aspect-square" />;
              }
              const dateStr = formatDate(date);
              const checkin = getCheckin(dateStr);
              const isToday = dateStr === today;
              const totalMinutes = checkin
                ? checkin.autoDuration + checkin.manualDuration
                : 0;
              const hasRecord = checkin && totalMinutes > 0;

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition active:scale-95 ${
                    isToday
                      ? 'border-2 border-pink-400 bg-pink-50'
                      : hasRecord
                      ? 'bg-pink-50/50'
                      : 'hover:bg-pink-50/30'
                  }`}
                >
                  {/* 打卡小圆点 */}
                  {hasRecord && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-400" />
                  )}
                  <div
                    className={`text-sm font-bold ${
                      isToday
                        ? 'text-pink-500'
                        : hasRecord
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  {hasRecord && (
                    <div className="text-[10px] text-pink-400 font-medium leading-tight mt-0.5 px-0.5 text-center truncate w-full">
                      {formatDuration(totalMinutes)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ===== BottomSheet ===== */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSelectedDate(null);
        }}
        title={
          selectedDate
            ? `${parseInt(selectedDate.slice(5, 7))}月${parseInt(selectedDate.slice(8, 10))}日`
            : ''
        }
      >
        {selectedDate && (
          <div className="space-y-4">
            {/* 学习时长汇总 */}
            {selectedCheckin ? (
              <Card className="gradient-bubble">
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <div className="text-lg font-bold text-pink-500">
                      {formatDuration(selectedCheckin.autoDuration)}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">🤖 自动</div>
                  </div>
                  <div className="w-px h-8 bg-pink-100" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-pink-500">
                      {formatDuration(selectedCheckin.manualDuration)}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">✍️ 手动</div>
                  </div>
                  <div className="w-px h-8 bg-pink-100" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-pink-500">
                      {formatDuration(
                        selectedCheckin.autoDuration + selectedCheckin.manualDuration
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">📊 总计</div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-pink-50/50">
                <EmptyState emoji="📝" text="该日期还没有打卡记录" />
              </Card>
            )}

            {/* 滚轴选择器添加手动时长 */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3">
                ✍️ 添加手动学习时长
              </h4>
              <div className="flex gap-4 bg-pink-50/30 rounded-2xl p-3">
                {renderWheel(hourWheel, 12, '小时')}
                {renderWheel(minuteWheel, 59, '分钟')}
              </div>
              <div className="mt-3">
                <Button
                  onClick={handleAddDuration}
                  disabled={hourWheel.value === 0 && minuteWheel.value === 0}
                  size="md"
                  className="w-full"
                >
                  添加 {hourWheel.value}h {minuteWheel.value}m
                </Button>
              </div>
            </div>

            {/* 番茄钟会话列表 */}
            {selectedDateSessions.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">
                  🍅 番茄钟记录（{selectedDateSessions.length}）
                </h4>
                <div className="space-y-2">
                  {selectedDateSessions.map((session) => {
                    const subject = SUBJECT_MAP[session.subject];
                    const timeStr = new Date(session.startedAt).toLocaleTimeString(
                      'zh-CN',
                      { hour: '2-digit', minute: '2-digit' }
                    );
                    return (
                      <div
                        key={session.id}
                        className="flex items-center gap-2 bg-white rounded-xl p-2.5 shadow-cute"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                          style={{ backgroundColor: subject?.bg }}
                        >
                          {subject?.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-700 truncate">
                            {subject?.name}
                          </div>
                          <div className="text-[10px] text-gray-400">{timeStr}</div>
                        </div>
                        <div className="text-xs font-bold text-pink-500 flex-shrink-0">
                          {formatDuration(session.duration / 60)}
                        </div>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center active:scale-90 transition flex-shrink-0"
                        >
                          <span className="text-red-400 text-xs">✕</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              {!selectedCheckin && (
                <Button onClick={handleAddCheckin} className="flex-1">
                  ✅ 添加打卡
                </Button>
              )}
              {selectedCheckin && (
                <Button
                  variant="danger"
                  onClick={handleDeleteCheckin}
                  className="flex-1"
                >
                  🗑 删除打卡记录
                </Button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
