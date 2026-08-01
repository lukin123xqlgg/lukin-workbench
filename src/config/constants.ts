// 公考板块定义 —— 莫兰迪色系
export type SubjectId =
  | 'verbal'        // 言语理解 - 蓝色
  | 'logic'         // 推理判断 - 绿色
  | 'quantity'      // 数量关系 - 橙色
  | 'data'          // 资料分析 - 紫色
  | 'politics'      // 政治和常识 - 白灰色
  | 'essay'         // 申论 - 粉色
  | 'current'       // 时政 - 浅红色
  | 'science';      // 科推/数推 - 青色

export interface Subject {
  id: SubjectId;
  name: string;
  emoji: string;
  color: string;   // 莫兰迪色系主色
  bg: string;      // 莫兰迪色系浅背景
}

export const SUBJECTS: Subject[] = [
  { id: 'verbal',    name: '言语理解', emoji: '📖', color: '#7B9EA8', bg: '#E8EEF1' },  // 莫兰迪蓝
  { id: 'logic',     name: '推理判断', emoji: '🧩', color: '#8BAA8B', bg: '#EDF3ED' },  // 莫兰迪绿
  { id: 'quantity',  name: '数量关系', emoji: '🔢', color: '#C9A87C', bg: '#F5EFE3' },  // 莫兰迪橙
  { id: 'data',      name: '资料分析', emoji: '📊', color: '#A89BC4', bg: '#EEEBF5' },  // 莫兰迪紫
  { id: 'politics',  name: '政治常识', emoji: '🏛️', color: '#B8B8B8', bg: '#F2F2F2' },  // 莫兰迪灰
  { id: 'essay',     name: '申论',     emoji: '✍️', color: '#D4A5A5', bg: '#F5EAEA' },  // 莫兰迪粉
  { id: 'current',   name: '时政',     emoji: '📰', color: '#D4A0A0', bg: '#F5E6E6' },  // 莫兰迪浅红
  { id: 'science',   name: '科推数推', emoji: '🔬', color: '#8BAAB0', bg: '#E8F0F1' },  // 莫兰迪青
];

export const SUBJECT_MAP = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s])
) as Record<SubjectId, Subject>;

// 考试类型
export type ExamType = 'national' | 'province' | 'institution' | 'custom';

export const EXAM_TYPES: Record<ExamType, { name: string; emoji: string; color: string }> = {
  national:     { name: '国考',   emoji: '🏛️', color: '#7B9EA8' },
  province:     { name: '省考',   emoji: '🗺️', color: '#8BAA8B' },
  institution:  { name: '事业编', emoji: '🏢', color: '#A89BC4' },
  custom:       { name: '自定义', emoji: '⭐', color: '#C9A87C' },
};

// 番茄钟模式
export type TimerMode = 'countdown' | 'stopwatch';

// 番茄钟预设时长（分钟）
export const POMODORO_PRESETS = [15, 25, 45, 60];

// 日期格式
export const DATE_FORMAT = 'yyyy-MM-dd';

// 生成唯一 ID
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 格式化时长（分钟 -> "Xh Ym" 或 "X分钟"）
export function formatDuration(minutes: number): string {
  if (minutes === 0) return '0m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

// 格式化秒为 mm:ss 或 hh:mm:ss
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// 格式化金额
export function formatMoney(amount: number): string {
  return amount.toFixed(2);
}
