import type { SubjectId, ExamType, TimerMode } from '../config/constants';

// ===== 基础审计字段 =====
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ===== 考试倒计时 =====
export interface Exam extends BaseEntity {
  name: string;
  type: ExamType;
  date: string;       // ISO date yyyy-MM-dd
  note?: string;
}

// ===== 番茄钟会话 =====
export interface PomodoroSession extends BaseEntity {
  subject: SubjectId;
  mode: TimerMode;
  duration: number;    // 实际时长（秒）
  date: string;        // yyyy-MM-dd
  startedAt: string;   // ISO datetime
  endedAt: string;     // ISO datetime
  note?: string;
}

// ===== 打卡记录 =====
export interface Checkin extends BaseEntity {
  date: string;          // yyyy-MM-dd
  manualDuration: number; // 手动添加的时长（分钟）
  autoDuration: number;   // 番茄钟自动累计的时长（分钟）
  note?: string;
}

// ===== 做题统计 =====
export interface PracticeRecord extends BaseEntity {
  date: string;
  subject: SubjectId;
  total: number;        // 做题总数
  correct: number;      // 正确数
  duration: number;     // 做题时长（分钟）
  note?: string;
}

// ===== 学习计划 =====
export interface Plan extends BaseEntity {
  date: string;
  subject: SubjectId;
  title: string;
  done: boolean;
  order: number;
}

// ===== 错题记录 =====
export interface MistakeVoiceNote {
  type: 'voice';
  audioBlob: string;   // base64
  duration: number;    // 秒
  transcript?: string;  // 语音转文字结果
}

export interface MistakePhotoNote {
  type: 'photo';
  image: string;       // base64
}

export interface Mistake extends BaseEntity {
  date: string;
  subject: SubjectId;
  question: string;
  myAnswer?: string;
  correctAnswer?: string;
  analysis?: string;
  knowledgePoint?: string;
  attachments: (MistakeVoiceNote | MistakePhotoNote)[];
}

// ===== 每日复盘 =====
export interface Review extends BaseEntity {
  date: string;
  subject: SubjectId;
  question: string;
  answer: string;
  knowledgePoint: string;
  attachments: (MistakeVoiceNote | MistakePhotoNote)[];
}

// ===== 试卷分析 =====
export type PaperType = '行测' | '申论' | '事业编';

export interface PaperScore {
  subject: SubjectId;
  score: number;
  totalScore: number;
}

export interface Paper extends BaseEntity {
  name: string;
  type: PaperType;
  date: string;
  totalScore: number;     // 试卷总分
  myScore: number;        // 我的得分
  duration: number;       // 做题时长（分钟）
  subjectScores: PaperScore[];  // 各板块得分
  mistakeNote?: string;       // 错题备注
  forgottenPoints?: string;   // 遗忘知识点
}

// ===== 每日考点 =====
export interface DailyCheckpoint {
  date: string;
  examType: ExamType;
  subject: SubjectId;
  content: string;       // 考点内容
  isCustom: boolean;     // 是否用户手动修改
}

// ===== 每日理财 =====
export type FinanceType = 'income' | 'expense';

export interface FinanceRecord extends BaseEntity {
  date: string;
  type: FinanceType;
  amount: number;
  category: string;
  note?: string;
}

// ===== 积累板块 =====
// 收藏分类
export type CollectionType = 'current' | 'essay' | 'common';

// 文件夹导入的素材条目
export interface CollectionItem extends BaseEntity {
  folderName: string;     // 所属文件夹名
  type: CollectionType;   // 时政/申论素材/常识积累
  title: string;          // 标题
  content: string;        // 内容
  order: number;          // 文件夹内顺序
  done: boolean;          // 是否已打卡
  doneDate?: string;      // 打卡日期
}

// 每日打卡量设置（每个文件夹每天打卡多少条）
export interface CollectionGoal extends BaseEntity {
  folderName: string;
  type: CollectionType;
  dailyGoal: number;      // 每日打卡条数（10/20等）
}

// ===== 用户设置 =====
export interface UserSettings {
  pomodoroDefaultMinutes: number;
  pomodoroDefaultMode: TimerMode;
  dailyGoalMinutes: number;
  examDateAlarm: boolean;
}
