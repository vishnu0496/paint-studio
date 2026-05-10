import { SegmentationInput, SegmentationResult, SegmentationFailure, SegmentationStatus } from "./types";

export interface SegmentationService {
  status: SegmentationStatus;
  initialize(): Promise<void>;
  segmentImage(input: SegmentationInput): Promise<SegmentationResult | SegmentationFailure>;
  onStatusChange?: (status: SegmentationStatus, message?: string, progress?: number) => void;
  dispose?(): void;
}
