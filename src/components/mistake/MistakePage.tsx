import { useState, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, X, Download, FolderCog, PencilLine } from 'lucide-react';
import { useMistakeStore, useSubCategoryStore, getSubCategories } from '../../store';
import { SUBJECTS, SUBJECT_MAP, type SubjectId } from '../../config/constants';
import { todayStr } from '../../hooks';
import { CenterModal, Button, Input, Textarea, SubjectTag, Card } from '../common';
import { VoiceRecorder, VoicePlayer, VoiceToText, PhotoCapture } from '../common/VoiceRecorder';
import AnnotationModal from './AnnotationModal';
import type { MistakeVoiceNote, MistakePhotoNote } from '../../types';

export default function MistakePage() {
  const { mistakes, addMistake, deleteMistake } = useMistakeStore();
  const [filterSubject, setFilterSubject] = useState<SubjectId | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  // 表单状态
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState<SubjectId>('verbal');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formNote, setFormNote] = useState('');
  const [question, setQuestion] = useState('');
  const [myAnswer, setMyAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [knowledgePoint, setKnowledgePoint] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [attachments, setAttachments] = useState<(MistakeVoiceNote | MistakePhotoNote)[]>([]);

  // 图片标注
  const [annotatingImage, setAnnotatingImage] = useState<string | null>(null);

  // 图片放大预览
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 展开状态
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredMistakes = useMemo(() => {
    const sorted = [...mistakes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filterSubject === 'all') return sorted;
    return sorted.filter((m) => m.subject === filterSubject);
  }, [mistakes, filterSubject]);

  // 月度打卡数据
  const monthData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const countMap: Record<number, number> = {};
    mistakes.forEach((m) => {
      const d = new Date(m.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        countMap[day] = (countMap[day] || 0) + 1;
      }
    });
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return { cells, countMap, maxCount: Math.max(1, ...Object.values(countMap)) };
  }, [mistakes]);

  const getHeatColor = (count: number) => {
    if (count === 0) return '#F0F0F0';
    const ratio = count / monthData.maxCount;
    if (ratio > 0.75) return '#E8A0BF';
    if (ratio > 0.5) return '#F0B8CE';
    if (ratio > 0.25) return '#F5CDDD';
    return '#FAE6EF';
  };

  const resetForm = () => {
    setFormTitle('');
    setFormSubject('verbal');
    setFormSubCategory('');
    setFormNote('');
    setQuestion('');
    setMyAnswer('');
    setCorrectAnswer('');
    setKnowledgePoint('');
    setAnalysis('');
    setAttachments([]);
  };

  const handleSave = () => {
    if (!question.trim() && !formTitle.trim()) return;
    addMistake({
      date: todayStr(),
      subject: formSubject,
      subCategory: formSubCategory || undefined,
      title: formTitle.trim() || undefined,
      note: formNote.trim() || undefined,
      question: question.trim() || formTitle.trim(),
      myAnswer: myAnswer.trim() || undefined,
      correctAnswer: correctAnswer.trim() || undefined,
      knowledgePoint: knowledgePoint.trim() || undefined,
      analysis: analysis.trim() || undefined,
      attachments,
    });
    resetForm();
    setModalOpen(false);
  };

  // 拍照后进入标注流程
  const handlePhotoCaptured = (base64: string) => {
    setAnnotatingImage(base64);
  };

  const handleAnnotationDone = (annotated: string) => {
    setAttachments((prev) => [...prev, { type: 'photo', image: annotated } as MistakePhotoNote]);
    setAnnotatingImage(null);
  };

  const handleAnnotationSkip = () => {
    if (annotatingImage) {
      setAttachments((prev) => [...prev, { type: 'photo', image: annotatingImage } as MistakePhotoNote]);
    }
    setAnnotatingImage(null);
  };

  const handleAddVoice = (note: MistakeVoiceNote) => {
    setAttachments((prev) => [...prev, note]);
  };

  const handleDeleteAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTranscript = (text: string) => {
    setQuestion((prev) => (prev ? prev + '\n' + text : text));
  };

  // ===== 导出 PDF（打印视图，可另存为 PDF）=====
  const handleExportPdf = () => {
    const list = filteredMistakes;
    if (list.length === 0) {
      alert('当前没有可导出的错题');
      return;
    }
    const esc = (s?: string) =>
      (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
    const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><title>lukin的错题本</title>
<style>
  body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; padding: 24px; color: #333; }
  h1 { font-size: 20px; color: #D97B9F; }
  .meta { color: #999; font-size: 12px; margin-bottom: 16px; }
  .item { border: 1px solid #F0D8E2; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; page-break-inside: avoid; }
  .title { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
  .tags { margin-bottom: 6px; }
  .tag { display: inline-block; background: #FDE8F0; color: #C5688A; border-radius: 999px; padding: 2px 10px; font-size: 11px; margin-right: 6px; }
  .row { font-size: 13px; margin: 4px 0; line-height: 1.6; }
  .label { color: #999; font-weight: 700; }
  .wrong { color: #D96060; } .right { color: #4E9A51; } .kp { color: #8E7CC3; }
  .note { background: #FDF3F7; border-radius: 8px; padding: 8px 10px; }
  img { max-width: 220px; border-radius: 8px; margin-top: 6px; }
</style></head><body>
<h1>📝 lukin的错题本</h1>
<div class="meta">导出时间：${new Date().toLocaleString('zh-CN')} · 共 ${list.length} 道错题</div>
${list
  .map((m) => {
    const subj = SUBJECT_MAP[m.subject];
    const photos = m.attachments.filter((a): a is MistakePhotoNote => a.type === 'photo');
    return `<div class="item">
  <div class="title">${esc(m.title || m.question)}</div>
  <div class="tags"><span class="tag">${subj?.emoji ?? ''} ${subj?.name ?? m.subject}</span>${
      m.subCategory ? `<span class="tag">${esc(m.subCategory)}</span>` : ''
    }<span class="tag">${esc(m.date)}</span></div>
  ${m.title && m.question && m.question !== m.title ? `<div class="row"><span class="label">题目：</span>${esc(m.question)}</div>` : ''}
  ${m.myAnswer ? `<div class="row"><span class="label">我的答案：</span><span class="wrong">${esc(m.myAnswer)}</span></div>` : ''}
  ${m.correctAnswer ? `<div class="row"><span class="label">正确答案：</span><span class="right">${esc(m.correctAnswer)}</span></div>` : ''}
  ${m.knowledgePoint ? `<div class="row"><span class="label">知识点：</span><span class="kp">${esc(m.knowledgePoint)}</span></div>` : ''}
  ${m.analysis ? `<div class="row"><span class="label">解析：</span>${esc(m.analysis)}</div>` : ''}
  ${m.note ? `<div class="row note"><span class="label">备注：</span>${esc(m.note)}</div>` : ''}
  ${photos.map((p) => `<img src="${p.image}" alt="题目图片"/>`).join('')}
</div>`;
  })
  .join('\n')}
<script>window.onload = () => { window.print(); }</script>
</body></html>`;
    const win = window.open('', '_blank');
    if (!win) {
      alert('浏览器拦截了弹窗，请允许弹出窗口后重试');
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  const photoAttachments = attachments.filter((a): a is MistakePhotoNote => a.type === 'photo');
  const voiceAttachments = attachments.filter((a): a is MistakeVoiceNote => a.type === 'voice');
  const subCategories = getSubCategories(formSubject, useSubCategoryStore.getState().custom);

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* 顶部标题 */}
      <div className="sticky top-0 z-30 backdrop-blur-sm px-4 pt-4 pb-2" style={{ backgroundColor: 'var(--app-bg)', opacity: 0.95 }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-800">错题本 📝</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="px-2.5 py-1.5 rounded-xl bg-white text-gray-500 text-xs font-bold shadow-cute active:scale-95 transition flex items-center gap-1"
            >
              <Download size={13} /> 导出PDF
            </button>
            <button
              onClick={() => setCategoryOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white text-gray-500 text-xs font-bold shadow-cute active:scale-95 transition flex items-center gap-1"
            >
              <FolderCog size={13} /> 分类管理
            </button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={15} className="inline mr-0.5" /> 新建错题
            </Button>
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <SubjectTag
            emoji="📚"
            name="全部"
            color="#E8A0BF"
            bg="#FAE6EF"
            active={filterSubject === 'all'}
            onClick={() => setFilterSubject('all')}
          />
          {SUBJECTS.map((s) => (
            <SubjectTag
              key={s.id}
              emoji={s.emoji}
              name={s.name}
              color={s.color}
              bg={s.bg}
              active={filterSubject === s.id}
              onClick={() => setFilterSubject(s.id)}
            />
          ))}
        </div>
      </div>

      {/* 错题列表 */}
      <div className="px-4 space-y-3 mt-2">
        {filteredMistakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3 opacity-60">📝</div>
            <p className="text-gray-400 text-sm mb-4">还没有错题，开始添加吧</p>
            <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>
              添加第一道错题
            </Button>
          </div>
        ) : (
          filteredMistakes.map((mistake) => {
            const subj = SUBJECT_MAP[mistake.subject];
            const isExpanded = expandedIds.has(mistake.id);
            const photos = mistake.attachments.filter((a): a is MistakePhotoNote => a.type === 'photo');
            const voices = mistake.attachments.filter((a): a is MistakeVoiceNote => a.type === 'voice');
            return (
              <Card key={mistake.id} className="relative">
                {/* 顶部：大类/小类标签 + 日期 + 删除 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                      style={{ backgroundColor: subj.bg, color: subj.color }}
                    >
                      {subj.emoji} {subj.name}
                    </span>
                    {mistake.subCategory && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-400">
                        {mistake.subCategory}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{mistake.date}</span>
                  </div>
                  <button
                    onClick={() => deleteMistake(mistake.id)}
                    className="p-1.5 rounded-full hover:bg-red-50 active:scale-90 transition flex-shrink-0"
                  >
                    <Trash2 size={15} className="text-red-300" />
                  </button>
                </div>

                {/* 标题 / 题目 */}
                <div onClick={() => toggleExpand(mistake.id)} className="cursor-pointer">
                  <p className={`text-sm font-bold text-gray-800 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {mistake.title || mistake.question}
                  </p>
                  {mistake.title && (
                    <p className={`text-xs text-gray-500 mt-0.5 ${isExpanded ? '' : 'line-clamp-1'}`}>
                      {mistake.question}
                    </p>
                  )}
                  {mistake.note && !isExpanded && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1 bg-pink-50/50 rounded-lg px-2 py-1 inline-block">
                      📌 {mistake.note}
                    </p>
                  )}
                  {!isExpanded && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-pink-400">
                      <ChevronDown size={14} /> 展开详情
                    </div>
                  )}
                </div>

                {/* 展开内容 */}
                {isExpanded && (
                  <div className="mt-3 space-y-2 animate-fade-in">
                    {mistake.myAnswer && (
                      <div className="text-sm">
                        <span className="text-gray-400 font-bold">我的答案：</span>
                        <span className="text-red-400">{mistake.myAnswer}</span>
                      </div>
                    )}
                    {mistake.correctAnswer && (
                      <div className="text-sm">
                        <span className="text-gray-400 font-bold">正确答案：</span>
                        <span className="text-green-500">{mistake.correctAnswer}</span>
                      </div>
                    )}
                    {mistake.knowledgePoint && (
                      <div className="text-sm">
                        <span className="text-gray-400 font-bold">知识点：</span>
                        <span className="text-purple-500">{mistake.knowledgePoint}</span>
                      </div>
                    )}
                    {mistake.analysis && (
                      <div className="text-sm bg-pink-50/50 rounded-xl p-3">
                        <span className="text-gray-400 font-bold">解析：</span>
                        <span className="text-gray-600 leading-relaxed">{mistake.analysis}</span>
                      </div>
                    )}
                    {mistake.note && (
                      <div className="text-sm bg-pink-50/50 rounded-xl p-3">
                        <span className="text-gray-400 font-bold">备注（错因）：</span>
                        <span className="text-gray-600 leading-relaxed">{mistake.note}</span>
                      </div>
                    )}

                    {/* 图片附件 */}
                    {photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {photos.map((photo, i) => (
                          <img
                            key={i}
                            src={photo.image}
                            alt="题目图片"
                            className="w-20 h-20 rounded-xl object-cover cursor-pointer active:scale-95 transition"
                            onClick={() => setPreviewImage(photo.image)}
                          />
                        ))}
                      </div>
                    )}

                    {/* 语音附件 */}
                    {voices.length > 0 && (
                      <div className="space-y-2">
                        {voices.map((voice, i) => (
                          <VoicePlayer key={i} note={voice} />
                        ))}
                      </div>
                    )}

                    <div
                      onClick={() => toggleExpand(mistake.id)}
                      className="flex items-center gap-1 mt-1 text-xs text-gray-400 cursor-pointer"
                    >
                      <ChevronDown size={14} className="rotate-180" /> 收起
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* 底部月度打卡视图 */}
      <div className="px-4 mt-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">
              📅 {new Date().getMonth() + 1}月打卡
            </h3>
            <span className="text-xs text-gray-400">
              共 {mistakes.filter((m) => {
                const d = new Date(m.date);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length} 条错题
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
              <div key={w} className="text-center text-xs text-gray-300 font-medium">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthData.cells.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square" />;
              const count = monthData.countMap[day] || 0;
              const isToday = day === new Date().getDate();
              return (
                <div
                  key={i}
                  className="aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition"
                  style={{
                    backgroundColor: getHeatColor(count),
                    color: count > monthData.maxCount * 0.5 ? '#fff' : '#999',
                    border: isToday ? '2px solid #E8A0BF' : 'none',
                  }}
                  title={`${day}日: ${count}条`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <span className="text-xs text-gray-400">少</span>
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F0F0F0' }} />
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FAE6EF' }} />
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F5CDDD' }} />
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F0B8CE' }} />
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#E8A0BF' }} />
            <span className="text-xs text-gray-400">多</span>
          </div>
        </Card>
      </div>

      {/* ===== 新建错题 CenterModal ===== */}
      <CenterModal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="新建错题 📝">
        <div className="space-y-4 pb-2">
          {/* 标题 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">标题</label>
            <Input value={formTitle} onChange={setFormTitle} placeholder="如：三角形、基期量计算..." />
          </div>

          {/* 大类 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">大类</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <SubjectTag
                  key={s.id}
                  emoji={s.emoji}
                  name={s.name}
                  color={s.color}
                  bg={s.bg}
                  active={formSubject === s.id}
                  onClick={() => {
                    setFormSubject(s.id);
                    setFormSubCategory('');
                  }}
                />
              ))}
            </div>
          </div>

          {/* 小类 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">小类</label>
            <div className="flex flex-wrap gap-2">
              {subCategories.map((name) => (
                <button
                  key={name}
                  onClick={() => setFormSubCategory(formSubCategory === name ? '' : name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition active:scale-95 ${
                    formSubCategory === name
                      ? 'bg-purple-100 text-purple-500 shadow-cute'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* 备注（错因） */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">备注</label>
            <Textarea
              value={formNote}
              onChange={setFormNote}
              placeholder="记录错因、知识点、解题思路..."
              rows={2}
            />
          </div>

          {/* 题目 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">题目</label>
            <Textarea
              value={question}
              onChange={setQuestion}
              placeholder="输入题目..."
              rows={3}
            />
          </div>

          {/* 我的答案 + 正确答案 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm font-bold text-gray-600 mb-2 block">我的答案</label>
              <Input value={myAnswer} onChange={setMyAnswer} placeholder="我的答案" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-bold text-gray-600 mb-2 block">正确答案</label>
              <Input value={correctAnswer} onChange={setCorrectAnswer} placeholder="正确答案" />
            </div>
          </div>

          {/* 知识点 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">知识点</label>
            <Input value={knowledgePoint} onChange={setKnowledgePoint} placeholder="如：排列组合" />
          </div>

          {/* 解析 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">解析</label>
            <Textarea
              value={analysis}
              onChange={setAnalysis}
              placeholder="输入解析..."
              rows={2}
            />
          </div>

          {/* 附件区（拍照 → 可标注） */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">
              附件 <span className="text-xs font-normal text-gray-400">（拍照后可标注图片）</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              <PhotoCapture onCaptured={handlePhotoCaptured} />
              <VoiceRecorder onRecorded={handleAddVoice} />
              <VoiceToText onTranscript={handleTranscript} />
            </div>

            {/* 图片预览 */}
            {photoAttachments.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {photoAttachments.map((photo, i) => (
                  <div key={i} className="relative">
                    <img
                      src={photo.image}
                      alt="预览"
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <button
                      onClick={() => setAnnotatingImage(photo.image)}
                      className="absolute -bottom-1.5 -left-1.5 w-5 h-5 bg-white text-pink-400 rounded-full flex items-center justify-center shadow active:scale-90 transition"
                      title="重新标注"
                    >
                      <PencilLine size={11} />
                    </button>
                    <button
                      onClick={() => handleDeleteAttachment(attachments.indexOf(photo))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-400 text-white rounded-full flex items-center justify-center shadow active:scale-90 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 语音条预览 */}
            {voiceAttachments.length > 0 && (
              <div className="space-y-2 mb-2">
                {voiceAttachments.map((voice, i) => {
                  const voiceIdx = attachments.indexOf(voice);
                  return (
                    <VoicePlayer
                      key={i}
                      note={voice}
                      onDelete={() => handleDeleteAttachment(voiceIdx)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={!question.trim() && !formTitle.trim()}
          >
            保存错题
          </Button>
        </div>
      </CenterModal>

      {/* ===== 分类管理 Modal ===== */}
      <CategoryManager open={categoryOpen} onClose={() => setCategoryOpen(false)} />

      {/* ===== 图片标注 ===== */}
      {annotatingImage && (
        <AnnotationModal
          image={annotatingImage}
          onDone={handleAnnotationDone}
          onSkip={handleAnnotationSkip}
        />
      )}

      {/* 图片放大预览 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="放大预览"
            className="max-w-full max-h-full rounded-2xl"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center active:scale-90 transition"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}

// ===== 分类管理：管理各大类的小类 =====
function CategoryManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { custom, addSubCategory, removeSubCategory } = useSubCategoryStore();
  const [subject, setSubject] = useState<SubjectId>('verbal');
  const [newName, setNewName] = useState('');

  const allSubs = getSubCategories(subject, custom);
  const customSubs = custom[subject] || [];

  const handleAdd = () => {
    if (!newName.trim()) return;
    addSubCategory(subject, newName);
    setNewName('');
  };

  return (
    <CenterModal open={open} onClose={onClose} title="分类管理 🗂">
      <div className="space-y-4 pb-2">
        {/* 大类选择 */}
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

        {/* 小类列表 */}
        <div>
          <label className="text-sm font-bold text-gray-600 mb-2 block">
            「{SUBJECT_MAP[subject].name}」的小类
          </label>
          <div className="flex flex-wrap gap-2">
            {allSubs.map((name) => {
              const isCustom = customSubs.includes(name);
              return (
                <span
                  key={name}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                    isCustom ? 'bg-purple-100 text-purple-500' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {name}
                  {isCustom && (
                    <button
                      onClick={() => removeSubCategory(subject, name)}
                      className="text-purple-300 hover:text-red-400 active:scale-90 transition"
                    >
                      ✕
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-300 mt-2">灰色为默认小类，紫色为你添加的自定义小类（可删除）</p>
        </div>

        {/* 添加小类 */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input value={newName} onChange={setNewName} placeholder="添加自定义小类，如：图形推理" />
          </div>
          <Button variant="primary" size="md" onClick={handleAdd} disabled={!newName.trim()}>
            添加
          </Button>
        </div>

        <Button variant="secondary" size="lg" className="w-full" onClick={onClose}>
          完成
        </Button>
      </div>
    </CenterModal>
  );
}
