/**
 * Types for collecting segmentation training data.
 *
 * Captures workbook sessions for building a segmentation model.
 * Each sample includes raw strokes, segmentation results, recognition results,
 * and ground truth (when available).
 */

import { Point, DividerLine } from './segmentation.types';

/**
 * A selection lasso for manual segmentation (future feature).
 * Users draw polygons around strokes belonging to one character.
 */
export interface SelectionLasso {
  /** Polygon points defining the lasso boundary */
  points: { x: number; y: number }[];
  /** Which strokes are enclosed by this lasso */
  strokeIndices: number[];
}

/**
 * Ground truth stroke-to-character assignment.
 * Either inferred from successful recognition or manually verified.
 */
export interface GroundTruthEntry {
  /** Which strokes belong to this character */
  strokeIndices: number[];
  /** Expected character (from answers) */
  character: string;
}

/**
 * A single training sample from a workbook session.
 * Collected after every CHECK press for building segmentation models.
 */
export interface CollectionSample {
  // 1. Raw input - strokes ordered by input order
  strokes: Point[][];

  // 2. Canvas dimensions for normalization
  canvasWidth: number;
  canvasHeight: number;

  // 3. Segmentation lines (algorithm output)
  segmentation: {
    columnDividers: DividerLine[];
    rowDividers: DividerLine[][];
  } | null;  // null for single-char cards

  // 4. Selection lassos - manual segmentation (deferred feature)
  // One lasso per character the user intended to write
  // May differ from answers length (learning app - user might not know char count)
  selectionLassos: SelectionLasso[] | null;

  // 5. Card answers list
  answers: string[];

  // 6. Detected character lists - API recognition results per cell
  // For single-char: [[{char, score}, ...]] (one cell)
  // For multi-char: [[cell0 results], [cell1 results], ...]
  recognitionResults: { character: string; score: number }[][] | null;

  // 7. Ground truth stroke-to-character assignments
  groundTruth: GroundTruthEntry[] | null;  // null until manually verified or inferred from success

  // 8. Success indicator
  success: boolean;  // Did recognition match an answer?

  // Metadata
  id: string;        // UUID for this entry
  userId: string;    // UUID for the user (persisted across sessions)
  cardId: string;    // Which card was being practiced
  timestamp: number; // When collected (for ordering/debugging)
}
