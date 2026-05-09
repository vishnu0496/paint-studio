import { useRef, useEffect, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";

interface VisualizerCanvasProps {
  image: string | null;
  loadedImage: HTMLImageElement | null;
  selectedShade: { code: string; name: string; jswCode: string };
  showBefore: boolean;
  texturePreservation: number;
  intensity: number;
  paintedAreas: { mask: Uint8Array; color: string }[];
  isDragging: boolean;
  dragStart: { x: number; y: number } | null;
  dragCurrent: { x: number; y: number } | null;
  selectionMode: "rectangle" | "brush" | "magic" | "polygon";
  brushSize: number;
  currentBrushMask: Uint8Array | null;
  polygonPoints: { x: number; y: number }[];
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onMouseDown: (e: MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onFillPolygon: () => void;
  aiStatus?: string;
}

export default function VisualizerCanvas({
  image,
  loadedImage,
  selectedShade,
  showBefore,
  texturePreservation,
  intensity,
  paintedAreas,
  isDragging,
  dragStart,
  dragCurrent,
  selectionMode,
  brushSize,
  currentBrushMask,
  polygonPoints,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onFillPolygon,
  aiStatus,
}: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (loadedImage && canvasRef.current) {
      renderCanvas();
    }
  }, [loadedImage, selectedShade, showBefore, texturePreservation, intensity, paintedAreas, isDragging, dragCurrent, selectionMode, brushSize, currentBrushMask]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    // REMOVED ctx.filter = 'none' as we will avoid it entirely

    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / loadedImage.width);
    canvas.width = loadedImage.width * scale;
    canvas.height = loadedImage.height * scale;

    ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

    // Helper to draw masks with realistic paint rendering formula
    const drawMaskOnCtx = (mask: Uint8Array, colorHex: string) => {
      const paintCanvas = document.createElement("canvas");
      paintCanvas.width = canvas.width;
      paintCanvas.height = canvas.height;
      const pCtx = paintCanvas.getContext("2d", { willReadFrequently: true })!;
      
      // Step 1: Draw original image to sample luminance
      pCtx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
      const imageData = pCtx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      const paintColor = hexToRgb(colorHex);
      const normIntensity = intensity / 100;

      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) {
          const idx = i * 4;
          const r = pixels[idx];
          const g = pixels[idx+1];
          const b = pixels[idx+2];
          
          // Realistic Paint Formula: 
          // 1. Calculate luminance of the original wall (0-255)
          const luma = (r * 299 + g * 587 + b * 114) / 1000;
          
          // 2. Calculate the paint's own luminance
          const paintLuma = (paintColor.r * 299 + paintColor.g * 587 + paintColor.b * 114) / 1000;
          
          // 3. Preserve Texture: How much brighter/darker is this pixel than the wall average?
          // We use a mid-point of 180 (typical wall brightness)
          const textureFactor = luma / 180; 
          
          // 4. Apply Hard-Light / Multiply Hybrid
          // This ensures the paint covers the wall but dark corners stay dark
          const paintedR = Math.min(255, paintColor.r * textureFactor);
          const paintedG = Math.min(255, paintColor.g * textureFactor);
          const paintedB = Math.min(255, paintColor.b * textureFactor);
          
          // Final blend using intensity slider
          // We use a higher base opacity to ensure it looks like a coat of paint
          const finalIntensity = Math.min(1.0, normIntensity * 1.15);
          pixels[idx] = r * (1 - finalIntensity) + paintedR * finalIntensity;
          pixels[idx+1] = g * (1 - finalIntensity) + paintedG * finalIntensity;
          pixels[idx+2] = b * (1 - finalIntensity) + paintedB * finalIntensity;
          // pixels[idx+3] remains original alpha (255)
        }
      }
      pCtx.putImageData(imageData, 0, 0);
      
      // Draw the realistic result back to main canvas
      // We avoid ctx.filter entirely to prevent the 'permanent blur' bug
      ctx.drawImage(paintCanvas, 0, 0);
    };

    // Render each painted area
    if (!showBefore && paintedAreas.length > 0) {
      paintedAreas.forEach(area => {
        // Only draw if mask matches current canvas dimensions
        if (area.mask.length === canvas.width * canvas.height) {
          drawMaskOnCtx(area.mask, area.color);
        }
      });
    }

    // Live feedback
    if (isDragging) {
      if (selectionMode === "rectangle" && dragStart && dragCurrent) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = selectedShade.code;
        ctx.lineWidth = 2;
        const x = Math.min(dragStart.x, dragCurrent.x);
        const y = Math.min(dragStart.y, dragCurrent.y);
        const width = Math.abs(dragStart.x - dragCurrent.x);
        const height = Math.abs(dragStart.y - dragCurrent.y);
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = areaToRgba(selectedShade.code, 0.2);
        ctx.fillRect(x, y, width, height);
        ctx.restore();
      } else if (selectionMode === "brush" && currentBrushMask) {
        // For live brush, we don't merge yet, just draw
        drawMaskOnCtx(currentBrushMask, selectedShade.code);
      }
    }

    if (selectionMode === "polygon" && polygonPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = selectedShade.code;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }

      if (dragCurrent) {
        ctx.lineTo(dragCurrent.x, dragCurrent.y);
      }

      ctx.stroke();

      ctx.fillStyle = selectedShade.code;
      polygonPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const areaToRgba = (hex: string, alpha: number) => {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900/5 overflow-hidden">
      {/* Canvas Area with Zoom and Pan capability */}
      <div className="flex-1 relative overflow-auto scrollbar-hide flex items-center justify-center p-8">
        <div 
          className="relative shadow-[0_32px_64px_rgba(0,17,58,0.2)] bg-white transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            className="cursor-crosshair block"
          />
          
          {/* Tool Cursor Feedback */}
          {selectionMode === 'brush' && !isDragging && (
            <div 
              className="absolute pointer-events-none border border-white/50 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] bg-primary/10"
              style={{
                width: `${brushSize}px`,
                height: `${brushSize}px`,
                left: dragCurrent ? `${dragCurrent.x - brushSize/2}px` : '-100px',
                top: dragCurrent ? `${dragCurrent.y - brushSize/2}px` : '-100px',
              }}
            />
          )}
        </div>
      </div>

      {/* Top Floating Info Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <AnimatePresence>
          {aiStatus === 'processing' && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass px-6 py-3 rounded-full flex items-center gap-4 shadow-lg border-primary/10"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                <span className="text-primary font-bold text-xs uppercase tracking-widest">AI Smart Analysis</span>
              </div>
              <div className="w-48 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  animate={{ width: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
        <div className="glass p-1.5 rounded-xl flex flex-col gap-1 shadow-lg">
          <button onClick={onZoomIn} className="p-2 hover:bg-primary/5 rounded-lg text-primary transition-all">
            <span className="material-symbols-outlined">zoom_in</span>
          </button>
          <button onClick={onZoomOut} className="p-2 hover:bg-primary/5 rounded-lg text-primary transition-all">
            <span className="material-symbols-outlined">zoom_out</span>
          </button>
          <div className="h-px bg-primary/10 mx-2"></div>
          <button onClick={onZoomReset} className="p-2 hover:bg-primary/5 rounded-lg text-primary transition-all">
            <span className="material-symbols-outlined">restart_alt</span>
          </button>
        </div>
      </div>

      {/* No Image State */}
      {!image && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-600">No Image Uploaded</p>
            <p className="text-sm">Upload a room photo to start visualizing</p>
          </div>
        </div>
      )}

      {/* Polygon Completion Trigger */}
      {selectionMode === "polygon" && polygonPoints.length >= 3 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={onFillPolygon}
            className="bg-primary text-white px-8 py-4 rounded-full font-bold shadow-[0_10px_20px_rgba(0,17,58,0.3)] hover:scale-105 transition-all flex items-center gap-3 animate-fade-in"
          >
            <span className="material-symbols-outlined">done_all</span>
            Finalize Surface
          </button>
        </div>
      )}
    </div>
  );
}
