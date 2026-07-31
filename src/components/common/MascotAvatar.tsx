import { useState, useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mascot } from '../../store/themeStore';

// ============ 自定义台词 store ============
interface QuoteState {
  quotes: Record<Mascot, string[]>;
  setQuotes: (mascot: Mascot, quotes: string[]) => void;
  addQuote: (mascot: Mascot, quote: string) => void;
  removeQuote: (mascot: Mascot, index: number) => void;
}

const DEFAULT_QUOTES: Record<Mascot, string[]> = {
  bear: [
    'lukin 加油呀！小熊陪你一起学~',
    '今天的计划完成了吗？',
    '抱抱你，辛苦啦！',
    '听说吃蜂蜜能提高专注力哦~',
    '休息一下也没关系哒！',
  ],
  rabbit: [
    'lukin 今天也好棒！',
    '胡萝卜给你补充能量~',
    '蹦蹦跳跳学起来！',
    '再坚持五分钟好不好？',
    '小兔在看着你哦，加油！',
  ],
  cat: [
    '喵~ lukin 来啦！',
    '专注学习，本猫监督你！',
    '摸摸头，继续加油~',
    '今天也要元气满满哦！',
    '本猫困了，但你还要学！',
  ],
  chick: [
    '叽叽叽！lukin 好棒！',
    '小鸡给你打气！',
    '今天也要元气满满哒！',
    '一起冲鸭！',
    '学到几点呀？别太晚哦~',
  ],
};

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set) => ({
      quotes: DEFAULT_QUOTES,
      setQuotes: (mascot, qs) =>
        set((s) => ({ quotes: { ...s.quotes, [mascot]: qs } })),
      addQuote: (mascot, q) =>
        set((s) => ({ quotes: { ...s.quotes, [mascot]: [...s.quotes[mascot], q] } })),
      removeQuote: (mascot, idx) =>
        set((s) => ({
          quotes: {
            ...s.quotes,
            [mascot]: s.quotes[mascot].filter((_, i) => i !== idx),
          },
        })),
    }),
    { name: 'lukin-quotes' }
  )
);

interface Props {
  mascot: Mascot;
  size?: number;
  onTalk?: (text: string) => void;
}

export default function MascotAvatar({ mascot, size = 80, onTalk }: Props) {
  const quotes = useQuoteStore((s) => s.quotes[mascot]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 随机眨眼
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    };
    const interval = setInterval(() => {
      if (Math.random() > 0.35) blink();
    }, 2200 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // 点击说话
  const handleClick = useCallback(() => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);

    const list = quotes.length > 0 ? quotes : DEFAULT_QUOTES[mascot];
    const text = list[Math.floor(Math.random() * list.length)];
    setSpeech(text);
    onTalk?.(text);

    // 浏览器语音合成
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 1.1;
        utter.pitch = 1.4;
        utter.volume = 0.8;
        window.speechSynthesis.speak(utter);
      }
    } catch {}

    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeech(null), 3500);
  }, [mascot, quotes, onTalk]);

  // 长按编辑台词
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlePressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowEditor(true);
    }, 600);
  };
  const handlePressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* 气泡 */}
      {speech && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 animate-pop-in whitespace-nowrap max-w-[200px]">
          <div className="relative bg-white rounded-2xl px-3 py-1.5 shadow-cute text-xs text-gray-700 font-medium border border-pink-100">
            {speech}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-pink-100 transform rotate-45" />
          </div>
        </div>
      )}

      {/* 吉祥物本体 */}
      <button
        onClick={handleClick}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerLeave={handlePressEnd}
        className="relative w-full h-full active:scale-90 transition-transform"
        aria-label={`点击${mascot}互动，长按编辑台词`}
      >
        <div
          className={`w-full h-full ${isBouncing ? 'animate-wiggle' : 'animate-float'}`}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(217, 123, 159, 0.2))' }}
        >
          <MascotSvg mascot={mascot} isBlinking={isBlinking} />
        </div>
      </button>

      {/* 长按编辑提示 */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-gray-300 whitespace-nowrap">
        长按可编辑台词
      </div>

      {/* 编辑台词弹窗 */}
      {showEditor && (
        <QuoteEditor mascot={mascot} onClose={() => setShowEditor(false)} />
      )}
    </div>
  );
}

