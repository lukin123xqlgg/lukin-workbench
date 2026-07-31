import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { usePaperStore } from '../../store';
import { formatDuration, type SubjectId } from '../../config/constants';
import { todayStr } from '../../hooks';
import { BottomSheet, Button, Input, Textarea, EmptyState, Card } from '../common';
import type { PaperType, PaperScore } from '../../types';

// 各类型对应的板块配置
const PAPER_SUBJECTS: Record<PaperType, { id: SubjectId; name: string }[]> = {
  '行测': [
    { id: 'politics', name: '政治理论' },
    { id: 'politics', name: '常识' },
    { id: 'verbal', name: '言语理解' },
    { id: 'quantity', name: '数量关系' },
    { id: 'science', name: '数推' },
    { id: 'science', name: '科推' },
    { id: 'logic', name: '逻辑判断' },
    { id: 'data', name: '资料分析' },
  ],
  '申论': [
    { id: 'essay', name: '单一概括' },
    { id: 'essay', name: '综合分析' },
    { id: 'essay', name: '公文写作' },
    { id: 'essay', name: '大作文' },
  ],
  '事业编': [
    { id: 'politics', name: '政治理论' },
    { id: 'politics', name: '常识' },
    { id: 'verbal', name: '言语理解' },
    { id: 'quantity', name: '数量关系' },
    { id: 'science', name: '数推' },
    { id: 'science', name: '科推' },
    { id: 'logic', name: '逻辑判断' },
    { id: 'data', name: '资料分析' },
  ],
};

const PAPER_TYPES: PaperType[] = ['行测', '申论', '事业编'];

// 类型对应颜色
const TYPE_COLORS: Record<PaperType, string> = {
  '行测': '#7B9EA8',
  '申论': '#D4A5A5',
  '事业编': '#A89BC4',
};

// 类型对应背景
const TYPE_BG: Record<PaperType, string> = {
  '行测': '#E8EEF1',
  '申论': '#F5EAEA',
  '事业编': '#EEEBF5',
};

