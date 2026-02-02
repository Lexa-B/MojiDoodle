/**
 * Types for character segmentation in Japanese handwriting recognition.
 *
 * Uses a deformable mesh grid approach where:
 * - Density valleys in stroke data determine character boundaries
 * - Cells are quadrilaterals with shared vertices (like epithelial tissue)
 * - Vertices deform to organically fit stroke content
 * - Grid enforces size uniformity (no cell > 1.75x another)
 *
 * Reading order: right-to-left columns, top-to-bottom within columns
 * (standard Japanese vertical writing)
 */

export interface Point {
  x: number;
  y: number;
  t: number; // timestamp relative to drawing start
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface StrokeWithBounds {
  index: number;
  stroke: Point[];
  bounds: BoundingBox;
}

/**
 * A vertex in the mesh grid.
 * Vertices are shared between adjacent cells.
 */
export interface Vertex {
  x: number;
  y: number;
}

/**
 * A cell in the mesh grid representing a character boundary.
 * Cells are quadrilaterals with shared vertices.
 */
export interface GridCell {
  column: number;           // Right-to-left (0 = rightmost)
  row: number;              // Top-to-bottom within column
  vertexIndices: [number, number, number, number];  // TL, TR, BR, BL indices into vertex array
  strokeIndices: number[];  // Indices of strokes belonging to this cell
}

/**
 * A deformable mesh grid for character segmentation.
 * The grid adapts to stroke density and enforces size uniformity.
 */
export interface MeshGrid {
  vertices: Vertex[];       // Shared vertex pool
  cells: GridCell[];        // Character cells
  columns: number;          // Number of columns (right-to-left)
  maxRows: number;          // Maximum rows in any column
  estimatedCharSize: number;
}

/**
 * Result of segmentation analysis.
 */
export interface SegmentationResult {
  mesh: MeshGrid;
  estimatedCharSize: number;
  gridColumns: number;
}
