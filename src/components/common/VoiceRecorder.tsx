import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import type { MistakeVoiceNote } from '../../types';

// ===== 语音转文字组件 =====
export function VoiceToText({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('当前浏览器不支持语音识别，建议使用 Chrome 或 Safari');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      const newText = (transcript + finalText);
      setTranscript(newText);
      onTranscript(newText);
    };

    recognition.onend = () => {
      // 如果还在 listening 状态（用户未主动停止），自动重启解决 60s 超时
      if (listening) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        alert('请允许麦克风权限以使用语音识别');
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, transcript, onTranscript]);

  const stopListening = useCallback(() => {
    setListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={listening ? stopListening : startListening}
        className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm font-medium transition active:scale-95 ${
          listening ? 'bg-red-100 text-red-500' : 'bg-purple-50 text-purple-500'
        }`}
      >
        <Mic size={16} className={listening ? 'animate-pulse' : ''} />
        {listening ? '停止' : '语音转文字'}
      </button>
      {transcript && (
        <span className="text-xs text-gray-400 flex-1 truncate">{transcript}</span>
      )}
    </div>
  );
}

// ===== 微信式语音条录入组件 =====
export function VoiceRecorder({ onRecorded }: { onRecorded: (note: MistakeVoiceNote) => void }) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 选择支持的 MIME 类型
      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg'];
      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        // 转 base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onRecorded({
            type: 'voice',
            audioBlob: base64,
            duration: duration,
            transcript: '',
          });
        };
        reader.readAsDataURL(blob);

        // 停止所有音轨
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      startTimeRef.current = Date.now();
      setDuration(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    } catch (err) {
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm font-medium transition active:scale-95 ${
        recording ? 'bg-red-100 text-red-500' : 'bg-pink-50 text-pink-500'
      }`}
    >
      {recording ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
      {recording ? `${duration}s 点击停止` : '语音条'}
    </button>
  );
}

// ===== 语音条播放组件 =====
export function VoicePlayer({ note, onDelete }: { note: MistakeVoiceNote; onDelete?: () => void }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(note.audioBlob);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-pink-50 rounded-2xl p-2.5">
      <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-pink-400 text-white flex items-center justify-center active:scale-90 transition">
        {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>
      <div className="flex items-center gap-0.5 flex-1 h-6">
        {Array.from({ length: Math.min(Math.max(Math.floor(note.duration / 0.5), 8), 30) }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 bg-pink-300 rounded-full ${playing ? 'wave-bar' : ''}`}
            style={{
              height: `${10 + Math.sin(i * 0.8) * 8 + Math.random() * 6}px`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 font-mono">{note.duration}s</span>
      {onDelete && (
        <button onClick={onDelete} className="p-1 text-gray-300 hover:text-red-400">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ===== 拍照组件 =====
export function PhotoCapture({ onCaptured }: { onCaptured: (base64: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 压缩图片
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        onCaptured(compressed);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // 重置 input 允许重复选择同一文件
    e.target.value = '';
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm font-medium bg-sky-50 text-sky-500 transition active:scale-95"
      >
        📷 拍照
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
}
