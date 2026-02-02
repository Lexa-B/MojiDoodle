import { Injectable } from '@angular/core';
import {
  Point,
  BoundingBox,
  StrokeWithBounds,
  Vertex,
  GridCell,
  MeshGrid,
  SegmentationResult,
} from '../models/segmentation.types';

/**
 * Character segmentation service using density-based deformable mesh grid.
 *
 * PURPOSE:
 * Segments handwritten Japanese text into individual character cells for recognition.
 * Handles vertical writing (top-to-bottom, right-to-left columns).
 *
 * APPROACH:
 * Instead of clustering strokes (which fails for い, だ, etc.), this uses density
 * analysis to find natural gaps between characters:
 *
 * 1. Estimate character size from stroke dimensions and gaps
 * 2. Create density histograms along X and Y axes
 * 3. Find valleys (low-density areas) that indicate character boundaries
 * 4. Build a unified mesh grid with shared vertices between cells
 * 5. Deform vertices to organically fit stroke content
 *
 * VALIDATION:
 * - No empty interior cells (cells between content are invalid)
 * - Size uniformity: all cells within 1.75x of each other
 * - If validation fails, simplify by removing valleys
 *
 * MESH STRUCTURE:
 * ```
 * V0----V1----V2
 * |  C0  |  C1  |    Vertices are shared (V1 belongs to C0 and C1)
 * V3----V4----V5    Cells are quadrilaterals that can deform
 * |  C2  |  C3  |    Column 0 = rightmost (Japanese reading order)
 * V6----V7----V8
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class CharacterSegmentationService {
  // Character size bounds as percentage of canvas height
  private readonly MIN_CHAR_SIZE_RATIO = 0.06;
  private readonly MAX_CHAR_SIZE_RATIO = 0.30;

  // Density histogram parameters
  private readonly DENSITY_BIN_DIVISOR = 10; // More bins = finer resolution
  private readonly VALLEY_THRESHOLD_RATIO = 0.5; // More sensitive - valleys below 50% of max

  // Size constraints
  private readonly MIN_CELL_SIZE_RATIO = 0.25; // Smaller minimum = more divisions allowed
  private readonly MAX_CELL_SIZE_RATIO = 3.0;

  // Mesh deformation parameters
  private readonly CELL_PADDING = 10;
  private readonly DEFORM_ITERATIONS = 5;
  private readonly DEFORM_STRENGTH = 0.6;

  /**
   * Segment strokes into a mesh grid of character cells.
   */
  segment(strokes: Point[][], canvasWidth: number, canvasHeight: number): SegmentationResult {
    if (strokes.length === 0) {
      return {
        mesh: { vertices: [], cells: [], columns: 0, maxRows: 0, estimatedCharSize: 0 },
        estimatedCharSize: 0,
        gridColumns: 0,
      };
    }

    // Step 1: Calculate bounding boxes for each stroke
    const strokesWithBounds = this.calculateStrokeBounds(strokes);

    // Step 2: Estimate character size
    const estimatedCharSize = this.estimateCharacterSize(strokesWithBounds, canvasHeight);

    // Step 3: Find grid divisions via density analysis
    let { columnBoundaries, rowBoundaries } = this.findGridDivisions(
      strokesWithBounds,
      estimatedCharSize
    );

    // Step 4: Create unified mesh grid with shared vertices
    let mesh = this.createDeformableMesh(
      columnBoundaries,
      rowBoundaries,
      strokesWithBounds,
      estimatedCharSize
    );

    // Step 5: Assign strokes to cells
    this.assignStrokesToCells(mesh, strokesWithBounds);

    // Step 6: Validate mesh - no empty interior cells, and uniform cell sizes
    // If invalid, simplify the grid by removing valleys until valid
    let attempts = 0;
    while (attempts < 10 && !this.isValidMesh(mesh)) {
      const simplified = this.simplifyGrid(columnBoundaries, rowBoundaries, mesh, strokesWithBounds);
      columnBoundaries = simplified.columnBoundaries;
      rowBoundaries = simplified.rowBoundaries;

      // Recreate mesh with simplified boundaries
      mesh = this.createDeformableMesh(columnBoundaries, rowBoundaries, strokesWithBounds, estimatedCharSize);
      this.assignStrokesToCells(mesh, strokesWithBounds);
      attempts++;
    }

    // Step 7: Deform mesh vertices to organically fit content
    this.deformMeshToContent(mesh, strokesWithBounds);

    return {
      mesh,
      estimatedCharSize,
      gridColumns: mesh.columns,
    };
  }

  /**
   * Check if mesh is valid: no empty interior cells, and uniform cell sizes.
   */
  private isValidMesh(mesh: MeshGrid): boolean {
    if (this.hasEmptyInteriorCells(mesh)) return false;
    if (!this.hasSizeUniformity(mesh)) return false;
    return true;
  }

  /**
   * Check that all cells with content are within 2x size of each other.
   */
  private hasSizeUniformity(mesh: MeshGrid): boolean {
    const cellSizes: number[] = [];

    for (const cell of mesh.cells) {
      if (cell.strokeIndices.length === 0) continue; // Skip empty cells

      const [tl, tr, br, bl] = cell.vertexIndices.map(i => mesh.vertices[i]);
      const width = Math.max(Math.abs(tr.x - tl.x), Math.abs(br.x - bl.x));
      const height = Math.max(Math.abs(bl.y - tl.y), Math.abs(br.y - tr.y));
      const size = Math.max(width, height); // Use larger dimension
      cellSizes.push(size);
    }

    if (cellSizes.length <= 1) return true; // Single cell or no cells is fine

    const minSize = Math.min(...cellSizes);
    const maxSize = Math.max(...cellSizes);

    // All cells should be close in size (within 1.75x)
    return maxSize <= minSize * 1.75;
  }

  /**
   * Check if mesh has any empty cells that are BETWEEN content.
   * An empty cell is problematic if there's content on opposite sides of it.
   */
  private hasEmptyInteriorCells(mesh: MeshGrid): boolean {
    // Build a map of which cells have strokes
    const cellHasContent = new Map<string, boolean>();
    for (const cell of mesh.cells) {
      cellHasContent.set(`${cell.column},${cell.row}`, cell.strokeIndices.length > 0);
    }

    for (const cell of mesh.cells) {
      if (cell.strokeIndices.length > 0) continue; // Has strokes, OK

      // Check if there's content on opposite sides (left-right or top-bottom)
      // If so, this empty cell is "interior" and shouldn't exist

      // Check left-right: content to the left AND right
      let hasContentLeft = false;
      let hasContentRight = false;
      for (let c = 0; c < cell.column; c++) {
        if (cellHasContent.get(`${c},${cell.row}`)) hasContentLeft = true;
      }
      for (let c = cell.column + 1; c < mesh.columns; c++) {
        if (cellHasContent.get(`${c},${cell.row}`)) hasContentRight = true;
      }

      // Check top-bottom: content above AND below
      let hasContentAbove = false;
      let hasContentBelow = false;
      for (let r = 0; r < cell.row; r++) {
        if (cellHasContent.get(`${cell.column},${r}`)) hasContentAbove = true;
      }
      for (let r = cell.row + 1; r < mesh.maxRows; r++) {
        if (cellHasContent.get(`${cell.column},${r}`)) hasContentBelow = true;
      }

      // Empty cell with content on opposite sides = bad
      if ((hasContentLeft && hasContentRight) || (hasContentAbove && hasContentBelow)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Simplify grid by removing a valley to eliminate empty interior cells.
   */
  private simplifyGrid(
    columnBoundaries: number[],
    rowBoundaries: number[],
    mesh: MeshGrid,
    strokes: StrokeWithBounds[]
  ): { columnBoundaries: number[]; rowBoundaries: number[] } {
    // Find which valleys create empty interior cells and remove one

    // Try removing column valleys first (interior only, not edges)
    if (columnBoundaries.length > 2) {
      for (let i = 1; i < columnBoundaries.length - 1; i++) {
        const newColBounds = [...columnBoundaries.slice(0, i), ...columnBoundaries.slice(i + 1)];
        const testMesh = this.createDeformableMesh(newColBounds, rowBoundaries, strokes, mesh.estimatedCharSize);
        this.assignStrokesToCells(testMesh, strokes);
        if (!this.hasEmptyInteriorCells(testMesh)) {
          return { columnBoundaries: newColBounds, rowBoundaries };
        }
      }
    }

    // Try removing row valleys
    if (rowBoundaries.length > 2) {
      for (let i = 1; i < rowBoundaries.length - 1; i++) {
        const newRowBounds = [...rowBoundaries.slice(0, i), ...rowBoundaries.slice(i + 1)];
        const testMesh = this.createDeformableMesh(columnBoundaries, newRowBounds, strokes, mesh.estimatedCharSize);
        this.assignStrokesToCells(testMesh, strokes);
        if (!this.hasEmptyInteriorCells(testMesh)) {
          return { columnBoundaries, rowBoundaries: newRowBounds };
        }
      }
    }

    // If still has issues, remove any interior valley
    if (columnBoundaries.length > 2) {
      return {
        columnBoundaries: [columnBoundaries[0], columnBoundaries[columnBoundaries.length - 1]],
        rowBoundaries
      };
    }
    if (rowBoundaries.length > 2) {
      return {
        columnBoundaries,
        rowBoundaries: [rowBoundaries[0], rowBoundaries[rowBoundaries.length - 1]]
      };
    }

    return { columnBoundaries, rowBoundaries };
  }

  private calculateStrokeBounds(strokes: Point[][]): StrokeWithBounds[] {
    return strokes.map((stroke, index) => ({
      index,
      stroke,
      bounds: this.calculateBoundingBox(stroke),
    }));
  }

  private calculateBoundingBox(points: Point[]): BoundingBox {
    if (points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    const width = maxX - minX;
    const height = maxY - minY;

    return {
      minX, minY, maxX, maxY, width, height,
      centerX: minX + width / 2,
      centerY: minY + height / 2,
    };
  }

  private estimateCharacterSize(strokes: StrokeWithBounds[], canvasHeight: number): number {
    if (strokes.length === 0) return canvasHeight * 0.15;

    // DON'T use overall extent - that fails for multiple characters
    // Instead, look at individual stroke sizes and find a reasonable character size

    // Collect stroke extents (max of width/height for each stroke)
    const strokeExtents = strokes.map(s => Math.max(s.bounds.width, s.bounds.height));

    // Sort and use median-ish value (avoid outliers from tiny dots or huge strokes)
    strokeExtents.sort((a, b) => a - b);
    const medianIdx = Math.floor(strokeExtents.length * 0.6); // Slightly above median
    const typicalStrokeSize = strokeExtents[medianIdx] || strokeExtents[0];

    // A character is typically 1.5-2x the size of its largest stroke
    let estimatedSize = typicalStrokeSize * 2;

    // Also consider gaps between strokes - large gaps suggest separate characters
    if (strokes.length > 1) {
      const gaps = this.findStrokeGaps(strokes);
      if (gaps.length > 0) {
        gaps.sort((a, b) => a - b);
        const medianGap = gaps[Math.floor(gaps.length / 2)];
        // If gaps are smaller than estimated size, strokes likely belong together
        // If gaps are larger, they're separate characters
        // Use this to refine estimate
        if (medianGap > estimatedSize * 0.5) {
          // Large gaps - estimate is probably too big, use smaller value
          estimatedSize = Math.min(estimatedSize, medianGap * 1.5);
        }
      }
    }

    // Clamp to reasonable bounds
    const minSize = canvasHeight * this.MIN_CHAR_SIZE_RATIO;
    const maxSize = canvasHeight * this.MAX_CHAR_SIZE_RATIO;

    return Math.max(minSize, Math.min(maxSize, estimatedSize));
  }

  private findStrokeGaps(strokes: StrokeWithBounds[]): number[] {
    const gaps: number[] = [];
    for (let i = 0; i < strokes.length; i++) {
      for (let j = i + 1; j < strokes.length; j++) {
        const a = strokes[i].bounds;
        const b = strokes[j].bounds;
        const hGap = Math.max(0, Math.max(a.minX, b.minX) - Math.min(a.maxX, b.maxX));
        const vGap = Math.max(0, Math.max(a.minY, b.minY) - Math.min(a.maxY, b.maxY));
        const gap = Math.sqrt(hGap * hGap + vGap * vGap);
        if (gap > 0) gaps.push(gap);
      }
    }
    return gaps;
  }

  private findGridDivisions(
    strokes: StrokeWithBounds[],
    charSize: number
  ): { columnBoundaries: number[]; rowBoundaries: number[] } {
    const allPoints = strokes.flatMap(s => s.stroke);
    const overallBounds = this.calculateBoundingBox(allPoints);

    // Find column boundaries (X-axis valleys)
    const columnValleys = this.findDensityValleys(strokes, 'x', overallBounds.minX, overallBounds.maxX, charSize);

    // Build column boundaries including edges
    const columnBoundaries = [
      overallBounds.minX - this.CELL_PADDING,
      ...columnValleys,
      overallBounds.maxX + this.CELL_PADDING,
    ];

    // Find row boundaries (Y-axis valleys) - UNIFIED across all columns
    const rowValleys = this.findDensityValleys(strokes, 'y', overallBounds.minY, overallBounds.maxY, charSize);

    const rowBoundaries = [
      overallBounds.minY - this.CELL_PADDING,
      ...rowValleys,
      overallBounds.maxY + this.CELL_PADDING,
    ];

    return { columnBoundaries, rowBoundaries };
  }

  private findDensityValleys(
    strokes: StrokeWithBounds[],
    axis: 'x' | 'y',
    minVal: number,
    maxVal: number,
    charSize: number
  ): number[] {
    const range = maxVal - minVal;

    // Only subdivide if range is large enough for multiple characters
    if (range < charSize * 0.9) {
      return []; // Not enough room for 2+ characters
    }

    // Create density histogram with fine bins
    const binSize = Math.max(charSize / this.DENSITY_BIN_DIVISOR, 2);
    const numBins = Math.ceil(range / binSize);
    if (numBins < 4) return [];

    const density = new Array(numBins).fill(0);

    for (const s of strokes) {
      for (const p of s.stroke) {
        const val = axis === 'x' ? p.x : p.y;
        const binIndex = Math.floor((val - minVal) / binSize);
        if (binIndex >= 0 && binIndex < numBins) {
          density[binIndex]++;
        }
      }
    }

    // Light smoothing to reduce noise
    const smoothed = this.smoothArray(density, 2);
    const maxDensity = Math.max(...smoothed);
    const threshold = maxDensity * this.VALLEY_THRESHOLD_RATIO;

    // Find candidate valleys (local minima below threshold)
    const candidates: number[] = [];
    const minCellSize = charSize * this.MIN_CELL_SIZE_RATIO;

    for (let i = 1; i < smoothed.length - 1; i++) {
      const curr = smoothed[i];

      // Must be a local minimum (lower than both neighbors)
      if (curr >= smoothed[i - 1] || curr >= smoothed[i + 1]) continue;

      // Must be below threshold (low density = gap between characters)
      if (curr > threshold) continue;

      const valleyPos = minVal + (i + 0.5) * binSize;

      // Must create cells that aren't too small
      const distFromStart = valleyPos - minVal;
      const distToEnd = maxVal - valleyPos;
      const distFromLastValley = candidates.length > 0 ? valleyPos - candidates[candidates.length - 1] : distFromStart;

      if (distFromStart < minCellSize) continue;
      if (distToEnd < minCellSize) continue;
      if (distFromLastValley < minCellSize) continue;

      candidates.push(valleyPos);
    }

    // Validate valleys: only keep those with strokes on BOTH sides
    // This prevents empty interior cells
    const valleys: number[] = [];
    for (const valley of candidates) {
      const hasStrokesBefore = strokes.some(s => {
        const center = axis === 'x' ? s.bounds.centerX : s.bounds.centerY;
        return center < valley;
      });
      const hasStrokesAfter = strokes.some(s => {
        const center = axis === 'x' ? s.bounds.centerX : s.bounds.centerY;
        return center > valley;
      });

      if (hasStrokesBefore && hasStrokesAfter) {
        valleys.push(valley);
      }
    }

    return valleys;
  }

  private smoothArray(arr: number[], windowSize: number): number[] {
    const result: number[] = [];
    const half = Math.floor(windowSize / 2);

    for (let i = 0; i < arr.length; i++) {
      let sum = 0, count = 0;
      for (let j = Math.max(0, i - half); j <= Math.min(arr.length - 1, i + half); j++) {
        sum += arr[j];
        count++;
      }
      result.push(sum / count);
    }

    return result;
  }

  /**
   * Create a deformable mesh with SHARED vertices between adjacent cells.
   * This creates one unified grid where all columns share the same row boundaries.
   */
  private createDeformableMesh(
    columnBoundaries: number[],
    rowBoundaries: number[],
    strokes: StrokeWithBounds[],
    charSize: number
  ): MeshGrid {
    const numColumns = columnBoundaries.length - 1;
    const numRows = rowBoundaries.length - 1;

    if (numColumns <= 0 || numRows <= 0) {
      return this.createSingleCellMesh(strokes, charSize);
    }

    // Create shared vertex grid: (numColumns + 1) x (numRows + 1)
    // Each vertex is shared by up to 4 adjacent cells
    const vertices: Vertex[] = [];
    const vertexGrid: number[][] = []; // [col][row] -> vertex index

    for (let col = 0; col <= numColumns; col++) {
      vertexGrid[col] = [];
      const x = columnBoundaries[col];

      for (let row = 0; row <= numRows; row++) {
        const y = rowBoundaries[row];
        vertexGrid[col][row] = vertices.length;
        vertices.push({ x, y });
      }
    }

    // Create cells that reference shared vertices
    const cells: GridCell[] = [];

    // Sort columns right-to-left for Japanese reading order
    const colOrder = Array.from({ length: numColumns }, (_, i) => i)
      .sort((a, b) => columnBoundaries[b] - columnBoundaries[a]);

    for (let gridCol = 0; gridCol < colOrder.length; gridCol++) {
      const colIdx = colOrder[gridCol];

      for (let row = 0; row < numRows; row++) {
        // Get shared vertex indices
        // TL = (col, row), TR = (col+1, row), BR = (col+1, row+1), BL = (col, row+1)
        const tl = vertexGrid[colIdx][row];
        const tr = vertexGrid[colIdx + 1][row];
        const br = vertexGrid[colIdx + 1][row + 1];
        const bl = vertexGrid[colIdx][row + 1];

        cells.push({
          column: gridCol,
          row,
          vertexIndices: [tl, tr, br, bl],
          strokeIndices: [],
        });
      }
    }

    return {
      vertices,
      cells,
      columns: numColumns,
      maxRows: numRows,
      estimatedCharSize: charSize,
    };
  }

  private createSingleCellMesh(strokes: StrokeWithBounds[], charSize: number): MeshGrid {
    const allPoints = strokes.flatMap(s => s.stroke);
    const bounds = this.calculateBoundingBox(allPoints);
    const pad = this.CELL_PADDING;

    const vertices: Vertex[] = [
      { x: bounds.minX - pad, y: bounds.minY - pad },
      { x: bounds.maxX + pad, y: bounds.minY - pad },
      { x: bounds.maxX + pad, y: bounds.maxY + pad },
      { x: bounds.minX - pad, y: bounds.maxY + pad },
    ];

    const cells: GridCell[] = [{
      column: 0,
      row: 0,
      vertexIndices: [0, 1, 2, 3],
      strokeIndices: [],
    }];

    return { vertices, cells, columns: 1, maxRows: 1, estimatedCharSize: charSize };
  }

  private assignStrokesToCells(mesh: MeshGrid, strokes: StrokeWithBounds[]): void {
    for (const stroke of strokes) {
      const { centerX, centerY } = stroke.bounds;
      let bestCell: GridCell | null = null;
      let bestDist = Infinity;

      for (const cell of mesh.cells) {
        const [tl, tr, br, bl] = cell.vertexIndices.map(i => mesh.vertices[i]);

        // Get cell center
        const cellCenterX = (tl.x + tr.x + br.x + bl.x) / 4;
        const cellCenterY = (tl.y + tr.y + br.y + bl.y) / 4;

        // Check if inside (approximate with bounding box)
        const minX = Math.min(tl.x, tr.x, br.x, bl.x);
        const maxX = Math.max(tl.x, tr.x, br.x, bl.x);
        const minY = Math.min(tl.y, tr.y, br.y, bl.y);
        const maxY = Math.max(tl.y, tr.y, br.y, bl.y);

        if (centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY) {
          bestCell = cell;
          break;
        }

        // Track closest
        const dist = Math.hypot(centerX - cellCenterX, centerY - cellCenterY);
        if (dist < bestDist) {
          bestDist = dist;
          bestCell = cell;
        }
      }

      if (bestCell) {
        bestCell.strokeIndices.push(stroke.index);
      }
    }
  }

  /**
   * Deform mesh vertices to organically wrap around stroke content.
   * Since vertices are shared, we accumulate desired positions from all cells
   * and average them - this creates the organic "epithelial" effect.
   */
  private deformMeshToContent(mesh: MeshGrid, strokes: StrokeWithBounds[]): void {
    for (let iter = 0; iter < this.DEFORM_ITERATIONS; iter++) {
      const strength = this.DEFORM_STRENGTH * (1 - iter * 0.15);

      // Track desired positions for each vertex (may have multiple from shared cells)
      const vertexTargets: Map<number, { x: number; y: number }[]> = new Map();

      for (const cell of mesh.cells) {
        if (cell.strokeIndices.length === 0) continue;

        const cellStrokes = cell.strokeIndices.map(i => strokes[i]);
        const allPoints = cellStrokes.flatMap(s => s.stroke);
        const pad = this.CELL_PADDING;

        // Calculate target positions for each corner
        const targets = [
          this.findClosestContentCorner(allPoints, 'tl', pad),
          this.findClosestContentCorner(allPoints, 'tr', pad),
          this.findClosestContentCorner(allPoints, 'br', pad),
          this.findClosestContentCorner(allPoints, 'bl', pad),
        ];

        // Add targets to the shared vertex map
        for (let i = 0; i < 4; i++) {
          const vIdx = cell.vertexIndices[i];
          if (!vertexTargets.has(vIdx)) {
            vertexTargets.set(vIdx, []);
          }
          vertexTargets.get(vIdx)!.push(targets[i]);
        }
      }

      // Move each vertex toward the average of its targets
      for (const [vIdx, targets] of vertexTargets) {
        if (targets.length === 0) continue;

        const vertex = mesh.vertices[vIdx];
        const avgX = targets.reduce((sum, t) => sum + t.x, 0) / targets.length;
        const avgY = targets.reduce((sum, t) => sum + t.y, 0) / targets.length;

        vertex.x += (avgX - vertex.x) * strength;
        vertex.y += (avgY - vertex.y) * strength;
      }
    }

    // Final pass: ensure valid quads
    this.ensureValidQuads(mesh);
  }

  /**
   * Find the target position for a corner vertex based on actual stroke points.
   * This creates organic shapes that follow the stroke contours.
   */
  private findClosestContentCorner(points: Point[], corner: 'tl' | 'tr' | 'br' | 'bl', padding: number): Vertex {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }

    // Find extreme points in the direction of the corner
    let bestPoint = points[0];
    let bestScore = -Infinity;

    for (const p of points) {
      let score = 0;
      switch (corner) {
        case 'tl': score = -p.x - p.y; break; // Minimize X and Y
        case 'tr': score = p.x - p.y; break;  // Maximize X, minimize Y
        case 'br': score = p.x + p.y; break;  // Maximize X and Y
        case 'bl': score = -p.x + p.y; break; // Minimize X, maximize Y
      }
      if (score > bestScore) {
        bestScore = score;
        bestPoint = p;
      }
    }

    // Add padding in the appropriate direction
    let px = 0, py = 0;
    switch (corner) {
      case 'tl': px = -padding; py = -padding; break;
      case 'tr': px = padding; py = -padding; break;
      case 'br': px = padding; py = padding; break;
      case 'bl': px = -padding; py = padding; break;
    }

    return { x: bestPoint.x + px, y: bestPoint.y + py };
  }

  /**
   * Ensure quads don't self-intersect by checking vertex order.
   */
  private ensureValidQuads(mesh: MeshGrid): void {
    for (const cell of mesh.cells) {
      const verts = cell.vertexIndices.map(i => mesh.vertices[i]);
      const [tl, tr, br, bl] = verts;

      // Check if the quad is valid (vertices in correct clockwise order)
      // If edges cross, we have a self-intersection

      // Simple fix: ensure TL is actually top-left relative to others, etc.
      // by checking that the centroid is inside all edges

      const cx = (tl.x + tr.x + br.x + bl.x) / 4;
      const cy = (tl.y + tr.y + br.y + bl.y) / 4;

      // Ensure each vertex is in roughly the right quadrant relative to center
      // Top-left should be left of and above center
      if (tl.x > cx + 5) tl.x = cx - 5;
      if (tl.y > cy + 5) tl.y = cy - 5;

      // Top-right should be right of and above center
      if (tr.x < cx - 5) tr.x = cx + 5;
      if (tr.y > cy + 5) tr.y = cy - 5;

      // Bottom-right should be right of and below center
      if (br.x < cx - 5) br.x = cx + 5;
      if (br.y < cy - 5) br.y = cy + 5;

      // Bottom-left should be left of and below center
      if (bl.x > cx + 5) bl.x = cx - 5;
      if (bl.y < cy - 5) bl.y = cy + 5;
    }
  }
}
