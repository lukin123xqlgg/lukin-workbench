// 小动物叫声合成器 —— 用 WebAudio 振荡器现场合成可爱音效，无需音频文件
import type { MascotKey } from './MascotAvatar';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

interface Note {
  freq: number;      // 起始频率 Hz
  freqEnd?: number;  // 结束频率（滑音）
  time: number;      // 开始时间（秒，相对）
  duration: number;  // 持续时长（秒）
  type?: OscillatorType;
  volume?: number;
}

// 每种动物的叫声配方：一小组音符
const SOUND_RECIPES: Record<MascotKey, Note[]> = {
  // 小兔：轻快两连跳音
  rabbit: [
    { freq: 880, freqEnd: 1320, time: 0, duration: 0.09, type: 'sine', volume: 0.25 },
    { freq: 990, freqEnd: 1480, time: 0.12, duration: 0.1, type: 'sine', volume: 0.25 },
  ],
  // 小狗：汪汪两声（短促低吠）
  dog: [
    { freq: 320, freqEnd: 180, time: 0, duration: 0.1, type: 'sawtooth', volume: 0.16 },
    { freq: 300, freqEnd: 160, time: 0.16, duration: 0.12, type: 'sawtooth', volume: 0.16 },
  ],
  // 小猫：喵～（上滑再下滑）
  cat: [
    { freq: 620, freqEnd: 980, time: 0, duration: 0.16, type: 'sine', volume: 0.22 },
    { freq: 980, freqEnd: 520, time: 0.16, duration: 0.22, type: 'sine', volume: 0.2 },
  ],
  // 小熊：低沉温和的呼噜
  bear: [
    { freq: 160, freqEnd: 120, time: 0, duration: 0.18, type: 'triangle', volume: 0.3 },
    { freq: 150, freqEnd: 110, time: 0.2, duration: 0.22, type: 'triangle', volume: 0.28 },
  ],
  // 小鸡：叽叽叽三连高音
  chick: [
    { freq: 1560, freqEnd: 1820, time: 0, duration: 0.06, type: 'square', volume: 0.1 },
    { freq: 1680, freqEnd: 1900, time: 0.09, duration: 0.06, type: 'square', volume: 0.1 },
    { freq: 1500, freqEnd: 1760, time: 0.18, duration: 0.07, type: 'square', volume: 0.1 },
  ],
  // 小熊猫：软软的中音两声
  panda: [
    { freq: 440, freqEnd: 520, time: 0, duration: 0.14, type: 'triangle', volume: 0.24 },
    { freq: 392, freqEnd: 470, time: 0.18, duration: 0.18, type: 'triangle', volume: 0.22 },
  ],
  // 企鹅：摇摆下滑口哨
  penguin: [
    { freq: 1180, freqEnd: 760, time: 0, duration: 0.14, type: 'sine', volume: 0.22 },
    { freq: 1080, freqEnd: 660, time: 0.16, duration: 0.18, type: 'sine', volume: 0.2 },
  ],
};

export function playMascotSound(mascot: MascotKey) {
  const audio = getCtx();
  if (!audio) return;
  const notes = SOUND_RECIPES[mascot];
  if (!notes) return;

  const now = audio.currentTime;
  for (const note of notes) {
    try {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = note.type ?? 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      if (note.freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(note.freqEnd, now + note.time + note.duration);
      }
      const v = note.volume ?? 0.2;
      gain.gain.setValueAtTime(0.0001, now + note.time);
      gain.gain.exponentialRampToValueAtTime(v, now + note.time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.05);
    } catch {
      // 忽略单音符失败
    }
  }
}
