import { useEffect, useRef, useState } from 'react';
import { X, Pencil, Eraser, Square, Type, Undo2, Redo2, Check } from 'lucide-react';

type Tool = 'pen' | 'eraser' | 'rect' | 'text';

const COLORS = ['#E74C3C', '#3498DB', '#27AE60', '#F39C12', '#9B59B6', '#2C3E50'];
const COLOR_NAMES = ['红', '蓝', '绿', '橙', '紫', '黑'];

interface Props {
  image: string;                    // base64 dataURL
  onDone: (annotated: string) => void;
  onSkip: () => void;
}

// 图片标注：画笔 / 橡皮 / 矩形 / 文字 + 颜色 + 粗细 + 撤销重做
export default function AnnotationModal({ image, onDone, onSkip }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(4);
  const drawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  // 撤销 / 重做栈
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef(-1);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  // 文字输入
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);

  const CANVAS_W = 420;

  // 加载图片并初始化画布
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      baseImgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale = Math.min(1, CANVAS_W / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      pushHistory();
      setReady(true);
    };
    img.src = image;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(url);
    if (historyRef.current.length > 30) historyRef.current.shift();
    historyIdxRef.current = historyRef.current.length - 1;
    setHistoryState({ canUndo: historyIdxRef.current > 0, canRedo: false });
  };

  const restoreFrom = (url: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = url;
  };

  const handleUndo = () => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    restoreFrom(historyRef.current[historyIdxRef.current]);
    setHistoryState({ canUndo: historyIdxRef.current > 0, canRedo: true });
  };

  const handleRedo = () => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    restoreFrom(historyRef.current[historyIdxRef.current]);
    setHistoryState({ canUndo: true, canRedo: historyIdxRef.current < historyRef.current.length - 1 });
  };

  const getPos = (e: React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!ready) return;
    const pos = getPos(e);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    if (tool === 'text') {
      setTextInput({ x: pos.x, y: pos.y, value: '' });
      return;
    }

    drawingRef.current = true;
    startPosRef.current = pos;
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
      ctx.strokeStyle = color;
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.lineTo(pos.x + 0.01, pos.y + 0.01);
      ctx.stroke();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const pos = getPos(e);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'rect' && snapshotRef.current && startPosRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(
        startPosRef.current.x,
        startPosRef.current.y,
        pos.x - startPosRef.current.x,
        pos.y - startPosRef.current.y
      );
    }
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.closePath();
    }
    pushHistory();
  };

  const commitText = () => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.max(14, lineWidth * 4)}px 'PingFang SC', sans-serif`;
    ctx.fillText(textInput.value.trim(), textInput.x, textInput.y);
    setTextInput(null);
    pushHistory();
  };

  const handleDone = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onDone(canvas.toDataURL('image/png'));
  };

  const tools: { key: Tool; name: string; icon: typeof Pencil }[] = [
    { key: 'pen', name: '画笔', icon: Pencil },
    { key: 'eraser', name: '橡皮', icon: Eraser },
    { key: 'rect', name: '矩形', icon: Square },
    { key: 'text', name: '文字', icon: Type },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-pink-50">
        <button onClick={onSkip} className="text-sm text-gray-400 active:scale-95 transition">
          ‹ 跳过
        </button>
        <h3 className="text-base font-bold text-gray-800">标注图片</h3>
        <button onClick={onSkip} className="p-1.5 rounded-full hover:bg-pink-50 active:scale-90 transition">
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      {/* 工具栏 */}
      <div className="px-4 py-3 bg-[#F2FAF6] border-b border-pink-50 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = tool === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTool(t.key)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition active:scale-90 ${
                  isActive ? 'bg-white shadow-cute ring-2 ring-[#8BAA8B]' : 'bg-white/60'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#8BAA8B]' : 'text-gray-400'} />
                <span className={`text-[10px] ${isActive ? 'text-[#8BAA8B] font-bold' : 'text-gray-400'}`}>
                  {t.name}
                </span>
              </button>
            );
          })}

          {/* 颜色 */}
          <div className="flex items-center gap-1.5 ml-1">
            {COLORS.map((c, i) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={COLOR_NAMES[i]}
                className={`w-6 h-6 rounded-full transition active:scale-90 ${
                  color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* 粗细 */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-[10px] text-gray-400">粗细</span>
            <input
              type="range"
              min={2}
              max={12}
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 accent-pink-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleUndo}
            disabled={!historyState.canUndo}
            className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30 active:scale-95 transition"
          >
            <Undo2 size={14} /> 撤销
          </button>
          <button
            onClick={handleRedo}
            disabled={!historyState.canRedo}
            className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30 active:scale-95 transition"
          >
            <Redo2 size={14} /> 重做
          </button>
          <button
            onClick={handleDone}
            className="ml-auto px-4 py-2 rounded-xl bg-[#4E7A52] text-white text-sm font-bold active:scale-95 transition flex items-center gap-1"
          >
            <Check size={15} /> 完成标注
          </button>
        </div>
      </div>

      {/* 画布区 */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-gray-50 relative">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="max-w-full rounded-xl shadow-cute touch-none bg-white"
          style={{ cursor: tool === 'text' ? 'text' : 'crosshair' }}
        />

        {/* 文字输入浮层 */}
        {textInput && (
          <div className="absolute inset-x-4 bottom-6 bg-white rounded-2xl shadow-cute-lg p-3 flex items-center gap-2">
            <input
              autoFocus
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && commitText()}
              placeholder="输入要标注的文字..."
              className="flex-1 px-3 py-2 bg-pink-50/50 border border-pink-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-pink-300"
            />
            <button
              onClick={commitText}
              className="px-3 py-2 rounded-xl bg-pink-400 text-white text-sm font-bold active:scale-95 transition"
            >
              确定
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
