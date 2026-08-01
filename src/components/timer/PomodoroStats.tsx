import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { usePomodoroStore } from '../../store/pomodoroStore';
import { SUBJECTS } from '../../config/constants';
import { Card, EmptyState } from '../common';
import { formatDate, todayStr } from '../../hooks';
import type { PomodoroSession } from '../../types';

type Period = 'day' | 'week' | 'month' | 'year';
type ChartType = 'pie' | 'bar' | 'line';

const MACARON_COLORS = ['#E8A0BF', '#B9A7D9', '#7B9EA8', '#8BAA8B', '#C9A87C', '#D4A5A5', '#8BAAB0', '#D4A0A0'];

// 生成周期内的日期桶
function getBuckets(period: Period): string[] {
  const today = new Date();
  const buckets: string[] = [];
  if (period === 'day') {
    for (let h = 0; h < 24; h++) buckets.push(h.toString());
  } else if (period === 'week') {
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      buckets.push(formatDate(d));
    }
  } else if (period === 'month') {
    const y = today.getFullYear();
    const m = today.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= days; i++) buckets.push(formatDate(new Date(y, m, i)));
  } else {
    const y = today.getFullYear();
    for (let i = 0; i < 12; i++) buckets.push(`${y}-${(i + 1).toString().padStart(2, '0')}`);
  }
  return buckets;
}

