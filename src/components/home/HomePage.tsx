import { useState, useMemo, useEffect } from 'react';
import { Plus, ChevronRight, Settings, Timer, CalendarCheck, Calendar, Clock, Pencil } from 'lucide-react';
import SettingsPage from '../settings/SettingsPage';
import { useExamStore } from '../../store/examStore';
import { usePomodoroStore } from '../../store/pomodoroStore';
import { useCheckinStore } from '../../store/checkinStore';
import { usePracticeStore, usePlanStore, useReviewStore, useMistakeStore } from '../../store';
import { useThemeStore, MASCOTS, type Mascot } from '../../store/themeStore';
import MascotAvatar from '../common/MascotAvatar';
import PomodoroTimer from '../common/PomodoroTimer';
import {
  SUBJECTS,
  SUBJECT_MAP,
  EXAM_TYPES,
  formatDuration,
  type SubjectId,
  type ExamType,
} from '../../config/constants';
import type { MistakeVoiceNote, MistakePhotoNote } from '../../types';
import {
  BottomSheet,
  CenterModal,
  Card,
  Button,
  Input,
  Textarea,
  SubjectTag,
  EmptyState,
} from '../common';
import { VoiceToText, VoiceRecorder, PhotoCapture } from '../common/VoiceRecorder';
import { todayStr } from '../../hooks';

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatChineseDate(date: Date): string {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${weekdays[date.getDay()]}`;
}

// 旧版（公考小星球）localStorage 里的考试日期
interface LegacyExamDate {
  name: string;
  icon: string;
  date: string;
}

const DEFAULT_EXAMS: { name: string; type: ExamType; date: string }[] = [
  { name: '国考', type: 'national', date: '2026-11-29' },
  { name: '省考', type: 'province', date: '2026-12-05' },
  { name: '事业编', type: 'institution', date: '2026-10-17' },
];

const FIXED_TYPES: ExamType[] = ['national', 'province', 'institution'];

export default function HomePage({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { exams, addExam } = useExamStore();
  const sessions = usePomodoroStore((s) => s.sessions);
  const { getCheckin } = useCheckinStore();
  const { records: practiceRecords } = usePracticeStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examAddOpen, setExamAddOpen] = useState(false);
  const { plans, togglePlan } = usePlanStore();
  const { reviews, addReview } = useReviewStore();
  const { mistakes } = useMistakeStore();
  const { mascot, setMascot } = useThemeStore();

  // ===== 考试日期初始化：迁移旧数据，或写入默认国考/省考/事业编 =====
  useEffect(() => {
    if (useExamStore.getState().exams.length > 0) return;
    const typeMap: Record<string, ExamType> = { 国考: 'national', 省考: 'province', 事业编: 'institution' };
    try {
      const legacy = localStorage.getItem('lukin-exam-dates');
      if (legacy) {
        const arr = JSON.parse(legacy) as LegacyExamDate[];
        if (Array.isArray(arr) && arr.length > 0) {
          arr.forEach((e) => {
            if (e?.name && e?.date) {
              useExamStore.getState().addExam({
                name: e.name,
                type: typeMap[e.name] ?? 'custom',
                date: e.date,
              });
            }
          });
          return;
        }
      }
    } catch {
      // 忽略解析失败，走默认
    }
    DEFAULT_EXAMS.forEach((e) => useExamStore.getState().addExam(e));
  }, []);

  const today = todayStr();
  const todayCheckin = getCheckin(today);
  const todayStudyMinutes = todayCheckin
    ? todayCheckin.autoDuration + todayCheckin.manualDuration
    : 0;

  const todayPractice = practiceRecords.filter((r) => r.date === today);
  const todayPracticeTotal = todayPractice.reduce((sum, r) => sum + r.total, 0);
  const todayPracticeCorrect = todayPractice.reduce((sum, r) => sum + r.correct, 0);
  const todayAccuracy =
    todayPracticeTotal > 0 ? Math.round((todayPracticeCorrect / todayPracticeTotal) * 100) : 0;

  const todayPomodoroCount = sessions.filter((s) => s.date === today).length;
  const todayPomodoroMinutes = sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.duration / 60, 0);

  const sortedExams = useMemo(
    () =>
      [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [exams]
  );
  const upcomingExams = useMemo(
    () => sortedExams.filter((e) => daysUntil(e.date) >= 0),
    [sortedExams]
  );

  const todayPlans = useMemo(
    () => plans.filter((p) => p.date === today).sort((a, b) => a.order - b.order).slice(0, 5),
    [plans, today]
  );

  const todayReviews = useMemo(
    () => reviews.filter((r) => r.date === today),
    [reviews, today]
  );

  const recentMistakes = mistakes.slice(0, 3);

  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [reviewSubject, setReviewSubject] = useState<SubjectId>(SUBJECTS[0].id);
  const [reviewQuestion, setReviewQuestion] = useState('');
  const [reviewAnswer, setReviewAnswer] = useState('');
  const [reviewKnowledge, setReviewKnowledge] = useState('');
  const [reviewAttachments, setReviewAttachments] = useState<
    (MistakeVoiceNote | MistakePhotoNote)[]
  >([]);

  const resetReviewForm = () => {
    setReviewSubject(SUBJECTS[0].id);
    setReviewQuestion('');
    setReviewAnswer('');
    setReviewKnowledge('');
    setReviewAttachments([]);
  };

  const handleAddReview = () => {
    if (!reviewQuestion.trim()) return;
    addReview({
      date: today,
      subject: reviewSubject,
      question: reviewQuestion.trim(),
      answer: reviewAnswer.trim(),
      knowledgePoint: reviewKnowledge.trim(),
      attachments: reviewAttachments,
    });
    resetReviewForm();
    setReviewSheetOpen(false);
  };

  const mascotThumb = (file: string) =>
    import.meta.env.BASE_URL
      ? `${import.meta.env.BASE_URL}mascots/${file}`.replace(/\/+/g, '/')
      : `/mascots/${file}`;

  return (
    <div className="min-h-screen pb-8">
      {/* ===== 顶部渐变区域：欢迎栏 + 倒计时（保持现有设计） ===== */}
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
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={mascotThumb(MASCOTS[mascot].file)}
                alt={MASCOTS[mascot].name}
                className="w-11 h-11 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide">lukin的工作台</h1>
              <p className="text-white/90 text-xs mt-0.5">{formatChineseDate(new Date())}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('timer')}
              className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center active:scale-90 transition"
              aria-label="番茄钟"
            >
              <Timer size={18} className="text-white" />
            </button>
            <button
              onClick={() => onNavigate('checkin')}
              className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center active:scale-90 transition"
              aria-label="打卡日历"
            >
              <CalendarCheck size={18} className="text-white" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center active:scale-90 transition"
              aria-label="设置"
            >
              <Settings size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* 日期 & 设置考试时间 */}
        <div className="relative flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white/25 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-white">
            <Calendar size={18} className="text-white" />
            <span className="text-sm font-semibold">{formatChineseDate(new Date())}</span>
          </div>
          <button
            onClick={() => setExamModalOpen(true)}
            className="flex items-center gap-1.5 bg-white/25 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-white active:scale-95 transition"
          >
            <Clock size={16} />
            <span className="text-sm font-semibold">设置考试时间</span>
            <Pencil size={14} />
          </button>
        </div>

        {/* 倒计时卡片 */}
        <div className="relative grid grid-cols-3 gap-3">
          {FIXED_TYPES.map((type) => {
            const exam = upcomingExams.find((e) => e.type === type);
            const days = exam ? daysUntil(exam.date) : null;
            return (
              <div
                key={type}
                className="flex flex-col items-center rounded-2xl bg-white/20 backdrop-blur-sm px-2 py-4 text-white"
              >
                <span className="text-xl mb-1">{EXAM_TYPES[type].emoji}</span>
                <span className="text-sm font-medium opacity-95">{EXAM_TYPES[type].name}</span>
                {exam ? (
                  <>
                    <div className="flex items-baseline gap-0.5 mt-1">
                      <span className="text-3xl font-extrabold">{days}</span>
                      <span className="text-xs opacity-90">天</span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-1">{exam.name}</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-0.5 mt-1">
                      <span className="text-3xl font-extrabold opacity-60">--</span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-1">未设置</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== 吉祥物互动区 ===== */}
      <div className="px-5 mt-4">
        <Card className="!p-0 overflow-hidden">
          <div className="relative h-32 bg-gradient-to-b from-[#E8F4FD] to-[#F0EBF7]">
            <div className="absolute top-3 left-4 text-xl opacity-50 animate-float" style={{ animationDuration: '5s' }}>☁️</div>
            <div className="absolute top-5 right-10 text-lg opacity-40 animate-float" style={{ animationDuration: '6s' }}>☁️</div>
            <div className="absolute top-3 right-24 text-sm opacity-40">☀️</div>
            <div className="absolute bottom-2 left-2 right-2 h-24 overflow-hidden">
              <MascotAvatar mascot={mascot} size={80} />
            </div>
          </div>
          <div className="px-4 pt-3 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">
                点一点{MASCOTS[mascot].name}，它会叫、会说话鼓励你哦～
              </p>
              <button
                onClick={() => setSettingsOpen(true)}
                className="text-xs text-pink-400 font-medium flex items-center gap-0.5 flex-shrink-0 active:scale-95 transition"
              >
                <Pencil size={12} /> 自定义鼓励的话
              </button>
            </div>
            {/* 小动物切换按钮 */}
            <div className="grid grid-cols-7 gap-1.5">
              {(Object.keys(MASCOTS) as Mascot[]).map((key) => {
                const m = MASCOTS[key];
                const isActive = mascot === key;
                return (
                  <button
                    key={key}
                    onClick={() => setMascot(key)}
                    className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition active:scale-90 ${
                      isActive ? 'bg-pink-50 ring-2 ring-pink-300' : 'bg-gray-50'
                    }`}
                  >
                    <img src={mascotThumb(m.file)} alt={m.name} className="w-8 h-8 object-contain" />
                    <span className={`text-[10px] ${isActive ? 'text-pink-500 font-bold' : 'text-gray-400'}`}>
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* ===== 番茄钟 ===== */}
      <div className="px-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span>🍅</span>
            <span>番茄钟</span>
          </h2>
          <button
            onClick={() => onNavigate('timer')}
            className="text-xs text-pink-400 font-medium flex items-center gap-0.5"
          >
            统计与记录 <ChevronRight size={14} />
          </button>
        </div>
        <Card>
          <PomodoroTimer compact />
          <div className="mt-3 pt-3 border-t border-pink-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              今日已专注 <span className="font-bold text-pink-500">{formatDuration(todayPomodoroMinutes)}</span> · {todayPomodoroCount} 次
            </span>
            <button
              onClick={() => onNavigate('checkin')}
              className="text-xs text-pink-400 font-medium flex items-center gap-0.5"
            >
              打卡日历 <ChevronRight size={14} />
            </button>
          </div>
        </Card>
      </div>

      <div className="px-5 space-y-4 mt-4">
        {/* ===== 今日学习概览 ===== */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>今日学习概览</span>
          </h2>
          <Card className="gradient-bubble">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">
                  {formatDuration(todayStudyMinutes)}
                </div>
                <div className="text-xs text-gray-400 mt-1">⏱️ 学习时长</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{todayPracticeTotal}</div>
                <div className="text-xs text-gray-400 mt-1">✏️ 做题数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{todayAccuracy}%</div>
                <div className="text-xs text-gray-400 mt-1">🎯 正确率</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{todayPomodoroCount}</div>
                <div className="text-xs text-gray-400 mt-1">🍅 番茄钟</div>
              </div>
            </div>
          </Card>
        </div>

        {/* ===== 今日计划 ===== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span>📝</span>
              <span>今日计划</span>
            </h2>
            <button
              onClick={() => onNavigate('plan')}
              className="text-xs text-pink-400 font-medium flex items-center gap-0.5"
            >
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          {todayPlans.length === 0 ? (
            <Card className="gradient-bubble">
              <EmptyState emoji="📋" text="今天还没有计划，去添加吧～" />
            </Card>
          ) : (
            <div className="space-y-2">
              {todayPlans.map((plan) => {
                const subject = SUBJECT_MAP[plan.subject];
                return (
                  <Card key={plan.id} className="flex items-center gap-3 !py-3">
                    <button
                      onClick={() => togglePlan(plan.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition active:scale-90 ${
                        plan.done
                          ? 'bg-pink-400 border-pink-400'
                          : 'border-gray-300'
                      }`}
                    >
                      {plan.done && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </button>
                    <div
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                      style={{ backgroundColor: subject.bg, color: subject.color }}
                    >
                      {subject.emoji} {subject.name}
                    </div>
                    <span
                      className={`flex-1 text-sm text-gray-700 truncate ${
                        plan.done ? 'line-through-cute' : ''
                      }`}
                    >
                      {plan.title}
                    </span>
                  </Card>
                );
              })}
              {plans.filter((p) => p.date === today).length > 5 && (
                <button
                  onClick={() => onNavigate('plan')}
                  className="w-full text-center text-xs text-pink-400 font-medium py-2"
                >
                  查看全部计划 →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ===== 每日复盘 ===== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span>💭</span>
              <span>每日复盘</span>
            </h2>
            <Button size="sm" onClick={() => setReviewSheetOpen(true)}>
              <Plus size={14} className="mr-1" /> 添加复盘
            </Button>
          </div>
          {todayReviews.length === 0 ? (
            <Card className="gradient-bubble">
              <EmptyState emoji="🤔" text="今天还没有复盘记录" />
            </Card>
          ) : (
            <div className="space-y-2">
              {todayReviews.map((review) => {
                const subject = SUBJECT_MAP[review.subject];
                return (
                  <Card key={review.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ backgroundColor: subject.bg, color: subject.color }}
                      >
                        {subject.emoji} {subject.name}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-800 font-medium">
                        📌 {review.question}
                      </div>
                      {review.answer && (
                        <div className="text-gray-600">💡 {review.answer}</div>
                      )}
                      {review.knowledgePoint && (
                        <div className="text-gray-500 text-xs">
                          🔑 {review.knowledgePoint}
                        </div>
                      )}
                    </div>
                    {review.attachments.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {review.attachments.map((att, i) =>
                          att.type === 'photo' ? (
                            <img
                              key={i}
                              src={att.image}
                              alt="附件"
                              className="w-16 h-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div
                              key={i}
                              className="px-2 py-1 bg-pink-50 rounded-lg text-[10px] text-pink-400"
                            >
                              🎤 {att.duration}s
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== 最近错题 ===== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span>❌</span>
              <span>最近错题</span>
            </h2>
            <button
              onClick={() => onNavigate('mistake')}
              className="text-xs text-pink-400 font-medium flex items-center gap-0.5"
            >
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          {recentMistakes.length === 0 ? (
            <Card className="gradient-bubble">
              <EmptyState emoji="✨" text="暂无错题记录" />
            </Card>
          ) : (
            <div className="space-y-2">
              {recentMistakes.map((mistake) => {
                const subject = SUBJECT_MAP[mistake.subject];
                return (
                  <Card
                    key={mistake.id}
                    className="flex items-center gap-3 !py-3"
                    onClick={() => onNavigate('mistake')}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: subject.bg }}
                    >
                      {subject.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700 truncate">{mistake.title || mistake.question}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{mistake.date}</div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== 复盘 BottomSheet ===== */}
      <BottomSheet
        open={reviewSheetOpen}
        onClose={() => {
          setReviewSheetOpen(false);
          resetReviewForm();
        }}
        title="添加每日复盘"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">板块</label>
            <div className="flex gap-2 flex-wrap">
              {SUBJECTS.map((s) => (
                <SubjectTag
                  key={s.id}
                  emoji={s.emoji}
                  name={s.name}
                  color={s.color}
                  bg={s.bg}
                  active={reviewSubject === s.id}
                  onClick={() => setReviewSubject(s.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">题目</label>
            <Input
              value={reviewQuestion}
              onChange={setReviewQuestion}
              placeholder="今天复盘的题目..."
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">答案</label>
            <Textarea
              value={reviewAnswer}
              onChange={setReviewAnswer}
              placeholder="正确答案或解题思路..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">知识点与思考</label>
            <Textarea
              value={reviewKnowledge}
              onChange={setReviewKnowledge}
              placeholder="涉及的知识点、易错点、个人思考..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">附件</label>
            <div className="flex gap-2 flex-wrap items-center">
              <PhotoCapture
                onCaptured={(base64) =>
                  setReviewAttachments((prev) => [
                    ...prev,
                    { type: 'photo', image: base64 } as MistakePhotoNote,
                  ])
                }
              />
              <VoiceRecorder
                onRecorded={(note) =>
                  setReviewAttachments((prev) => [...prev, note])
                }
              />
              <VoiceToText
                onTranscript={(text) =>
                  setReviewKnowledge((prev) => (prev ? prev + '\n' + text : text))
                }
              />
            </div>

            {reviewAttachments.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {reviewAttachments.map((att, i) => (
                  <div key={i} className="relative">
                    {att.type === 'photo' ? (
                      <img
                        src={att.image}
                        alt="预览"
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-pink-50 rounded-xl text-xs text-pink-500">
                        🎤 {att.duration}s
                      </div>
                    )}
                    <button
                      onClick={() =>
                        setReviewAttachments((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-400 text-white flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleAddReview}
            disabled={!reviewQuestion.trim()}
            className="w-full"
            size="lg"
          >
            保存复盘
          </Button>
        </div>
      </BottomSheet>

      {/* ===== 设置考试时间弹窗 ===== */}
      <ExamSettingsModal
        open={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        onAddNew={() => {
          setExamModalOpen(false);
          setExamAddOpen(true);
        }}
      />

      {/* ===== 添加考试弹窗 ===== */}
      <ExamAddModal
        open={examAddOpen}
        onClose={() => setExamAddOpen(false)}
        onAdd={(data) => {
          addExam(data);
          setExamAddOpen(false);
        }}
      />

      {/* ===== 设置弹窗 ===== */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 animate-fade-in" onClick={() => setSettingsOpen(false)}>
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-3xl shadow-cute-lg animate-slide-up max-h-[85vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-pink-50 sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="text-lg font-bold text-gray-800">设置 ⚙️</h3>
              <button onClick={() => setSettingsOpen(false)} className="p-1.5 rounded-full hover:bg-pink-50 active:scale-90 transition text-gray-400">
                ✕
              </button>
            </div>
            <SettingsPage />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 设置考试时间弹窗（保持现有设计，支持修改三类考试 + 自定义考试） =====
function ExamSettingsModal({
  open,
  onClose,
  onAddNew,
}: {
  open: boolean;
  onClose: () => void;
  onAddNew: () => void;
}) {
  const { exams, addExam, updateExam, deleteExam } = useExamStore();

  const handleDateChange = (type: ExamType, date: string) => {
    if (!date) return;
    const existing = exams.find((e) => e.type === type);
    if (existing) {
      updateExam(existing.id, { date });
    } else {
      addExam({ name: EXAM_TYPES[type].name, type, date });
    }
  };

  const customExams = exams.filter((e) => !FIXED_TYPES.includes(e.type));

  return (
    <CenterModal open={open} onClose={onClose} title="设置考试时间 ⏰">
      <div className="space-y-3 pb-2">
        {FIXED_TYPES.map((type) => {
          const exam = exams.find((e) => e.type === type);
          return (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{EXAM_TYPES[type].emoji}</span>
                <span className="text-sm text-gray-700">{EXAM_TYPES[type].name}</span>
              </div>
              <input
                type="date"
                value={exam?.date ?? ''}
                onChange={(e) => handleDateChange(type, e.target.value)}
                className="text-sm border border-pink-100 rounded-xl px-2 py-1.5 text-gray-700 focus:outline-none focus:border-pink-300"
              />
            </div>
          );
        })}

        {/* 自定义考试 */}
        {customExams.map((exam) => (
          <div key={exam.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{EXAM_TYPES[exam.type]?.emoji ?? '⭐'}</span>
              <span className="text-sm text-gray-700">{exam.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={exam.date}
                onChange={(e) => e.target.value && updateExam(exam.id, { date: e.target.value })}
                className="text-sm border border-pink-100 rounded-xl px-2 py-1.5 text-gray-700 focus:outline-none focus:border-pink-300"
              />
              <button
                onClick={() => deleteExam(exam.id)}
                className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-xs active:scale-90 transition flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={onAddNew}
          className="w-full py-2 rounded-xl bg-pink-50 text-pink-500 text-sm font-bold active:scale-95 transition"
        >
          ＋ 添加其他考试
        </button>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-400 to-pink-500 text-white text-sm font-bold active:scale-95 transition"
        >
          完成
        </button>
      </div>
    </CenterModal>
  );
}

function ExamAddModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; type: ExamType; date: string; note?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ExamType>('national');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !date) return;
    onAdd({ name: name.trim(), type, date, note: note.trim() || undefined });
    setName('');
    setDate('');
    setNote('');
    setType('national');
  };

  return (
    <CenterModal open={open} onClose={onClose} title="添加考试 ⏰">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-500 mb-1 block">考试名称</label>
          <Input value={name} onChange={setName} placeholder="如：2026国考、广东省考..." />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-2 block">考试类型</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(EXAM_TYPES) as ExamType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-2 rounded-xl text-sm font-medium transition active:scale-95 ${
                  type === t ? 'text-white shadow-cute' : 'bg-gray-100 text-gray-400'
                }`}
                style={type === t ? { backgroundColor: EXAM_TYPES[t].color } : {}}
              >
                {EXAM_TYPES[t].emoji}
                <div className="text-xs mt-0.5">{EXAM_TYPES[t].name}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">考试日期</label>
          <Input value={date} onChange={setDate} type="date" />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">备注（可选）</label>
          <Input value={note} onChange={setNote} placeholder="如：上午9:00-11:00 行测" />
        </div>
        <Button onClick={handleAdd} disabled={!name.trim() || !date} className="w-full" size="lg">
          确认添加
        </Button>
      </div>
    </CenterModal>
  );
}
