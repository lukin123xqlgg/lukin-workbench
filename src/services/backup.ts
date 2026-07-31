import type {
  Exam, PomodoroSession, Checkin, PracticeRecord, Plan,
  Mistake, Review, Paper, FinanceRecord, UserSettings,
} from '../types';

export interface BackupData {
  version: string;
  exportTime: string;
  exams: Exam[];
  pomodoroSessions: PomodoroSession[];
  checkins: Checkin[];
  practiceRecords: PracticeRecord[];
  plans: Plan[];
  mistakes: Mistake[];
  reviews: Review[];
  papers: Paper[];
  financeRecords: FinanceRecord[];
  settings: UserSettings;
}


function getState(key: string): any {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function exportAllData(): BackupData {
  const get = (key: string, field: string) => {
    const state = getState(key);
    return state?.state?.[field] ?? [];
  };

  return {
    version: '1.0.0',
    exportTime: new Date().toISOString(),
    exams: get('lukin-exams', 'exams'),
    pomodoroSessions: get('lukin-pomodoro', 'sessions'),
    checkins: get('lukin-checkins', 'checkins'),
    practiceRecords: get('lukin-practice', 'records'),
    plans: get('lukin-plans', 'plans'),
    mistakes: get('lukin-mistakes', 'mistakes'),
    reviews: get('lukin-reviews', 'reviews'),
    papers: get('lukin-papers', 'papers'),
    financeRecords: get('lukin-finance', 'records'),
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

export function importData(data: BackupData): void {
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
