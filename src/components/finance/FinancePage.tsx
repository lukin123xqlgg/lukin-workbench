import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useFinanceStore } from '../../store';
import { formatMoney } from '../../config/constants';
import { BottomSheet, Button, Input, Card, EmptyState } from '../common';
import { todayStr } from '../../hooks';
import type { FinanceRecord, FinanceType } from '../../types';

type ReportPeriod = 'week' | 'month' | 'year';

const EXPENSE_CATEGORIES = [
  { name: '餐饮', emoji: '🍜' },
  { name: '交通', emoji: '🚌' },
  { name: '购物', emoji: '🛍️' },
  { name: '学习', emoji: '📚' },
  { name: '生活', emoji: '🏠' },
  { name: '其他', emoji: '✨' },
];

const INCOME_CATEGORIES = [
  { name: '工资', emoji: '💼' },
  { name: '兼职', emoji: '💻' },
  { name: '红包', emoji: '🧧' },
  { name: '其他', emoji: '✨' },
];

function getEmoji(type: FinanceType, category: string): string {
  const list = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return list.find((c) => c.name === category)?.emoji || '✨';
}

export default function FinancePage() {
  const { records, addRecord, deleteRecord } = useFinanceStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');

  // 表单状态
  const [formType, setFormType] = useState<FinanceType>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState(todayStr());
  const [formNote, setFormNote] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const yearMonth = `${year}-${(month + 1).toString().padStart(2, '0')}`;

  // 月份切换
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // ===== 当月记录 =====
  const monthRecords = useMemo(() => {
    return records
      .filter((r) => r.date.startsWith(yearMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, yearMonth]);

  // ===== 月度概览 =====
  const overview = useMemo(() => {
    let income = 0;
    let expense = 0;
    monthRecords.forEach((r) => {
      if (r.type === 'income') income += r.amount;
      else expense += r.amount;
    });
    return { income, expense, balance: income - expense };
  }, [monthRecords]);

  // ===== 报表数据 =====
  const reportData = useMemo(() => {
    const now = new Date();
    let filtered: FinanceRecord[] = [];

    if (reportPeriod === 'week') {
      const day = now.getDay();
      const monday = new Date(now);
      const diff = day === 0 ? -6 : 1 - day;
      monday.setDate(now.getDate() + diff);
      const weekStart = `${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, '0')}-${monday.getDate().toString().padStart(2, '0')}`;
      filtered = records.filter((r) => r.date >= weekStart && r.date <= todayStr());
    } else if (reportPeriod === 'month') {
      filtered = records.filter((r) => r.date.startsWith(yearMonth));
    } else {
      filtered = records.filter((r) => r.date.startsWith(String(year)));
    }

    // 收入趋势（按日期分组）
    const incomeByDate: Record<string, number> = {};
    filtered.forEach((r) => {
      if (r.type === 'income') {
        incomeByDate[r.date] = (incomeByDate[r.date] || 0) + r.amount;
      }
    });
    const incomeDates = Object.keys(incomeByDate).sort();
    const incomeValues = incomeDates.map((d) => incomeByDate[d]);

    // 支出分类分布
    const expenseByCategory: Record<string, number> = {};
    filtered.forEach((r) => {
      if (r.type === 'expense') {
        expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + r.amount;
      }
    });

    return { incomeDates, incomeValues, expenseByCategory };
  }, [records, reportPeriod, yearMonth, year]);

  // ===== 收入趋势折线图 =====
  const incomeChartOption = useMemo(() => {
    const dates = reportData.incomeDates;
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>收入: ¥${formatMoney(p.value)}`;
        },
      },
      grid: { left: '12%', right: '5%', bottom: '12%', top: '10%' },
      xAxis: {
        type: 'category',
        data: dates.map((d) => {
          const dt = new Date(d);
          return `${dt.getMonth() + 1}/${dt.getDate()}`;
        }),
        axisLine: { lineStyle: { color: '#B9A7D9' } },
        axisLabel: { color: '#999', fontSize: 10, rotate: dates.length > 7 ? 30 : 0 },
      },
      yAxis: {
        type: 'value',
        name: '元',
        nameTextStyle: { color: '#999', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#999', fontSize: 10 },
        splitLine: { lineStyle: { color: '#F0EBF7', type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          data: reportData.incomeValues,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#B9A7D9', width: 3 },
          itemStyle: { color: '#B9A7D9', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(185,167,217,0.3)' },
                { offset: 1, color: 'rgba(185,167,217,0.02)' },
              ],
            },
          },
        },
      ],
    };
  }, [reportData]);

  // ===== 支出分类柱状图 =====
  const expenseChartOption = useMemo(() => {
    const categories = Object.keys(reportData.expenseByCategory);
    const values = categories.map((c) => reportData.expenseByCategory[c]);
    const colors = ['#E8A0BF', '#B9A7D9', '#7B9EA8', '#8BAA8B', '#C9A87C', '#D4A5A5'];

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>支出: ¥${formatMoney(p.value)}`;
        },
      },
      grid: { left: '12%', right: '5%', bottom: '15%', top: '10%' },
      xAxis: {
        type: 'category',
        data: categories.length > 0 ? categories : ['暂无数据'],
        axisLine: { lineStyle: { color: '#E8A0BF' } },
        axisLabel: { color: '#999', fontSize: 10, rotate: categories.length > 4 ? 30 : 0 },
      },
      yAxis: {
        type: 'value',
        name: '元',
        nameTextStyle: { color: '#999', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#999', fontSize: 10 },
        splitLine: { lineStyle: { color: '#F5EAEA', type: 'dashed' } },
      },
      series: [
        {
          type: 'bar',
          data: categories.length > 0
            ? values.map((v, i) => ({
                value: v,
                itemStyle: { color: colors[i % colors.length], borderRadius: [6, 6, 0, 0] },
              }))
            : [{ value: 0, itemStyle: { color: '#F5EAEA' } }],
          barWidth: '45%',
        },
      ],
    };
  }, [reportData]);

  // ===== 表单操作 =====
  const handleOpenSheet = () => {
    setFormType('expense');
    setFormAmount('');
    setFormCategory('');
    setFormDate(todayStr());
    setFormNote('');
    setSheetOpen(true);
  };

  const handleSave = () => {
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0 || !formCategory) return;
    addRecord({
      date: formDate,
      type: formType,
      amount,
      category: formCategory,
      note: formNote.trim() || undefined,
    });
    setSheetOpen(false);
  };

  const categories = formType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const reportPeriods: { key: ReportPeriod; label: string }[] = [
    { key: 'week', label: '周' },
    { key: 'month', label: '月' },
    { key: 'year', label: '年' },
  ];

  return (
    <div className="min-h-screen pb-8">
      {/* ===== 顶部标题 + 月份切换 ===== */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-gray-800 text-center mb-4">理财记账 💰</h1>
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
          </div>
          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-full bg-white shadow-cute flex items-center justify-center active:scale-90 transition"
          >
            <span className="text-gray-400 text-lg">›</span>
          </button>
        </div>
      </div>

      {/* ===== 月度概览卡片 ===== */}
      <div className="px-5 pb-4">
        <Card className="gradient-bubble">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-xs text-gray-400 font-medium mb-1">收入</div>
              <div className="text-lg font-bold text-green-500">
                +{formatMoney(overview.income)}
              </div>
            </div>
            <div className="w-px h-12 bg-pink-100" />
            <div className="text-center">
              <div className="text-xs text-gray-400 font-medium mb-1">支出</div>
              <div className="text-lg font-bold text-pink-500">
                -{formatMoney(overview.expense)}
              </div>
            </div>
            <div className="w-px h-12 bg-pink-100" />
            <div className="text-center">
              <div className="text-xs text-gray-400 font-medium mb-1">结余</div>
              <div className="text-lg font-bold text-purple-500">
                {formatMoney(overview.balance)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ===== 记一笔按钮 ===== */}
      <div className="px-5 pb-4">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleOpenSheet}
        >
          ✏️ 记一笔
        </Button>
      </div>

      {/* ===== 记录列表 ===== */}
      <div className="px-5 pb-4">
        <h3 className="text-base font-bold text-gray-700 mb-3 px-1">
          📋 本月记录 ({monthRecords.length})
        </h3>
        {monthRecords.length === 0 ? (
          <Card>
            <EmptyState emoji="💸" text="本月还没有记录哦~" />
          </Card>
        ) : (
          <div className="space-y-2.5">
            {monthRecords.map((r: FinanceRecord) => {
              const emoji = getEmoji(r.type, r.category);
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-3.5 shadow-cute flex items-center gap-3"
                >
                  {/* 分类 emoji */}
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-lg flex-shrink-0">
                    {emoji}
                  </div>

                  {/* 中间信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-700">{r.category}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {r.date}
                      {r.note && <span className="ml-2">{r.note}</span>}
                    </div>
                  </div>

                  {/* 金额 */}
                  <div
                    className={`text-sm font-bold flex-shrink-0 ${
                      r.type === 'income' ? 'text-green-500' : 'text-pink-500'
                    }`}
                  >
                    {r.type === 'income' ? '+' : '-'}{formatMoney(r.amount)}
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => deleteRecord(r.id)}
                    className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center active:scale-90 transition flex-shrink-0"
                  >
                    <span className="text-red-400 text-xs">✕</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== 底部报表区 ===== */}
      <div className="px-5">
        {/* 报表周期切换 */}
        <div className="flex bg-white rounded-2xl p-1 shadow-cute mb-3">
          {reportPeriods.map((p) => (
            <button
              key={p.key}
              onClick={() => setReportPeriod(p.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition active:scale-95 ${
                reportPeriod === p.key
                  ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-cute'
                  : 'text-gray-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 收入趋势折线图 */}
        <Card className="mb-3">
          <h4 className="text-sm font-bold text-gray-600 mb-2">📈 收入趋势</h4>
          {reportData.incomeDates.length > 0 ? (
            <ReactECharts option={incomeChartOption} style={{ height: 220 }} />
          ) : (
            <EmptyState emoji="📊" text="暂无收入数据" />
          )}
        </Card>

        {/* 支出分类柱状图 */}
        <Card>
          <h4 className="text-sm font-bold text-gray-600 mb-2">📊 支出分类分布</h4>
          {Object.keys(reportData.expenseByCategory).length > 0 ? (
            <ReactECharts option={expenseChartOption} style={{ height: 220 }} />
          ) : (
            <EmptyState emoji="📊" text="暂无支出数据" />
          )}
        </Card>
      </div>

      {/* ===== 记一笔 BottomSheet ===== */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="记一笔 ✏️">
        <div className="space-y-4 pb-2">
          {/* 类型切换 */}
          <div className="flex bg-pink-50/50 rounded-2xl p-1">
            <button
              onClick={() => {
                setFormType('expense');
                setFormCategory('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95 ${
                formType === 'expense'
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-cute'
                  : 'text-gray-400'
              }`}
            >
              💸 支出
            </button>
            <button
              onClick={() => {
                setFormType('income');
                setFormCategory('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95 ${
                formType === 'income'
                  ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-cute'
                  : 'text-gray-400'
              }`}
            >
              💰 收入
            </button>
          </div>

          {/* 金额输入 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300">¥</span>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-pink-50/50 border border-pink-100 rounded-2xl text-2xl font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-pink-300 focus:bg-white transition text-center"
              />
            </div>
          </div>

          {/* 分类选择 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">分类</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setFormCategory(c.name)}
                  className={`py-2.5 rounded-2xl text-sm font-medium flex flex-col items-center gap-1 transition active:scale-95 ${
                    formCategory === c.name
                      ? formType === 'expense'
                        ? 'bg-pink-100 text-pink-600 shadow-cute'
                        : 'bg-green-100 text-green-600 shadow-cute'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <span className="text-xl">{c.emoji}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 日期 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">日期</label>
            <Input
              type="date"
              value={formDate}
              onChange={setFormDate}
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">备注</label>
            <Input
              value={formNote}
              onChange={setFormNote}
              placeholder="可选，写点啥~"
            />
          </div>

          {/* 保存按钮 */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={!formAmount || parseFloat(formAmount) <= 0 || !formCategory}
          >
            保存
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
