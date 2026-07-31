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
  //:scale transition-transform block"
        style={{ width: size, height: size }}
        aria-label={`点击${config.name}互动`}
      >
        <div
          className={`w-full h-full ${isBouncing ? 'animate-wiggle' : isWalking ? 'animate-walk' : 'animate-float'}`}
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(217, 123, 159, 0.18))',
            transform: `scaleX(${direction})`,
          }}
        >
          <img
            src={mascotSrc}
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
                background: `linear
