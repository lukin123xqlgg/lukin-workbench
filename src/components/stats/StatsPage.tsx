import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { usePracticeStore } from '../../store';
import { usePomodoroStore } from '../../store/pomodoroStore';
import { useCheckinStore } from '../../store/checkinStore';
import { SUBJECTS, SUBJECT_MAP, formatDuration, type SubjectId } from '../../config/constants';
import { Card, EmptyState } from '../common';
import { formatDate, todayStr } from '../../hooks';
import type { PracticeRecord, PomodoroSession, Checkin } from '../../types';

type Period = 'day' | 'week' | 'month' | 'year';
type ChartType = 'line' | 'bar' | 'pie';

// 马卡龙色系
const MACARON_COLORS = ['#E8A0BF', '#B9A7D9', '#7B9EA8', '#8BAA8B', '#C9A87C', '#D4A5A5', '#8BAAB0', '#D4A0A0'];

// 生成日期范围数组
function getDateRange(period: Period): string[] {
  const today = new Date();
  const dates: string[] = [];

  if (period === 'day') {
    // 今天 24 个小时（key 为小时数字符串）
    for (let h = 0; h < 24; h++) {
      dates.push(h.toString());
    }
  } else if (period === 'week') {
    // 本周7天（周一到周日）
    const day = today.getDay();
    const monday = new Date(today);
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(today.getDate() + diff);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(formatDate(d));
    }
  } else if (period === 'month') {
    // 本月30天（或当月天数）
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(formatDate(new Date(year, month, i)));
    }
  } else {
    // 本年12个月
    const year = today.getFullYear();
    for (let i = 0; i < 12; i++) {
      dates.push(`${year}-${(i + 1).toString().padStart(2, '0')}`);
    }
  }

  return dates;
}

