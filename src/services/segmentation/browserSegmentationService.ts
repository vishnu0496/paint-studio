import { SegmentationService } from "./segmentationService";
import { 
  SegmentationInput, 
  SegmentationResult, 
  SegmentationFailure, 
  SegmentationStatus, 
  SurfaceMask, 
  SurfaceLabel 
} from "./types";

export class BrowserSegmentationService implements SegmentationService {
  private worker: Worker | null = null;
  status: SegmentationStatus = "idle";
  onStatusChange?: (status: SegmentationStatus, message?: string, progress?: number) => void;

  async initialize(): Promise<void> {
    if (this.worker) return;

    this.status = "loading";
    this.onStatusChange?.(this.status, "Initializing AI worker...");

    try {
      this.worker = new Worker(new URL('../../workers/segmentationWorker.ts', import.meta.url), { 
        type: 'module' 
      });

      return new Promise((resolve, reject) => {
        if (!this.worker) return reject(new Error("Worker failed to initialize"));

        this.worker.onmessage = (event) => {
          const { status, message, progress, error } = event.data;

          if (status === 'progress') {
            this.onStatusChange?.('loading', message, progress / 100);
            return;
          }

          if (status === 'ready') {
            this.status = "ready";
            this.onStatusChange?.(this.status, "AI model ready");
            resolve();
            return;
          }

          if (status === 'error') {
            this.status = "error";
            this.onStatusChange?.(this.status, error);
            reject(new Error(error));
            return;
          }

          if (message) {
             this.onStatusChange?.(this.status, message);
          }
        };

        this.worker.postMessage({ type: 'INIT' });
      });
    } catch (err: any) {
      this.status = "error";
      this.onStatusChange?.(this.status, err.message);
      throw err;
    }
  }

  async segmentImage(input: SegmentationInput): Promise<SegmentationResult | SegmentationFailure> {
    if (!this.worker || this.status !== "ready" && this.status !== "complete") {
      return {
        status: "error",
        error: "Segmentation service not ready",
        fallbackAvailable: true
      };
    }

    return new Promise((resolve) => {
      if (!this.worker) return resolve({ 
        status: "error", 
        error: "Worker lost", 
        fallbackAvailable: true 
      });

      this.worker.onmessage = (event) => {
        const { status, message, results, error, progress } = event.data;

        if (status === 'progress') {
           this.onStatusChange?.('processing', message, progress / 100);
           return;
        }

        if (status === 'processing') {
          this.status = "processing";
          this.onStatusChange?.(this.status, message);
          return;
        }

        if (status === 'complete' && results) {
          this.status = "complete";
          const masks: SurfaceMask[] = results.map((res: any, index: number) => ({
            id: `mask-${index}-${res.label}`,
            label: this.mapLabel(res.label),
            confidence: res.score,
            width: res.width,
            height: res.height,
            maskData: res.maskData
          }));

          this.onStatusChange?.(this.status, "Analysis complete");
          resolve({ status: "complete", masks });
        } else if (status === 'error') {
          this.status = "error";
          this.onStatusChange?.(this.status, error);
          resolve({ status: "error", error, fallbackAvailable: true });
        }
      };

      this.worker.postMessage({
        type: 'SEGMENT',
        payload: {
          image: input.image,
          targetWidth: Math.floor(input.targetWidth),
          targetHeight: Math.floor(input.targetHeight)
        }
      });
    });
  }

  private mapLabel(label: string): SurfaceLabel {
    const wallLabels = ["wall", "fence", "partition"];
    const ceilingLabels = ["ceiling"];
    const floorLabels = ["floor", "rug", "carpet"];
    
    if (wallLabels.includes(label)) return "wall";
    if (ceilingLabels.includes(label)) return "ceiling";
    if (floorLabels.includes(label)) return "floor";
    
    return "object";
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.status = "idle";
  }
}
