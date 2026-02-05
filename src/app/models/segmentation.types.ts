/**
 * Types for character segmentation in Japanese handwriting recognition.
 *
 * Uses a two-pass approach:
 * 1. Column segmentation: Find vertical dividers between columns
 * 2. Row segmentation: Within each column, find horizontal dividers between characters
 *
 * Dividers are simple lines (max 10° off vertical/horizontal).
 */

export interface Point {
  x: number;
  y: number;
  t: number; // timestamp relative to drawing start
}

/**
 * Bounding box and timing metadata for a single stroke.
 */
export interface StrokeBounds {
  strokeIndex: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

/**
 * A dividing line between columns or rows.
 * Column dividers: x = slope * y + intercept (mostly vertical)
 * Row dividers: y = slope * x + intercept (mostly horizontal)
 */
export interface DividerLine {
  slope: number;      // For columns: dx/dy, for rows: dy/dx
  intercept: number;  // x-intercept for columns, y-intercept for rows
  start: number;      // Start coordinate (y for columns, x for rows)
  end: number;        // End coordinate
}

/**
 * A cell in the segmentation grid representing a single character.
 */
export interface GridCell {
  column: number;           // 0 = rightmost (Japanese reading order)
  row: number;              // 0 = topmost
  strokeIndices: number[];  // Strokes belonging to this cell
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * The complete segmentation grid with dividers and cells.
 */
export interface SegmentationGrid {
  columnDividers: DividerLine[];    // Vertical-ish lines between columns
  rowDividers: DividerLine[][];     // Horizontal-ish lines within each column
  cells: GridCell[];
  columns: number;
  maxRows: number;
}

/**
 * Result of segmentation analysis.
 */
export interface SegmentationResult {
  grid: SegmentationGrid;
  estimatedCharHeight: number;
  estimatedCharWidth: number;
}

/**
 * Configurable thresholds for segmentation tuning.
 */
export interface SegmentationConfig {
  // Column detection
  minColumnGapRatio: number;     // Min gap as fraction of char width (default: 0.25)
  maxColumnAngle: number;        // Max degrees from vertical (default: 10)

  // Row detection
  minRowGapRatio: number;        // Min gap as fraction of char height (default: 0.25)
  maxRowAngle: number;           // Max degrees from horizontal (default: 10)

  // Character size estimation
  charSizeMultiplier: number;    // Multiply median stroke size by this (default: 2.0)
  minCharSizeRatio: number;      // Min char size as fraction of canvas (default: 0.08)
  maxCharSizeRatio: number;      // Max char size as fraction of canvas (default: 0.40)
}

/**
 * A group of strokes that should not be split by segmentation.
 * Used when user draws a lasso around strokes to keep them together.
 */
export interface ProtectedGroup {
  strokeIndices: number[];
}
