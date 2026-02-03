import { Injectable } from '@angular/core';
import {
  Point,
  StrokeBounds,
  DividerLine,
  GridCell,
  SegmentationResult,
  SegmentationConfig,
} from '../models/segmentation.types';

/**
 * Character segmentation service using two-pass column-based approach.
 *
 * APPROACH:
 * 1. PASS 1 - Column Detection: Find vertical gaps between columns
 *    - Sort strokes by X position
 *    - Find gaps larger than threshold
 *    - Create vertical divider lines (x = slope*y + intercept)
 *
 * 2. PASS 2 - Row Detection: Within each column, find horizontal gaps
 *    - Sort column's strokes by Y position
 *    - Find gaps larger than threshold
 *    - Create horizontal divider lines (y = slope*x + intercept)
 *
 * DIVIDER LINES:
 * - Simple linear: x = m*y + b (columns) or y = m*x + b (rows)
 * - Max 10 degrees from vertical/horizontal
 */
@Injectable({
  providedIn: 'root',
})
export class CharacterSegmentationService {
  private readonly config: SegmentationConfig = {
    minColumnGapRatio: 0.25,
    maxColumnAngle: 10,
    minRowGapRatio: 0.25,
    maxRowAngle: 10,
    charSizeMultiplier: 2.0,
    minCharSizeRatio: 0.08,
    maxCharSizeRatio: 0.40,
  };

  private readonly MAX_SIZE_RATIO = 2.0;

  /**
   * Segment strokes into a grid of character cells.
   */
  segment(strokes: Point[][], canvasWidth: number, canvasHeight: number): SegmentationResult {
    if (strokes.length === 0) {
      return this.emptyResult();
    }

    // Step 1: Calculate bounds for each stroke
    const strokeBounds = strokes.map((stroke, index) => this.calculateStrokeBounds(stroke, index));

    // Step 2: Get overall content bounds
    const contentBounds = {
      minX: Math.min(...strokeBounds.map(s => s.minX)),
      maxX: Math.max(...strokeBounds.map(s => s.maxX)),
      minY: Math.min(...strokeBounds.map(s => s.minY)),
      maxY: Math.max(...strokeBounds.map(s => s.maxY)),
    };

    // Step 3: Estimate character dimensions
    const charWidth = this.estimateCharSize(strokeBounds, canvasWidth, 'width');
    const charHeight = this.estimateCharSize(strokeBounds, canvasHeight, 'height');

    // Step 4: PASS 1 - Find column dividers (vertical gaps)
    let columnDividers = this.findColumnDividers(strokeBounds, charWidth, canvasHeight);

    // Step 5: Enforce column width uniformity (no column >2x wider than another)
    columnDividers = this.enforceColumnUniformity(columnDividers, strokeBounds, contentBounds);

    // Step 6: Assign strokes to columns
    const strokesByColumn = this.assignStrokesToColumns(strokeBounds, columnDividers);

    // Step 7: PASS 2 - Find row dividers within each column
    let rowDividers = this.findAllRowDividers(strokesByColumn, strokeBounds, columnDividers, charHeight);

    // Step 8: Enforce row height uniformity per column (no cell >2x taller than another)
    rowDividers = this.enforceRowUniformity(rowDividers, strokesByColumn, strokeBounds, columnDividers);

    // Step 9: Enforce columns <= maxRows constraint
    // Japanese writing is vertical, so we should never have more columns than rows
    const enforceResult = this.enforceColumnsNotExceedRows(
      columnDividers,
      rowDividers,
      strokeBounds,
      charHeight,
      contentBounds
    );
    columnDividers = enforceResult.columnDividers;
    rowDividers = enforceResult.rowDividers;
    const strokesByColumnFinal = this.assignStrokesToColumns(strokeBounds, columnDividers);

    // Step 10: Create cell grid
    const cells = this.createCellGrid(strokesByColumnFinal, strokeBounds, columnDividers, rowDividers);

    const numColumns = columnDividers.length + 1;
    const maxRows = Math.max(...rowDividers.map(r => r.length + 1), 1);

    return {
      grid: {
        columnDividers,
        rowDividers,
        cells,
        columns: numColumns,
        maxRows,
      },
      estimatedCharHeight: charHeight,
      estimatedCharWidth: charWidth,
    };
  }

