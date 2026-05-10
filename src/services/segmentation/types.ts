export type SurfaceLabel = "wall" | "ceiling" | "floor" | "object" | "unknown";
export type SegmentationStatus = "idle" | "loading" | "ready" | "processing" | "error" | "complete";

export interface SurfaceMask {
  id: string;
  label: SurfaceLabel;
  confidence: number;
  width: number;
  height: number;
  maskData: Uint8Array;
}

export interface SegmentationResult {
  status: "complete";
  masks: SurfaceMask[];
  message?: string;
}

export interface SegmentationFailure {
  status: "error";
  error: string;
  fallbackAvailable: boolean;
}

export interface SegmentationProgress {
  status: "loading" | "processing";
  message?: string;
  progress?: number;
}

export type SegmentationEvent = SegmentationResult | SegmentationFailure | SegmentationProgress;

export interface SegmentationInput {
  image: string;
  targetWidth: number;
  targetHeight: number;
}