/* ============ 台词编辑器 ============ */
function QuoteEditor({ mascot, onClose }: { mascot: Mascot; onClose: () => void }) {
  const { quotes, addQuote, removeQuote } = useQuoteStore();
  const list = quotes[mascot];
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return;
    addQuote(mascot, input.trim());
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-[480px] mx-auto bg-white rounded-t-3xl p-5 animate-slide-up max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800">编辑{mascot === 'bear' ? '小熊' : mascot === 'rabbit' ? '小兔' : mascot === 'cat' ? '小猫' : '小鸡'}的台词 ✏️</h3>
          <button onClick={onClose} className="text-gray-400 text-sm">完成</button>
        </div>

        <p className="text-xs text-gray-400 mb-3 bg-pink-50/50 rounded-xl p-3">
          💡 点击吉祥物时会随机说一句台词。长按吉祥物可再次打开此页面编辑。
        </p>

        {/* 现有台词列表 */}
        <div className="space-y-2 mb-4">
          {list.map((q, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
              <span className="text-xs text-gray-300 flex-shrink-0 w-6">{i + 1}.</span>
              <span className="text-sm text-gray-700 flex-1">{q}</span>
              <button
                onClick={() => removeQuote(mascot, i)}
                className="text-red-300 text-xs px-2 py-1 rounded-lg active:scale-90 transition"
              >
                删除
              </button>
            </div>
          ))}
        </div>

        {/* 添加新台词 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="输入想对自己说的话..."
            className="flex-1 px-3 py-2 bg-pink-50/50 border border-pink-100 rounded-xl text-sm focus:outline-none focus:border-pink-300"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 text-white text-sm font-bold disabled:opacity-40 active:scale-95 transition"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ SVG 吉祥物（完整身体版） ============ */
function MascotSvg({ mascot, isBlinking }: { mascot: Mascot; isBlinking: boolean }) {
  switch (mascot) {
    case 'bear': return <BearSvg isBlinking={isBlinking} />;
    case 'rabbit': return <RabbitSvg isBlinking={isBlinking} />;
    case 'cat': return <CatSvg isBlinking={isBlinking} />;
    case 'chick': return <ChickSvg isBlinking={isBlinking} />;
  }
}

/* ----- 小熊（完整身体） ----- */
function BearSvg({ isBlinking }: { isBlinking: boolean }) {
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full">
      {/* 耳朵 */}
      <circle cx="25" cy="20" r="9" fill="#C8916B" />
      <circle cx="25" cy="20" r="5.5" fill="#E8B894" />
      <circle cx="75" cy="20" r="9" fill="#C8916B" />
      <circle cx="75" cy="20" r="5.5" fill="#E8B894" />
      {/* 头 */}
      <circle cx="50" cy="32" r="26" fill="#D4A37F" />
      {/* 脸 */}
      <ellipse cx="50" cy="38" rx="18" ry="14" fill="#F0D9BE" />
      {/* 眼睛 */}
      <circle cx="40" cy="30" r="3.5" fill="#3D2817" />
      <circle cx="60" cy="30" r="3.5" fill="#3D2817" />
      {!isBlinking && (
        <>
          <circle cx="41.2" cy="28.8" r="1.3" fill="white" />
          <circle cx="61.2" cy="28.8" r="1.3" fill="white" />
        </>
      )}
      {isBlinking && (
        <>
          <path d="M 37 30 Q 40 28.5 43 30" stroke="#3D2817" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 57 30 Q 60 28.5 63 30" stroke="#3D2817" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* 鼻子 */}
      <ellipse cx="50" cy="38" rx="3.5" ry="2.5" fill="#3D2817" />
      {/* 嘴 */}
      <path d="M 46 41 Q 50 44 54 41" stroke="#3D2817" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* 腮红 */}
      <circle cx="33" cy="38" r="3.5" fill="#FFB3C1" opacity="0.6" />
      <circle cx="67" cy="38" r="3.5" fill="#FFB3C1" opacity="0.6" />
      {/* 身体 */}
      <ellipse cx="50" cy="82" rx="20" ry="18" fill="#D4A37F" />
      <ellipse cx="50" cy="85" rx="14" ry="12" fill="#F0D9BE" />
      {/* 手臂 */}
      <ellipse cx="28" cy="78" rx="7" ry="10" fill="#D4A37F" transform="rotate(-20 28 78)" />
      <ellipse cx="72" cy="78" rx="7" ry="10" fill="#D4A37F" transform="rotate(20 72 78)" />
      {/* 小手 */}
      <circle cx="24" cy="85" r="5" fill="#C8916B" />
      <circle cx="76" cy="85" r="5" fill="#C8916B" />
      {/* 脚 */}
      <ellipse cx="40" cy="102" rx="8" ry="6" fill="#C8916B" />
      <ellipse cx="60" cy="102" rx="8" ry="6" fill="#C8916B" />
      {/* 肚子爱心 */}
      <path d="M 50 80 Q 47 77 45 79 Q 45 82 50 85 Q 55 82 55 79 Q 53 77 50 80 Z" fill="#FFB3C1" opacity="0.8" />
    </svg>
  );
}

/* ----- 小兔（完整身体） ----- */
function RabbitSvg({ isBlinking }: { isBlinking: boolean }) {
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full">
      {/* 长耳朵 */}
      <ellipse cx="36" cy="12" rx="6" ry="15" fill="#FFFFFF" stroke="#E8E0E0" strokeWidth="0.5" transform="rotate(-12 36 12)" />
      <ellipse cx="36" cy="12" rx="3" ry="10" fill="#FFB3C1" transform="rotate(-12 36 12)" />
      <ellipse cx="64" cy="12" rx="6" ry="15" fill="#FFFFFF" stroke="#E8E0E0" strokeWidth="0.5" transform="rotate(12 64 12)" />
      <ellipse cx="64" cy="12" rx="3" ry="10" fill="#FFB3C1" transform="rotate(12 64 12)" />
      {/* 头 */}
      <circle cx="50" cy="38" r="25" fill="#FFFFFF" stroke="#E8E0E0" strokeWidth="0.5" />
      {/* 脸 */}
      <ellipse cx="50" cy="44" rx="16" ry="12" fill="#FFF5F7" />
      {/* 眼睛 */}
      <ellipse cx="40" cy="35" rx="3.5" ry={isBlinking ? 0.8 : 4.5} fill="#3D2817" />
      <ellipse cx="60" cy="35" rx="3.5" ry={isBlinking ? 0.8 : 4.5} fill="#3D2817" />
      {!isBlinking && (
        <>
          <circle cx="41" cy="33.5" r="1.3" fill="white" />
          <circle cx="61" cy="33.5" r="1.3" fill="white" />
        </>
      )}
      {/* 鼻子 */}
      <path d="M 47 42 L 53 42 L 50 45 Z" fill="#FF8FA3" />
      {/* 嘴 */}
      <path d="M 50 45 Q 47 48 45 46 M 50 45 Q 53 48 55 46" stroke="#3D2817" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* 腮红 */}
      <circle cx="33" cy="42" r="3.5" fill="#FFB3C1" opacity="0.6" />
      <circle cx="67" cy="42" r="3.5" fill="#FFB3C1" opacity="0.6" />
      {/* 身体 */}
      <ellipse cx="50" cy="82" rx="19" ry="17" fill="#FFFFFF" stroke="#E8E0E0" strokeWidth="0.5" />
      <ellipse cx="50" cy="85" rx="13" ry="11" fill="#FFF5F7" />
      {/* 手臂 */}
      <ellipse cx="29" cy="78" rx="6" ry="9" fill="#FFFFFF" stroke="#E8E0E0" strokeWidth="0.5" transform="rotate(-20 29 78)" />
      <ellipse cx="71" cy="78" rx="6" ry="9" fill="#FFFFFF" stroke="#E8E0E0" strokeWidth="0.5" transform="rotate(20 71 78)" />
      {/* 小手 */}
      <circle cx="25" cy="85" r="4.5" fill="#FFE8E8" />
      <circle cx="75" cy="85" r="4.5" fill="#FFE8E8" />
      {/* 脚 */}
      <ellipse cx="40" cy="102" rx="8" ry="5.5" fill="#FFFFFF" stroke="#E8E0E0" strokeWidth="0.5" />
      <ellipse cx="60" cy="102" rx="8" ry="5.5" fill="#FFFFFF" stroke="#E8E0E0" strokeWidth="0.5" />
      {/* 蝴蝶结 */}
      <path d="M 50 60 L 44 56 L 44 64 Z" fill="#FFB3C1" />
      <path d="M 50 60 L 56 56 L 56 64 Z" fill="#FFB3C1" />
      <circle cx="50" cy="60" r="2" fill="#FF8FA3" />
    </svg>
  );
}