  private emptyResult(): SegmentationResult {
    return {
      grid: {
        columnDividers: [],
        rowDividers: [],
        cells: [],
        columns: 0,
        maxRows: 0,
      },
      estimatedCharHeight: 0,
      estimatedCharWidth: 0,
    };
  }

  /**
   * Calculate bounding box for a stroke.
   */
  private calculateStrokeBounds(stroke: Point[], index: number): StrokeBounds {
    if (stroke.length === 0) {
      return {
        strokeIndex: index,
        minX: 0, maxX: 0, minY: 0, maxY: 0,
        centerX: 0, centerY: 0,
      };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const p of stroke) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    return {
      strokeIndex: index,
      minX, maxX, minY, maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  /**
   * Estimate character size from stroke dimensions.
   */
  private estimateCharSize(
    strokeBounds: StrokeBounds[],
    canvasDimension: number,
    dimension: 'width' | 'height'
  ): number {
    if (strokeBounds.length === 0) {
      return canvasDimension * 0.15;
    }

    const sizes = strokeBounds
      .map(s => dimension === 'width' ? s.maxX - s.minX : s.maxY - s.minY)
      .filter(size => size > 5);  // Filter out tiny strokes

    if (sizes.length === 0) {
      return canvasDimension * 0.15;
    }

    sizes.sort((a, b) => a - b);
    const medianSize = sizes[Math.floor(sizes.length / 2)];
    let estimated = medianSize * this.config.charSizeMultiplier;

    const minSize = canvasDimension * this.config.minCharSizeRatio;
    const maxSize = canvasDimension * this.config.maxCharSizeRatio;

    return Math.max(minSize, Math.min(maxSize, estimated));
  }

  // ============================================================
  // PASS 1: Column Detection
  // ============================================================

  /**
   * Find vertical dividers between columns by looking for X-gaps.
   */
  private findColumnDividers(
    strokeBounds: StrokeBounds[],
    charWidth: number,
    _canvasHeight: number
  ): DividerLine[] {
    if (strokeBounds.length < 2) return [];

    // Get overall bounds
    const overallMinY = Math.min(...strokeBounds.map(s => s.minY));
    const overallMaxY = Math.max(...strokeBounds.map(s => s.maxY));

    // Sort strokes by X center position
    const sortedByX = [...strokeBounds].sort((a, b) => a.centerX - b.centerX);

    // Find gaps between consecutive strokes (looking at their bounding boxes)
    const gaps: { gapStart: number; gapEnd: number; gapSize: number }[] = [];
    const minGap = charWidth * this.config.minColumnGapRatio;

    for (let i = 0; i < sortedByX.length - 1; i++) {
      const current = sortedByX[i];
      const next = sortedByX[i + 1];

      // Gap is from the right edge of current to the left edge of next
      const gapStart = current.maxX;
      const gapEnd = next.minX;
      const gapSize = gapEnd - gapStart;

      if (gapSize >= minGap) {
        gaps.push({ gapStart, gapEnd, gapSize });
      }
    }

    // Convert gaps to divider lines
    // Divider goes through the middle of the gap
    return gaps.map(gap => {
      const x = (gap.gapStart + gap.gapEnd) / 2;
      return {
        slope: 0,  // Perfectly vertical
        intercept: x,
        start: overallMinY - 10,
        end: overallMaxY + 10,
      };
    });
  }

  // ============================================================
  // PASS 2: Row Detection
  // ============================================================

  /**
   * Assign strokes to columns based on dividers.
   */
  private assignStrokesToColumns(
    strokeBounds: StrokeBounds[],
    columnDividers: DividerLine[]
  ): number[][] {
    const numColumns = columnDividers.length + 1;
    const strokesByColumn: number[][] = Array.from({ length: numColumns }, () => []);

    // Get X positions of dividers (intercept is the X position for vertical lines)
    const dividerXs = columnDividers.map(d => d.intercept).sort((a, b) => a - b);

    for (const stroke of strokeBounds) {
      // Find which column this stroke belongs to
      let colIdx = 0;
      for (let i = 0; i < dividerXs.length; i++) {
        if (stroke.centerX > dividerXs[i]) {
          colIdx = i + 1;
        }
      }

      // Japanese reading order: rightmost column is 0
      // Physical columns go left-to-right (0, 1, 2...)
      // Japanese order is right-to-left, so invert
      const japaneseColIdx = numColumns - 1 - colIdx;
      strokesByColumn[japaneseColIdx].push(stroke.strokeIndex);
    }

    return strokesByColumn;
  }

  /**
   * Find row dividers for all columns.
   */
  private findAllRowDividers(
    strokesByColumn: number[][],
    strokeBounds: StrokeBounds[],
    columnDividers: DividerLine[],
    charHeight: number
  ): DividerLine[][] {
    return strokesByColumn.map((colStrokeIndices, colIdx) => {
      if (colStrokeIndices.length < 2) return [];

      const colStrokes = colStrokeIndices.map(i => strokeBounds[i]);
      const colBounds = this.getColumnXBounds(colIdx, columnDividers, strokesByColumn.length, colStrokes);

      return this.findRowDividers(colStrokes, charHeight, colBounds);
    });
  }

  /**
   * Get the X bounds for a column.
   */
  private getColumnXBounds(
    colIdx: number,
    columnDividers: DividerLine[],
    numColumns: number,
    colStrokes: StrokeBounds[]
  ): { minX: number; maxX: number } {
    // Fallback to stroke bounds if no dividers
    if (columnDividers.length === 0 || colStrokes.length === 0) {
      return {
        minX: Math.min(...colStrokes.map(s => s.minX)),
        maxX: Math.max(...colStrokes.map(s => s.maxX)),
      };
    }

    const dividerXs = columnDividers.map(d => d.intercept).sort((a, b) => a - b);

    // Column 0 is rightmost in Japanese order
    const physicalColIdx = numColumns - 1 - colIdx;

    // Get stroke extent as fallback
    const strokeMinX = Math.min(...colStrokes.map(s => s.minX));
    const strokeMaxX = Math.max(...colStrokes.map(s => s.maxX));

    const leftBound = physicalColIdx > 0 ? dividerXs[physicalColIdx - 1] : strokeMinX;
    const rightBound = physicalColIdx < dividerXs.length ? dividerXs[physicalColIdx] : strokeMaxX;

    return { minX: leftBound, maxX: rightBound };
  }

  /**
   * Find horizontal dividers within a column by looking for Y-gaps.
   */
  private findRowDividers(
    colStrokes: StrokeBounds[],
    charHeight: number,
    colBounds: { minX: number; maxX: number }
  ): DividerLine[] {
    if (colStrokes.length < 2) return [];

    // Sort strokes by Y center position
    const sortedByY = [...colStrokes].sort((a, b) => a.centerY - b.centerY);

    // Find gaps between consecutive strokes
    const gaps: { gapStart: number; gapEnd: number; gapSize: number }[] = [];
    const minGap = charHeight * this.config.minRowGapRatio;

    for (let i = 0; i < sortedByY.length - 1; i++) {
      const current = sortedByY[i];
      const next = sortedByY[i + 1];

      // Gap is from the bottom of current to the top of next
      const gapStart = current.maxY;
      const gapEnd = next.minY;
      const gapSize = gapEnd - gapStart;

      if (gapSize >= minGap) {
        gaps.push({ gapStart, gapEnd, gapSize });
      }
    }

    // Convert gaps to divider lines
    return gaps.map(gap => {
      const y = (gap.gapStart + gap.gapEnd) / 2;
      return {
        slope: 0,  // Perfectly horizontal
        intercept: y,
        start: colBounds.minX - 10,
        end: colBounds.maxX + 10,
      };
    });
  }

  // ============================================================
  // Cell Grid Creation
  // ============================================================

  /**
   * Create the grid of cells from column/row dividers.
   */
  private createCellGrid(
    strokesByColumn: number[][],
    strokeBounds: StrokeBounds[],
    _columnDividers: DividerLine[],
    rowDividers: DividerLine[][]
  ): GridCell[] {
    const cells: GridCell[] = [];
    const numColumns = strokesByColumn.length;

    for (let colIdx = 0; colIdx < numColumns; colIdx++) {
      const colStrokeIndices = strokesByColumn[colIdx];
      const colRowDividers = rowDividers[colIdx] || [];

      if (colStrokeIndices.length === 0) continue;

      const colStrokes = colStrokeIndices.map(i => strokeBounds[i]);

      // Get Y extent for this column
      const colMinY = Math.min(...colStrokes.map(s => s.minY));
      const colMaxY = Math.max(...colStrokes.map(s => s.maxY));

      // Row divider Y positions (intercept is Y for horizontal lines)
      const rowYs = colRowDividers.map(d => d.intercept).sort((a, b) => a - b);

      // Create cells for this column
      const numRows = rowYs.length + 1;

      for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
        const topY = rowIdx === 0 ? colMinY - 5 : rowYs[rowIdx - 1];
        const bottomY = rowIdx === numRows - 1 ? colMaxY + 5 : rowYs[rowIdx];

        // Find strokes in this cell
        const cellStrokeIndices = colStrokeIndices.filter(i => {
          const s = strokeBounds[i];
          return s.centerY >= topY && s.centerY <= bottomY;
        });

        if (cellStrokeIndices.length === 0) continue;

        // Calculate cell bounds from its strokes
        const cellStrokes = cellStrokeIndices.map(i => strokeBounds[i]);
        const bounds = {
          minX: Math.min(...cellStrokes.map(s => s.minX)),
          maxX: Math.max(...cellStrokes.map(s => s.maxX)),
          minY: Math.min(...cellStrokes.map(s => s.minY)),
          maxY: Math.max(...cellStrokes.map(s => s.maxY)),
        };

        cells.push({
          column: colIdx,
          row: rowIdx,
          strokeIndices: cellStrokeIndices,
          bounds,
        });
      }
    }

    return cells;
  }

  // ============================================================
  // Size Uniformity Enforcement
  // ============================================================

  /**
   * Calculate the max/min ratio for a set of sizes.
   */
  private calculateRatio(sizes: number[]): number {
    if (sizes.length <= 1) return 1;
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    return min > 0 ? max / min : Infinity;
  }

  /**
   * Enforce column width uniformity: no column should be >2x wider than another.
   * Can either split large columns OR merge small columns, whichever improves ratio.
   */
  private enforceColumnUniformity(
    columnDividers: DividerLine[],
    strokeBounds: StrokeBounds[],
    contentBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): DividerLine[] {
    if (strokeBounds.length === 0) return columnDividers;

    const MAX_ITERATIONS = 10;
    let dividers = [...columnDividers];

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      // Get column boundaries including content edges
      const dividerXs = dividers.map(d => d.intercept).sort((a, b) => a - b);
      const boundaries = [contentBounds.minX, ...dividerXs, contentBounds.maxX];

      // Calculate column widths
      const widths: number[] = [];
      for (let i = 0; i < boundaries.length - 1; i++) {
        widths.push(boundaries[i + 1] - boundaries[i]);
      }

      if (widths.length <= 1) break;

      const currentRatio = this.calculateRatio(widths);

      // Check if already uniform
      if (currentRatio <= this.MAX_SIZE_RATIO) break;

      // Try two strategies and pick the better one:
      // 1. Split the largest column
      // 2. Merge the smallest column with a neighbor (remove a divider)

      let bestAction: 'split' | 'merge' | null = null;
      let bestRatio = currentRatio;
      let splitX = 0;
      let mergeIdx = -1;

      // Strategy 1: Split the largest
      const widestIdx = widths.indexOf(Math.max(...widths));
      const candidateSplitX = (boundaries[widestIdx] + boundaries[widestIdx + 1]) / 2;
      const widthsAfterSplit = [...widths];
      const splitWidth = widths[widestIdx] / 2;
      widthsAfterSplit.splice(widestIdx, 1, splitWidth, splitWidth);
      const ratioAfterSplit = this.calculateRatio(widthsAfterSplit);

      if (ratioAfterSplit < bestRatio) {
        bestRatio = ratioAfterSplit;
        bestAction = 'split';
        splitX = candidateSplitX;
      }

      // Strategy 2: Merge the smallest with a neighbor (only if we have dividers to remove)
      if (dividers.length > 0) {
        const smallestIdx = widths.indexOf(Math.min(...widths));

        // Try merging with left neighbor (remove divider at smallestIdx - 1)
        if (smallestIdx > 0) {
          const widthsAfterMergeLeft = [...widths];
          widthsAfterMergeLeft[smallestIdx - 1] += widthsAfterMergeLeft[smallestIdx];
          widthsAfterMergeLeft.splice(smallestIdx, 1);
          const ratioAfterMergeLeft = this.calculateRatio(widthsAfterMergeLeft);

          if (ratioAfterMergeLeft < bestRatio) {
            bestRatio = ratioAfterMergeLeft;
            bestAction = 'merge';
            mergeIdx = smallestIdx - 1; // Remove divider at this index
          }
        }

        // Try merging with right neighbor (remove divider at smallestIdx)
        if (smallestIdx < widths.length - 1) {
          const widthsAfterMergeRight = [...widths];
          widthsAfterMergeRight[smallestIdx] += widthsAfterMergeRight[smallestIdx + 1];
          widthsAfterMergeRight.splice(smallestIdx + 1, 1);
          const ratioAfterMergeRight = this.calculateRatio(widthsAfterMergeRight);

          if (ratioAfterMergeRight < bestRatio) {
            bestRatio = ratioAfterMergeRight;
            bestAction = 'merge';
            mergeIdx = smallestIdx; // Remove divider at this index
          }
        }
      }

      // Apply the best action
      if (bestAction === 'split') {
        const newDivider: DividerLine = {
          slope: 0,
          intercept: splitX,
          start: contentBounds.minY - 10,
          end: contentBounds.maxY + 10,
        };
        dividers.push(newDivider);
        dividers.sort((a, b) => a.intercept - b.intercept);
      } else if (bestAction === 'merge' && mergeIdx >= 0 && mergeIdx < dividers.length) {
        // Remove the divider to merge columns
        const sortedDividers = [...dividers].sort((a, b) => a.intercept - b.intercept);
        sortedDividers.splice(mergeIdx, 1);
        dividers = sortedDividers;
      } else {
        // No improvement possible
        break;
      }
    }

    return dividers;
  }

