import { useState, useEffect, useRef, useCallback } from 'react';
import type { Mascot } from '../../store/themeStore';

interface Props {
  mascot: Mascot;
  size?: number;
  onTalk?: (text: string) => void;
}

// 每个吉祥物的台词库
const QUOTES: Record<Mascot, string[]> = {
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

export default function MascotAvatar({ mascot, size = 64, onTalk }: Props) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 随机眨眼
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    };
    const interval = setInterval(() => {
      if (Math.random() > 0.4) blink();
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // 点击说话
  const handleClick = useCallback(() => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);

    const quotes = QUOTES[mascot];
    const text = quotes[Math.floor(Math.random() * quotes.length)];
    setSpeech(text);
    onTalk?.(text);

    // 用浏览器内置语音合成让吉祥物说话
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 1.1;
        utter.pitch = 1.3; // 提高音调让声音更可爱
        utter.volume = 0.8;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      // 语音不可用就静默
    }

    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeech(null), 3000);
  }, [mascot, onTalk]);

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* 气泡 */}
      {speech && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 animate-pop-in whitespace-nowrap">
          <div className="relative bg-white rounded-2xl px-3 py-1.5 shadow-cute text-xs text-gray-700 font-medium border border-pink-100">
            {speech}
            {/* 气泡尖角 */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-pink-100 transform rotate-45" />
          </div>
        </div>
      )}

      {/* 吉祥物本体 */}
      <button
        onClick={handleClick}
        className="relative w-full h-full active:scale-90 transition-transform"
        aria-label={`点击${mascot}互动`}
      >
        <div
          className={`w-full h-full ${isBouncing ? 'animate-wiggle' : 'animate-float'}`}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(217, 123, 159, 0.25))' }}
        >
          <MascotSvg mascot={mascot} isBlinking={isBlinking} />
        </div>
      </button>
    </div>
  );
}

/* ===== SVG 吉祥物绘制 ===== */
function MascotSvg({ mascot, isBlinking }: { mascot: Mascot; isBlinking: boolean }) {
  switch (mascot) {
    case 'bear':
      return <BearSvg isBlinking={isBlinking} />;
    case 'rabbit':
      return <RabbitSvg isBlinking={isBlinking} />;
    case 'cat':
      return <CatSvg isBlinking={isBlinking} />;
    case 'chick':
      return <ChickSvg isBlinking={isBlinking} />;
  }
}

/* ----- 小熊 ----- */
function BearSvg({ isBlinking }: { isBlinking: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* 耳朵 */}
      <circle cx="25" cy="22" r="10" fill="#C8916B" />
      <circle cx="25" cy="22" r="6" fill="#E8B894" />
      <circle cx="75" cy="22" r="10" fill="#C8916B" />
      <circle cx="75" cy="22" r="6" fill="#E8B894" />
      {/* 头 */}
      <circle cx="50" cy="52" r="32" fill="#D4A37F" />
      {/* 脸（浅色） */}
      <ellipse cx="50" cy="58" rx="22" ry="18" fill="#F0D9BE" />
      {/* 眼睛 */}
      <ellipse cx="38" cy="48" rx="4" ry={isBlinking ? 0.8 : 4.5} fill="#3D2817" />
      <ellipse cx="62" cy="48" rx="4" ry={isBlinking ? 0.8 : 4.5} fill="#3D2817" />
      {!isBlinking && (
        <>
          <circle cx="39.5" cy="46.5" r="1.5" fill="white" />
          <circle cx="63.5" cy="46.5" r="1.5" fill="white" />
        </>
      )}
      {/* 鼻子 */}
      <ellipse cx="50" cy="58" rx="4" ry="3" fill="#3D2817" />
      {/* 嘴 */}
      <path d="M 46 62 Q 50 66 54 62" stroke="#3D2817" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* 腮红 */}
      <circle cx="32" cy="58" r="4" fill="#FFB3C1" opacity="0.6" />
      <circle cx="68" cy="58" r="4" fill="#FFB3C1" opacity="0.6" />
    </svg>
  );
}

/* ----- 小兔 ----- */
function RabbitSvg({ isBlinking }: { isBlinking: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* 长耳朵 */}
      <ellipse cx="36" cy="18" rx="7" ry="18" fill="#F5E6E8" transform="rotate(-15 36 18)" />
      <ellipse cx="36" cy="18" rx="3.5" ry="13" fill="#FFB3C1" transform="rotate(-15 36 18)" />
      <ellipse cx="64" cy="18" rx="7" ry="18" fill="#F5E6E8" transform="rotate(15 64 18)" />
      <ellipse cx="64" cy="18" rx="3.5" ry="13" fill="#FFB3C1" transform="rotate(15 64 18)" />
      {/* 头 */}
      <circle cx="50" cy="56" r="30" fill="#FFFFFF" />
      <circle cx="50" cy="56" r="30" fill="#FAF0F2" opacity="0.5" />
      {/* 脸 */}
      <ellipse cx="50" cy="62" rx="20" ry="15" fill="#FFF5F7" />
      {/* 眼睛 */}
      <ellipse cx="38" cy="52" rx="4" ry={isBlinking ? 0.8 : 5} fill="#3D2817" />
      <ellipse cx="62" cy="52" rx="4" ry={isBlinking ? 0.8 : 5} fill="#3D2817" />
      {!isBlinking && (
        <>
          <circle cx="39.5" cy="50" r="1.5" fill="white" />
          <circle cx="63.5" cy="50" r="1.5" fill="white" />
        </>
      )}
      {/* 鼻子（粉色 Y 形） */}
      <path d="M 50 60 L 47 63 M 50 60 L 53 63" stroke="#FF8FA3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="60" rx="2" ry="1.5" fill="#FF8FA3" />
      {/* 嘴 */}
      <path d="M 50 64 Q 47 67 45 65 M 50 64 Q 53 67 55 65" stroke="#3D2817" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* 腮红 */}
      <circle cx="30" cy="60" r="4" fill="#FFB3C1" opacity="0.6" />
      <circle cx="70" cy="60" r="4" fill="#FFB3C1" opacity="0.6" />
    </svg>
  );
}