/* ----- 小猫（完整身体） ----- */
function CatSvg({ isBlinking }: { isBlinking: boolean }) {
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full">
      {/* 耳朵 */}
      <path d="M 22 22 L 28 8 L 38 24 Z" fill="#F4A261" />
      <path d="M 25 21 L 29 13 L 35 22 Z" fill="#FFD8A8" />
      <path d="M 78 22 L 72 8 L 62 24 Z" fill="#F4A261" />
      <path d="M 75 21 L 71 13 L 65 22 Z" fill="#FFD8A8" />
      {/* 头 */}
      <circle cx="50" cy="36" r="25" fill="#F4A261" />
      {/* 脸 */}
      <ellipse cx="50" cy="42" rx="15" ry="10" fill="#FFF" opacity="0.85" />
      {/* 条纹 */}
      <path d="M 30 28 Q 35 26 40 29" stroke="#E76F51" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M 60 29 Q 65 26 70 28" stroke="#E76F51" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M 32 20 Q 35 18 38 21" stroke="#E76F51" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
      <path d="M 62 21 Q 65 18 68 20" stroke="#E76F51" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
      {/* 眼睛 */}
      {!isBlinking ? (
        <>
          <ellipse cx="40" cy="34" rx="4" ry="5.5" fill="#3D2817" />
          <ellipse cx="40" cy="34" rx="1.3" ry="4.5" fill="#000" />
          <circle cx="41" cy="32.5" r="1.2" fill="white" />
          <ellipse cx="60" cy="34" rx="4" ry="5.5" fill="#3D2817" />
          <ellipse cx="60" cy="34" rx="1.3" ry="4.5" fill="#000" />
          <circle cx="61" cy="32.5" r="1.2" fill="white" />
        </>
      ) : (
        <>
          <path d="M 36 34 Q 40 32 44 34" stroke="#3D2817" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 56 34 Q 60 32 64 34" stroke="#3D2817" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* 鼻子 */}
      <path d="M 47 41 L 53 41 L 50 44 Z" fill="#FF8FA3" />
      {/* 嘴 */}
      <path d="M 50 44 Q 47 47 44 45 M 50 44 Q 53 47 56 45" stroke="#3D2817" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* 胡须 */}
      <line x1="28" y1="40" x2="36" y2="41" stroke="#3D2817" strokeWidth="0.8" opacity="0.4" />
      <line x1="28" y1="43" x2="36" y2="43" stroke="#3D2817" strokeWidth="0.8" opacity="0.4" />
      <line x1="64" y1="41" x2="72" y2="40" stroke="#3D2817" strokeWidth="0.8" opacity="0.4" />
      <line x1="64" y1="43" x2="72" y2="43" stroke="#3D2817" strokeWidth="0.8" opacity="0.4" />
      {/* 腮红 */}
      <circle cx="32" cy="42" r="3" fill="#FFB3C1" opacity="0.6" />
      <circle cx="68" cy="42" r="3" fill="#FFB3C1" opacity="0.6" />
      {/* 身体 */}
      <ellipse cx="50" cy="82" rx="19" ry="17" fill="#F4A261" />
      <ellipse cx="50" cy="85" rx="13" ry="11" fill="#FFE8C8" />
      {/* 条纹身体 */}
      <path d="M 38 75 Q 42 73 46 75" stroke="#E76F51" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M 54 75 Q 58 73 62 75" stroke="#E76F51" strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* 手臂 */}
      <ellipse cx="29" cy="78" rx="6" ry="9" fill="#F4A261" transform="rotate(-20 29 78)" />
      <ellipse cx="71" cy="78" rx="6" ry="9" fill="#F4A261" transform="rotate(20 71 78)" />
      {/* 小手 */}
      <circle cx="25" cy="85" r="4.5" fill="#F4A261" />
      <circle cx="75" cy="85" r="4.5" fill="#F4A261" />
      {/* 脚 */}
      <ellipse cx="40" cy="102" rx="7" ry="5" fill="#E76F51" />
      <ellipse cx="60" cy="102" rx="7" ry="5" fill="#E76F51" />
      {/* 尾巴 */}
      <path d="M 68 88 Q 85 80 82 65 Q 80 60 84 58" stroke="#F4A261" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="84" cy="58" r="4" fill="#F4A261" />
    </svg>
  );
}

