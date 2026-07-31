import type { TreeStage } from '../../store/treeStore';

interface Props {
  stage: TreeStage;
  growth: number; // 0-150+
  size?: number;
  animate?: boolean;
}

export default function TreeSvg({ stage, growth, size = 160, animate = true }: Props) {
  const swayClass = animate ? 'animate-float' : '';
  const swayStyle = animate ? { animationDuration: '4s' } : {};

  return (
    <div className={swayClass} style={swayStyle}>
      <svg viewBox="0 0 200 200" width={size} height={size} className="w-full h-full">
        {/* 地面 */}
        <ellipse cx="100" cy="180" rx="60" ry="8" fill="#D4B896" opacity="0.5" />
        <ellipse cx="100" cy="178" rx="55" ry="6" fill="#E8D4A8" opacity="0.6" />

        {stage === 'seed' && <SeedSvg />}
        {stage === 'sprout' && <SproutSvg />}
        {stage === 'seedling' && <SeedlingSvg />}
        {stage === 'small' && <SmallTreeSvg />}
        {stage === 'medium' && <MediumTreeSvg />}
        {stage === 'large' && <LargeTreeSvg />}
        {stage === 'bloom' && <BloomTreeSvg growth={growth} />}
      </svg>
    </div>
  );
}

/* 种子 */
function SeedSvg() {
  return (
    <g>
      <ellipse cx="100" cy="172" rx="8" ry="5" fill="#8B6F47" />
      <ellipse cx="98" cy="170" rx="3" ry="2" fill="#A8895A" opacity="0.7" />
      <path d="M 95 168 Q 100 162 105 168" stroke="#6B5435" strokeWidth="1" fill="none" />
    </g>
  );
}

/* 发芽 */
function SproutSvg() {
  return (
    <g>
      <rect x="98" y="160" width="4" height="15" fill="#7BAE6F" rx="2" />
      <ellipse cx="92" cy="160" rx="7" ry="4" fill="#8BC34A" transform="rotate(-30 92 160)" />
      <ellipse cx="108" cy="158" rx="7" ry="4" fill="#8BC34A" transform="rotate(30 108 158)" />
      <ellipse cx="90" cy="159" rx="3" ry="2" fill="#A5D678" transform="rotate(-30 90 159)" />
      <ellipse cx="110" cy="157" rx="3" ry="2" fill="#A5D678" transform="rotate(30 110 157)" />
    </g>
  );
}

/* 小苗 */
function SeedlingSvg() {
  return (
    <g>
      <rect x="98" y="150" width="4" height="25" fill="#6B8E5A" rx="2" />
      {/* 叶子 */}
      <ellipse cx="88" cy="155" rx="10" ry="5" fill="#7CB342" transform="rotate(-25 88 155)" />
      <ellipse cx="112" cy="150" rx="10" ry="5" fill="#7CB342" transform="rotate(25 112 150)" />
      <ellipse cx="100" cy="142" rx="8" ry="5" fill="#8BC34A" />
      {/* 叶脉 */}
      <ellipse cx="88" cy="155" rx="5" ry="2" fill="#A5D678" transform="rotate(-25 88 155)" opacity="0.6" />
      <ellipse cx="112" cy="150" rx="5" ry="2" fill="#A5D678" transform="rotate(25 112 150)" opacity="0.6" />
    </g>
  );
}

/* 小树 */
function SmallTreeSvg() {
  return (
    <g>
      {/* 树干 */}
      <path d="M 96 178 L 96 140 L 104 140 L 104 178 Z" fill="#8B6F47" />
      <path d="M 96 178 L 96 140 L 100 140 L 100 178 Z" fill="#A8895A" />
      {/* 树冠 */}
      <circle cx="100" cy="125" r="25" fill="#66BB6A" />
      <circle cx="85" cy="130" r="18" fill="#7CB342" />
      <circle cx="115" cy="130" r="18" fill="#7CB342" />
      <circle cx="100" cy="115" r="20" fill="#81C784" />
      {/* 高光 */}
      <circle cx="92" cy="115" r="8" fill="#A5D6A788" opacity="0.5" />
    </g>
  );
}

/* 中树 */
function MediumTreeSvg() {
  return (
    <g>
      {/* 树干 */}
      <path d="M 95 180 L 95 125 L 105 125 L 105 180 Z" fill="#8B6F47" />
      <path d="M 95 180 L 95 125 L 100 125 L 100 180 Z" fill="#A8895A" />
      {/* 分枝 */}
      <path d="M 95 145 L 80 135 L 82 140 L 95 150 Z" fill="#8B6F47" />
      <path d="M 105 145 L 120 135 L 118 140 L 105 150 Z" fill="#8B6F47" />
      {/* 树冠 */}
      <circle cx="100" cy="110" r="32" fill="#4CAF50" />
      <circle cx="78" cy="120" r="22" fill="#66BB6A" />
      <circle cx="122" cy="120" r="22" fill="#66BB6A" />
      <circle cx="100" cy="95" r="25" fill="#81C784" />
      <circle cx="85" cy="105" r="18" fill="#81C784" />
      <circle cx="115" cy="105" r="18" fill="#81C784" />
      {/* 高光 */}
      <circle cx="88" cy="98" r="10" fill="#A5D6A7" opacity="0.5" />
      <circle cx="115" cy="115" r="6" fill="#A5D6A7" opacity="0.4" />
    </g>
  );
}

