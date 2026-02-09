import { Injectable } from '@angular/core';
import { CollectionSampleV2, CharacterAssignment, GroundTruthEntry, SelectionLasso } from '../models/collection.types';
import { Point, SegmentResult } from 'mojidoodle-algo-segmenter';

/**
 * Service for collecting segmentation training data.
 *
 * Exports workbook session data as JSON to a Cloudflare Worker for building segmentation models.
 * Each sample captures strokes, character assignments, recognition results, and ground truth.
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
   * Sends to Cloudflare Worker, falls back to logging on failure.
   */
  async exportSample(params: {
    strokes: Point[][];
    canvasWidth: number;
    canvasHeight: number;
    segmentResult: SegmentResult | null;
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
  private async sendToWorker(sample: CollectionSampleV2): Promise<void> {
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
   * Build a CollectionSampleV2 from workbook data.
   */
  private buildSample(params: {
    strokes: Point[][];
    canvasWidth: number;
    canvasHeight: number;
    segmentResult: SegmentResult | null;
    answers: string[];
    recognitionResults: { character: string; score: number }[][] | null;
    success: boolean;
    cardId: string;
  }): CollectionSampleV2 {
    const {
      strokes,
      canvasWidth,
      canvasHeight,
      segmentResult,
      answers,
      recognitionResults,
      success,
      cardId,
    } = params;

    // Build character assignments from segmenter output
    let characterAssignments: CharacterAssignment[] = [];
    if (segmentResult) {
      const groups = new Map<number, number[]>();
      for (const s of segmentResult.strokes) {
        if (s.characterIndex >= 0) {
          if (!groups.has(s.characterIndex)) groups.set(s.characterIndex, []);
          groups.get(s.characterIndex)!.push(s.index);
        }
      }
      characterAssignments = segmentResult.characters.map(c => ({
        characterIndex: c.index,
        strokeIndices: groups.get(c.index) || [],
        bounds: c.bounds,
      }));
    }

    // Build lasso data from segmenter output
    let selectionLassos: SelectionLasso[] | null = null;
    if (segmentResult && segmentResult.lassos.length > 0) {
      selectionLassos = segmentResult.lassos.map(l => ({
        points: [...l.points],
        strokeIndices: [...l.strokeIndices],
      }));
    }

    // Infer ground truth on success
    let groundTruth: GroundTruthEntry[] | null = null;
    if (success) {
      groundTruth = this.inferGroundTruth(strokes, characterAssignments, answers);
    }

    return {
      version: 2,
      strokes,
      canvasWidth,
      canvasHeight,
      characterAssignments,
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
   * Infer ground truth from successful recognition.
   *
   * For single-char cards: all strokes belong to the one character
   * For multi-char cards: use character assignment stroke indices
   */
  private inferGroundTruth(
    strokes: Point[][],
    characterAssignments: CharacterAssignment[],
    answers: string[]
  ): GroundTruthEntry[] {
    const primaryAnswer = answers[0].replace(/\s+/g, '');
    const chars = [...primaryAnswer]; // Unicode-safe split

    if (characterAssignments.length <= 1) {
      // Single character - all strokes belong to it
      return [{
        strokeIndices: strokes.map((_, i) => i),
        character: chars[0] || ''
      }];
    }

    // Multi-character - use character assignments
    return characterAssignments.map((ca, idx) => ({
      strokeIndices: ca.strokeIndices,
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
