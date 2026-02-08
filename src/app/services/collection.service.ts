import { Injectable } from '@angular/core';
import { CollectionSample, GroundTruthEntry, SelectionLasso } from '../models/collection.types';
import { Point, DividerLine, SegmentationResult, GridCell } from '../models/segmentation.types';

/**
 * Service for collecting segmentation training data.
 *
 * Exports workbook session data as JSON files for building segmentation models.
 * Each sample captures strokes, segmentation, recognition results, and ground truth.
 */
@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private readonly USER_ID_KEY = 'mojidoodle_collection_user_id';
  private readonly WORKER_URL = 'https://data-collection.mojidoodle.ai/collect';

  /**
   * Get or create a persistent user UUID.
   * Stored in localStorage, generated once on first use.
   */
  getUserId(): string {
    let userId = localStorage.getItem(this.USER_ID_KEY);
    if (!userId) {
      userId = this.generateUUID();
      localStorage.setItem(this.USER_ID_KEY, userId);
    }
    return userId;
  }

  /**
   * Build and export a sample after grading.
   * Sends to Cloudflare Worker, falls back to local download on failure.
   *
   * @param params Collection parameters from workbook
   */
  async exportSample(params: {
    strokes: Point[][];
    canvasWidth: number;
    canvasHeight: number;
    segmentationResult: SegmentationResult | null;
    sortedCells: GridCell[];
    answers: string[];
    recognitionResults: { character: string; score: number }[][] | null;
    success: boolean;
    cardId: string;
    lassos?: { points: {x: number, y: number}[] }[];
  }): Promise<void> {
    const sample = this.buildSample(params);

    try {
      await this.sendToWorker(sample);
    } catch (err) {
      console.error('Failed to send to worker:', err);
    }
  }

  /**
   * Send sample to Cloudflare Worker.
   */
  private async sendToWorker(sample: CollectionSample): Promise<void> {
    const response = await fetch(this.WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sample),
    });

    if (!response.ok) {
      throw new Error(`Worker returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Sample sent to worker:', result);
  }

  /**
   * Build a CollectionSample from workbook data.
   */
  private buildSample(params: {
    strokes: Point[][];
    canvasWidth: number;
    canvasHeight: number;
    segmentationResult: SegmentationResult | null;
    sortedCells: GridCell[];
    answers: string[];
    recognitionResults: { character: string; score: number }[][] | null;
    success: boolean;
    cardId: string;
    lassos?: { points: {x: number, y: number}[] }[];
  }): CollectionSample {
    const {
      strokes,
      canvasWidth,
      canvasHeight,
      segmentationResult,
      sortedCells,
      answers,
      recognitionResults,
      success,
      cardId,
      lassos
    } = params;

    // Extract segmentation lines if available
    let segmentation: { columnDividers: DividerLine[]; rowDividers: DividerLine[][] } | null = null;
    if (segmentationResult) {
      segmentation = {
        columnDividers: segmentationResult.grid.columnDividers,
        rowDividers: segmentationResult.grid.rowDividers
      };
    }

    // Infer ground truth on success
    let groundTruth: GroundTruthEntry[] | null = null;
    if (success) {
      groundTruth = this.inferGroundTruth(strokes, sortedCells, answers);
    }

    // Convert lassos to SelectionLasso format (with strokeIndices)
    let selectionLassos: SelectionLasso[] | null = null;
    if (lassos && lassos.length > 0) {
      selectionLassos = lassos.map(lasso => ({
        points: lasso.points,
        strokeIndices: this.findStrokesInLasso(strokes, lasso.points)
      }));
    }

    return {
      strokes,
      canvasWidth,
      canvasHeight,
      segmentation,
      selectionLassos,
      answers,
      recognitionResults,
      groundTruth,
      success,
      id: this.generateUUID(),
      userId: this.getUserId(),
      cardId,
      timestamp: Date.now()
    };
  }

  /**
   * Find which strokes are inside a lasso polygon (>= 50% of points contained).
   */
  private findStrokesInLasso(strokes: Point[][], lasso: {x: number, y: number}[]): number[] {
    const indices: number[] = [];

    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      if (stroke.length === 0) continue;

      let pointsInside = 0;
      for (const point of stroke) {
        if (this.isPointInPolygon(point, lasso)) {
          pointsInside++;
        }
      }

      const containment = pointsInside / stroke.length;
      if (containment >= 0.5) {
        indices.push(i);
      }
    }

    return indices;
  }

  /**
   * Point-in-polygon test using ray casting algorithm.
   */
  private isPointInPolygon(point: {x: number, y: number}, polygon: {x: number, y: number}[]): boolean {
    if (polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  /**
   * Infer ground truth from successful recognition.
   *
   * For single-char cards: all strokes belong to the one character
   * For multi-char cards: use segmentation cell assignments
   */
  private inferGroundTruth(
    strokes: Point[][],
    sortedCells: GridCell[],
    answers: string[]
  ): GroundTruthEntry[] {
    const primaryAnswer = answers[0].replace(/\s+/g, '');
    const chars = [...primaryAnswer]; // Unicode-safe split

    if (sortedCells.length <= 1) {
      // Single character - all strokes belong to it
      return [{
        strokeIndices: strokes.map((_, i) => i),
        character: chars[0] || ''
      }];
    }

    // Multi-character - use cell assignments
    return sortedCells.map((cell, idx) => ({
      strokeIndices: cell.strokeIndices,
      character: chars[idx] || ''
    }));
  }

  /**
   * Generate a UUID v4.
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
