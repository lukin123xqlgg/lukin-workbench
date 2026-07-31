import { useState, useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// 扩展 mascot 类型：加入小狗、熊猫、企鹅
export type MascotKey = 'bear' | 'rabbit' | 'cat' | 'chick' | 'dog' | 'panda' | 'penguin';

interface MascotConfig {
  name: string;
  file: string;       // PNG 文件名
  favoriteFood: string;
}

export const MASCOT_CONFIG: Record<MascotKey, MascotConfig> = {
  bear:    { name: '小熊',   file: 'bear.png',    favoriteFood: '蜂蜜' },
  rabbit:  { name: '小兔',   file: 'rabbit.png',  favoriteFood: '胡萝卜' },
  cat:     { name: '小猫',   file: 'cat.png',     favoriteFood: '小鱼干' },
  chick:   { name: '小鸡',   file: 'chick.png',   favoriteFood: '玉米' },
  dog:     { name: '小狗',   file: 'dog.png',     favoriteFood: '肉骨头' },
  panda:   { name: '小熊猫', file: 'panda.png',   favoriteFood: '苹果' },
  penguin: { name: '企鹅',   file: 'penguin.png', favoriteFood: '小鱼干' },
};

interface Props {
  mascot: MascotKey;
  size?: number;
  onTalk?: (text: string) => void;
}

export default function MascotAvatar({ mascot, size = 96, onTalk }: Props) {
  // ===== 眨眼模拟：定时给图片叠半透明黑色矩形（眼睛区域） =====
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    };
    const interval = setInterval(() => {
      if (Math.random() > 0.35) blink();
    }, 2200 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // ===== 走路系统 =====
  const [posX, setPosX] = useState(20);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isWalking, setIsWalking] = useState(true);
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleWalk = () => {
      const walkDuration = 2000 + Math.random() * 2500;
      const newDir = Math.random() > 0.5 ? 1 : -1;
      const newPos = Math.max(8, Math.min(72, posX + newDir * (12 + Math.random() * 25)));
      setDirection(newDir);
      setPosX(newPos);
      setIsWalking(true);

      walkTimer.current = setTimeout(() => {
        setIsWalking(false);
        walkTimer.current = setTimeout(scheduleWalk, 1200 + Math.random() * 2500);
      }, walkDuration);
    };
    scheduleWalk();
    return () => { if (walkTimer.current) clearTimeout(walkTimer.current); };
  }, [posX]);

  // ===== 台词系统 =====
  const quotes = useQuoteStore((s) => s.quotes[mascot]);
  const [speech, setSpeech] = useState<string | null>(null);
  const [isBouncing, setIsBouncing] = useState(false);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);

    const list = quotes.length > 0 ? quotes : [];
    if (list.length === 0) return;
    const text = list[Math.floor(Math.random() * list.length)];
    setSpeech(text);
    onTalk?.(text);

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 1.1;
        utter.pitch = 1.5;
        utter.volume = 0.8;
        window.speechSynthesis.speak(utter);
      }
    } catch {}

    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeech(null), 3500);
  }, [mascot, quotes, onTalk]);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlePressStart = () => {
    longPressTimer.current = setTimeout(() => {}, 600);
  };
  const handlePressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const config = MASCOT_CONFIG[mascot];
    // 动态计算 base URL，适配 GitHub Pages 子路径部署
  const mascotSrc = import.meta.env.BASE_URL
    ? `${import.meta.env.BASE_URL}mascots/${config.file}`.replace(/\/+/g, '/')
    : `/mascots/${config.file}`;
  return (
    <div
      className="relative transition-all duration-[2000ms] ease-linear"
      style={{ left: `${posX}%` }}
    >
      {/* 气泡 */}
      {speech && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 animate-pop-in whitespace-nowrap max-w-[200px]">
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
        className="relative active:scale-90 transition-transform block"
        style={{ width: size, height: size }}
        aria-label={`点击${config.name}互动`}
      >
        <div
          className={`w-full h-full ${isBouncing ? 'animate-wiggle' : isWalking ? 'animate-walk' : 'animate-float'}`}
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(217, 123, 159, 0.18))',
             `src={mascotSrc}
          }}
        >
          const mascotSrc = import.meta.env.BASE_URL
  ? `${import.meta.env.BASE_URL}mascots/${config.file}`.replace(/\/+/g, '/')
  : `/mascots/${config.file}`;
            alt={config.name}
            className="w-full h-full object-contain"
            style={{
              filter: isBlinking
                ? 'brightness(0.95) contrast(1.05)'
                : 'none',
              transition: 'filter 0.1s',
            }}
            draggable={false}
          />
          {/* 眨眼效果：在眼睛区域叠一条线 */}
          {isBlinking && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(transparent 28%, rgba(40, 30, 35, 0.7) 30%, transparent 32%)`,
              }}
            />
          )}
        </div>
      </button>
    </div>
  );
}

// ===== 台词 store =====
const DEFAULT_QUOTES: Record<MascotKey, string[]> = {
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
  dog: [
    '汪汪！lukin 真棒！',
    '本汪陪你一起上岸！',
    '骨头给你补充能量~',
    '摇尾巴为你加油！',
    '今天也要元气满满！',
  ],
  panda: [
    'lukin 加油鸭！',
    '本熊在给你打气！',
    '咬一口竹子清醒一下~',
    '别累坏啦，休息一下！',
    '一起冲鸭！',
  ],
  penguin: [
    '企鹅为你鼓掌！啪啪啪~',
    '南极虽冷，但 lukin 你很暖！',
    '游向你的目标吧！',
    '今天也要快乐学习！',
    '本企鹅最擅长坚持啦！',
  ],
};

interface QuoteState {
  quotes: Record<MascotKey, string[]>;
  addQuote: (mascot: MascotKey, q: string) => void;
  removeQuote: (mascot: MascotKey, idx: number) => void;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set) => ({
      quotes: DEFAULT_QUOTES,
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
    { name: 'lukin-quotes-v2' }
  )
);
