import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 通用滚轴选择器 Hook
 * 管理 scroll-snap 滚轴的选中状态
 */
export function useWheelSelector(initialValue: number, min: number, max: number) {
  const [value, setValue] = useState(initialValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 40;
  const padding = 80; // 上下各2个空item的高度

  const scrollToValue = useCallback((val: number, smooth = true) => {
    const container = containerRef.current;
    if (!container) return;
    const targetIndex = val - min;
    container.scrollTo({
      top: targetIndex * itemHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, [min]);

  useEffect(() => {
    scrollToValue(initialValue, false);
  }, [initialValue]); // eslint-disable-line

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const newValue = min + index;
    if (newValue !== value && newValue >= min && newValue <= max) {
      setValue(newValue);
    }
  }, [min, max, value]);

  return {
    value,
    setValue,
    containerRef,
    itemHeight,
    padding,
    handleScroll,
    scrollToValue,
  };
}

/**
 * 日历 Hook
 */
export function useCalendar(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0=周日

  // 生成 6x7 网格
  const days: (Date | null)[] = [];
  // 前置空位
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }
  // 后置补齐到 42 格
  while (days.length < 42) {
    days.push(null);
  }

  return { days, year, month };
}

/**
 * 格式化日期为 yyyy-MM-dd
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 获取今天的 yyyy-MM-dd
 */
export function todayStr(): string {
  return formatDate(new Date());
}