// 获取日期标签
function getDateLabel(dateStr: string, period: Period): string {
  if (period === 'day') {
    return `${parseInt(dateStr, 10)}时`;
  } else if (period === 'week') {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } else if (period === 'month') {
    const d = new Date(dateStr);
    return `${d.getDate()}`;
  } else {
    const month = parseInt(dateStr.slice(5, 7));
    return `${month}月`;
  }
}

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [chartType, setChartType] = useState<ChartType>('line');

  const { records: practiceRecords, deleteRecord } = usePracticeStore();
  const sessions = usePomodoroStore((s) => s.sessions);
  const checkins = useCheckinStore((s) => s.checkins);

  const dateRange = useMemo(() => getDateRange(period), [period]);

  // ===== 计算学习时长（按 date 聚合，分钟） =====
  const studyMinutesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    const today = todayStr();

    // pomodoro sessions: duration 秒 -> 分钟
    sessions.forEach((s: PomodoroSession) => {
      let key: string | null;
      if (period === 'year') {
        key = s.date.slice(0, 7);
      } else if (period === 'day') {
        // 只统计今天的会话，按开始小时聚合
        key = s.date === today ? new Date(s.startedAt).getHours().toString() : null;
      } else {
        key = s.date;
      }
      if (key === null) return;
      map[key] = (map[key] || 0) + s.duration / 60;
    });

    // checkins: manualDuration 分钟（日视图下手动时长无小时信息，仅计入汇总）
    checkins.forEach((c: Checkin) => {
      if (period === 'day') return;
      const key = period === 'year' ? c.date.slice(0, 7) : c.date;
      map[key] = (map[key] || 0) + c.manualDuration;
    });

    return map;
  }, [sessions, checkins, period]);

  // ===== 数据摘要 =====
  const summary = useMemo(() => {
    let totalMinutes = dateRange.reduce((sum, date) => sum + (studyMinutesByDate[date] || 0), 0);
    // 日视图：加上今天手动记录的时长
    if (period === 'day') {
      const todayCheckin = checkins.find((c) => c.date === todayStr());
      totalMinutes += todayCheckin?.manualDuration || 0;
    }
    const totalHours = totalMinutes / 60;

    const studyDays = dateRange.filter((date) => (studyMinutesByDate[date] || 0) > 0).length;

    const dayCount = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? dateRange.length : 12;
    const avgMinutes = dayCount > 0 ? totalMinutes / dayCount : 0;

    // 做题统计（按 period 过滤）
    const filteredPractice = practiceRecords.filter((r) => {
      if (period === 'day') return r.date === todayStr();
      if (period === 'week') return dateRange.includes(r.date);
      if (period === 'month') return dateRange.includes(r.date);
      // year: 同年
      return r.date.slice(0, 4) === todayStr().slice(0, 4);
    });

    const totalQuestions = filteredPractice.reduce((sum, r) => sum + r.total, 0);
    const totalCorrect = filteredPractice.reduce((sum, r) => sum + r.correct, 0);
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return {
      totalHours: totalHours.toFixed(1),
      avgHours: (avgMinutes / 60).toFixed(1),
      studyDays,
      totalQuestions,
      accuracy: accuracy.toFixed(1),
    };
  }, [dateRange, studyMinutesByDate, practiceRecords, period]);

  // ===== 当前周期内的番茄钟会话（用于柱状图/饼图按周期过滤） =====
  const periodSessions = useMemo(() => {
    const today = todayStr();
    if (period === 'day') return sessions.filter((s) => s.date === today);
    if (period === 'year') return sessions.filter((s) => s.date.slice(0, 4) === today.slice(0, 4));
    return sessions.filter((s) => dateRange.includes(s.date));
  }, [sessions, period, dateRange]);

  // ===== 主图表 option =====
  const mainChartOption = useMemo(() => {
    if (chartType === 'line') {
      return {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const p = params[0];
            return `${p.name}<br/>学习时长: ${Number(p.value).toFixed(1)}h`;
          },
        },
        grid: { left: '8%', right: '5%', bottom: '10%', top: '10%' },
        xAxis: {
          type: 'category',
          data: dateRange.map((d) => getDateLabel(d, period)),
          axisLine: { lineStyle: { color: '#E8A0BF' } },
          axisLabel: { color: '#999', fontSize: 10, interval: period === 'month' ? Math.floor(dateRange.length / 6) : 0 },
        },
        yAxis: {
          type: 'value',
          name: '小时',
          nameTextStyle: { color: '#999', fontSize: 10 },
          axisLine: { show: false },
          axisLabel: { color: '#999', fontSize: 10 },
          splitLine: { lineStyle: { color: '#F5EAEA', type: 'dashed' } },
        },
        series: [
          {
            type: 'line',
            data: dateRange.map((d) => Number(((studyMinutesByDate[d] || 0) / 60).toFixed(2))),
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: '#E8A0BF', width: 3 },
            itemStyle: { color: '#E8A0BF', borderColor: '#fff', borderWidth: 2 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(232,160,191,0.3)' },
                  { offset: 1, color: 'rgba(232,160,191,0.02)' },
                ],
              },
            },
          },
        ],
      };
    }

    if (chartType === 'bar') {
      // 各板块累计学习时长（小时，按当前周期过滤）
      const subjectHours = SUBJECTS.map((s) => {
        const totalSeconds = periodSessions
          .filter((sess) => sess.subject === s.id)
          .reduce((sum, sess) => sum + sess.duration, 0);
        return Number((totalSeconds / 3600).toFixed(2));
      });

      return {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const p = params[0];
            return `${p.name}<br/>学习时长: ${p.value}h`;
          },
        },
        grid: { left: '12%', right: '5%', bottom: '15%', top: '10%' },
        xAxis: {
          type: 'category',
          data: SUBJECTS.map((s) => s.name),
          axisLine: { lineStyle: { color: '#E8A0BF' } },
          axisLabel: { color: '#999', fontSize: 9, rotate: 30 },
        },
        yAxis: {
          type: 'value',
          name: '小时',
          nameTextStyle: { color: '#999', fontSize: 10 },
          axisLine: { show: false },
          axisLabel: { color: '#999', fontSize: 10 },
          splitLine: { lineStyle: { color: '#F5EAEA', type: 'dashed' } },
        },
        series: [
          {
            type: 'bar',
            data: SUBJECTS.map((s, i) => ({
              value: subjectHours[i],
              itemStyle: { color: s.color, borderRadius: [6, 6, 0, 0] },
            })),
            barWidth: '50%',
          },
        ],
      };
    }

    // pie（按当前周期过滤）
    const subjectHours = SUBJECTS.map((s) => {
      const totalSeconds = periodSessions
        .filter((sess) => sess.subject === s.id)
        .reduce((sum, sess) => sum + sess.duration, 0);
      return { name: s.name, value: Number((totalSeconds / 3600).toFixed(2)), color: s.color };
    }).filter((item) => item.value > 0);

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}h ({d}%)',
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        textStyle: { color: '#999', fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 10,
            color: '#666',
          },
          labelLine: { length: 8, length2: 8 },
          data: subjectHours.map((item, i) => ({
            name: item.name,
            value: item.value,
            itemStyle: { color: item.color || MACARON_COLORS[i % MACARON_COLORS.length] },
          })),
        },
      ],
    };
  }, [chartType, dateRange, period, studyMinutesByDate, periodSessions]);

  // ===== 做题统计：分板块正确率堆叠柱状图 =====
  const practiceChartOption = useMemo(() => {
    const subjectData = SUBJECTS.map((s) => {
      const subjRecords = practiceRecords.filter((r) => r.subject === s.id);
      const total = subjRecords.reduce((sum, r) => sum + r.total, 0);
      const correct = subjRecords.reduce((sum, r) => sum + r.correct, 0);
      const wrong = total - correct;
      return { name: s.name, correct, wrong, total, color: s.color };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const name = params[0].name;
          const correct = params.find((p: any) => p.seriesName === '正确')?.value || 0;
          const wrong = params.find((p: any) => p.seriesName === '错误')?.value || 0;
          const total = correct + wrong;
          const rate = total > 0 ? ((correct / total) * 100).toFixed(1) : '0';
          return `${name}<br/>正确: ${correct} 错误: ${wrong}<br/>正确率: ${rate}%`;
        },
      },
      legend: {
        data: ['正确', '错误'],
        bottom: 0,
        textStyle: { color: '#999', fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: { left: '8%', right: '5%', bottom: '15%', top: '10%' },
      xAxis: {
        type: 'category',
        data: subjectData.map((s) => s.name),
        axisLine: { lineStyle: { color: '#E8A0BF' } },
        axisLabel: { color: '#999', fontSize: 9, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: '题数',
        nameTextStyle: { color: '#999', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#999', fontSize: 10 },
        splitLine: { lineStyle: { color: '#F5EAEA', type: 'dashed' } },
      },
      series: [
        {
          name: '正确',
          type: 'bar',
          stack: 'total',
          data: subjectData.map((s) => ({
            value: s.correct,
            itemStyle: { color: s.color },
          })),
          barWidth: '45%',
        },
        {
          name: '错误',
          type: 'bar',
          stack: 'total',
          data: subjectData.map((s) => ({
            value: s.wrong,
            itemStyle: { color: '#E8D0D8' },
          })),
          barWidth: '45%',
        },
      ],
    };
  }, [practiceRecords]);

  // ===== 做题记录列表（倒序） =====
  const sortedPracticeRecords = useMemo(() => {
    return [...practiceRecords].sort((a, b) => b.date.localeCompare(a.date));
  }, [practiceRecords]);

  const periods: { key: Period; label: string }[] = [
    { key: 'day', label: '日' },
    { key: 'week', label: '周' },
    { key: 'month', label: '月' },
    { key: 'year', label: '年' },
  ];

  const chartTypes: { key: ChartType; label: string }[] = [
    { key: 'line', label: '折线图' },
    { key: 'bar', label: '柱状图' },
    { key: 'pie', label: '饼图' },
  ];

  return (
    <div className="min-h-screen pb-8">
      {/* ===== 时间维度切换 ===== */}
      <div className="px-5 pt-6 pb-3">
        <div className="flex bg-white rounded-2xl p-1 shadow-cute">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition active:scale-95 ${
                period === p.key
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-cute'
                  : 'text-gray-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 数据摘要卡片 ===== */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <Card className="gradient-bubble">
            <div className="text-xs text-gray-400 font-medium">⏰ 总学习时长</div>
            <div className="text-2xl font-bold text-pink-500 mt-1">
              {summary.totalHours}
              <span className="text-sm font-normal text-gray-400 ml-1">小时</span>
            </div>
          </Card>
          <Card className="gradient-bubble">
            <div className="text-xs text-gray-400 font-medium">📊 平均每日</div>
            <div className="text-2xl font-bold text-pink-500 mt-1">
              {summary.avgHours}
              <span className="text-sm font-normal text-gray-400 ml-1">小时</span>
            </div>
          </Card>
          <Card className="gradient-bubble">
            <div className="text-xs text-gray-400 font-medium">✅ 打卡天数</div>
            <div className="text-2xl font-bold text-pink-500 mt-1">
              {summary.studyDays}
              <span className="text-sm font-normal text-gray-400 ml-1">天</span>
            </div>
          </Card>
          <Card className="gradient-bubble">
            <div className="text-xs text-gray-400 font-medium">📝 做题总数</div>
            <div className="text-2xl font-bold text-pink-500 mt-1">
              {summary.totalQuestions}
              <span className="text-sm font-normal text-gray-400 ml-1">题</span>
            </div>
            <div className="text-xs text-pink-400 font-medium mt-0.5">正确率 {summary.accuracy}%</div>
          </Card>
        </div>
      </div>

      {/* ===== 图表类型切换 ===== */}
      <div className="px-5 pb-3">
        <div className="flex bg-white rounded-2xl p-1 shadow-cute">
          {chartTypes.map((c) => (
            <button
              key={c.key}
              onClick={() => setChartType(c.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition active:scale-95 ${
                chartType === c.key
                  ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-cute'
                  : 'text-gray-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 主图表区域 ===== */}
      <div className="px-5 pb-4">
        <Card>
          <ReactECharts option={mainChartOption} style={{ height: 260 }} />
        </Card>
      </div>

      {/* ===== 做题统计区 ===== */}
      <div className="px-5 pb-4">
        <h3 className="text-base font-bold text-gray-700 mb-3 px-1">📝 分板块正确率</h3>
        <Card>
          {practiceRecords.length > 0 ? (
            <ReactECharts option={practiceChartOption} style={{ height: 260 }} />
          ) : (
            <EmptyState emoji="📊" text="还没有做题记录哦~" />
          )}
        </Card>
      </div>

      {/* ===== 每日做题记录列表 ===== */}
      <div className="px-5">
        <h3 className="text-base font-bold text-gray-700 mb-3 px-1">📋 每日做题记录</h3>
        {sortedPracticeRecords.length === 0 ? (
          <Card>
            <EmptyState emoji="📝" text="还没有做题记录，去刷题吧~" />
          </Card>
        ) : (
          <div className="space-y-2.5">
            {sortedPracticeRecords.map((r: PracticeRecord) => {
              const subj = SUBJECT_MAP[r.subject as SubjectId];
              const rate = r.total > 0 ? ((r.correct / r.total) * 100).toFixed(0) : '0';
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-3.5 shadow-cute flex items-center gap-3"
                >
                  {/* 板块图标 */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: subj?.bg }}
                  >
                    {subj?.emoji}
                  </div>

                  {/* 中间信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700">{subj?.name}</span>
                      <span className="text-xs text-gray-400">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        做题 <span className="font-bold text-gray-700">{r.total}</span> 题
                      </span>
                      <span className="text-xs text-gray-500">
                        正确 <span className="font-bold text-pink-500">{r.correct}</span>
                      </span>
                      <span className="text-xs font-bold" style={{ color: subj?.color }}>
                        {rate}%
                      </span>
                      <span className="text-xs text-gray-400">{formatDuration(r.duration)}</span>
                    </div>
                    {r.note && (
                      <div className="text-xs text-gray-400 mt-1 truncate">{r.note}</div>
                    )}
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => deleteRecord(r.id)}
                    className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center active:scale-90 transition flex-shrink-0"
                  >
                    <span className="text-red-400 text-xs">✕</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
