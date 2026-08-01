import React from 'react';
import { X } from 'lucide-react';

// ===== 底部弹窗 =====
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeight = '75vh',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 animate-fade-in" />
      <div
        className="relative w-full max-w-[480px] bg-white rounded-t-3xl shadow-cute-lg animate-slide-up max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-pink-50">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50 active:scale-90 transition">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 no-scrollbar flex-1">{children}</div>
      </div>
    </div>
  );
}

// ===== 居中弹窗（白色弹窗，用于刷题记录/添加错题等）=====
export function CenterModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 animate-fade-in" />
      <div
        className="relative w-full max-w-[400px] bg-white rounded-3xl shadow-cute-lg animate-pop-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-pink-50">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50 active:scale-90 transition">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 no-scrollbar">{children}</div>
      </div>
    </div>
  );
}

// ===== 卡片 =====
export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 shadow-cute ${onClick ? 'cursor-pointer active:scale-[0.98] transition' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ===== 主按钮 =====
export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  size = 'md',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-cute',
    secondary: 'bg-pink-50 text-pink-600',
    ghost: 'bg-transparent text-gray-500',
    danger: 'bg-red-50 text-red-500',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-xl',
    md: 'px-4 py-2.5 text-sm rounded-2xl',
    lg: 'px-6 py-3 text-base rounded-2xl',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-bold transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// ===== 输入框 =====
export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 bg-pink-50/50 border border-pink-100 rounded-2xl text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-pink-300 focus:bg-white transition ${className}`}
    />
  );
}

// ===== 文本域 =====
export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-4 py-2.5 bg-pink-50/50 border border-pink-100 rounded-2xl text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-pink-300 focus:bg-white transition resize-none ${className}`}
    />
  );
}

// ===== 板块标签 =====
export function SubjectTag({ emoji, name, color, bg, active, onClick }: {
  emoji: string; name: string; color: string; bg: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition active:scale-95 ${
        active ? 'shadow-cute' : ''
      }`}
      style={{ backgroundColor: active ? bg : '#F5F5F5', color: active ? color : '#999' }}
    >
      <span>{emoji}</span>
      <span>{name}</span>
    </button>
  );
}

// ===== 空状态 =====
export function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-5xl mb-3 opacity-60">{emoji}</div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}
