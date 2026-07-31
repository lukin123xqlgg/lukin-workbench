import { useState, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, X } from 'lucide-react';
import { useMistakeStore } from '../../store';
import { SUBJECTS, SUBJECT_MAP, type SubjectId } from '../../config/constants';
import { todayStr } from '../../hooks';
import { CenterModal, Button, Input, Textarea, SubjectTag, EmptyState, Card } from '../common';
import { VoiceRecorder, VoicePlayer, VoiceToText, PhotoCapture } from '../common/VoiceRecorder';
import type { MistakeVoiceNote, MistakePhotoNote } from '../../types';

export default function MistakePage() {
  const { mistakes, addMistake, deleteMistake } = useMistakeStore();
  const [filterSubject, setFilterSubject] = useState<SubjectId | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // 表单状态
  const [formSubject, setFormSubject] = useState<SubjectId>('verbal');
  const [question, setQuestion] = useState('');
  const [myAnswer, setMyAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [knowledgePoint, setKnowledgePoint] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [attachments, setAttachments] = useState<(MistakeVoiceNote | MistakePhotoNote)[]>([]);

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
    setFormSubject('verbal');
    setQuestion('');
    setMyAnswer('');
    setCorrectAnswer('');
    setKnowledgePoint('');
    setAnalysis('');
    setAttachments([]);
  };

  const handleSave = () => {
    if (!question.trim()) return;
    addMistake({
      date: todayStr(),
      subject: formSubject,
      question: question.trim(),
      myAnswer: myAnswer.trim() || undefined,
      correctAnswer: correctAnswer.trim() || undefined,
      knowledgePoint: knowledgePoint.trim() || undefined,
      analysis: analysis.trim() || undefined,
      attachments,
    });
    resetForm();
    setModalOpen(false);
  };

  const handleAddPhoto = (base64: string) => {
    setAttachments((prev) => [...prev, { type: 'photo', image: base64 } as MistakePhotoNote]);
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

  const photoAttachments = attachments.filter((a): a is MistakePhotoNote => a.type === 'photo');
  const voiceAttachments = attachments.filter((a): a is MistakeVoiceNote => a.type === 'voice');

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* 顶部标题 */}
      <div className="sticky top-0 z-30 backdrop-blur-sm px-4 pt-4 pb-2" style={{ backgroundColor: 'var(--app-bg)', opacity: 0.95 }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-800">错题本 📝</h1>
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} className="inline mr-0.5" /> 添加错题
          </Button>
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
          <EmptyState emoji="📝" text="还没有错题记录，添加第一道吧~" />
        ) : (
          filteredMistakes.map((mistake) => {
            const subj = SUBJECT_MAP[mistake.subject];
            const isExpanded = expandedIds.has(mistake.id);
            const photos = mistake.attachments.filter((a): a is MistakePhotoNote => a.type === 'photo');
            const voices = mistake.attachments.filter((a): a is MistakeVoiceNote => a.type === 'voice');
            return (
              <Card key={mistake.id} className="relative">
                {/* 顶部：板块标签 + 日期 + 删除 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                      style={{ backgroundColor: subj.bg, color: subj.color }}
                    >
                      {subj.emoji} {subj.name}
                    </span>
                    <span className="text-xs text-gray-400">{mistake.date}</span>
                  </div>
                  <button
                    onClick={() => deleteMistake(mistake.id)}
                    className="p-1.5 rounded-full hover:bg-red-50 active:scale-90 transition"
                  >
                    <Trash2 size={15} className="text-red-300" />
                  </button>
                </div>

                {/* 题目内容 */}
                <div onClick={() => toggleExpand(mistake.id)} className="cursor-pointer">
                  <p
                    className={`text-sm text-gray-700 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}
                  >
                    {mistake.question}
                  </p>
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
          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
              <div key={w} className="text-center text-xs text-gray-300 font-medium">{w}</div>
            ))}
          </div>
          {/* 热力图网格 */}
          <div className="grid grid-cols-7 gap-1">
            {monthData.cells.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square" />;
              const count = monthData.countMap[day] || 0;
              const isToday = day === new Date().getDate() &&
                new Date().getMonth() === new Date().getMonth();
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
          {/* 图例 */}
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

      {/* 添加错题 CenterModal */}
      <CenterModal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="添加错题 📝">
        <div className="space-y-4 pb-2">
          {/* 板块选择 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">板块</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <SubjectTag
                  key={s.id}
                  emoji={s.emoji}
                  name={s.name}
                  color={s.color}
                  bg={s.bg}
                  active={formSubject === s.id}
                  onClick={() => setFormSubject(s.id)}
                />
              ))}
            </div>
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

          {/* 附件区 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">附件</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <PhotoCapture onCaptured={handleAddPhoto} />
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
                      onClick={() => handleDeleteAttachment(i)}
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
            disabled={!question.trim()}
          >
            保存错题
          </Button>
        </div>
      </CenterModal>

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
