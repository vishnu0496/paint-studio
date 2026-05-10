import { useRef, useEffect, MouseEvent, TouchEvent } from "react";
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
  onTouchStart?: (e: TouchEvent<HTMLCanvasElement>) => void;
  onTouchMove?: (e: TouchEvent<HTMLCanvasElement>) => void;
  onTouchEnd?: (e: TouchEvent<HTMLCanvasElement>) => void;
  onFillPolygon: () => void;
  aiStatus?: string;
  previewMask: Uint8Array | null;
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
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onFillPolygon,
  aiStatus,
  previewMask,
}: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (loadedImage && canvasRef.current) {
      renderCanvas();
    }
  }, [loadedImage, selectedShade, showBefore, texturePreservation, intensity, paintedAreas, isDragging, dragCurrent, selectionMode, brushSize, currentBrushMask, previewMask, zoom]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / loadedImage.width);
    canvas.width = loadedImage.width * scale;
    canvas.height = loadedImage.height * scale;

    ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const drawMaskOnCtx = (mask: Uint8Array, colorHex: string, isPreview = false) => {
      const paintCanvas = document.createElement("canvas");
      paintCanvas.width = canvas.width;
      paintCanvas.height = canvas.height;
      const pCtx = paintCanvas.getContext("2d", { willReadFrequently: true })!;
      
      pCtx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
      const imageData = pCtx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      const paintColor = hexToRgb(colorHex);
      const normIntensity = Math.max(0.1, Math.min(1, intensity / 100));
      const textureAmount = Math.max(0, Math.min(1, texturePreservation / 100));

      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) {
          const idx = i * 4;
          const r = pixels[idx];
          const g = pixels[idx+1];
          const b = pixels[idx+2];
          
          // Luma-preserving paint blend: keep wall light/shadow while making the
          // selected shade visibly read as paint instead of a transparent overlay.
          const luma = (r * 299 + g * 587 + b * 114) / 1000;
          
          // Improved luma factor: non-linear curve to preserve shadows better
          const lumaFactor = Math.max(0.25, Math.min(1.4, 0.35 + (luma / 255) * 1.1));
          
          const detailR = (r - luma) * textureAmount * 0.25;
          const detailG = (g - luma) * textureAmount * 0.25;
          const detailB = (b - luma) * textureAmount * 0.25;

          let pr = paintColor.r * lumaFactor + detailR;
          let pg = paintColor.g * lumaFactor + detailG;
          let pb = paintColor.b * lumaFactor + detailB;

          const paintLuma = (paintColor.r * 299 + paintColor.g * 587 + paintColor.b * 114) / 1000;
          const isDarkShade = paintLuma < 70;
          
          // For dark shades, we need higher intensity to avoid "washed out" look, 
          // but still preserve the underlying texture.
          const finalIntensity = isPreview
            ? Math.min(isDarkShade ? 0.88 : 0.88, Math.max(0.72, normIntensity))
            : Math.min(isDarkShade ? 0.92 : 0.9, normIntensity);

          pixels[idx] = r * (1 - finalIntensity) + pr * finalIntensity;
          pixels[idx+1] = g * (1 - finalIntensity) + pg * finalIntensity;
          pixels[idx+2] = b * (1 - finalIntensity) + pb * finalIntensity;

          // Extra highlight preservation for very bright spots
          if (luma > 220) {
             const highlightPreserve = textureAmount * 0.15;
             pixels[idx] = pixels[idx] * (1 - highlightPreserve) + r * highlightPreserve;
             pixels[idx+1] = pixels[idx+1] * (1 - highlightPreserve) + g * highlightPreserve;
             pixels[idx+2] = pixels[idx+2] * (1 - highlightPreserve) + b * highlightPreserve;
          }
        }
      }
      pCtx.putImageData(imageData, 0, 0);
      
      ctx.drawImage(paintCanvas, 0, 0);
    };

    if (!showBefore && paintedAreas.length > 0) {
      paintedAreas.forEach(area => {
        if (area.mask.length === canvas.width * canvas.height) {
          drawMaskOnCtx(area.mask, area.color);
        }
      });
    }

    // Render Preview Mask if exists
    if (!showBefore && previewMask && previewMask.length === canvas.width * canvas.height) {
      drawMaskOnCtx(previewMask, selectedShade.code, true);
    }

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

  const areaToRgba = (hex: string, alpha: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    const rgb = result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-background overflow-hidden touch-none">
      <div className="flex-1 relative overflow-auto md:flex md:items-center md:justify-center p-4 md:p-8">
        <div 
          className="relative shadow-xl bg-white transition-transform duration-300 ease-out origin-top md:origin-center mx-auto"
          style={{ transform: `scale(${zoom})` }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="cursor-crosshair block touch-none"
          />
          
          {selectionMode === 'brush' && !isDragging && (
            <div 
              className="absolute pointer-events-none border border-white/50 rounded-full shadow-sm bg-primary/10"
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

      <AnimatePresence>
        {aiStatus === 'processing' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] md:w-auto"
          >
            <div className="bg-white/90 backdrop-blur-sm border border-primary/20 px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                <span className="text-primary font-bold text-[10px] md:text-xs uppercase tracking-wider">Analyzing Room</span>
              </div>
              <div className="w-32 md:w-48 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  animate={{ width: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-white border border-border p-1 rounded-xl flex flex-col gap-1 shadow-md">
          <button onClick={onZoomIn} className="p-2 hover:bg-slate-100 rounded-lg text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">zoom_in</span>
          </button>
          <button onClick={onZoomOut} className="p-2 hover:bg-slate-100 rounded-lg text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">zoom_out</span>
          </button>
          <div className="h-px bg-border mx-2"></div>
          <button onClick={onZoomReset} className="p-2 hover:bg-slate-100 rounded-lg text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">restart_alt</span>
          </button>
        </div>
      </div>

      {!image && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary gap-4 p-8">
          <div className="w-20 h-20 rounded-3xl bg-soft-blue flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-text-primary">No Photo Selected</p>
            <p className="text-sm">Upload a photo to start previewing JSW shades</p>
          </div>
        </div>
      )}

      {selectionMode === "polygon" && polygonPoints.length >= 3 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={onFillPolygon}
            className="btn btn-primary px-8 py-4 rounded-full shadow-xl animate-fade-in text-sm"
          >
            <span className="material-symbols-outlined">done_all</span>
            <span>Finalize Surface</span>
          </button>
        </div>
      )}
    </div>
  );
}
