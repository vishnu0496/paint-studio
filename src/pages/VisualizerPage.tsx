/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { FilesetResolver, InteractiveSegmenter } from "@mediapipe/tasks-vision";
import { JSW_PAINTS_COLLECTIONS, CONTACT_INFO } from "../constants";
import { Shade, Room } from "../types";
import VisualizerCanvas from "../components/VisualizerCanvas";
import { ShadePickerPanel } from '../components/ShadePickerPanel';
import { ProjectManager } from '../components/ProjectManager';
import { PaintCalculator } from '../components/PaintCalculator';
import { QuotePanel } from '../features/visualizer/components/QuotePanel';
import { buildProjectQuoteMessage, buildSelectedShadeMessage } from '../features/visualizer/lib/quoteBuilder';

import { searchShades } from '../features/visualizer/lib/shadeSearch';
import { useProjectPersistence } from "../features/visualizer/hooks/useProjectPersistence";
import { useRooms } from "../features/visualizer/hooks/useRooms";
import { 
  clonePaintedAreas, 
  maskHasPaint, 
  getMaskCoverage, 
  mergeMask, 
  drawLineOnMask, 
  drawCircleOnMask,
  createPolygonMask,
  fillPinholes,
  removeSmallMaskIslands,
  keepTopConnectedMask,
  removeCeilingDrips,
  protectDetailedObjects,
  protectExistingPaint,
  expandMaskByColorSimilarity,
  validateMask,
  PaintedArea
} from "../features/visualizer/lib/maskUtils";
import { SegmentationStatus, SurfaceMask, SurfaceLabel } from "../services/segmentation/types";
import { BrowserSegmentationService } from "../services/segmentation/browserSegmentationService";
import { FallbackSegmentationService } from "../services/segmentation/fallbackSegmentationService";





