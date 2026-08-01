import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { usePlanStore } from '../../store';
import { SUBJECTS, SUBJECT_MAP, type SubjectId } from '../../config/constants';
import { todayStr, formatDate } from '../../hooks';
import { BottomSheet, Button, Input, SubjectTag, EmptyState } from '../common';

export default function PlanPage() {
  const { plans, addPlan, togglePlan, deletePlan, reorderPlans } = usePlanStore();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [subject, setSubject] = useState<SubjectId>('verbal');
  const [title, setTitle] = useState('');

  const dayPlans = plans
    .filter((p) => p.date === selectedDate)
    .sort((a, b) => a.order - b.order);

  const doneCount = dayPlans.filter((p) => p.done).length;
  const totalCount = dayPlans.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(formatDate(d));
  };

  const isToday = selectedDate === todayStr();

  const handleAdd = () => {
    if (!title.trim()) return;
    addPlan({ date: selectedDate, subject, title: title.trim(), done: false });
    setTitle('');
    setSubject('verbal');
    setSheetOpen(false);
  };

  const dateLabel = () => {
    const d = new Date(selectedDate);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return `${month}月${day}日 周${week}`;
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* 日期切换 */}
      <div className="sticky top-0 z-30 backdrop-blur-sm px-4 pt-4 pb-3" style={{ backgroundColor: 'var(--app-bg)', opacity: 0.95 }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-full bg-white/60 active:scale-90 transition"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="text-center">
            <div className="text-base font-bold text-gray-800">
              {isToday ? '今天' : dateLabel()}
            </div>
            <div className="text-xs text-gray-400">{dateLabel()}</div>
          </div>
          <button
            onClick={() => shiftDate(1)}
            className="p-2 rounded-full bg-white/60 active:scale-90 transition"
          >
            <ChevronRight size={20} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* 添加按钮 */}
      <div className="px-4 mb-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => setSheetOpen(true)}
        >
          <Plus size={20} className="inline mr-1" /> 添加计划
        </Button>
      </div>

      {/* 计划列表 */}
      <div className="px-4 space-y-2.5">
        {dayPlans.length === 0 ? (
          <EmptyState emoji="📋" text="今天还没有计划，添加一个吧~" />
        ) : (
          dayPlans.map((plan) => {
            const subj = SUBJECT_MAP[plan.subject];
            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl p-3.5 shadow-cute flex items-center gap-3"
              >
                {/* checkbox */}
                <button
                  onClick={() => togglePlan(plan.id)}
                  className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition active:scale-90 ${
                    plan.done
                      ? 'border-pink-400 bg-pink-400'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {plan.done && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {/* 板块emoji + 标题 */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-lg flex-shrink-0">{subj.emoji}</span>
                  <span
                    className={`text-sm text-gray-700 truncate ${plan.done ? 'line-through text-gray-300' : ''}`}
                  >
                    {plan.title}
                  </span>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => reorderPlans(plan.id, 'up')}
                    className="p-1.5 rounded-lg hover:bg-pink-50 active:scale-90 transition"
                  >
                    <ArrowUp size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => reorderPlans(plan.id, 'down')}
                    className="p-1.5 rounded-lg hover:bg-pink-50 active:scale-90 transition"
                  >
                    <ArrowDown size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 active:scale-90 transition"
                  >
                    <Trash2 size={16} className="text-red-300" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部统计 */}
      {dayPlans.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[480px] mx-auto px-4 z-20">
          <div className="bg-white rounded-2xl shadow-cute-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">
                📊 完成 {doneCount} / 共 {totalCount} 条
              </span>
              <span className="text-sm font-bold text-pink-500">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-3 bg-pink-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 添加计划 BottomSheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="添加计划 📝">
        <div className="space-y-4 pb-2">
          {/* 板块选择 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">选择板块</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <SubjectTag
                  key={s.id}
                  emoji={s.emoji}
                  name={s.name}
                  color={s.color}
                  bg={s.bg}
                  active={subject === s.id}
                  onClick={() => setSubject(s.id)}
                />
              ))}
            </div>
          </div>

          {/* 计划标题 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">计划标题</label>
            <Input
              value={title}
              onChange={setTitle}
              placeholder="如：做2篇资料分析"
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleAdd}
            disabled={!title.trim()}
          >
            确认添加
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