/* ----- 小鸡（完整身体） ----- */
function ChickSvg({ isBlinking }: { isBlinking: boolean }) {
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full">
      {/* 头顶呆毛 */}
      <path d="M 48 18 Q 50 10 52 18" stroke="#F4A261" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 头 */}
      <circle cx="50" cy="35" r="22" fill="#FFD93D" />
      {/* 身体 */}
      <ellipse cx="50" cy="80" rx="24" ry="22" fill="#FFD93D" />
      {/* 肚子 */}
      <ellipse cx="50" cy="84" rx="16" ry="14" fill="#FFF4C2" />
      {/* 翅膀 */}
      <ellipse cx="28" cy="78" rx="7" ry="11" fill="#F4C430" transform="rotate(-15 28 78)" />
      <ellipse cx="72" cy="78" rx="7" ry="11" fill="#F4C430" transform="rotate(15 72 78)" />
      {/* 眼睛 */}
      <circle cx="42" cy="32" r="3.5" fill="#3D2817" />
      <circle cx="58" cy="32" r="3.5" fill="#3D2817" />
      {!isBlinking && (
        <>
          <circle cx="43" cy="30.5" r="1.3" fill="white" />
          <circle cx="59" cy="30.5" r="1.3" fill="white" />
        </>
      )}
      {isBlinking && (
        <>
          <path d="M 39 32 Q 42 30.5 45 32" stroke="#3D2817" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 55 32 Q 58 30.5 61 32" stroke="#3D2817" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* 喙 */}
      <path d="M 45 40 L 55 40 L 50 46 Z" fill="#FF8C42" />
      <path d="M 45 40 L 55 40 L 50 42 Z" fill="#F4A261" />
      {/* 脚 */}
      <path d="M 42 102 L 38 108 M 42 102 L 42 108 M 42 102 L 46 108" stroke="#FF8C42" strokeWidth="2" strokeLinecap="round" />
      <path d="M 58 102 L 54 108 M 58 102 L 58 108 M 58 102 L 62 108" stroke="#FF8C42" strokeWidth="2" strokeLinecap="round" />
      {/* 腮红 */}
      <circle cx="34" cy="38" r="3.5" fill="#FFB3C1" opacity="0.7" />
      <circle cx="66" cy="38" r="3.5" fill="#FFB3C1" opacity="0.7" />
      {/* 小翅膀羽毛 */}
      <path d="M 25 75 Q 28 73 31 75" stroke="#E0A800" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M 69 75 Q 72 73 75 75" stroke="#E0A800" strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
  );
}