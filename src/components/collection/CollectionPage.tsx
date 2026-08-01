import { useState, useMemo, useRef } from 'react';
import { Trash2, ChevronDown, RefreshCw, ExternalLink, FolderOpen, Upload, Star, FileText, PlayCircle, Plus, StickyNote } from 'lucide-react';
import { useCollectionStore, useNoteStore } from '../../store';
import { todayStr } from '../../hooks';
import { BottomSheet, Button, Input, Textarea, EmptyState, Card } from '../common';
import QuizModal from './QuizModal';
import MistakePage from '../mistake/MistakePage';
import type { CollectionType, CollectionItem } from '../../types';

type TabId = CollectionType | 'favorite' | 'mistake' | 'note';

const TABS: { id: TabId; name: string; emoji: string }[] = [
  { id: 'current', name: '每日时政', emoji: '📰' },
  { id: 'essay', name: '申论素材', emoji: '✍️' },
  { id: 'common', name: '常识积累', emoji: '💡' },
  { id: 'favorite', name: '收藏夹', emoji: '⭐' },
  { id: 'mistake', name: '错题积累', emoji: '❌' },
  { id: 'note', name: '笔记', emoji: '📒' },
];

const TYPE_BADGE: Record<CollectionType, { name: string; emoji: string }> = {
  current: { name: '时政', emoji: '📰' },
  essay: { name: '申论', emoji: '✍️' },
  common: { name: '常识', emoji: '💡' },
};

const PRESET_NEWS = [
  { title: '习近平出席重要会议并发表重要讲话', source: '人民网', url: 'https://www.people.com.cn/' },
  { title: '国务院常务会议研究部署稳增长措施', source: '新华网', url: 'https://www.xinhuanet.com/politics/' },
  { title: '广东扎实推进高质量发展', source: '南方日报', url: 'https://www.nfnews.com/' },
  { title: '全国两会聚焦民生热点问题', source: '人民网', url: 'https://www.people.com.cn/' },
  { title: '中央经济工作会议定调明年发展', source: '新华网', url: 'https://www.xinhuanet.com/' },
  { title: '乡村振兴战略持续推进', source: '央广网', url: 'https://www.cnr.cn/' },
  { title: '科技创新助力产业升级', source: '光明日报', url: 'https://www.gmw.cn/' },
  { title: '生态文明建设取得新成效', source: '人民网', url: 'https://env.people.com.cn/' },
];

// 解析文件文本：每行一条，「标题 | 内容」格式（支持中英文竖线）
function parseTextToItems(text: string): { title: string; content: string }[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => {
      const sepIdx = line.search(/[|｜]/);
      if (sepIdx > 0) {
        return {
          title: line.slice(0, sepIdx).trim(),
          content: line.slice(sepIdx + 1).trim(),
        };
      }
      return { title: line, content: '' };
    });
}