  /**
   * Enforce row height uniformity per column: no cell should be >2x taller than another.
   * Can either split large cells OR merge small cells, whichever improves ratio.
   */
  private enforceRowUniformity(
    rowDividers: DividerLine[][],
    strokesByColumn: number[][],
    strokeBounds: StrokeBounds[],
    columnDividers: DividerLine[]
  ): DividerLine[][] {
    const MAX_ITERATIONS = 10;

    return rowDividers.map((colRowDividers, colIdx) => {
      const colStrokeIndices = strokesByColumn[colIdx];
      if (colStrokeIndices.length === 0) return colRowDividers;

      const colStrokes = colStrokeIndices.map(i => strokeBounds[i]);
      const colMinY = Math.min(...colStrokes.map(s => s.minY));
      const colMaxY = Math.max(...colStrokes.map(s => s.maxY));
      const colBounds = this.getColumnXBounds(colIdx, columnDividers, strokesByColumn.length, colStrokes);

      let dividers = [...colRowDividers];

      for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
        // Get row boundaries including content edges
        const dividerYs = dividers.map(d => d.intercept).sort((a, b) => a - b);
        const boundaries = [colMinY, ...dividerYs, colMaxY];

        // Calculate row heights
        const heights: number[] = [];
        for (let i = 0; i < boundaries.length - 1; i++) {
          heights.push(boundaries[i + 1] - boundaries[i]);
        }

        if (heights.length <= 1) break;

        const currentRatio = this.calculateRatio(heights);

        // Check if already uniform
        if (currentRatio <= this.MAX_SIZE_RATIO) break;

        // Try two strategies and pick the better one
        let bestAction: 'split' | 'merge' | null = null;
        let bestRatio = currentRatio;
        let splitY = 0;
        let mergeIdx = -1;

        // Strategy 1: Split the tallest
        const tallestIdx = heights.indexOf(Math.max(...heights));
        const candidateSplitY = (boundaries[tallestIdx] + boundaries[tallestIdx + 1]) / 2;
        const heightsAfterSplit = [...heights];
        const splitHeight = heights[tallestIdx] / 2;
        heightsAfterSplit.splice(tallestIdx, 1, splitHeight, splitHeight);
        const ratioAfterSplit = this.calculateRatio(heightsAfterSplit);

        if (ratioAfterSplit < bestRatio) {
          bestRatio = ratioAfterSplit;
          bestAction = 'split';
          splitY = candidateSplitY;
        }

        // Strategy 2: Merge the smallest with a neighbor
        if (dividers.length > 0) {
          const smallestIdx = heights.indexOf(Math.min(...heights));

          // Try merging with top neighbor
          if (smallestIdx > 0) {
            const heightsAfterMergeTop = [...heights];
            heightsAfterMergeTop[smallestIdx - 1] += heightsAfterMergeTop[smallestIdx];
            heightsAfterMergeTop.splice(smallestIdx, 1);
            const ratioAfterMergeTop = this.calculateRatio(heightsAfterMergeTop);

            if (ratioAfterMergeTop < bestRatio) {
              bestRatio = ratioAfterMergeTop;
              bestAction = 'merge';
              mergeIdx = smallestIdx - 1;
            }
          }

          // Try merging with bottom neighbor
          if (smallestIdx < heights.length - 1) {
            const heightsAfterMergeBottom = [...heights];
            heightsAfterMergeBottom[smallestIdx] += heightsAfterMergeBottom[smallestIdx + 1];
            heightsAfterMergeBottom.splice(smallestIdx + 1, 1);
            const ratioAfterMergeBottom = this.calculateRatio(heightsAfterMergeBottom);

            if (ratioAfterMergeBottom < bestRatio) {
              bestRatio = ratioAfterMergeBottom;
              bestAction = 'merge';
              mergeIdx = smallestIdx;
            }
          }
        }

        // Apply the best action
        if (bestAction === 'split') {
          const newDivider: DividerLine = {
            slope: 0,
            intercept: splitY,
            start: colBounds.minX - 10,
            end: colBounds.maxX + 10,
          };
          dividers.push(newDivider);
          dividers.sort((a, b) => a.intercept - b.intercept);
        } else if (bestAction === 'merge' && mergeIdx >= 0 && mergeIdx < dividers.length) {
          const sortedDividers = [...dividers].sort((a, b) => a.intercept - b.intercept);
          sortedDividers.splice(mergeIdx, 1);
          dividers = sortedDividers;
        } else {
          break;
        }
      }

      return dividers;
    });
  }

  /**
   * Enforce that columns never exceed maxRows.
   * Japanese writing is vertical (top-to-bottom, right-to-left), so having more
   * columns than rows indicates over-segmentation (e.g., い being split into 2 columns).
   */
  private enforceColumnsNotExceedRows(
    columnDividers: DividerLine[],
    rowDividers: DividerLine[][],
    strokeBounds: StrokeBounds[],
    charHeight: number,
    contentBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): { columnDividers: DividerLine[]; rowDividers: DividerLine[][] } {
    const MAX_ITERATIONS = 10;
    let dividers = [...columnDividers];
    let rows = [...rowDividers];

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const numColumns = dividers.length + 1;
      const maxRows = Math.max(...rows.map(r => r.length + 1), 1);

      // Check if constraint is satisfied
      if (numColumns <= maxRows) {
        break;
      }

      // Need to remove a column divider (merge two columns)
      if (dividers.length === 0) {
        break; // Can't remove any more
      }

      // Find the best divider to remove (the one with the smallest gap)
      // This merges the two most closely-spaced columns
      const sortedDividers = [...dividers].sort((a, b) => a.intercept - b.intercept);
      const boundaries = [contentBounds.minX, ...sortedDividers.map(d => d.intercept), contentBounds.maxX];

      // Find the smallest gap between adjacent columns
      let smallestGapIdx = 0;
      let smallestGap = Infinity;
      for (let i = 0; i < sortedDividers.length; i++) {
        // Gap covered by this divider is boundaries[i+1] to boundaries[i+2]
        // Actually, the divider at index i separates column i and column i+1
        // We want to remove the divider that separates the narrowest combined width
        const leftWidth = boundaries[i + 1] - boundaries[i];
        const rightWidth = boundaries[i + 2] - boundaries[i + 1];
        const combinedWidth = leftWidth + rightWidth;

        if (combinedWidth < smallestGap) {
          smallestGap = combinedWidth;
          smallestGapIdx = i;
        }
      }

      // Remove the divider
      sortedDividers.splice(smallestGapIdx, 1);
      dividers = sortedDividers;

      // Re-assign strokes to columns and recalculate row dividers
      const strokesByColumn = this.assignStrokesToColumns(strokeBounds, dividers);
      rows = this.findAllRowDividers(strokesByColumn, strokeBounds, dividers, charHeight);
      rows = this.enforceRowUniformity(rows, strokesByColumn, strokeBounds, dividers);
    }

    return { columnDividers: dividers, rowDividers: rows };
  }
}
