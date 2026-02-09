/**
 * Types for collecting segmentation training data (v2).
 *
 * Uses mojidoodle-algo-segmenter output instead of raw divider lines.
 * Each sample includes raw strokes, character assignments, recognition results,
 * and ground truth (when available).
 */

import { Point } from 'mojidoodle-algo-segmenter';

/**
 * A selection lasso for manual segmentation.
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

/** Character assignment from segmenter output. */
export interface CharacterAssignment {
  /** Reading-order index (0 = first character). */
  characterIndex: number;
  /** Which input strokes belong to this character. */
  strokeIndices: number[];
  /** Bounding box of this character's strokes. */
  bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
}

/**
 * v2 training sample — uses module output instead of raw divider lines.
 * No SVG or divider line data — just character assignments.
 */
export interface CollectionSampleV2 {
  version: 2;

  // Raw input
  strokes: Point[][];
  canvasWidth: number;
  canvasHeight: number;

  // Segmentation output: character assignments only (no divider lines, no SVG)
  characterAssignments: CharacterAssignment[];

  // Lasso data
  selectionLassos: SelectionLasso[] | null;

  // Card & recognition
  answers: string[];
  recognitionResults: { character: string; score: number }[][] | null;
  groundTruth: GroundTruthEntry[] | null;
  success: boolean;

  // Metadata
  id: string;
  userId: string;
  cardId: string;
  timestamp: number;
}