export default function CollectionPage(_props: { onNavigate?: (tab: string) => void }) {
  const { items, addItems, toggleItemDone, toggleFavorite, deleteItem, deleteFolder, setGoal, getGoal } = useCollectionStore();
  const { notes, addNote, updateNote, deleteNote } = useNoteStore();
  const [activeTab, setActiveTab] = useState<TabId>('current');
  const [importOpen, setImportOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [quizFolder, setQuizFolder] = useState<string | null>(null);

  // 导入表单
  const [folderName, setFolderName] = useState('');
  const [importText, setImportText] = useState('');
  const [dailyGoal, setDailyGoal] = useState('10');
  const [importSummary, setImportSummary] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 时政刷新
  const [refreshing, setRefreshing] = useState(false);

  // 笔记编辑
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());

  const isFolderTab = activeTab === 'current' || activeTab === 'essay' || activeTab === 'common';

  const toggleFolder = (name: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // 按 tab 分组的文件夹
  const folderMap = useMemo(() => {
    if (!isFolderTab) return {};
    const tabItems = items.filter((it) => it.type === activeTab);
    const groups: Record<string, CollectionItem[]> = {};
    tabItems.forEach((it) => {
      if (!groups[it.folderName]) groups[it.folderName] = [];
      groups[it.folderName].push(it);
    });
    Object.keys(groups).forEach((name) => {
      groups[name].sort((a, b) => a.order - b.order);
    });
    return groups;
  }, [items, activeTab, isFolderTab]);

  const folderNames = Object.keys(folderMap);

  // 收藏夹
  const favoriteItems = useMemo(
    () => items.filter((it) => it.favorite).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [items]
  );

  // ===== 文件导入（选择 / 拖拽）=====
  const importFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    const targetType: CollectionType = isFolderTab ? activeTab : 'essay';
    const goal = parseInt(dailyGoal) || 10;
    let totalItems = 0;
    const folderResults: string[] = [];

    for (const file of fileArr) {
      const text = await file.text();
      const parsed = parseTextToItems(text);
      if (parsed.length === 0) continue;
      // 文件夹名：单文件时优先用输入框里的名字，否则用文件名
      const baseName = file.name.replace(/\.[^.]+$/, '').trim() || '未命名文件夹';
      const name =
        fileArr.length === 1 && folderName.trim() ? folderName.trim() : baseName;
      const newItems = parsed.map((p, i) => ({
        folderName: name,
        type: targetType,
        title: p.title,
        content: p.content,
        done: false,
        order: i,
      }));
      addItems(newItems);
      setGoal(name, targetType, goal);
      totalItems += parsed.length;
      folderResults.push(name);
      setExpandedFolders((prev) => new Set([...prev, name]));
    }

    if (totalItems > 0) {
      setImportSummary(`✅ 已导入 ${folderResults.length} 个文件夹，共 ${totalItems} 条（按文件顺序排列，可直接刷题）`);
      // 回到对应 tab 查看
      if (!isFolderTab) setActiveTab(targetType);
    } else {
      setImportSummary('⚠️ 没有解析到有效内容，请确认文件每行一条素材');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      importFiles(e.dataTransfer.files);
    }
  };

  const handleTextImport = () => {
    if (!folderName.trim() || !importText.trim()) return;
    const parsed = parseTextToItems(importText);
    if (parsed.length === 0) return;
    const targetType: CollectionType = isFolderTab ? activeTab : 'essay';
    const newItems = parsed.map((p, i) => ({
      folderName: folderName.trim(),
      type: targetType,
      title: p.title,
      content: p.content,
      done: false,
      order: i,
    }));
    addItems(newItems);
    setGoal(folderName.trim(), targetType, parseInt(dailyGoal) || 10);
    setExpandedFolders((prev) => new Set([...prev, folderName.trim()]));
    setFolderName('');
    setImportText('');
    setDailyGoal('10');
    setImportSummary('');
    setImportOpen(false);
  };

  const handleRefreshNews = async () => {
    setRefreshing(true);
    try {
      const resp = await fetch('https://corsproxy.io/?url=' + encodeURIComponent('http://politics.people.com.cn/'));
      if (resp.ok) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch {
      // 预期会失败，使用预置内容
    }
    setRefreshing(false);
  };

  const getFolderStats = (name: string) => {
    const folderItems = folderMap[name] || [];
    const doneCount = folderItems.filter((it) => it.done).length;
    return { total: folderItems.length, done: doneCount };
  };

  // ===== 笔记 =====
  const openNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteSheetOpen(true);
  };

  const openEditNote = (id: string) => {
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    setEditingNoteId(id);
    setNoteTitle(n.title);
    setNoteContent(n.content);
    setNoteSheetOpen(true);
  };

  const handleSaveNote = () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    if (editingNoteId) {
      updateNote(editingNoteId, { title: noteTitle.trim() || '无标题', content: noteContent });
    } else {
      addNote({ title: noteTitle.trim() || '无标题', content: noteContent });
    }
    setNoteSheetOpen(false);
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const toggleNoteExpand = (id: string) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ===== 条目行（文件夹内 & 收藏夹共用）=====
  const renderItemRow = (item: CollectionItem, showSource = false) => (
    <div key={item.id}>
      <div className="flex items-center gap-2.5 py-1.5">
        <button
          onClick={() => toggleItemDone(item.id, todayStr())}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition active:scale-90 ${
            item.done ? 'border-pink-400 bg-pink-400' : 'border-gray-200 bg-white'
          }`}
        >
          {item.done && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
        <span
          className={`text-sm flex-1 cursor-pointer ${item.done ? 'line-through text-gray-300' : 'text-gray-700'}`}
          onClick={() => {
            const el = document.getElementById(`item-content-${item.id}`);
            if (el) el.classList.toggle('hidden');
          }}
        >
          {showSource && (
            <span className="text-[10px] text-pink-400 bg-pink-50 rounded-full px-1.5 py-0.5 mr-1.5">
              {TYPE_BADGE[item.type].emoji}{TYPE_BADGE[item.type].name}·{item.folderName}
            </span>
          )}
          {item.title}
        </span>
        <button
          onClick={() => toggleFavorite(item.id)}
          className="p-1 rounded-lg hover:bg-yellow-50 active:scale-90 transition flex-shrink-0"
          aria-label="收藏"
        >
          <Star size={15} className={item.favorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
        </button>
        <button
          onClick={() => deleteItem(item.id)}
          className="p-1 rounded-lg hover:bg-red-50 active:scale-90 transition flex-shrink-0"
        >
          <Trash2 size={13} className="text-gray-300 hover:text-red-300" />
        </button>
      </div>
      {item.content && (
        <div id={`item-content-${item.id}`} className="hidden pl-8 pr-2 pb-1.5">
          <p className="text-xs text-gray-500 leading-relaxed bg-pink-50/30 rounded-lg p-2">
            {item.content}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* 顶部标题 + Tab */}
      <div className="sticky top-0 z-30 backdrop-blur-sm px-4 pt-4 pb-2" style={{ backgroundColor: 'var(--app-bg)', opacity: 0.95 }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-800">积累 📚</h1>
          {isFolderTab && (
            <button
              onClick={() => setImportOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 text-white text-sm font-bold shadow-cute active:scale-95 transition flex items-center gap-1"
            >
              <FolderOpen size={16} /> 添加文件夹
            </button>
          )}
          {activeTab === 'note' && (
            <button
              onClick={openNewNote}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 text-white text-sm font-bold shadow-cute active:scale-95 transition flex items-center gap-1"
            >
              <Plus size={16} /> 写笔记
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-2xl text-xs font-bold transition active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-cute'
                  : 'bg-white/60 text-gray-400'
              }`}
            >
              {tab.emoji} {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-2 space-y-3">
        {/* ===== 每日时政 tab：今日时政卡片 ===== */}
        {activeTab === 'current' && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700">📰 今日时政考点</h3>
              <button
                onClick={handleRefreshNews}
                disabled={refreshing}
                className="p-2 rounded-full bg-pink-50 text-pink-500 active:scale-90 transition disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">点击刷新获取今日时政考点，以下为预置时政要点</p>
            <div className="space-y-2">
              {PRESET_NEWS.map((news, i) => (
                <a
                  key={i}
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (window.matchMedia('(display-mode: standalone)').matches) {
                      e.preventDefault();
                      window.open(news.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="block bg-pink-50/50 rounded-xl p-3 active:scale-[0.98] transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">{news.title}</p>
                    <ExternalLink size={14} className="text-gray-300 group-hover:text-pink-400 flex-shrink-0 mt-0.5" />
                  </div>
                  <span className="text-xs text-gray-400 mt-1 inline-block">来源：{news.source}</span>
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* ===== 文件夹 tab：导入按钮 + 文件夹列表 ===== */}
        {isFolderTab && (
          <>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setImportOpen(true)}
            >
              <Upload size={18} className="inline mr-1" /> 上传文件 / 导入文件夹
            </Button>

            {folderNames.length === 0 ? (
              <EmptyState emoji="📂" text={`还没有${TABS.find((t) => t.id === activeTab)?.name}文件夹，上传一个吧~`} />
            ) : (
              folderNames.map((name) => {
                const stats = getFolderStats(name);
                const isExpanded = expandedFolders.has(name);
                const goal = getGoal(name);
                const folderItems = folderMap[name];
                return (
                  <Card key={name}>
                    {/* 文件夹头部 */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => toggleFolder(name)}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">📂</span>
                          <span className="text-sm font-bold text-gray-800">{name}</span>
                          <span className="text-xs text-gray-400">
                            {stats.done}/{stats.total}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 bg-pink-50 rounded-full flex-1 overflow-hidden max-w-[120px]">
                            <div
                              className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all"
                              style={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{Math.round(stats.total > 0 ? (stats.done / stats.total) * 100 : 0)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* 顺序刷题按钮 */}
                        <button
                          onClick={() => setQuizFolder(name)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-pink-50 text-pink-500 text-xs font-bold active:scale-90 transition"
                          title="按文件顺序出选择题"
                        >
                          <PlayCircle size={14} /> 刷题
                        </button>
                        <button
                          onClick={() => toggleFolder(name)}
                          className="p-1.5 rounded-lg hover:bg-pink-50 active:scale-90 transition"
                        >
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除文件夹「${name}」及其所有条目吗？`)) {
                              deleteFolder(name);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 active:scale-90 transition"
                        >
                          <Trash2 size={16} className="text-red-300" />
                        </button>
                      </div>
                    </div>

                    {/* 每日打卡目标 */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">每日目标</span>
                      <input
                        type="number"
                        value={goal}
                        onChange={(e) => setGoal(name, activeTab as CollectionType, parseInt(e.target.value) || 10)}
                        className="w-16 px-2 py-1 bg-pink-50/50 border border-pink-100 rounded-lg text-sm text-gray-700 text-center focus:outline-none focus:border-pink-300"
                      />
                      <span className="text-xs text-gray-400">条/天</span>
                    </div>

                    {/* 条目列表 */}
                    {isExpanded && (
                      <div className="mt-3 space-y-1.5 animate-fade-in">
                        {folderItems.map((item) => renderItemRow(item))}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </>
        )}

        {/* ===== 收藏夹 tab ===== */}
        {activeTab === 'favorite' && (
          <>
            {favoriteItems.length === 0 ? (
              <Card>
                <EmptyState emoji="⭐" text="还没有收藏，点条目右侧的小星星收藏起来吧~" />
              </Card>
            ) : (
              <Card>
                <h3 className="text-sm font-bold text-gray-700 mb-2">⭐ 我的收藏（{favoriteItems.length}）</h3>
                <div className="space-y-1.5">
                  {favoriteItems.map((item) => renderItemRow(item, true))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* ===== 错题积累 tab：内嵌完整错题本 ===== */}
        {activeTab === 'mistake' && (
          <div className="-mx-4">
            <MistakePage />
          </div>
        )}

        {/* ===== 笔记 tab ===== */}
        {activeTab === 'note' && (
          <>
            <Button variant="primary" size="lg" className="w-full" onClick={openNewNote}>
              <StickyNote size={18} className="inline mr-1" /> 写一条新笔记
            </Button>
            {notes.length === 0 ? (
              <Card>
                <EmptyState emoji="📒" text="还没有笔记，把灵感和总结记下来吧~" />
              </Card>
            ) : (
              notes.map((n) => {
                const isExpanded = expandedNoteIds.has(n.id);
                return (
                  <Card key={n.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => toggleNoteExpand(n.id)}>
                        <FileText size={15} className="text-pink-400 flex-shrink-0" />
                        <span className="text-sm font-bold text-gray-800 truncate">{n.title}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEditNote(n.id)}
                          className="px-2 py-1 rounded-lg bg-pink-50 text-pink-500 text-xs font-bold active:scale-90 transition"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除笔记「${n.title}」吗？`)) deleteNote(n.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 active:scale-90 transition"
                        >
                          <Trash2 size={15} className="text-red-300" />
                        </button>
                      </div>
                    </div>
                    <p
                      className={`text-xs text-gray-500 leading-relaxed whitespace-pre-wrap cursor-pointer ${isExpanded ? '' : 'line-clamp-2'}`}
                      onClick={() => toggleNoteExpand(n.id)}
                    >
                      {n.content || '（无内容）'}
                    </p>
                    <p className="text-[10px] text-gray-300 mt-1.5">
                      更新于 {new Date(n.updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </Card>
                );
              })
            )}
          </>
        )}
      </div>

      {/* ===== 导入文件夹 BottomSheet（支持上传文件 / 拖拽 / 粘贴文本）===== */}
      <BottomSheet open={importOpen} onClose={() => { setImportOpen(false); setImportSummary(''); }} title={`导入${TABS.find((t) => t.id === activeTab)?.name ?? ''}文件夹 📂`}>
        <div className="space-y-4 pb-2">
          {/* 文件夹名称 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">文件夹名称</label>
            <Input
              value={folderName}
              onChange={setFolderName}
              placeholder="不填则自动使用文件名"
            />
          </div>

          {/* 每日打卡目标 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">每日打卡目标</label>
            <Input
              type="number"
              value={dailyGoal}
              onChange={setDailyGoal}
              placeholder="10"
            />
          </div>

          {/* 文件上传 / 拖拽区 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">上传文件</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                dragOver ? 'border-pink-400 bg-pink-50' : 'border-pink-100 bg-pink-50/40'
              }`}
            >
              <Upload size={28} className="mx-auto text-pink-300 mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                {dragOver ? '松开即可导入 ✨' : '把文件拖到这里，或点击选择文件'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                支持 .txt / .md / .csv，可多选；每行一条素材，格式：标题 | 内容
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.text,text/plain,text/markdown,text/csv"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    importFiles(e.target.files);
                  }
                  e.target.value = '';
                }}
              />
            </div>
            {importSummary && (
              <p className="text-xs text-gray-500 bg-pink-50/60 rounded-xl p-2.5 mt-2">{importSummary}</p>
            )}
          </div>

          {/* 手动粘贴文本 */}
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">
              或直接粘贴文本 <span className="text-xs font-normal text-gray-400">（每行一条，格式：标题 | 内容）</span>
            </label>
            <Textarea
              value={importText}
              onChange={setImportText}
              placeholder={`两会政府工作报告要点 | 关键词...\n全国人大会议议程\n国务院机构改革方案 | 主要内容...`}
              rows={6}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleTextImport}
            disabled={!folderName.trim() || !importText.trim()}
          >
            导入文本
          </Button>
        </div>
      </BottomSheet>

      {/* ===== 笔记编辑 BottomSheet ===== */}
      <BottomSheet open={noteSheetOpen} onClose={() => setNoteSheetOpen(false)} title={editingNoteId ? '编辑笔记 📒' : '写笔记 📒'}>
        <div className="space-y-4 pb-2">
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">标题</label>
            <Input value={noteTitle} onChange={setNoteTitle} placeholder="笔记标题..." />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">内容</label>
            <Textarea value={noteContent} onChange={setNoteContent} placeholder="记录知识点、心得、总结..." rows={8} />
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSaveNote}
            disabled={!noteTitle.trim() && !noteContent.trim()}
          >
            保存笔记
          </Button>
        </div>
      </BottomSheet>

      {/* ===== 顺序刷题弹窗 ===== */}
      {quizFolder && (
        <QuizModal
          folderName={quizFolder}
          items={folderMap[quizFolder] ?? []}
          onClose={() => setQuizFolder(null)}
        />
      )}
    </div>
  );
}