export default function VisualizerPage() {
  const navigate = useNavigate();
  const [selectedShade, setSelectedShade] = useState<Shade>(JSW_PAINTS_COLLECTIONS[0].shades[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBefore, setShowBefore] = useState(false);
  const [activePanel, setActivePanel] = useState<'shades' | 'projects' | 'calculator' | 'quote'>('shades');
  const [projectPalette, setProjectPalette] = useState<Shade[]>([]);

  const [eyedropperActive, setEyedropperActive] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'error' } | null>(null);
  const [ceilingBoundaryLine, setCeilingBoundaryLine] = useState<number | null>(null);

  // Active room editing state
  const [image, setImage] = useState<string | null>("https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200");
  const [paintedAreas, setPaintedAreas] = useState<{ mask: Uint8Array, color: string }[]>([]);
  const [paintHistory, setPaintHistory] = useState<{ mask: Uint8Array, color: string }[][]>([]);
  const [intensity, setIntensity] = useState(70);
  const [texturePreservation, setTexturePreservation] = useState(50);
  const [zoom, setZoom] = useState(1);

  const {
    rooms,
    setRooms,
    activeRoomId,
    setActiveRoomId,
    syncCurrentRoom,
    getRoomsSnapshot,
    handleSwitchRoom,
    handleAddRoom
  } = useRooms({
    image,
    paintedAreas,
    intensity,
    texturePreservation,
    ceilingBoundaryLine,
    setImage,
    setPaintedAreas,
    setPaintHistory,
    setIntensity,
    setTexturePreservation,
    setCeilingBoundaryLine,
    setZoom
  });

  // Selection tools state
  const [selectionMode, setSelectionMode] = useState<"brush" | "magic" | "polygon">("brush");
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [isEraser, setIsEraser] = useState(false);
  const [brushSize, setBrushSize] = useState(32);
  const [surfaceType, setSurfaceType] = useState<"wall" | "ceiling" | "general">("general");
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [lastCalculatorSummary, setLastCalculatorSummary] = useState('');
  const [photoStage, setPhotoStage] = useState<"idle" | "capturing" | "finished">("finished");
  const [refineMode, setRefineMode] = useState(false);
  const [magicSensitivity, setMagicSensitivity] = useState(45);
  const [previewMask, setPreviewMask] = useState<Uint8Array | null>(null);

  // AI Service State
  const segmentationServiceRef = useRef<BrowserSegmentationService | FallbackSegmentationService | null>(null);
  const [aiStatus, setAiStatus] = useState<SegmentationStatus>("idle");
  const [aiProgress, setAiProgress] = useState(0);
  const [aiMessage, setAiMessage] = useState("");
  const [aiMasks, setAiMasks] = useState<SurfaceMask[]>([]);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [aiFailedImage, setAiFailedImage] = useState<string | null>(null);


  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [lastProcessedImage, setLastProcessedImage] = useState<string | null>(null);
  const [currentBrushMask, setCurrentBrushMask] = useState<Uint8Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const interactiveSegmenterRef = useRef<InteractiveSegmenter | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'tools' | 'colours' | 'rooms' | 'estimate' | 'quote'>('tools');
  const [interactiveStatus, setInteractiveStatus] = useState<"loading" | "ready" | "error">("loading");


  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const canvas = e.currentTarget;
    
    // Simulate mouse down
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      currentTarget: canvas,
      preventDefault: () => {},
      stopPropagation: () => {}
    } as any;
    handleMouseDown(mouseEvent);
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const canvas = e.currentTarget;
    
    // Simulate mouse move
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      currentTarget: canvas,
      preventDefault: () => {},
      stopPropagation: () => {}
    } as any;
    handleMouseMove(mouseEvent);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleMouseUp();
  };

  useEffect(() => {
    let cancelled = false;

    const loadInteractiveSegmenter = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const segmenter = await InteractiveSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/interactive_segmenter/ptm_512_hdt_ptm_woid.tflite"
          },
          outputConfidenceMasks: true,
          outputCategoryMask: false
        });

        if (cancelled) {
          segmenter.close();
          return;
        }

        interactiveSegmenterRef.current = segmenter;
        setInteractiveStatus("ready");
      } catch (error) {
        console.error("Interactive segmenter failed:", error);
        if (!cancelled) setInteractiveStatus("error");
      }
    };

    loadInteractiveSegmenter();

    return () => {
      cancelled = true;
      interactiveSegmenterRef.current?.close();
      interactiveSegmenterRef.current = null;
    };
  }, []);

  useEffect(() => {
    let initTimeoutId: any;

    const switchToFallback = () => {
      if (initTimeoutId) clearTimeout(initTimeoutId);
      
      // Dispose existing service before switching
      if (segmentationServiceRef.current) {
        segmentationServiceRef.current.dispose?.();
      }

      setAiUnavailable(true);
      setAiStatus("error");
      setAiMessage("AI detection unavailable. Use Brush or Polygon Select.");
      
      const fallback = new FallbackSegmentationService();
      segmentationServiceRef.current = fallback;
      fallback.onStatusChange = (status) => {
        // Only update if this is still the active service
        if (segmentationServiceRef.current !== fallback) return;
        setAiStatus(status);
        if (status === "error") {
          setAiMessage("AI detection unavailable. Use Brush or Polygon Select.");
        }
      };
      fallback.initialize().catch(() => {});
    };


    // Capability Check
    const memory = (navigator as any).deviceMemory;
    const connection = (navigator as any).connection;
    const isLowEnd = (memory && memory < 4) || (connection && (connection.effectiveType === '2g' || connection.effectiveType === '3g'));

    if (isLowEnd) {
      switchToFallback();
      return () => segmentationServiceRef.current?.dispose?.();
    }

    const service = new BrowserSegmentationService();
    segmentationServiceRef.current = service;

    service.onStatusChange = (status, message, progress) => {
      // Race condition protection: ignore events from disposed/replaced services
      if (segmentationServiceRef.current !== service) return;

      setAiStatus(status);
      if (progress !== undefined) setAiProgress(progress);
      
      // Standardized Phase 4B Messaging
      switch (status) {
        case "loading":
          setAiMessage("Preparing wall detection...");
          break;
        case "ready":
          setAiMessage("Wall detection ready.");
          break;
        case "processing":
          setAiMessage("Analyzing room photo...");
          break;
        case "complete":
          setAiMessage("Wall detection complete. Tap a wall or use manual tools.");
          setTimeout(() => setAiMessage(""), 5000);
          break;
        case "error":
          setAiMessage("AI detection unavailable. Use Brush or Polygon Select.");
          break;
        default:
          if (message) setAiMessage(message);
      }
    };


    // Timeout Protection (20 seconds)
    initTimeoutId = setTimeout(() => {
      if (aiStatus === "loading" || aiStatus === "idle") {
        console.warn("[Main] AI initialization timed out. Switching to fallback.");
        switchToFallback();
      }
    }, 20000);

    service.initialize()
      .then(() => {
        if (initTimeoutId) clearTimeout(initTimeoutId);
      })
      .catch(err => {
        console.error('[Main] Service initialization failed:', err);
        switchToFallback();
      });

    return () => {
      if (initTimeoutId) clearTimeout(initTimeoutId);
      service.dispose();
    };
  }, []);






  useEffect(() => {
    // Only trigger if we have an image, valid canvas dimensions, and AI is ready/finished
    // Do not trigger if AI is unavailable or if this image previously failed segmentation
    if (image && canvasWidth > 0 && canvasHeight > 0 &&
      !aiUnavailable &&
      image !== lastProcessedImage &&
      image !== aiFailedImage &&
      (aiStatus === 'ready' || aiStatus === 'complete' || aiStatus === 'error')) {


      // Small timeout to ensure UI updates before heavy processing
      const timeoutId = setTimeout(async () => {
        setLastProcessedImage(image);
        setAiMasks([]);
        
        if (!segmentationServiceRef.current) return;

        try {
          const result = await segmentationServiceRef.current.segmentImage({
            image,
            targetWidth: canvasWidth,
            targetHeight: canvasHeight
          });

          if (result.status === 'complete') {
            setAiMasks(result.masks);
            setAiFailedImage(null); // Clear failure marker on success
          } else {
            console.warn('[Main] AI segmentation failed:', result.error);
            setAiFailedImage(image); // Mark this image as failed to prevent retry loops
          }
        } catch (err) {
          console.error('[Main] Segmentation error:', err);
          setAiFailedImage(image);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [image, aiStatus, lastProcessedImage, aiFailedImage, canvasWidth, canvasHeight, aiUnavailable]);






      const allShades = JSW_PAINTS_COLLECTIONS[0].shades;

      const filteredShades = searchShades(JSW_PAINTS_COLLECTIONS, searchQuery);

      useEffect(() => {
        if (!image) {
          setLoadedImage(null);
          setCeilingBoundaryLine(null);
          return;
        }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = image;
        img.onload = () => {
          setLoadedImage(img);
          // Reset boundary on new image
          setCeilingBoundaryLine(null);
        };
      }, [image]);

      useEffect(() => {
        if (loadedImage) {
          // On mobile, use viewport width minus padding to avoid horizontal scroll at zoom 1
          const isMobile = window.innerWidth < 768;
          const maxWidth = isMobile ? window.innerWidth - 32 : 1200; 
          const scale = Math.min(1, maxWidth / loadedImage.width);
          setCanvasWidth(loadedImage.width * scale);
          setCanvasHeight(loadedImage.height * scale);
        }
      }, [loadedImage]);

      const getShadeForColor = (hex: string) => {
        return allShades.find(s => s.code.toLowerCase() === hex.toLowerCase());
      };

      const getProjectSummary = () => {
        const snapshot = getRoomsSnapshot();
        const usedRooms = snapshot
          .map(room => {
            const shades = room.paintedAreas
              .map(area => getShadeForColor(area.color) || { name: "Custom Color", jswCode: area.color.toUpperCase(), code: area.color })
              .filter((shade, index, arr) => arr.findIndex(s => s.code === shade.code) === index);

            return { room, shades };
          })
          .filter(item => item.shades.length > 0);

        const allUsedShades = usedRooms
          .flatMap(item => item.shades)
          .filter((shade, index, arr) => arr.findIndex(s => s.code === shade.code) === index);

        return { usedRooms, allUsedShades };
      };

      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };

      const findNearestJSWShade = (r: number, g: number, b: number) => {
        let minDistance = Infinity;
        let closestShade = JSW_PAINTS_COLLECTIONS[0].shades[0];

        JSW_PAINTS_COLLECTIONS.forEach(collection => {
          collection.shades.forEach(shade => {
            const shadeRgb = hexToRgb(shade.code);

            const distance = Math.sqrt(
              Math.pow(r - shadeRgb.r, 2) +
              Math.pow(g - shadeRgb.g, 2) +
              Math.pow(b - shadeRgb.b, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestShade = shade;
            }
          });
        });
        return closestShade;
      };

      const { saveProject, loadProject } = useProjectPersistence({
        getRoomsSnapshot,
        activeRoomId,
        projectPalette
      });

      const currentRoomPalette = Array.from(new Set(paintedAreas.map(a => a.color)));
      const shadePalette = currentRoomPalette.map(hex => allShades.find(s => s.code === hex) || { name: "Custom Color", code: hex, jswCode: "0000" });


      const applyPaintedAreas = (nextAreas: { mask: Uint8Array, color: string }[]) => {
        setPaintHistory(prev => [...prev.slice(-19), clonePaintedAreas(paintedAreas)]);
        setPaintedAreas(nextAreas);
      };


      const updatePaintedAreas = (newMask: Uint8Array) => {
        if (isEraser) {
          const updated = paintedAreas
            .map(area => ({ ...area, mask: mergeMask(area.mask, newMask, true) }))
            .filter(area => maskHasPaint(area.mask));
          applyPaintedAreas(updated);
          return;
        }

        const existingAreaIdx = paintedAreas.findIndex(a => a.color === selectedShade.code);
        if (existingAreaIdx > -1) {
          const updated = clonePaintedAreas(paintedAreas);
          updated[existingAreaIdx].mask = mergeMask(updated[existingAreaIdx].mask, newMask, false);
          applyPaintedAreas(updated);
        } else {
          applyPaintedAreas([...clonePaintedAreas(paintedAreas), { mask: newMask, color: selectedShade.code }]);
        }
      };

      const areaToRgba = (hex: string, alpha: number) => {
        const rgb = hexToRgb(hex);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      };


      const handleFillPolygon = () => {
        if (polygonPoints.length < 3 || canvasWidth === 0 || canvasHeight === 0) {
          setPolygonPoints([]);
          return;
        }
        const newMask = createPolygonMask(polygonPoints, canvasWidth, canvasHeight);
        updatePaintedAreas(newMask);
        setPolygonPoints([]);
      };

      const handleCompletePolygon = () => {
        if (polygonPoints.length < 3 || !loadedImage) return;
        const newMask = createPolygonMask(polygonPoints, canvasWidth, canvasHeight);
        updatePaintedAreas(newMask);
        setPolygonPoints([]);
        setToast({ message: "Custom area applied!" });
        setTimeout(() => setToast(null), 2000);
      };

      const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        if (showBefore || !image) return;
        const canvas = e.currentTarget;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvasWidth);
        const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvasHeight);

        if (eyedropperActive && loadedImage) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvasWidth;
          tempCanvas.height = canvasHeight;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(loadedImage, 0, 0, canvasWidth, canvasHeight);
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const matchedShade = findNearestJSWShade(pixel[0], pixel[1], pixel[2]);
            handleSelectShade(matchedShade);
            setToast({ message: `Closest JSW match: ${matchedShade.name} · JSW ${matchedShade.jswCode}` });
            setTimeout(() => setToast(null), 3000);
            setEyedropperActive(false);
          }
          setIsDragging(false);
          return;
        }

        setIsDragging(true);
        setLastPoint({ x, y });

        if (selectionMode === "brush") {
          const mask = new Uint8Array(canvasWidth * canvasHeight);
          drawCircleOnMask(mask, x, y, brushSize / 2, canvasWidth, canvasHeight);
          setCurrentBrushMask(mask);
        } else if (selectionMode === "polygon") {
          setPolygonPoints(prev => [...prev, { x, y }]);
          // Keep dragging enabled for visual line following if needed, 
          // but for points we don't need the rectangle drag
          setIsDragging(false);
        } else if (selectionMode === "magic") {
          handleMagicWand(x, y);
          setIsDragging(false);
        } else {
          // Default to rectangle/drag mode
          setDragStart({ x, y });
          setDragCurrent({ x, y });
          setIsDragging(true);
        }
      };

      const handleFillGaps = () => {
        if (canvasWidth === 0 || canvasHeight === 0 || !loadedImage) return;
        if (paintedAreas.length === 0) return;

        const width = canvasWidth;
        const height = canvasHeight;

        // Find the currently active mask
        const activeMaskIdx = paintedAreas.findIndex(a => a.color === selectedShade.code);
        if (activeMaskIdx === -1) return;

        const baseMask = paintedAreas[activeMaskIdx].mask;
        const newMask = new Uint8Array(baseMask); // Copy

        // Stronger closing: fill small pinholes and one-pixel broken lines.
        for (let pass = 0; pass < 3; pass++) {
          const source = new Uint8Array(newMask);
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = y * width + x;
              if (source[idx] === 1) continue;

              let paintedNeighbors = 0;
              for (let yy = -1; yy <= 1; yy++) {
                for (let xx = -1; xx <= 1; xx++) {
                  if (xx === 0 && yy === 0) continue;
                  if (source[(y + yy) * width + (x + xx)] === 1) paintedNeighbors++;
                }
              }

              const bridgesHorizontal = source[idx - 1] === 1 && source[idx + 1] === 1;
              const bridgesVertical = source[idx - width] === 1 && source[idx + width] === 1;
              if (paintedNeighbors >= 5 || bridgesHorizontal || bridgesVertical) {
                newMask[idx] = 1;
              }
            }
          }
        }

        const updatedAreas = clonePaintedAreas(paintedAreas);
        updatedAreas[activeMaskIdx] = { ...updatedAreas[activeMaskIdx], mask: newMask };
        applyPaintedAreas(updatedAreas);
      };

      const getCurrentImagePixels = (width: number, height: number) => {
        if (!loadedImage || width === 0 || height === 0) return null;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;
        ctx.drawImage(loadedImage, 0, 0, width, height);
        return ctx.getImageData(0, 0, width, height).data;
      };

      const handleAutoSelectWall = async () => {
        if (!image || !loadedImage || !segmentationServiceRef.current || isProcessingAll || canvasWidth === 0 || canvasHeight === 0) return;
        
        setIsProcessingAll(true);
        setAiStatus('processing');
        
        try {
          const results = await segmentationServiceRef.current.segmentImage({
            image,
            targetWidth: canvasWidth,
            targetHeight: canvasHeight
          });

          if (results.status !== 'complete' || results.masks.length === 0) {
            throw new Error("No clear surfaces detected.");
          }

          const targetMask = results.masks.find(m => m.label === 'wall') || results.masks[0];
          const sourcePixels = getCurrentImagePixels(canvasWidth, canvasHeight);
          if (!sourcePixels) {
            throw new Error("Could not inspect image pixels.");
          }
          
          let cleaned = removeSmallMaskIslands(targetMask.maskData, canvasWidth, canvasHeight, 500);
          cleaned = protectDetailedObjects(cleaned, canvasWidth, canvasHeight, sourcePixels, targetMask.label === 'ceiling' ? 'ceiling' : 'wall');

          const validation = validateMask(cleaned, canvasWidth, canvasHeight, targetMask.label === 'ceiling' ? 'ceiling' : 'wall');
          if (!validation.isValid) {
            setToast({ message: validation.reason || "Surface selection too low quality.", type: 'error' });
            return;
          }

          setPreviewMask(cleaned);
          setToast({ message: "Surface detected. Apply this selection?", type: 'info' });
        } catch (err) {
          console.error(err);
          setToast({ message: "Auto-select failed. Try manual tools.", type: 'error' });
        } finally {
          setIsProcessingAll(false);
          setAiStatus('idle');
          setTimeout(() => setToast(null), 3000);
        }
      };

      const handleApplyPreview = () => {
        if (previewMask) {
          updatePaintedAreas(previewMask);
          setPreviewMask(null);
          setToast({ message: "Paint applied successfully!", type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }
      };

      const handleCancelPreview = () => {
        setPreviewMask(null);
        setToast({ message: "Selection cleared.", type: 'info' });
        setTimeout(() => setToast(null), 3000);
      };


      const buildTopConnectedCeilingGuard = (width: number, height: number) => {
        if (!loadedImage) return new Uint8Array(width * height);

        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = width;
        sourceCanvas.height = height;
        const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
        if (!sourceCtx) return new Uint8Array(width * height);

        sourceCtx.drawImage(loadedImage, 0, 0, width, height);
        const pixels = sourceCtx.getImageData(0, 0, width, height).data;

        const ceilingRefs: { r: number; g: number; b: number }[] = [];
        const sampleRows = [
          Math.max(2, Math.floor(height * 0.04)),
          Math.max(2, Math.floor(height * 0.08)),
          Math.max(2, Math.floor(height * 0.12))
        ];

        for (const sampleY of sampleRows) {
          for (let band = 0; band < 8; band++) {
            const startX = Math.floor(width * (band / 8));
            const endX = Math.floor(width * ((band + 1) / 8));
            let refR = 0;
            let refG = 0;
            let refB = 0;
            let samples = 0;

            for (let x = startX; x < endX; x += 3) {
              const idx = (sampleY * width + x) * 4;
              const r = pixels[idx];
              const g = pixels[idx + 1];
              const b = pixels[idx + 2];
              const chroma = Math.max(r, g, b) - Math.min(r, g, b);
              const luma = r * 0.299 + g * 0.587 + b * 0.114;
              if (luma < 95 || chroma > 92) continue;
              refR += r;
              refG += g;
              refB += b;
              samples++;
            }

            if (samples > 0) {
              ceilingRefs.push({ r: refR / samples, g: refG / samples, b: refB / samples });
            }
          }
        }

        if (ceilingRefs.length === 0) return new Uint8Array(width * height);

        const isCeilingLike = (x: number, y: number) => {
          if (y > height * 0.65) return false;
          const idx = (y * width + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const luma = r * 0.299 + g * 0.587 + b * 0.114;
          const chroma = max - min;
          if (luma < 105 || chroma > 95) return false;

          let bestDistance = Infinity;
          for (const ref of ceilingRefs) {
            const distance = Math.abs(r - ref.r) + Math.abs(g - ref.g) + Math.abs(b - ref.b);
            if (distance < bestDistance) bestDistance = distance;
          }

          return bestDistance < 96 || (luma > 190 && chroma < 58);
        };

        const buildBoundaryMap = () => {
          const boundary = new Int32Array(width);
          const minY = Math.max(10, Math.floor(height * 0.08));
          const maxY = Math.floor(height * 0.65);

          for (let x = 0; x < width; x++) {
            let bestY = Math.floor(height * 0.24);
            let bestScore = -Infinity;

            for (let y = minY; y < maxY; y++) {
              const above = Math.max(1, y - 4);
              const below = Math.min(height - 2, y + 4);
              const a = (above * width + x) * 4;
              const b = (below * width + x) * 4;
              const lumaA = pixels[a] * 0.299 + pixels[a + 1] * 0.587 + pixels[a + 2] * 0.114;
              const lumaB = pixels[b] * 0.299 + pixels[b + 1] * 0.587 + pixels[b + 2] * 0.114;
              const colorJump =
                Math.abs(pixels[b] - pixels[a]) +
                Math.abs(pixels[b + 1] - pixels[a + 1]) +
                Math.abs(pixels[b + 2] - pixels[a + 2]);
              const centerBias = -Math.abs(y - height * 0.24) * 0.08;
              const score = Math.abs(lumaB - lumaA) + colorJump * 0.35 + centerBias;

              if (score > bestScore) {
                bestScore = score;
                bestY = y;
              }
            }

            boundary[x] = bestY;
          }

          for (let pass = 0; pass < 4; pass++) {
            const next = new Int32Array(boundary);
            for (let x = 2; x < width - 2; x++) {
              next[x] = Math.round((boundary[x - 2] + boundary[x - 1] + boundary[x] * 2 + boundary[x + 1] + boundary[x + 2]) / 6);
            }
            boundary.set(next);
          }

          return boundary;
        };

        const boundaryMap = buildBoundaryMap();
        (window as any)._ceilingBoundaryMap = boundaryMap;

        const guard = new Uint8Array(width * height);
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        let qHead = 0;
        let qTail = 0;
        const dirs = [-width, width, -1, 1];

        for (let x = 0; x < width; x++) {
          if (isCeilingLike(x, 0)) {
            const idx = x;
            queue[qTail++] = idx;
            visited[idx] = 1;
          }
        }

        while (qHead < qTail) {
          const idx = queue[qHead++];
          const x = idx % width;
          const y = Math.floor(idx / width);
          if (y > Math.min(boundaryMap[x] + 10, height * 0.34)) continue;
          guard[idx] = 1;

          for (let i = 0; i < dirs.length; i++) {
            const nextIdx = idx + dirs[i];
            const nx = nextIdx % width;
            const ny = Math.floor(nextIdx / width);
            if (nextIdx < 0 || nextIdx >= width * height) continue;
            if (dirs[i] === -1 && x === 0) continue;
            if (dirs[i] === 1 && x === width - 1) continue;
            if (visited[nextIdx] || !isCeilingLike(nx, ny)) continue;
            if (ny > Math.min(boundaryMap[nx] + 10, height * 0.34)) continue;

            visited[nextIdx] = 1;
            queue[qTail++] = nextIdx;
          }
        }

        return fillPinholes(guard, width, height, 2);
      };

      const buildAiSurfaceMask = (
        label: "wall" | "ceiling",
        width: number,
        height: number,
        seed?: { x: number; y: number }
      ): Uint8Array | null => {
        if (!loadedImage) return null;

        const canvasSize = width * height;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(loadedImage, 0, 0, width, height);
        const pixels = ctx.getImageData(0, 0, width, height).data;

        if (!loadedImage || !aiMasks || aiMasks.length === 0) return null;

        const candidate = new Uint8Array(canvasSize);

        // 1. Build full target surface mask from AI
        const targetMasks = aiMasks.filter((m: SurfaceMask) => m.label === label);
        if (targetMasks.length === 0) return null;


        for (const m of targetMasks) {
          for (let y = 0; y < height; y++) {
            const maskY = Math.floor(y * (m.height / height));
            const maskYOffset = maskY * m.width;
            const candYOffset = y * width;
            for (let x = 0; x < width; x++) {
              const mX = Math.floor(x * (m.width / width));
              if (m.maskData[maskYOffset + mX] > 0) {
                candidate[candYOffset + x] = 1;
              }
            }
          }
        }

        // 2. Subtract opposite surface
        const oppLabel = label === "wall" ? "ceiling" : "wall";
        const oppMasks = aiMasks.filter((m: SurfaceMask) => m.label === oppLabel);

        for (const m of oppMasks) {
          for (let y = 0; y < height; y++) {
            const maskY = Math.floor(y * (m.height / height));
            const maskYOffset = maskY * m.width;
            const candYOffset = y * width;
            for (let x = 0; x < width; x++) {
              const mX = Math.floor(x * (m.width / width));
              if (m.maskData[maskYOffset + mX] > 0) {
                candidate[candYOffset + x] = 0;
              }
            }
          }
        }

        // 3. Subtract non-target surfaces (objects and floors)
        const blockedLabels = new Set<SurfaceLabel>(["object", "floor"]);


        for (const m of aiMasks) {
          if (!blockedLabels.has(m.label)) continue;
          for (let y = 0; y < height; y++) {
            const maskY = Math.floor(y * (m.height / height));
            const maskYOffset = maskY * m.width;
            const candYOffset = y * width;
            for (let x = 0; x < width; x++) {
              const mX = Math.floor(x * (m.width / width));
              if (m.maskData[maskYOffset + mX] > 0) {
                candidate[candYOffset + x] = 0;
              }
            }
          }
        }

        // 4. Advanced boundary cleanup
        const ceilingGuard = buildTopConnectedCeilingGuard(width, height);
        if (label === "wall") {
          // For wall: only subtract ceiling guard in top 20%
          const topBoundary = height * 0.20;
          if (ceilingGuard) {
            for (let i = 0; i < canvasSize; i++) {
              const y = Math.floor(i / width);
              if (y < topBoundary && ceilingGuard[i] === 1) {
                candidate[i] = 0;
              }
            }
          }
        } else if (label === "ceiling") {
          // For ceiling: use the top-connected ceiling plane as a fallback because
          // generic AI often misses sloped or shaded ceiling sections.
          const boundaryMap = (window as any)._ceilingBoundaryMap as Int32Array | undefined;
          for (let i = 0; i < canvasSize; i++) {
            candidate[i] = ceilingGuard[i] === 1 ? 1 : 0;
          }

          const cutoff = height * 0.65;
          let maskPixelCount = 0;
          for (let i = 0; i < canvasSize; i++) {
            const y = Math.floor(i / width);
            const x = i % width;
            const inGuard = ceilingGuard ? ceilingGuard[i] === 1 : false;
            const belowCeilingLine = boundaryMap ? y > Math.min(boundaryMap[x] + 12, height * 0.65) : false;
            if (belowCeilingLine || (!inGuard && y > height * 0.65) || y > cutoff) {
              candidate[i] = 0;
            } else if (candidate[i] === 1) {
              maskPixelCount++;
            }
          }
          
          // Low confidence check: if detected area is tiny compared to image size
          if (maskPixelCount < (canvasSize * 0.02)) {
            (window as any)._aiLowConfidence = true;
          } else {
            (window as any)._aiLowConfidence = false;
          }
        }

        // 5. Click verification
        if (seed) {
          const sx = Math.max(0, Math.min(width - 1, Math.floor(seed.x)));
          const sy = Math.max(0, Math.min(height - 1, Math.floor(seed.y)));
          if (candidate[sy * width + sx] !== 1) return null;
        }

        // 6. Fill small surface gaps, then remove object-like islands and detail-heavy regions.
        const fillRadius = label === "wall" ? 2 : 3;
        let cleanedMask = protectDetailedObjects(
          fillPinholes(candidate, width, height, fillRadius),
          width,
          height,
          pixels,
          label
        );

        if (label === "ceiling") {
          const boundaryMap = (window as any)._ceilingBoundaryMap as Int32Array | undefined;
          cleanedMask = removeCeilingDrips(
            keepTopConnectedMask(cleanedMask, width, height),
            width,
            height,
            boundaryMap
          );
        }

        cleanedMask = removeSmallMaskIslands(
          cleanedMask,
          width,
          height,
          Math.max(90, Math.floor(canvasSize * 0.0012))
        );

        // CRITICAL: Always protect existing paint to prevent overwriting
        return protectExistingPaint(
          cleanedMask,
          paintedAreas,
          selectedShade.code
        );
      };

      const handleCompleteDetectedSurface = (targetSurface?: "wall" | "ceiling") => {
        if (canvasWidth === 0 || canvasHeight === 0 || !loadedImage) return;

        const label = targetSurface || (surfaceType === "ceiling" ? "ceiling" : "wall");
        if (label === "ceiling" && photoStage !== "finished") {
          const siteMask = buildSiteCeilingMask(canvasWidth, canvasHeight);
          if (siteMask && maskHasPaint(siteMask)) {
            updatePaintedAreas(siteMask);
            setSurfaceType("ceiling");
            setSelectionMode("brush");
            setIsEraser(false);
            setRefineMode(false);
            setAiMessage("Site ceiling filled automatically. Use Brush/Eraser only for small corrections.");
            setTimeout(() => setAiMessage(''), 4000);
            return;
          }
        }

        setSurfaceType(label);
        setSelectionMode("magic");
        setIsEraser(false);
        setPolygonPoints([]);
        setRefineMode(false);
        setAiMessage(label === "ceiling"
          ? "Click inside the ceiling. Click missed ceiling patches to add them."
          : "Click inside a wall. Click other wall sections to add them."
        );
        setTimeout(() => setAiMessage(''), 5000);
      };

      const buildTargetedFloodMask = (
        startX: number,
        startY: number,
        targetSurface: "wall" | "ceiling" | "general",
        width: number,
        height: number
      ) => {
        if (!loadedImage) return null;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
        if (!tCtx) return null;

        tCtx.drawImage(loadedImage, 0, 0, width, height);
        const pixels = tCtx.getImageData(0, 0, width, height).data;

        startX = Math.max(0, Math.min(width - 1, Math.floor(startX)));
        startY = Math.max(0, Math.min(height - 1, Math.floor(startY)));
        const startIdx = startY * width + startX;
        const pStartIdx = startIdx * 4;
        const startR = pixels[pStartIdx];
        const startG = pixels[pStartIdx + 1];
        const startB = pixels[pStartIdx + 2];
        const startLuma = startR * 0.299 + startG * 0.587 + startB * 0.114;
        const startChroma = Math.max(startR, startG, startB) - Math.min(startR, startG, startB);
        const ceilingGuard = buildTopConnectedCeilingGuard(width, height);

        const canAcceptPixel = (idx: number) => {
          const x = idx % width;
          const y = Math.floor(idx / width);
          
          if (targetSurface === "ceiling") {
            if (y > Math.min(height * 0.34, startY + height * 0.12)) return false;
          }
          
          if (targetSurface === "wall") {
            if (y < height * 0.10) return false;
            // Prevent wall fill from bleeding into the detected ceiling in the top 65% of the image
            if (y < height * 0.65 && ceilingGuard && ceilingGuard[idx] === 1) return false;
          }

          const p = idx * 4;
          const r = pixels[p];
          const g = pixels[p + 1];
          const b = pixels[p + 2];
          const luma = r * 0.299 + g * 0.587 + b * 0.114;
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          const colorDist = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB);
          const lumaDist = Math.abs(luma - startLuma);
          const chromaDist = Math.abs(chroma - startChroma);

          if (targetSurface === "ceiling") {
            return colorDist <= 150 && lumaDist <= 72 && chroma <= 100;
          }
          if (targetSurface === "wall") {
            return colorDist <= 130 && lumaDist <= 65 && chromaDist <= 55;
          }
          return colorDist <= magicSensitivity * 1.2;
        };

        const newMask = new Uint8Array(width * height);
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        const dirs = [-width, width, -1, 1];
        let qHead = 0;
        let qTail = 0;

        queue[qTail++] = startIdx;
        visited[startIdx] = 1;

        while (qHead < qTail) {
          const idx = queue[qHead++];
          const x = idx % width;
          if (!canAcceptPixel(idx)) continue;
          newMask[idx] = 1;

          for (const dir of dirs) {
            const nextIdx = idx + dir;
            if (nextIdx < 0 || nextIdx >= width * height) continue;
            if (dir === -1 && x === 0) continue;
            if (dir === 1 && x === width - 1) continue;
            if (visited[nextIdx]) continue;
            visited[nextIdx] = 1;
            queue[qTail++] = nextIdx;
          }
        }

        const tempCanvas2 = document.createElement("canvas");
        tempCanvas2.width = canvasWidth;
        tempCanvas2.height = canvasHeight;
        const ctx = tempCanvas2.getContext("2d")!;
        ctx.drawImage(loadedImage, 0, 0, canvasWidth, canvasHeight);
        const pixels2 = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;

        const cleanedMask = fillPinholes(
          protectDetailedObjects(
            newMask, 
            canvasWidth, 
            canvasHeight, 
            pixels2,
            targetSurface === "ceiling" ? "ceiling" : "wall"
          ),
          canvasWidth,
          canvasHeight
        );

        return protectExistingPaint(
            removeSmallMaskIslands(
                cleanedMask,
                width,
                height,
                Math.max(40, Math.floor(width * height * 0.0005))
            ),
            paintedAreas,
            selectedShade.code
        );
      };

      const buildInteractiveMask = async (
        startX: number,
        startY: number,
        targetSurface: "wall" | "ceiling" | "general",
        width: number,
        height: number
      ) => {
        const segmenter = interactiveSegmenterRef.current;
        if (!segmenter || !loadedImage || interactiveStatus !== "ready") return null;

        const normalizedX = Math.max(0, Math.min(1, startX / width));
        const normalizedY = Math.max(0, Math.min(1, startY / height));

        const result = await new Promise<any>((resolve, reject) => {
          try {
            segmenter.segment(
              loadedImage,
              { keypoint: { x: normalizedX, y: normalizedY } },
              (segmentationResult) => resolve(segmentationResult)
            );
          } catch (error) {
            reject(error);
          }
        });

        const masks = result.confidenceMasks || [];
        if (masks.length === 0) {
          result.close?.();
          return null;
        }

        const openSitePhoto = photoStage !== "finished";
        const threshold = targetSurface === "ceiling" ? 0.48 : targetSurface === "wall" ? 0.45 : openSitePhoto ? 0.26 : 0.30;
        const maxCoverage = targetSurface === "ceiling" ? 0.24 : targetSurface === "wall" ? 0.95 : 0.50;
        const minCoverage = 0.004;
        let bestCandidate: Uint8Array | null = null;
        let bestCandidateScore = -Infinity;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext("2d")!;
        ctx.drawImage(loadedImage, 0, 0, width, height);
        const pixels = ctx.getImageData(0, 0, width, height).data;

        masks.forEach((candidateMask: any, index: number) => {
          const maskData = candidateMask.getAsFloat32Array();
          const maskWidth = candidateMask.width;
          const maskHeight = candidateMask.height;
          const binaryMask = new Uint8Array(width * height);

          for (let y = 0; y < height; y++) {
            const my = Math.min(maskHeight - 1, Math.floor((y / height) * maskHeight));
            const maskRow = my * maskWidth;
            const row = y * width;
            for (let x = 0; x < width; x++) {
              const mx = Math.min(maskWidth - 1, Math.floor((x / width) * maskWidth));
              if (maskData[maskRow + mx] >= threshold) {
                binaryMask[row + x] = 1;
              }
            }
          }

          const seedIdx = Math.floor(startY) * width + Math.floor(startX);
          if (binaryMask[seedIdx] !== 1) return;

          let cleaned = expandMaskByColorSimilarity(binaryMask, pixels, width, height, startX, startY);
          cleaned = fillPinholes(cleaned, width, height, 2);
          cleaned = protectDetailedObjects(cleaned, width, height, pixels, targetSurface === "ceiling" ? "ceiling" : "wall");
          
          cleaned = removeSmallMaskIslands(cleaned, width, height, targetSurface === "wall" ? 300 : 120);

          if (targetSurface === "ceiling") {
            for (let i = 0; i < cleaned.length; i++) {
              const y = Math.floor(i / width);
              if (y > height * 0.40) cleaned[i] = 0;
            }
          }

          const coverage = getMaskCoverage(cleaned);
          if (coverage < minCoverage || coverage > maxCoverage) return;

          const quality = result.qualityScores?.[index] ?? 0.5;
          const idealCoverage = targetSurface === "ceiling" ? 0.14 : targetSurface === "wall" ? 0.85 : 0.22;
          const score = quality - Math.abs(coverage - idealCoverage) * (targetSurface === "wall" ? 0.2 : 1.8);
          if (score > bestCandidateScore) {
            bestCandidateScore = score;
            bestCandidate = cleaned;
          }
        });

        result.close?.();
        return bestCandidate ? protectExistingPaint(bestCandidate, paintedAreas, selectedShade.code) : null;
      };

      const buildSiteCeilingMask = (width: number, height: number) => {
        if (!loadedImage) return null;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;

        ctx.drawImage(loadedImage, 0, 0, width, height);
        const pixels = ctx.getImageData(0, 0, width, height).data;
        const topY = Math.max(2, Math.floor(height * 0.08));
        let refR = 0;
        let refG = 0;
        let refB = 0;
        let samples = 0;

        for (let y = Math.max(2, topY - 8); y <= topY + 8; y += 2) {
          for (let x = Math.floor(width * 0.35); x < Math.floor(width * 0.65); x += 3) {
            const idx = (y * width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const luma = r * 0.299 + g * 0.587 + b * 0.114;
            if (luma < 60) continue;
            refR += r;
            refG += g;
            refB += b;
            samples++;
          }
        }

        if (samples === 0) return null;
        refR /= samples;
        refG /= samples;
        refB /= samples;

        const mask = new Uint8Array(width * height);
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        const dirs = [-width, width, -1, 1];
        const maxY = Math.floor(height * 0.42);
        let qHead = 0;
        let qTail = 0;

        const isCeilingPixel = (idx: number) => {
          const y = Math.floor(idx / width);
          if (y > maxY) return false;
          const p = idx * 4;
          const r = pixels[p];
          const g = pixels[p + 1];
          const b = pixels[p + 2];
          const luma = r * 0.299 + g * 0.587 + b * 0.114;
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          const colorDist = Math.abs(r - refR) + Math.abs(g - refG) + Math.abs(b - refB);
          return luma > 65 && chroma < 95 && colorDist < 145;
        };

        for (let x = Math.floor(width * 0.18); x < Math.floor(width * 0.82); x += 4) {
          const seed = topY * width + x;
          if (isCeilingPixel(seed) && !visited[seed]) {
            visited[seed] = 1;
            queue[qTail++] = seed;
          }
        }

        while (qHead < qTail) {
          const idx = queue[qHead++];
          const x = idx % width;
          mask[idx] = 1;

          for (const dir of dirs) {
            const nextIdx = idx + dir;
            if (nextIdx < 0 || nextIdx >= width * height) continue;
            if (dir === -1 && x === 0) continue;
            if (dir === 1 && x === width - 1) continue;
            if (visited[nextIdx] || !isCeilingPixel(nextIdx)) continue;
            visited[nextIdx] = 1;
            queue[qTail++] = nextIdx;
          }
        }

        const cleaned = removeSmallMaskIslands(
          fillPinholes(mask, width, height, 2),
          width,
          height,
          Math.max(60, Math.floor(width * height * 0.0008))
        );

        return maskHasPaint(cleaned) ? protectExistingPaint(cleaned, paintedAreas, selectedShade.code) : null;
      };

      const handleMagicWand = async (startX: number, startY: number) => {
        if (canvasWidth === 0 || canvasHeight === 0 || !loadedImage) return;

        const width = canvasWidth;
        const height = canvasHeight;

        if (interactiveStatus === "ready") {
          setAiStatus("processing");
          setAiMessage("Finding clicked surface...");
          try {
            const mediaPipeMask = await buildInteractiveMask(startX, startY, surfaceType, width, height);
            if (mediaPipeMask && maskHasPaint(mediaPipeMask)) {
              
              const validation = validateMask(mediaPipeMask, width, height, surfaceType);
              if (!validation.isValid) {
                setToast({ message: validation.reason || "Selection quality too low.", type: 'error' });
                setAiStatus("idle");
                return;
              }

              setPreviewMask(mediaPipeMask);
              setAiStatus("complete");
              setAiMessage("Selection preview active. Tap 'Apply' to confirm.");
              setTimeout(() => setAiMessage(''), 3500);
              return;
            }
            setAiMessage("That selection was too large or unclear. Click a flatter wall/ceiling area, or use Shape.");
            setTimeout(() => setAiMessage(''), 3500);
            setAiStatus("complete");
            return;
          } catch (error) {
            console.error("Interactive segmentation failed:", error);
            setInteractiveStatus("error");
          }
        }

        if ((surfaceType === "wall" || surfaceType === "ceiling") && aiMasks && aiMasks.length > 0) {
          const clickSeed = { x: startX, y: startY };
          const mask = buildAiSurfaceMask(surfaceType, width, height, clickSeed);
          if (mask) {
            const validation = validateMask(mask, width, height, surfaceType);
            if (!validation.isValid) {
              setToast({ message: validation.reason || "AI selection too broad.", type: 'error' });
              return;
            }
            setPreviewMask(mask);
            setAiMessage(`AI preview active. Tap 'Apply' to confirm.`);
            setTimeout(() => setAiMessage(''), 3000);
            return;
          }
        }
      };

      const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * canvasWidth;
        const y = ((e.clientY - rect.top) / rect.height) * canvasHeight;

        if (selectionMode === "polygon" && polygonPoints.length > 0) {
          setDragCurrent({ x, y });
        }

        if (!isDragging) return;

        if (selectionMode === "brush" && currentBrushMask && lastPoint) {
          // PERFORMANCE OPTIMIZATION: Mutate the mask instead of creating new ones
          drawLineOnMask(currentBrushMask, lastPoint.x, lastPoint.y, x, y, brushSize / 2, canvasWidth, canvasHeight);
          // Trigger a re-render by creating a shallow copy only after mutation if needed, 
          // but here we rely on the state update pattern below
          setCurrentBrushMask(new Uint8Array(currentBrushMask));
          setLastPoint({ x, y });
        } else {
          setDragCurrent({ x, y });
        }
      };

      const handleMouseUp = () => {
        if (!isDragging || canvasWidth === 0 || canvasHeight === 0) {
          setIsDragging(false);
          return;
        }

        if (selectionMode === "rectangle" && dragStart && dragCurrent) {
          const width = canvasWidth;
          const height = canvasHeight;
          const newMask = new Uint8Array(width * height);
          const xMin = Math.floor(Math.min(dragStart.x, dragCurrent.x));
          const xMax = Math.floor(Math.max(dragStart.x, dragCurrent.x));
          const yMin = Math.floor(Math.min(dragStart.y, dragCurrent.y));
          const yMax = Math.floor(Math.max(dragStart.y, dragCurrent.y));

          for (let y = yMin; y <= yMax; y++) {
            for (let x = xMin; x <= xMax; x++) {
              if (x >= 0 && x < width && y >= 0 && y < height) {
                newMask[y * width + x] = 1;
              }
            }
          }

          if (isEraser) {
            updatePaintedAreas(newMask);
          } else {
            updatePaintedAreas(newMask);
          }
        } else if (selectionMode === "brush" && currentBrushMask) {
          updatePaintedAreas(currentBrushMask);
          setCurrentBrushMask(null);
        }

        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
        setLastPoint(null);
      };

      const handleUndo = () => {
        const previous = paintHistory[paintHistory.length - 1];
        if (!previous) {
          setAiMessage("Nothing to undo yet.");
          setTimeout(() => setAiMessage(''), 1800);
          return;
        }
        setPaintedAreas(clonePaintedAreas(previous));
        setPaintHistory(prev => prev.slice(0, -1));
      };

      const [showClearConfirm, setShowClearConfirm] = useState(false);

      const handleClearAll = () => {
        if (paintedAreas.length === 0) return;
        if (!showClearConfirm) {
          setShowClearConfirm(true);
          // Auto-reset confirmation after 3 seconds
          setTimeout(() => setShowClearConfirm(false), 3000);
          return;
        }
        setPaintHistory(prev => [...prev.slice(-19), clonePaintedAreas(paintedAreas)]);
        setPaintedAreas([]);
        setShowClearConfirm(false);
      };

      const handleSaveProject = () => {
        if (!image) return;
        const result = saveProject();
        if (result.ok) {
          alert("All rooms saved successfully!");
        } else {
          alert(result.error);
        }
      };

      const handleLoadProject = (silent = false) => {
        const result = loadProject();
        if (!result.ok) {
          alert(result.error);
          return;
        }

        const data = result.data!;
        const restoredRooms = data.rooms;

        setRooms(restoredRooms);
        if (data.projectPalette) {
          setProjectPalette(data.projectPalette);
        }
        const active = restoredRooms.find((r: any) => r.id === data.activeRoomId) || (restoredRooms.length > 0 ? restoredRooms[0] : null);
        if (active) {
          setActiveRoomId(active.id);
          setImage(active.image);
          setPaintedAreas([...active.paintedAreas]);
          setPaintHistory([]);
          setIntensity(active.intensity);
          setTexturePreservation(active.texturePreservation);
          setCeilingBoundaryLine(active.ceilingBoundaryLine ?? null);
        }

        if (!silent) alert("Project loaded!");
      };

      const handleSelectShade = (shade: Shade) => {
        setSelectedShade(shade);
        setSearchQuery("");
        // Automatically add to palette if not already there
        if (!projectPalette.find(s => s.code === shade.code)) {
          setProjectPalette(prev => [...prev, shade]);
        }
      };

      const removeFromPalette = (code: string) => {
        setProjectPalette(prev => prev.filter(s => s.code !== code));
        if (selectedShade.code === code) {
          setSelectedShade(projectPalette.find(s => s.code !== code) || JSW_PAINTS_COLLECTIONS[0].shades[0]);
        }
      };

      const handleBook = () => {
        const { usedRooms, allUsedShades } = getProjectSummary();
        const message = usedRooms.length > 0
          ? buildProjectQuoteMessage(usedRooms, rooms.length, allUsedShades.length)
          : buildSelectedShadeMessage(selectedShade);
        
        if (message) {
          window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
        }
      };

      const desktopTools: {
        id: "brush" | "magic" | "polygon";
        icon: string;
        label: string;
        hint: string;
      }[] = [
        { id: 'brush', icon: 'brush', label: 'Brush', hint: 'Brush: paint small wall areas manually' },
        { id: 'magic', icon: 'auto_fix_high', label: 'Auto Select', hint: 'Auto Select: tap a wall area to detect it' },
        { id: 'polygon', icon: 'pentagon', label: 'Custom Shape', hint: 'Custom Shape: mark wall edges point by point' },
      ];

      const tooltipClass = "pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden font-inter text-text-primary">
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="z-50 w-full h-14 md:h-16 px-4 md:px-8 flex justify-between items-center bg-white border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center cursor-pointer"
            onClick={() => navigate('/')}
          >
            <span className="material-symbols-outlined text-white text-lg md:text-xl">home</span>
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-bold text-primary leading-none tracking-tight font-poppins">
              Colour Visualizer
            </h1>
            <p className="text-[10px] md:text-xs text-text-secondary font-medium uppercase tracking-wider">Vishnu Paints Darsi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowBefore(!showBefore)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all border ${showBefore ? 'bg-primary text-white border-primary' : 'bg-white text-text-primary border-border hover:bg-slate-50'}`}
          >
            <span className="material-symbols-outlined text-xs md:text-sm">{showBefore ? 'visibility_off' : 'compare'}</span>
            <span className="hidden sm:inline">{showBefore ? 'Original' : 'Compare'}</span>
            <span className="sm:hidden">{showBefore ? 'Orig.' : 'Comp.'}</span>
          </button>
          
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-text-primary border border-border text-[10px] md:text-xs font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
            onClick={() => handleLoadProject()}
          >
            <span className="material-symbols-outlined text-xs md:text-sm">open_in_browser</span>
            <span>Load</span>
          </button>

          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] md:text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all"
            onClick={handleSaveProject}
          >
            <span className="material-symbols-outlined text-xs md:text-sm">save</span>
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* --- LEFT TOOLBAR (Desktop Only) --- */}
        <aside className="hidden md:flex w-20 flex-col items-center py-6 gap-4 border-r border-border bg-white z-40">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Tools</span>

          {desktopTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              aria-label={tool.hint}
              title={tool.label}
              onClick={() => {
                setSelectionMode(tool.id);
                setIsEraser(false);
              }}
              className={`p-3 rounded-xl transition-all relative group ${selectionMode === tool.id && !isEraser ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-slate-100'}`}
            >
              <span className="material-symbols-outlined">{tool.icon}</span>
              <span className={tooltipClass}>{tool.hint}</span>
            </button>
          ))}
          
          <div className="w-8 h-px bg-border my-1" />
          
          <button
            type="button"
            aria-label="Eraser: remove painted areas"
            title="Eraser"
            onClick={() => setIsEraser(!isEraser)}
            className={`p-3 rounded-xl transition-all relative group ${isEraser ? 'bg-jsw-red text-white shadow-md' : 'text-text-secondary hover:bg-slate-100'}`}
          >
            <span className="material-symbols-outlined">{isEraser ? 'ink_eraser' : 'ink_eraser_off'}</span>
            <span className={tooltipClass}>Eraser: remove painted areas</span>
          </button>

          <div className="mt-auto flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => handleAutoSelectWall()}
              className="p-3 rounded-xl text-text-secondary hover:bg-slate-100 transition-all relative group"
              aria-label="Auto-select a wall surface"
              title="Auto Select Wall"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              <span className={tooltipClass}>Auto-select a wall surface</span>
            </button>
            <button
              type="button"
              onClick={() => handleUndo()}
              className="p-3 rounded-xl text-text-secondary hover:bg-slate-100 transition-all relative group"
              aria-label="Undo last paint action"
              title="Undo"
            >
              <span className="material-symbols-outlined">undo</span>
              <span className={tooltipClass}>Undo last paint action</span>
            </button>
          </div>
        </aside>

        {/* --- CENTER CANVAS AREA --- */}
        <div className="flex-1 relative bg-slate-50 flex flex-col overflow-hidden">
          <VisualizerCanvas
            image={image}
            loadedImage={loadedImage}
            selectedShade={selectedShade}
            showBefore={showBefore}
            texturePreservation={texturePreservation}
            intensity={intensity}
            paintedAreas={paintedAreas}
            isDragging={isDragging}
            dragStart={dragStart}
            dragCurrent={dragCurrent}
            selectionMode={selectionMode}
            brushSize={brushSize}
            currentBrushMask={currentBrushMask}
            polygonPoints={polygonPoints}
            zoom={zoom}
            onZoomIn={() => setZoom(z => Math.min(3, z + 0.2))}
            onZoomOut={() => setZoom(z => Math.max(0.5, z - 0.2))}
            onZoomReset={() => setZoom(1)}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onFillPolygon={handleFillPolygon}
            aiStatus={aiStatus}
            previewMask={previewMask}
          />

          {/* Preview Confirmation Overlay */}
          <AnimatePresence>
            {previewMask && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-primary/20"
              >
                <div className="flex items-center gap-3 px-4 border-r border-border">
                  <div className="w-8 h-8 rounded-full border shadow-sm" style={{ backgroundColor: selectedShade.code }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Apply Colour</span>
                    <span className="text-xs font-bold text-primary truncate max-w-[120px]">{selectedShade.name}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pr-2">
                  <button 
                    onClick={handleCancelPreview}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-slate-100 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    <span>Cancel</span>
                  </button>
                  <button 
                    onClick={handleApplyPreview}
                    className="px-6 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">done</span>
                    <span>Apply Paint</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Zoom Slider Overlay (Bottom Left) */}
          <div className="hidden md:block absolute bottom-6 left-6 z-20">
             {/* Slider is in the Canvas component but we can add more overlay tools here if needed */}
          </div>
        </div>

        {/* --- RIGHT SIDEBAR (Desktop Only) --- */}
        <aside className="hidden md:flex w-[380px] flex-col border-l border-border bg-white z-40">
          <div className="flex border-b border-border">
              {[
                { id: 'shades', icon: 'palette', label: 'Shades' },
                { id: 'projects', icon: 'folder_special', label: 'History' },
                { id: 'calculator', icon: 'calculate', label: 'Estimate' },
                { id: 'quote', icon: 'description', label: 'Quote' }
              ].map((tab) => (

                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id as any)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${activePanel === tab.id ? 'bg-slate-50 text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activePanel === 'shades' && (
              <div className="h-full flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-border flex items-center gap-4 shrink-0">
                  <div 
                    className="w-12 h-12 rounded-full shadow-inner border border-border"
                    style={{ backgroundColor: selectedShade.code }}
                  />
                  <div>
                    <h3 className="text-text-primary font-bold text-sm">{selectedShade.name}</h3>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">JSW · {selectedShade.jswCode}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ShadePickerPanel 
                    selectedShade={selectedShade} 
                    onShadeSelect={handleSelectShade}
                  />
                </div>
              </div>
            )}

            {activePanel === 'projects' && (
              <ProjectManager 
                selectedShade={selectedShade} 
                onLoadConsultation={setSelectedShade}
                calculatorSummary={lastCalculatorSummary}
              />
            )}

            {activePanel === 'calculator' && (
              <PaintCalculator 
                onAddToQuote={(s) => {
                  setLastCalculatorSummary(s);
                  setActivePanel('quote');
                  setToast({ message: "Estimate added to quote!", type: 'success' });
                  setTimeout(() => setToast(null), 2000);
                }}
              />
            )}

            {activePanel === 'quote' && (
              <QuotePanel 
                rooms={rooms}
                activeRoomId={activeRoomId}
                currentPaintedAreas={paintedAreas}
                lastCalculatorSummary={lastCalculatorSummary}
              />
            )}

          </div>

          <div className="p-6 bg-slate-50 border-t border-border space-y-4 shrink-0">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                <span>Paint Intensity</span>
                <span className="text-primary">{intensity}%</span>
              </div>
              <input 
                type="range" min="30" max="100" 
                value={intensity} 
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                <span>Texture Detail</span>
                <span className="text-primary">{texturePreservation}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={texturePreservation} 
                onChange={(e) => setTexturePreservation(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </aside>

        {/* --- MOBILE BOTTOM SHEET (Mobile Only) --- */}
        <div className="md:hidden z-40 bg-white border-t border-border flex flex-col shadow-2xl">
          {/* Tab Content Area */}
          <div className="h-[30vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
            {activeMobileTab === 'tools' && (
              <div className="p-4 grid grid-cols-4 gap-3 animate-slide-up">
                {[
                  { id: 'brush', icon: 'brush', label: 'Brush' },
                  { id: 'magic', icon: 'auto_fix_high', label: 'Auto' },
                  { id: 'polygon', icon: 'pentagon', label: 'Shape' },
                  { id: 'undo', icon: 'undo', label: 'Undo', action: () => handleUndo() },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      if (tool.action) tool.action();
                      else {
                        setSelectionMode(tool.id as any);
                        setIsEraser(false);
                      }
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${selectionMode === tool.id && !isEraser && !tool.action ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border'}`}
                  >
                    <span className="material-symbols-outlined">{tool.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{tool.label}</span>
                  </button>
                ))}
                
                <button
                  onClick={() => setIsEraser(!isEraser)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${isEraser ? 'bg-jsw-red text-white border-jsw-red' : 'bg-white text-text-secondary border-border'}`}
                >
                  <span className="material-symbols-outlined">{isEraser ? 'ink_eraser' : 'ink_eraser_off'}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Eraser</span>
                </button>

                <button
                  onClick={() => handleAutoSelectWall()}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-white text-text-secondary border-border"
                >
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Auto Select</span>
                </button>

                <button
                  onClick={() => handleClearAll()}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-white text-text-secondary border-border"
                >
                  <span className="material-symbols-outlined">delete_sweep</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Clear</span>
                </button>
                
                {/* Mobile Brush Size Slider if brush active */}
                {selectionMode === 'brush' && (
                  <div className="col-span-4 mt-2 px-2 pb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold text-text-secondary uppercase">Brush Size</span>
                      <span className="text-[9px] font-bold text-primary">{brushSize}px</span>
                    </div>
                    <input 
                      type="range" min="4" max="80" 
                      value={brushSize} 
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-primary"
                    />
                  </div>
                )}
              </div>
            )}

            {activeMobileTab === 'colours' && (
              <div className="h-full flex flex-col animate-slide-up">
                <div className="px-4 py-2 bg-slate-100 flex items-center gap-3 shrink-0">
                  <div className="w-8 h-8 rounded-full border border-white" style={{ backgroundColor: selectedShade.code }} />
                  <span className="text-xs font-bold truncate">{selectedShade.name}</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ShadePickerPanel 
                    selectedShade={selectedShade} 
                    onShadeSelect={handleSelectShade}
                  />
                </div>
              </div>
            )}

            {activeMobileTab === 'rooms' && (
              <div className="p-4 flex flex-col gap-4 animate-slide-up">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar-h">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleSwitchRoom(room.id)}
                      className={`shrink-0 flex flex-col items-center gap-2 p-1 rounded-xl border transition-all ${activeRoomId === room.id ? 'border-primary bg-soft-blue/20' : 'border-border bg-white'}`}
                    >
                      <img src={room.image} className="w-16 h-16 rounded-lg object-cover" />
                      <span className="text-[9px] font-bold truncate max-w-[64px] uppercase">{room.name}</span>
                    </button>
                  ))}
                  
                  <label className="shrink-0 w-16 h-[92px] flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-white cursor-pointer">
                    <input type="file" className="hidden" multiple onChange={handleAddRoom} />
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span className="text-[9px] font-bold uppercase">Add</span>
                  </label>
                </div>
                
                <button 
                  onClick={handleAutoSelectWall}
                  disabled={isProcessingAll}
                  className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                  <span>Auto Select Wall</span>
                </button>
              </div>
            )}

            {activeMobileTab === 'estimate' && (
              <div className="p-0 animate-slide-up">
                <PaintCalculator 
                  onAddToQuote={(s) => {
                    setLastCalculatorSummary(s);
                    setActiveMobileTab('quote');
                    setToast({ message: "Estimate added to quote!", type: 'success' });
                    setTimeout(() => setToast(null), 2000);
                  }}
                />

              </div>
            )}

            {activeMobileTab === 'quote' && (
              <div className="h-full animate-slide-up">
                <QuotePanel 
                  rooms={rooms}
                  activeRoomId={activeRoomId}
                  currentPaintedAreas={paintedAreas}
                  lastCalculatorSummary={lastCalculatorSummary}
                />
              </div>
            )}
          </div>

          {/* Bottom Nav Bar */}
          <nav className="h-14 flex items-center border-t border-border bg-white">
            {[
              { id: 'tools', icon: 'construction', label: 'Tools' },
              { id: 'colours', icon: 'palette', label: 'Colours' },
              { id: 'rooms', icon: 'imagesmode', label: 'Rooms' },
              { id: 'estimate', icon: 'calculate', label: 'Estimate' },
              { id: 'quote', icon: 'description', label: 'Quote' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMobileTab(tab.id as any)}
                className={`visualizer-tab-btn ${activeMobileTab === tab.id ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* --- DESKTOP BOTTOM ROOM BAR (Desktop Only) --- */}
        <nav className="hidden md:flex fixed bottom-4 left-24 right-[400px] z-50 h-20 bg-white/90 backdrop-blur-sm rounded-2xl border border-border shadow-lg justify-between items-center px-6 pointer-events-auto">
          <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar-h py-2 flex-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleSwitchRoom(room.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all border ${activeRoomId === room.id ? 'bg-primary text-white border-primary' : 'bg-transparent text-text-secondary border-transparent hover:bg-slate-50'}`}
              >
                <img src={room.image} className="w-8 h-8 rounded-full object-cover shadow-sm" />
                <span className="text-xs font-bold whitespace-nowrap">{room.name}</span>
              </button>
            ))}
            
            <label className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-border text-text-secondary hover:bg-slate-50 cursor-pointer transition-all">
              <input type="file" className="hidden" multiple onChange={handleAddRoom} />
              <span className="material-symbols-outlined text-sm">add</span>
              <span className="text-xs font-bold">Add View</span>
            </label>
          </div>

          <div className="w-px h-8 bg-border mx-4" />
          
          <button 
            onClick={() => handleAutoSelectWall()}
            disabled={isProcessingAll}
            className="btn btn-primary px-6 py-3 rounded-full flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">auto_fix_high</span>
            <span>Auto Select Wall</span>
          </button>
        </nav>
      </main>

      {/* --- NOTIFICATIONS / TOASTS --- */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 md:bottom-32 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className={`px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 ${toast.type === 'error' ? 'bg-jsw-red text-white border-jsw-red' : 'bg-success text-white border-success'}`}>
              <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}</span>
              <p className="text-sm font-bold tracking-tight">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
