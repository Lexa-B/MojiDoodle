import { Injectable } from '@angular/core';
import { CollectionSample, GroundTruthEntry } from '../models/collection.types';
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
  private readonly WORKER_URL = 'https://mojidoodle.lexa.digital/collect';

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
      cardId
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

    return {
      strokes,
      canvasWidth,
      canvasHeight,
      segmentation,
      selectionLassos: null, // Deferred feature
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
