import { useState } from 'react';
import { Download, Upload, Info, Palette, Clock, Target, MessageCircleHeart, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../../store';
import { useThemeStore, THEMES, MASCOTS, FONT_COLORS, type Mascot } from '../../store/themeStore';
import { useQuoteStore } from '../common/MascotAvatar';
import { downloadBackup, importData } from '../../services/backup';
import { Card, Button, Input } from '../common';
import type { BackupData } from '../../services/backup';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore();
  const { theme, mascot, fontColor, customFontColor, customThemeColor, setTheme, setMascot, setFontColor, setCustomFontColor, setCustomThemeColor } = useThemeStore();
  const [importStatus, setImportStatus] = useState('');

  // 鼓励的话自定义（按当前吉祥物分别设置）
  const quotes = useQuoteStore((s) => s.quotes[mascot]);
  const addQuote = useQuoteStore((s) => s.addQuote);
  const removeQuote = useQuoteStore((s) => s.removeQuote);
  const [newQuote, setNewQuote] = useState('');

  const handleAddQuote = () => {
    const text = newQuote.trim();
    if (!text) return;
    addQuote(mascot, text);
    setNewQuote('');
  };

  const handleExport = () => {
    downloadBackup();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as BackupData;
        importData(data);
        setImportStatus('✅ 导入成功！刷新页面生效');
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setImportStatus('❌ 导入失败，文件格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-4 space-y-4">
      {/* 番茄钟设置 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={18} className="text-pink-400" />
          <h3 className="font-bold text-gray-700">番茄钟设置</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">默认倒计时时长（分钟）</label>
            <Input
              type="number"
              value={settings.pomodoroDefaultMinutes}
              onChange={(v) => updateSettings({ pomodoroDefaultMinutes: Number(v) || 25 })}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">默认模式</label>
            <div className="flex gap-2">
              {(['countdown', 'stopwatch'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSettings({ pomodoroDefaultMode: mode })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    settings.pomodoroDefaultMode === mode
                      ? 'bg-pink-300 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {mode === 'countdown' ? '倒计时' : '正向计时'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 学习目标 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-purple-400" />
          <h3 className="font-bold text-gray-700">每日学习目标</h3>
        </div>
        <Input
          type="number"
          value={settings.dailyGoalMinutes}
          onChange={(v) => updateSettings({ dailyGoalMinutes: Number(v) || 180 })}
          placeholder="每日目标学习时长（分钟）"
        />
        <p className="text-xs text-gray-400 mt-1">当前目标：{settings.dailyGoalMinutes} 分钟 / 天</p>
      </Card>

      {/* 数据备份 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Download size={18} className="text-mint" />
          <h3 className="font-bold text-gray-700">数据备份</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          导出数据到手机本地文件，避免数据丢失。可选择保存到文件或分享。
        </p>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="primary" size="md" className="flex-1">
            <Download size={16} className="inline mr-1" />
            导出数据
          </Button>
          <label className="flex-1">
            <Button variant="secondary" size="md" className="w-full">
              <Upload size={16} className="inline mr-1" />
              导入数据
            </Button>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        {importStatus && (
          <p className="text-sm text-center mt-2 text-gray-600">{importStatus}</p>
        )}
      </Card>

      {/* 关于 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-gray-400" />
          <h3 className="font-bold text-gray-700">关于lukin的工作台</h3>
        </div>
        <div className="text-sm text-gray-500 space-y-1">
          <p>🌸 版本：1.0.0</p>
          <p>📚 马卡龙粉紫色系 · 可爱风公考学习工作台</p>
          <p>💾 数据存储：本地浏览器（localStorage）</p>
          <p>📱 可添加到主屏幕作为 PWA 应用使用</p>
          <p className="mt-2 text-xs text-gray-400">
            提示：导出的 JSON 文件可保存到手机文件夹，也可导入到其他设备或平台使用。
          </p>
        </div>
      </Card>

      {/* 主题风格 + 吉祥物 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Palette size={18} className="text-pink-400" />
          <h3 className="font-bold text-gray-700">主题风格 🎨</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">选择你喜欢的色系和吉祥物</p>

        {/* 色系选择 */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((key) => {
            const t = THEMES[key];
            const isActive = theme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition active:scale-95 ${
                  isActive ? 'ring-2 ring-pink-400 bg-pink-50' : 'bg-gray-50'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${t.primary} 0%, ${t.secondary} 100%)` }}
                />
                <span className="text-xs font-medium text-gray-600">{t.emoji}</span>
                <span className="text-[10px] text-gray-400">{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* 自定义主题色 */}
        <div className={`mb-4 flex items-center gap-3 p-2 rounded-2xl ${theme === 'custom' ? 'ring-2 ring-pink-400 bg-pink-50' : 'bg-gray-50'}`}>
          <label className="text-xs text-gray-500 flex-shrink-0">自定义主题色：</label>
          <input
            type="color"
            value={customThemeColor}
            onChange={(e) => {
              setCustomThemeColor(e.target.value);
              setTheme('custom');
            }}
            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
          />
          <span className="text-xs text-gray-400">{customThemeColor}</span>
          {theme === 'custom' && (
            <span className="text-xs font-bold text-pink-500 ml-auto">使用中 ✓</span>
          )}
        </div>

        {/* 吉祥物选择 */}
        <label className="text-sm text-gray-500 mb-2 block">选择吉祥物伙伴</label>
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(MASCOTS) as Mascot[]).map((key) => {
            const m = MASCOTS[key];
            const isActive = mascot === key;
            return (
              <button
                key={key}
                onClick={() => setMascot(key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition active:scale-95 ${
                  isActive ? 'ring-2 ring-pink-400 bg-pink-50' : 'bg-gray-50'
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/60 flex items-center justify-center">
                  <img
                    src={import.meta.env.BASE_URL ? `${import.meta.env.BASE_URL}mascots/${m.file}`.replace(/\/+/g, '/') : `/mascots/${m.file}`}
                    alt={m.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">{m.name}</span>
              </button>
            );
          })}
        </div>

        {/* 字体颜色选择 */}
        <label className="text-sm text-gray-500 mb-2 block mt-4">选择字体颜色</label>
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(FONT_COLORS) as Array<keyof typeof FONT_COLORS>).map((key) => {
            const f = FONT_COLORS[key];
            const isActive = fontColor === key;
            return (
              <button
                key={key}
                onClick={() => setFontColor(key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition active:scale-95 ${
                  isActive ? 'ring-2 ring-pink-400 bg-pink-50' : 'bg-gray-50'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full shadow-sm"
                  style={{ backgroundColor: f.preview }}
                />
                <span className="text-xs font-medium text-gray-600">{f.name}</span>
              </button>
            );
          })}
        </div>

        {/* 自定义颜色 */}
        <div className="mt-3 flex items-center gap-3">
          <label className="text-xs text-gray-500">自定义颜色：</label>
          <input
            type="color"
            value={customFontColor}
            onChange={(e) => {
              setCustomFontColor(e.target.value);
              setFontColor('custom');
            }}
            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
          />
          <span className="text-xs text-gray-400">{customFontColor}</span>
        </div>
      </Card>

      {/* 鼓励的话自定义 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <MessageCircleHeart size={18} className="text-pink-400" />
          <h3 className="font-bold text-gray-700">鼓励的话 💬</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          点击首页的{MASCOTS[mascot].name}时，它会随机说出这些话并读给你听。当前为「{MASCOTS[mascot].emoji} {MASCOTS[mascot].name}」设置，切换吉祥物可分别自定义。
        </p>

        {/* 现有语录 */}
        <div className="space-y-2 mb-3">
          {quotes.length === 0 ? (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
              还没有语录，添加一句吧～没有语录时小动物就不会说话哦
            </p>
          ) : (
            quotes.map((q, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-pink-50/50 rounded-xl px-3 py-2"
              >
                <span className="flex-1 text-sm text-gray-600">{q}</span>
                <button
                  onClick={() => removeQuote(mascot, i)}
                  className="p-1 rounded-lg hover:bg-red-50 active:scale-90 transition flex-shrink-0"
                  aria-label="删除这句"
                >
                  <Trash2 size={14} className="text-red-300" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* 添加新语录 */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={newQuote}
              onChange={setNewQuote}
              placeholder="写一句鼓励的话，如：今天也要加油呀！"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleAddQuote}
            disabled={!newQuote.trim()}
          >
            添加
          </Button>
        </div>
      </Card>
    </div>
  );
}