export default function PaperPage() {
  const { papers, addPaper, deletePaper } = usePaperStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  // 表单状态
  const [name, setName] = useState('');
  const [type, setType] = useState<PaperType>('行测');
  const [date, setDate] = useState(todayStr());
  const [totalScore, setTotalScore] = useState('');
  const [myScore, setMyScore] = useState('');
  const [duration, setDuration] = useState('');
  const [subjectScores, setSubjectScores] = useState<Record<string, { score: string; total: string }>>({});
  const [mistakeNote, setMistakeNote] = useState('');
  const [forgottenPoints, setForgottenPoints] = useState('');

  const currentSubjects = PAPER_SUBJECTS[type];

  const resetForm = () => {
    setName('');
    setType('行测');
    setDate(todayStr());
    setTotalScore('');
    setMyScore('');
    setDuration('');
    setSubjectScores({});
    setMistakeNote('');
    setForgottenPoints('');
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const scores: PaperScore[] = currentSubjects.map((s) => {
      const key = `${s.id}-${s.name}`;
      const entry = subjectScores[key] || { score: '', total: '' };
      return {
        subject: s.id,
        score: entry.score ? Number(entry.score) : 0,
        totalScore: entry.total ? Number(entry.total) : 0,
      };
    });

    addPaper({
      name: name.trim(),
      type,
      date,
      totalScore: totalScore ? Number(totalScore) : 0,
      myScore: myScore ? Number(myScore) : 0,
      duration: duration ? Number(duration) : 0,
      subjectScores: scores,
      mistakeNote: mistakeNote.trim() || undefined,
      forgottenPoints: forgottenPoints.trim() || undefined,
    });

    resetForm();
    setSheetOpen(false);
  };

  // 按日期倒序
  const sortedPapers = useMemo(
    () => [...papers].sort((a, b) => b.date.localeCompare(a.date)),
    [papers]
  );

  // ECharts 选项 —— 按日期正序
  const chartOption = useMemo(() => {
    const ascPapers = [...papers].sort((a, b) => a.date.localeCompare(b.date));
    const typeList = [...new Set(ascPapers.map((p) => p.type))];

    const series = typeList.map((t) => {
      const color = TYPE_COLORS[t];
      return {
        name: t,
        type: 'line' as const,
        data: ascPapers
          .filter((p) => p.type === t)
          .map((p) => ({
            value: p.totalScore > 0 ? Number(((p.myScore / p.totalScore) * 100).toFixed(1)) : 0,
            name: p.name,
          })),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color },
        itemStyle: { color },
      };
    });

    // X轴用所有试卷名称
    const xData = ascPapers.map((p) => p.name);

    return {
      tooltip: {
        trigger: 'axis' as const,
        formatter: (params: any[]) => {
          let tip = params[0]?.name || '';
          params.forEach((p) => {
            tip += `<br/>${p.marker}${p.seriesName}: ${p.value}%`;
          });
          return tip;
        },
      },
      legend: {
        data: typeList,
        bottom: 0,
        textStyle: { color: '#888', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12,
      },
      grid: { left: 35, right: 15, top: 15, bottom: 35 },
      xAxis: {
        type: 'category' as const,
        data: xData,
        axisLabel: {
          color: '#aaa',
          fontSize: 10,
          rotate: 20,
          formatter: (val: string) => (val.length > 5 ? val.slice(0, 5) + '…' : val),
        },
        axisLine: { lineStyle: { color: '#eee' } },
      },
      yAxis: {
        type: 'value' as const,
        max: 100,
        axisLabel: { color: '#aaa', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f5f5f5' } },
      },
      series,
    };
  }, [papers]);

  return (
    <div className="min-h-screen bg-[#FBF3F6] pb-8">
      {/* 顶部标题 */}
      <div className="sticky top-0 z-30 bg-[#FBF3F6]/95 backdrop-blur-sm px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">试卷分析 📝</h1>
          <Button variant="primary" size="sm" onClick={() => setSheetOpen(true)}>
            <Plus size={16} className="inline mr-0.5" /> 添加试卷
          </Button>
        </div>
      </div>

      {/* 试卷列表 */}
      <div className="px-4 space-y-3 mb-6">
        {sortedPapers.length === 0 ? (
          <EmptyState emoji="📄" text="还没有试卷记录，添加第一张试卷吧~" />
        ) : (
          sortedPapers.map((paper) => {
            const accuracy = paper.totalScore > 0
              ? ((paper.myScore / paper.totalScore) * 100).toFixed(1)
              : '0';
            return (
              <Card key={paper.id} className="relative">
                {/* 删除按钮 */}
                <button
                  onClick={() => deletePaper(paper.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-red-50 active:scale-90 transition"
                >
                  <Trash2 size={16} className="text-red-300" />
                </button>

                {/* 名称 + 类型标签 */}
                <div className="flex items-center gap-2 mb-2 pr-8">
                  <span className="font-bold text-gray-800 text-sm truncate">{paper.name}</span>
                  <span
                    className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: TYPE_BG[paper.type], color: TYPE_COLORS[paper.type] }}
                  >
                    {paper.type}
                  </span>
                </div>

                {/* 日期 + 时长 */}
                <div className="text-xs text-gray-400 mb-3">
                  📅 {paper.date} · ⏱️ {formatDuration(paper.duration)}
                </div>

                {/* 得分 / 正确率 */}
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-xs text-gray-400">得分</div>
                    <div className="text-lg font-bold text-pink-500">
                      {paper.myScore}
                      <span className="text-sm text-gray-400"> / {paper.totalScore}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">正确率</div>
                    <div className="text-lg font-bold text-purple-400">{accuracy}%</div>
                  </div>
                </div>

                {/* 各板块得分 */}
                {paper.subjectScores.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-pink-50 flex flex-wrap gap-1.5">
                    {paper.subjectScores.map((ss, idx) => {
                      const subj = PAPER_SUBJECTS[paper.type][idx];
                      const label = subj?.name || ss.subject;
                      return (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500"
                        >
                          {label}: {ss.score}/{ss.totalScore}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* 错题备注 */}
                {paper.mistakeNote && (
                  <div className="mt-2 text-xs text-gray-400 bg-orange-50/50 rounded-xl p-2">
                    🔖 {paper.mistakeNote}
                  </div>
                )}

                {/* 遗忘知识点 */}
                {paper.forgottenPoints && (
                  <div className="mt-1.5 text-xs text-gray-400 bg-purple-50/50 rounded-xl p-2">
                    💡 {paper.forgottenPoints}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* 成绩趋势图 */}
      {papers.length > 0 && (
        <div className="px-4">
          <div className="bg-white rounded-2xl shadow-cute p-4">
            <h2 className="text-sm font-bold text-gray-700 mb-3">📈 成绩趋势</h2>
            <ReactECharts option={chartOption} style={{ height: 250 }} />
          </div>
        </div>
      )}

      {/* 添加试卷 BottomSheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="添加试卷 📝">
        <div className="space-y-4 pb-2">
          {/* 试卷名称 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">试卷名称</label>
            <Input value={name} onChange={setName} placeholder="如：2024国考行测副省级" />
          </div>

          {/* 类型选择 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">试卷类型</label>
            <div className="flex gap-2">
              {PAPER_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    setSubjectScores({});
                  }}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition active:scale-95"
                  style={{
                    backgroundColor: type === t ? TYPE_BG[t] : '#F5F5F5',
                    color: type === t ? TYPE_COLORS[t] : '#999',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 考试日期 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">考试日期</label>
            <Input type="date" value={date} onChange={setDate} />
          </div>

          {/* 总分 / 得分 / 时长 */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">总分</label>
              <Input type="number" value={totalScore} onChange={setTotalScore} placeholder="100" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">我的得分</label>
              <Input type="number" value={myScore} onChange={setMyScore} placeholder="75" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">时长(分钟)</label>
              <Input type="number" value={duration} onChange={setDuration} placeholder="120" />
            </div>
          </div>

          {/* 各板块得分 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">各板块得分</label>
            <div className="space-y-2">
              {currentSubjects.map((s) => {
                const key = `${s.id}-${s.name}`;
                const entry = subjectScores[key] || { score: '', total: '' };
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-20 flex-shrink-0">{s.name}</span>
                    <Input
                      type="number"
                      value={entry.score}
                      onChange={(v) =>
                        setSubjectScores((prev) => ({
                          ...prev,
                          [key]: { ...entry, score: v },
                        }))
                      }
                      placeholder="得分"
                    />
                    <span className="text-gray-300">/</span>
                    <Input
                      type="number"
                      value={entry.total}
                      onChange={(v) =>
                        setSubjectScores((prev) => ({
                          ...prev,
                          [key]: { ...entry, total: v },
                        }))
                      }
                      placeholder="满分"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 错题备注 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">错题备注</label>
            <Textarea
              value={mistakeNote}
              onChange={setMistakeNote}
              placeholder="记录错题类型、易错点等..."
              rows={2}
            />
          </div>

          {/* 遗忘知识点 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">遗忘知识点</label>
            <Textarea
              value={forgottenPoints}
              onChange={setForgottenPoints}
              placeholder="记录需要复习的知识点..."
              rows={2}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            保存试卷
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