/* ----- 小猫 ----- */
function CatSvg({ isBlinking }: { isBlinking: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* 耳朵（三角） */}
      <path d="M 22 30 L 28 12 L 38 28 Z" fill="#F4A261" />
      <path d="M 24 28 L 29 16 L 35 27 Z" fill="#FFD8A8" />
      <path d="M 78 30 L 72 12 L 62 28 Z" fill="#F4A261" />
      <path d="M 76 28 L 71 16 L 65 27 Z" fill="#FFD8A8" />
      {/* 头 */}
      <circle cx="50" cy="54" r="30" fill="#F4A261" />
      {/* 脸（白色） */}
      <ellipse cx="50" cy="62" rx="18" ry="12" fill="#FFF" opacity="0.85" />
      {/* 条纹 */}
      <path d="M 30 42 Q 35 40 40 43" stroke="#E76F51" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M 60 43 Q 65 40 70 42" stroke="#E76F51" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* 眼睛（猫眼，杏仁形） */}
      {!isBlinking ? (
        <>
          <ellipse cx="38" cy="52" rx="4.5" ry="6" fill="#3D2817" />
          <ellipse cx="38" cy="52" rx="1.5" ry="5" fill="#000" />
          <circle cx="39.5" cy="50" r="1.2" fill="white" />
          <ellipse cx="62" cy="52" rx="4.5" ry="6" fill="#3D2817" />
          <ellipse cx="62" cy="52" rx="1.5" ry="5" fill="#000" />
          <circle cx="63.5" cy="50" r="1.2" fill="white" />
        </>
      ) : (
        <>
          <path d="M 34 52 Q 38 50 42 52" stroke="#3D2817" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 58 52 Q 62 50 66 52" stroke="#3D2817" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* 鼻子（粉色三角） */}
      <path d="M 47 60 L 53 60 L 50 63 Z" fill="#FF8FA3" />
      {/* 嘴（w 形） */}
      <path d="M 50 63 Q 47 66 44 64 M 50 63 Q 53 66 56 64" stroke="#3D2817" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* 胡须 */}
      <line x1="28" y1="58" x2="36" y2="59" stroke="#3D2817" strokeWidth="1" opacity="0.4" />
      <line x1="28" y1="62" x2="36" y2="62" stroke="#3D2817" strokeWidth="1" opacity="0.4" />
      <line x1="64" y1="59" x2="72" y2="58" stroke="#3D2817" strokeWidth="1" opacity="0.4" />
      <line x1="64" y1="62" x2="72" y2="62" stroke="#3D2817" strokeWidth="1" opacity="0.4" />
      {/* 腮红 */}
      <circle cx="30" cy="60" r="3.5" fill="#FFB3C1" opacity="0.6" />
      <circle cx="70" cy="60" r="3.5" fill="#FFB3C1" opacity="0.6" />
    </svg>
  );
}

/* ----- 小鸡 ----- */
function ChickSvg({ isBlinking }: { isBlinking: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* 头顶呆毛 */}
      <path d="M 48 20 Q 50 14 52 20" stroke="#F4A261" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 身体（圆胖） */}
      <ellipse cx="50" cy="56" rx="32" ry="30" fill="#FFD93D" />
      {/* 肚子（浅色） */}
      <ellipse cx="50" cy="64" rx="20" ry="16" fill="#FFF4C2" />
      {/* 翅膀（小） */}
      <ellipse cx="22" cy="58" rx="6" ry="10" fill="#F4C430" transform="rotate(-20 22 58)" />
      <ellipse cx="78" cy="58" rx="6" ry="10" fill="#F4C430" transform="rotate(20 78 58)" />
      {/* 眼睛 */}
      <ellipse cx="40" cy="50" rx="3.5" ry={isBlinking ? 0.8 : 4.5} fill="#3D2817" />
      <ellipse cx="60" cy="50" rx="3.5" ry={isBlinking ? 0.8 : 4.5} fill="#3D2817" />
      {!isBlinking && (
        <>
          <circle cx="41" cy="48.5" r="1.2" fill="white" />
          <circle cx="61" cy="48.5" r="1.2" fill="white" />
        </>
      )}
      {/* 喙（橙色三角） */}
      <path d="M 46 58 L 54 58 L 50 64 Z" fill="#FF8C42" />
      <path d="M 46 58 L 54 58 L 50 60 Z" fill="#F4A261" />
      {/* 脚（小三角） */}
      <path d="M 42 84 L 40 88 L 44 88 Z" fill="#FF8C42" />
      <path d="M 58 84 L 56 88 L 60 88 Z" fill="#FF8C42" />
      {/* 腮红 */}
      <circle cx="32" cy="58" r="3.5" fill="#FFB3C1" opacity="0.7" />
      <circle cx="68" cy="58" r="3.5" fill="#FFB3C1" opacity="0.7" />
    </svg>
  );
}