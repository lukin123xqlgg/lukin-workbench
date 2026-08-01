import type {
  Exam, PomodoroSession, Checkin, PracticeRecord, Plan,
  Mistake, Review, Paper, FinanceRecord, UserSettings,
} from '../types';

// 需要备份的 localStorage 键（lukin- 前缀的全部数据）
const BACKUP_PREFIX = 'lukin-';

// v1 结构化字段（兼容旧版备份文件导入）
export interface BackupData {
  version: string;
  exportTime: string;
  // v2：全量原始数据（localStorage 键 -> 原始 JSON 字符串）
  stores?: Record<string, string>;
  // v1 字段（保留兼容）
  exams?: Exam[];
  pomodoroSessions?: PomodoroSession[];
  checkins?: Checkin[];
  practiceRecords?: PracticeRecord[];
  plans?: Plan[];
  mistakes?: Mistake[];
  reviews?: Review[];
  papers?: Paper[];
  financeRecords?: FinanceRecord[];
  settings?: UserSettings;
}

function getState(key: string): any {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ===== 导出：收集所有 lukin- 前缀的 localStorage 数据 =====
export function exportAllData(): BackupData {
  const stores: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(BACKUP_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        stores[key] = value;
      }
    }
  }

  return {
    version: '2.0.0',
    exportTime: new Date().toISOString(),
    stores,
    // 同时写一份 v1 结构化字段，方便查看与兼容
    exams: getState('lukin-exams')?.state?.exams ?? [],
    pomodoroSessions: getState('lukin-pomodoro')?.state?.sessions ?? [],
    checkins: getState('lukin-checkins')?.state?.checkins ?? [],
    practiceRecords: getState('lukin-practice')?.state?.records ?? [],
    plans: getState('lukin-plans')?.state?.plans ?? [],
    mistakes: getState('lukin-mistakes')?.state?.mistakes ?? [],
    reviews: getState('lukin-reviews')?.state?.reviews ?? [],
    papers: getState('lukin-papers')?.state?.papers ?? [],
    financeRecords: getState('lukin-finance')?.state?.records ?? [],
    settings: getState('lukin-settings')?.state?.settings ?? {
      pomodoroDefaultMinutes: 25,
      pomodoroDefaultMode: 'countdown',
      dailyGoalMinutes: 180,
      examDateAlarm: true,
    },
  };
}

export function downloadBackup() {
  const data = exportAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `lukin-backup-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  // 尝试使用 Web Share API（移动端可保存到文件）
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: 'application/json' });
    if (navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'lukin的工作台数据备份',
        text: `备份时间：${dateStr}`,
      }).catch(() => {
        // 用户取消分享，回退到下载
        a.click();
      });
      URL.revokeObjectURL(url);
      return;
    }
  }

  a.click();
  URL.revokeObjectURL(url);
}

// ===== 导入：优先 v2 全量恢复，兼容 v1 结构化字段 =====
export function importData(data: BackupData): void {
  // v2：直接恢复全部原始 localStorage
  if (data.stores && typeof data.stores === 'object') {
    for (const [key, value] of Object.entries(data.stores)) {
      if (key.startsWith(BACKUP_PREFIX) && typeof value === 'string') {
        localStorage.setItem(key, value);
      }
    }
    return;
  }

  // v1：结构化字段映射
  const mapping: Record<string, [string, string]> = {
    'lukin-exams': ['exams', 'exams'],
    'lukin-pomodoro': ['pomodoroSessions', 'sessions'],
    'lukin-checkins': ['checkins', 'checkins'],
    'lukin-practice': ['practiceRecords', 'records'],
    'lukin-plans': ['plans', 'plans'],
    'lukin-mistakes': ['mistakes', 'mistakes'],
    'lukin-reviews': ['reviews', 'reviews'],
    'lukin-papers': ['papers', 'papers'],
    'lukin-finance': ['financeRecords', 'records'],
  };

  for (const [storageKey, [dataField, storeField]] of Object.entries(mapping)) {
    const items = (data as any)[dataField];
    if (Array.isArray(items)) {
      localStorage.setItem(storageKey, JSON.stringify({ state: { [storeField]: items }, version: 0 }));
    }
  }

  if (data.settings) {
    localStorage.setItem('lukin-settings', JSON.stringify({ state: { settings: data.settings }, version: 0 }));
  }
}
