import { useMemo, useState } from 'react';
import { X, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { CollectionItem } from '../../types';
import { Button } from '../common';

interface QuizQuestion {
  item: CollectionItem;
  options: string[];       // 打乱后的选项（内容为条目 content）
  correctIndex: number;
}

// 从数组中随机取 n 个（不含 exclude）
function sample<T>(arr: T[], n: number, exclude: T): T[] {
  const pool = arr.filter((x) => x !== exclude);
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 选项显示时截断过长的内容
function clip(text: string, max = 90): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}

export default function QuizModal({
  folderName,
  items,
  onClose,
}: {
  folderName: string;
  items: CollectionItem[];
  onClose: () => void;
}) {
  // 按文件顺序出题（order 字段就是导入时的行顺序）
  const [round, setRound] = useState(0);
  const questions: QuizQuestion[] = useMemo(() => {
    const quizItems = items
      .filter((it) => it.content.trim().length > 0)
      .sort((a, b) => a.order - b.order);
    const allContents = quizItems.map((it) => it.content);
    return quizItems.map((item) => {
      const distractors = sample(allContents, 3, item.content);
      const options = shuffle([item.content, ...distractors]);
      return { item, options, correctIndex: options.indexOf(item.content) };
    });
    // round 变化时重新生成（用于"再来一轮"）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, round]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const q = questions[idx];

  const handlePick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i !== q.correctIndex) {
      setWrongIds((prev) => [...prev, q.item.id]);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= total) {
      setFinished(true);
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  const handleRestart = () => {
    setRound((r) => r + 1);
    setIdx(0);
    setPicked(null);
    setWrongIds([]);
    setFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />
      <div
        className="relative w-full max-w-[480px] bg-white rounded-t-3xl sm:rounded-3xl shadow-cute-lg animate-slide-up max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-pink-50">
          <h3 className="text-base font-bold text-gray-800">
            📝 {folderName} · 顺序刷题
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50 active:scale-90 transition">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 no-scrollbar flex-1">
          {total < 2 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-sm text-gray-500 leading-relaxed">
                这个文件夹还出不了题～<br />
                至少需要 <b>2 条带内容</b>的素材（导入时用「标题 | 内容」格式，每行一条）
              </p>
              <Button variant="secondary" size="md" className="mt-4" onClick={onClose}>
                知道了
              </Button>
            </div>
          ) : finished ? (
            /* ===== 成绩单 ===== */
            <div className="py-4">
              <div className="text-center mb-5">
                <div className="text-5xl mb-2">{wrongIds.length === 0 ? '🎉' : '💪'}</div>
                <div className="text-2xl font-extrabold text-pink-500">
                  {total - wrongIds.length} / {total}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {wrongIds.length === 0 ? '全部答对，太棒了！' : `答错 ${wrongIds.length} 题，回头看看解析吧`}
                </p>
              </div>

              {wrongIds.length > 0 && (
                <div className="space-y-2 mb-5">
                  <h4 className="text-sm font-bold text-gray-700">答错的题目：</h4>
                  {questions
                    .filter((qq) => wrongIds.includes(qq.item.id))
                    .map((qq) => (
                      <div key={qq.item.id} className="bg-pink-50/60 rounded-xl p-3">
                        <p className="text-sm font-bold text-gray-700">{qq.item.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{qq.item.content}</p>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="secondary" size="lg" className="flex-1" onClick={handleRestart}>
                  <RotateCcw size={16} className="inline mr-1" /> 再来一轮
                </Button>
                <Button variant="primary" size="lg" className="flex-1" onClick={onClose}>
                  完成
                </Button>
              </div>
            </div>
          ) : (
            /* ===== 做题区 ===== */
            <div>
              {/* 进度 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-2 bg-pink-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all"
                    style={{ width: `${((idx + 1) / total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-bold whitespace-nowrap">
                  {idx + 1} / {total}
                </span>
              </div>

              {/* 题干 */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 mb-4">
                <p className="text-xs text-gray-400 mb-1">第 {idx + 1} 题 · 选出对应的正确内容</p>
                <p className="text-base font-bold text-gray-800 leading-relaxed">{q.item.title}</p>
              </div>

              {/* 选项 */}
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isPicked = picked === i;
                  let cls = 'bg-white border-pink-100 text-gray-600';
                  if (picked !== null) {
                    if (isCorrect) cls = 'bg-green-50 border-green-300 text-green-700';
                    else if (isPicked) cls = 'bg-red-50 border-red-300 text-red-500';
                    else cls = 'bg-gray-50 border-gray-100 text-gray-300';
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handlePick(i)}
                      disabled={picked !== null}
                      className={`w-full text-left border-2 rounded-2xl px-4 py-3 text-sm leading-relaxed transition active:scale-[0.99] ${cls}`}
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                      {clip(opt)}
                      {picked !== null && isCorrect && (
                        <CheckCircle2 size={16} className="inline ml-1.5 text-green-500 -mt-0.5" />
                      )}
                      {picked !== null && isPicked && !isCorrect && (
                        <XCircle size={16} className="inline ml-1.5 text-red-400 -mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 答案解析 */}
              {picked !== null && (
                <div className="mt-4 animate-fade-in">
                  <div className="bg-green-50/70 border border-green-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-green-600 mb-1">
                      ✅ 正确答案（{q.item.title}）
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">{q.item.content}</p>
                  </div>
                  <Button variant="primary" size="lg" className="w-full mt-3" onClick={handleNext}>
                    {idx + 1 >= total ? '查看成绩' : '下一题 →'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
