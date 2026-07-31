import { useState, useMemo } from 'react';
import { Plus, ChevronRight, Settings, Timer, CalendarCheck } from 'lucide-react';
import SettingsPage from '../settings/SettingsPage';
import { useExamStore } from '../../store/examStore';
import { usePomodoroStore } from '../../store/pomodoroStore';
import { useCheckinStore } from '../../store/checkinStore';
import { usePracticeStore, usePlanStore, useReviewStore, useMistakeStore } from '../../store';
import { useThemeStore } from '../../store/themeStore';
import MascotAvatar from '../common/MascotAvatar';
import {
  SUBJECTS,
  SUBJECT_MAP,
  EXAM_TYPES,
  formatDuration,
  type SubjectId,
  type ExamType,
} from '../../config/constants';
import type { TabKey } from '../layout/tabs';
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

export default function HomePage({ onNavigate }: { onNavigate: (tab: TabKey) => void }) {
  const { exams, addExam } = useExamStore();
  const sessions = usePomodoroStore((s) => s.sessions);
  const { getCheckin } = useCheckinStore();
  const { records: practiceRecords } = usePracticeStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const { plans, togglePlan } = usePlanStore();
  const { reviews, addReview } = useReviewStore();
  const { mistakes } = useMistakeStore();
  const { mascot } = useThemeStore();

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

  return (
    <div className="min-h-screen pb-8">
      {/* ===== 顶部渐变区域：欢迎栏 + 倒计时 ===== */}
      <div
        className="px-5 pt-10 pb-6 rounded-b-3xl"
        style={{
          background: 'linear-gradient(135deg, #C8A6D4 0%, #D9A0C4 30%, #E8A8B8 60%, #F0B8C8 100%)',
        }}
      >
        {/* 欢迎栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MascotAvatar mascot={mascot} size={64} />
            <div>
              <h1 className="text-2xl font-bold text-white">lukin的工作台</h1>
              <p className="text-sm text-white/70 mt-1">{formatChineseDate(new Date())}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('timer' as any)}
              className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center active:scale-90 transition"
            >
              <Timer size={18} className="text-white" />
            </button>
            <button
              onClick={() => onNavigate('checkin' as any)}
              className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center active:scale-90 transition"
            >
              <CalendarCheck size={18} className="text-white" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center active:scale-90 transition"
            >
              <Settings size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* 日期 + 设置考试时间 */}
        <div className="flex items-center justify-between mt-4 mb-3">
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
            <span className="text-lg">📅</span>
            <span className="text-sm text-white font-medium">
              {new Date().getFullYear()}年{new Date().getMonth() + 1}月{new Date().getDate()}日 星期{['日','一','二','三','四','五','六'][new Date().getDay()]}
            </span>
          </div>
          <button
            onClick={() => setExamModalOpen(true)}
            className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5 text-sm text-white font-medium active:scale-95 transition"
          >
            <span>⏰</span> 设置考试时间 <span>✏️</span>
          </button>
        </div>

        {/* 三列考试倒计时 */}
        <div className="grid grid-cols-3 gap-3">
          {(['national', 'province', 'institution'] as ExamType[]).map((type) => {
            const typeExams = upcomingExams.filter((e) => e.type === type);
            const exam = typeExams[0];
            const days = exam ? daysUntil(exam.date) : null;
            return (
              <div
                key={type}
                className="rounded-2xl p-3 text-center"
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="text-2xl mb-1">{EXAM_TYPES[type].emoji}</div>
                <div className="text-xs text-white/80 font-medium">{EXAM_TYPES[type].name}</div>
                {exam ? (
                  <>
                    <div className="text-2xl font-bold text-white mt-1">
                      {days}<span className="text-sm font-normal">天</span>
                    </div>
                    <div className="text-[10px] text-white/60 mt-0.5">{EXAM_TYPES[type].name}</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold text-white/60 mt-1">--</div>
                    <div className="text-[10px] text-white/40 mt-0.5">未设置</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
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
                      <div className="text-sm text-gray-700 truncate">{mistake.question}</div>
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

      {/* ===== 添加考试弹窗 ===== */}
      <ExamAddModal
        open={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        onAdd={(data) => {
          addExam(data);
          setExamModalOpen(false);
        }}
      />

      {/* ===== 设置弹窗 ===== */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 animate-fade-in" onClick={() => setSettingsOpen(false)}>
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-3xl shadow-cute-lg animate-slide-up max-h-[85vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-pink-50 sticky top-0 bg-white rounded-t-3xl">
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

  

