import React, { useRef, useState, useEffect } from 'react';
import { Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface KanjiCanvasProps {
  targetKanji: string;
  onCapture: (base64Image: string) => void;
  disabled?: boolean;
}

export default function KanjiCanvas({ targetKanji, onCapture, disabled = false }: KanjiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [history, setHistory] = useState<string[]>([]); // for undo support

  // Set up high DPI canvas & Native Scroll Prevention
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the size of the canvas container
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; // high DPI scale
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Brush styling
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Deep slate ink
    ctx.lineWidth = window.innerWidth > 640 ? 18 : 14; // Bolder stroke for kids

    // Save initial empty state
    setHistory([canvas.toDataURL()]);

    // Native scroll lock on touch start/move on the canvas itself
    const preventScroll = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventScroll, { passive: false });
    canvas.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventScroll);
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, [targetKanji]);

  // Handle resizing or viewport adjustments
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save drawn content
    const tempImage = new Image();
    tempImage.src = canvas.toDataURL();

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = window.innerWidth > 640 ? 18 : 14;

    tempImage.onload = () => {
      ctx.drawImage(tempImage, 0, 0, rect.width, rect.height);
    };
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Freeze screen scrolling when drawing is active to support children on mobile
  useEffect(() => {
    if (isDrawing) {
      const preventDefault = (e: TouchEvent) => {
        if (e.cancelable) {
          e.preventDefault();
        }
      };

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      window.addEventListener('touchmove', preventDefault, { passive: false });

      return () => {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        window.removeEventListener('touchmove', preventDefault);
      };
    }
  }, [isDrawing]);

  // Helper to get drawing coordinates
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event or mouse/pointer event
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Draw a single dot on click
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    if (e.cancelable) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Save state to history for undo
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setHistory((prev) => [...prev, dataUrl]);
      // Notify parent immediately with updated drawing
      onCapture(dataUrl);
    }
  };

  // Clear Canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const initial = canvas.toDataURL();
    setHistory([initial]);
    onCapture('');
  };

  // Undo Last Stroke
  const undoLast = () => {
    if (history.length <= 1) return;

    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = newHistory[newHistory.length - 1];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rect = canvas.getBoundingClientRect();
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      
      // Notify parent of updated state
      onCapture(newHistory.length > 1 ? newHistory[newHistory.length - 1] : '');
    };
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full pb-12">
      {/* Dashed Kanji box */}
      <div 
        id="kanji-drawing-container"
        className="relative w-full max-w-[310px] sm:max-w-[390px] aspect-square border-4 border-emerald-400 bg-white rounded-3xl shadow-md overflow-hidden select-none touch-none"
        style={{ touchAction: 'none' }}
      >
        {/* Dashed vertical and horizontal lines for Japanese Kanji grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-emerald-300"></div>
          <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-emerald-300"></div>
        </div>

        {/* Faint model character guide behind the canvas */}
        {showGuide && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-bold text-slate-100 select-none">
            <span className="text-[220px] sm:text-[310px] leading-none" style={{ fontFamily: '"Klee One", "Yu Mincho", "Noto Serif JP", serif' }}>
              {targetKanji}
            </span>
          </div>
        )}

        {/* The active canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none bg-transparent block"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Handwriting controls with child-friendly padding and touch support */}
      <div className="flex gap-2.5 sm:gap-4 mt-1 pb-2">
        <button
          id="btn-toggle-guide"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-black rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all active:scale-95 cursor-pointer touch-manipulation shadow-sm"
          title={showGuide ? "お手本をかくす" : "お手本をだす"}
        >
          {showGuide ? <EyeOff size={16} /> : <Eye size={16} />}
          {showGuide ? "おてほんを隠す" : "おてほん表示"}
        </button>

        <button
          id="btn-undo-stroke"
          onClick={undoLast}
          disabled={history.length <= 1 || disabled}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-black rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer touch-manipulation shadow-sm"
          title="1つもどす"
        >
          <RotateCcw size={16} />
          <span>もどす</span>
        </button>

        <button
          id="btn-clear-canvas"
          onClick={clearCanvas}
          disabled={disabled}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-black rounded-xl bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer touch-manipulation shadow-sm"
          title="ぜんぶ消す"
        >
          <Trash2 size={16} />
          <span>消す</span>
        </button>
      </div>
    </div>
  );
}