/* 大树 */
function LargeTreeSvg() {
  return (
    <g>
      {/* 粗树干 */}
      <path d="M 92 180 L 92 115 L 108 115 L 108 180 Z" fill="#6B5435" />
      <path d="M 92 180 L 92 115 L 100 115 L 100 180 Z" fill="#8B6F47" />
      {/* 树干纹理 */}
      <path d="M 94 150 Q 96 155 94 160" stroke="#5A4530" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M 104 140 Q 106 145 104 150" stroke="#5A4530" strokeWidth="1" fill="none" opacity="0.5" />
      {/* 分枝 */}
      <path d="M 92 130 L 70 115 L 73 122 L 92 138 Z" fill="#6B5435" />
      <path d="M 108 130 L 130 115 L 127 122 L 108 138 Z" fill="#6B5435" />
      <path d="M 95 110 L 85 90 L 88 95 L 100 115 Z" fill="#6B5435" />
      {/* 茂密树冠 */}
      <circle cx="100" cy="100" r="38" fill="#388E3C" />
      <circle cx="70" cy="110" r="26" fill="#4CAF50" />
      <circle cx="130" cy="110" r="26" fill="#4CAF50" />
      <circle cx="100" cy="80" r="28" fill="#66BB6A" />
      <circle cx="80" cy="95" r="22" fill="#66BB6A" />
      <circle cx="120" cy="95" r="22" fill="#66BB6A" />
      <circle cx="85" cy="115" r="18" fill="#81C784" />
      <circle cx="115" cy="115" r="18" fill="#81C784" />
      {/* 高光 */}
      <circle cx="85" cy="85" r="12" fill="#A5D6A7" opacity="0.5" />
      <circle cx="118" cy="100" r="8" fill="#A5D6A7" opacity="0.4" />
      <circle cx="95" cy="120" r="6" fill="#A5D6A7" opacity="0.4" />
    </g>
  );
}

/* 开花树 */
function BloomTreeSvg({ growth }: { growth: number }) {
  // 花的数量随成长值变化
  const numFlowers = Math.min(12, Math.floor((growth - 150) / 10) + 8);
  const flowers = Array.from({ length: numFlowers }, (_, i) => {
    const angle = (i / numFlowers) * Math.PI * 2;
    const r = 30 + Math.random() * 10;
    const cx = 100 + Math.cos(angle) * r;
    const cy = 100 + Math.sin(angle) * r * 0.85;
    return { cx, cy, key: i };
  });

  return (
    <g>
      {/* 粗树干 */}
      <path d="M 92 180 L 92 115 L 108 115 L 108 180 Z" fill="#6B5435" />
      <path d="M 92 180 L 92 115 L 100 115 L 100 180 Z" fill="#8B6F47" />
      {/* 分枝 */}
      <path d="M 92 130 L 70 115 L 73 122 L 92 138 Z" fill="#6B5435" />
      <path d="M 108 130 L 130 115 L 127 122 L 108 138 Z" fill="#6B5435" />
      <path d="M 95 110 L 85 90 L 88 95 L 100 115 Z" fill="#6B5435" />
      {/* 树冠 */}
      <circle cx="100" cy="100" r="38" fill="#388E3C" />
      <circle cx="70" cy="110" r="26" fill="#4CAF50" />
      <circle cx="130" cy="110" r="26" fill="#4CAF50" />
      <circle cx="100" cy="80" r="28" fill="#66BB6A" />
      <circle cx="80" cy="95" r="22" fill="#66BB6A" />
      <circle cx="120" cy="95" r="22" fill="#66BB6A" />
      {/* 花朵 */}
      {flowers.map((f) => (
        <g key={f.key}>
          <circle cx={f.cx} cy={f.cy} r="5" fill="#FFB3C1" />
          <circle cx={f.cx} cy={f.cy} r="3" fill="#FF8FA3" />
          <circle cx={f.cx} cy={f.cy} r="1" fill="#FFE0E8" />
        </g>
      ))}
      {/* 几片飘落的花瓣 */}
      <ellipse cx="60" cy="160" rx="3" ry="2" fill="#FFB3C1" transform="rotate(45 60 160)" opacity="0.7" />
      <ellipse cx="140" cy="155" rx="3" ry="2" fill="#FFB3C1" transform="rotate(-30 140 155)" opacity="0.7" />
    </g>
  );
}