function bucketLabel(bucket: string, period: Period): string {
  if (period === 'day') return `${parseInt(bucket, 10)}时`;
  if (period === 'week') {
    const d = new Date(bucket);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  if (period === 'month') return `${parseInt(bucket.slice(8, 10), 10)}日`;
  return `${parseInt(bucket.slice(5, 7), 10)}月`;
}

function sessionBucket(s: PomodoroSession, period: Period, today: string): string | null {
  if (period === 'year') return s.date.slice(0, 7);
  if (period === 'day') return s.date === today ? new Date(s.startedAt).getHours().toString() : null;
  return s.date;
}

// 番茄钟记录统计：日/周/月/年 + 饼图/条形图/折线图 自由切换
export default function PomodoroStats() {
  const sessions = usePomodoroStore((s) => s.sessions);
  const [period, setPeriod] = useState<Period>('week');
  const [chartType, setChartType] = useState<ChartType>('bar');

  const buckets = useMemo(() => getBuckets(period), [period]);

  // 按时间桶聚合（小时）
  const minutesByBucket = useMemo(() => {
    const map: Record<string, number> = {};
    const today = todayStr();
    sessions.forEach((s) => {
      const key = sessionBucket(s, period, today);
      if (key === null) return;
      map[key] = (map[key] || 0) + s.duration / 60;
    });
    return map;
  }, [sessions, period]);

  // 当前周期内的会话（用于饼图/条形图按板块聚合）
  const periodSessions = useMemo(() => {
    const today = todayStr();
    if (period === 'day') return sessions.filter((s) => s.date === today);
    if (period === 'year') return sessions.filter((s) => s.date.slice(0, 4) === today.slice(0, 4));
    return sessions.filter((s) => buckets.includes(s.date));
  }, [sessions, period, buckets]);

  const totalMinutes = useMemo(
    () => periodSessions.reduce((sum, s) => sum + s.duration / 60, 0),
    [periodSessions]
  );

  const chartOption = useMemo(() => {
    // 折线图：按时间轴展示学习时长
    if (chartType === 'line') {
      return {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const p = params[0];
            return `${p.name}<br/>学习时长: ${Number(p.value).toFixed(1)}h`;
          },
        },
        grid: { left: '8%', right: '5%', bottom: '12%', top: '12%' },
        xAxis: {
          type: 'category',
          data: buckets.map((b) => bucketLabel(b, period)),
          axisLine: { lineStyle: { color: '#E8A0BF' } },
          axisLabel: { color: '#999', fontSize: 10, interval: period === 'month' ? Math.floor(buckets.length / 6) : 0 },
        },
        yAxis: {
          type: 'value',
          name: '小时',
          nameTextStyle: { color: '#999', fontSize: 10 },
          axisLabel: { color: '#999', fontSize: 10 },
          splitLine: { lineStyle: { color: '#F5EAEA', type: 'dashed' } },
        },
        series: [
          {
            type: 'line',
            data: buckets.map((b) => Number(((minutesByBucket[b] || 0) / 60).toFixed(2))),
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: '#E8A0BF', width: 3 },
            itemStyle: { color: '#E8A0BF', borderColor: '#fff', borderWidth: 2 },
            areaStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
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

    // 条形图：各板块学习时长
    const subjectHours = SUBJECTS.map((s) => {
      const totalSeconds = periodSessions
        .filter((sess) => sess.subject === s.id)
        .reduce((sum, sess) => sum + sess.duration, 0);
      return { name: s.name, color: s.color, value: Number((totalSeconds / 3600).toFixed(2)) };
    });

    if (chartType === 'bar') {
      return {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const p = params[0];
            return `${p.name}<br/>学习时长: ${p.value}h`;
          },
        },
        grid: { left: '12%', right: '5%', bottom: '18%', top: '12%' },
        xAxis: {
          type: 'category',
          data: subjectHours.map((s) => s.name),
          axisLine: { lineStyle: { color: '#E8A0BF' } },
          axisLabel: { color: '#999', fontSize: 9, rotate: 30 },
        },
        yAxis: {
          type: 'value',
          name: '小时',
          nameTextStyle: { color: '#999', fontSize: 10 },
          axisLabel: { color: '#999', fontSize: 10 },
          splitLine: { lineStyle: { color: '#F5EAEA', type: 'dashed' } },
        },
        series: [
          {
            type: 'bar',
            data: subjectHours.map((s) => ({
              value: s.value,
              itemStyle: { color: s.color, borderRadius: [6, 6, 0, 0] },
            })),
            barWidth: '50%',
          },
        ],
      };
    }

    // 饼图：各板块占比
    const pieData = subjectHours.filter((s) => s.value > 0);
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}h ({d}%)' },
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
          label: { show: true, formatter: '{b}\n{d}%', fontSize: 10, color: '#666' },
          labelLine: { length: 8, length2: 8 },
          data: pieData.map((item, i) => ({
            name: item.name,
            value: item.value,
            itemStyle: { color: item.color || MACARON_COLORS[i % MACARON_COLORS.length] },
          })),
        },
      ],
    };
  }, [chartType, buckets, period, minutesByBucket, periodSessions]);

  const periods: { key: Period; label: string }[] = [
    { key: 'day', label: '日' },
    { key: 'week', label: '周' },
    { key: 'month', label: '月' },
    { key: 'year', label: '年' },
  ];

  const chartTypes: { key: ChartType; label: string; emoji: string }[] = [
    { key: 'pie', label: '饼状图', emoji: '🥧' },
    { key: 'bar', label: '条形图', emoji: '📊' },
    { key: 'line', label: '折线图', emoji: '📈' },
  ];

  return (
    <div>
      {/* 周期 + 图表类型切换 */}
      <div className="flex gap-2 mb-3">
        <div className="flex flex-1 bg-white rounded-2xl p-1 shadow-cute">
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
      <div className="flex bg-white rounded-2xl p-1 shadow-cute mb-3">
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
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* 汇总 + 图表 */}
      <Card className="gradient-bubble mb-3">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-500">{(totalMinutes / 60).toFixed(1)}</div>
            <div className="text-xs text-gray-400 mt-1">⏰ 总时长(小时)</div>
          </div>
          <div className="w-px h-10 bg-pink-100" />
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-500">{periodSessions.length}</div>
            <div className="text-xs text-gray-400 mt-1">🍅 番茄钟次数</div>
          </div>
        </div>
      </Card>

      <Card>
        {periodSessions.length > 0 ? (
          <ReactECharts option={chartOption} style={{ height: 260 }} />
        ) : (
          <EmptyState emoji="🍅" text="这个周期还没有番茄钟记录，先专注一次吧~" />
        )}
      </Card>
    </div>
  );
}
