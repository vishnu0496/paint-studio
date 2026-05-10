import { SegmentationService } from "./segmentationService";
import { SegmentationInput, SegmentationResult, SegmentationFailure, SegmentationStatus } from "./types";

export class FallbackSegmentationService implements SegmentationService {
  status: SegmentationStatus = "idle";
  onStatusChange?: (status: SegmentationStatus, message?: string, progress?: number) => void;

  async initialize(): Promise<void> {
    this.status = "ready";
    this.onStatusChange?.(this.status);
  }

  async segmentImage(_input: SegmentationInput): Promise<SegmentationResult | SegmentationFailure> {
    return {
      status: "error",
      error: "AI detection is unavailable. Use Brush or Polygon Select.",
      fallbackAvailable: true
    };
  }

  dispose(): void {
    this.status = "idle";
  }
}
