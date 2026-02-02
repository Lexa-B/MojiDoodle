import { Injectable } from '@angular/core';
import { CardsService } from './cards.service';

interface Point {
  x: number;
  y: number;
  t: number; // timestamp
}

// Google Input Tools ink format: [[x1,x2,...], [y1,y2,...], [t1,t2,...]]
type InkStroke = [number[], number[], number[]];

interface GoogleInputRequest {
  app_version: number;
  api_level: string;
  device: string;
  input_type: number;
  options: string;
  requests: {
    max_completions: number;
    max_num_results: number;
    pre_context: string;
    writing_guide: {
      writing_area_height: number;
      writing_area_width: number;
    };
    ink: InkStroke[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class StrokeRecognitionService {
  private readonly API_URL = 'https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate';

  constructor(private cardsService: CardsService) {}

  /**
   * Recognize handwritten strokes using Google Input Tools API
   */
  async recognize(
    userStrokes: Point[][],
    canvasWidth: number,
    canvasHeight: number
  ): Promise<{ character: string; score: number }[]> {
    if (userStrokes.length === 0) {
      return [];
    }

    // Convert strokes to Google Input Tools format
    const ink: InkStroke[] = userStrokes.map(stroke => {
      const xs: number[] = [];
      const ys: number[] = [];
      const ts: number[] = [];

      for (const point of stroke) {
        xs.push(Math.round(point.x));
        ys.push(Math.round(point.y));
        ts.push(point.t);
      }

      return [xs, ys, ts];
    });

    const payload: GoogleInputRequest = {
      app_version: 0.4,
      api_level: '537.36',
      device: navigator.userAgent,
      input_type: 0,
      options: 'enable_pre_space',
      requests: [{
        max_completions: 0,
        max_num_results: 10,
        pre_context: '',
        writing_guide: {
          writing_area_height: canvasHeight,
          writing_area_width: canvasWidth
        },
        ink
      }]
    };

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error('Recognition failed:', error);
      throw new Error('Handwriting recognition failed. Please check your internet connection.');
    }
  }

  /**
   * Recognize multiple cell interpretations in a single batch request.
   * Each cell's strokes are sent as a separate request item.
   */
  async recognizeBatch(
    cells: { strokes: Point[][]; bounds: { width: number; height: number } }[]
  ): Promise<{ character: string; score: number }[][]> {
    if (cells.length === 0) return [];

    // Build batch requests - one per cell
    const requests = cells.map(cell => {
      const ink: InkStroke[] = cell.strokes.map(stroke => {
        const xs: number[] = [];
        const ys: number[] = [];
        const ts: number[] = [];

        for (const point of stroke) {
          xs.push(Math.round(point.x));
          ys.push(Math.round(point.y));
          ts.push(point.t);
        }

        return [xs, ys, ts] as InkStroke;
      });

      return {
        max_completions: 0,
        max_num_results: 10,
        pre_context: '',
        writing_guide: {
          writing_area_height: Math.round(cell.bounds.height),
          writing_area_width: Math.round(cell.bounds.width)
        },
        ink
      };
    });

    const payload: GoogleInputRequest = {
      app_version: 0.4,
      api_level: '537.36',
      device: navigator.userAgent,
      input_type: 0,
      options: 'enable_pre_space',
      requests
    };

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return this.parseBatchResponse(data, cells.length);
    } catch (error) {
      console.error('Batch recognition failed:', error);
      throw new Error('Handwriting recognition failed. Please check your internet connection.');
    }
  }

  private parseBatchResponse(data: any, expectedCount: number): { character: string; score: number }[][] {
    // Response format: ["SUCCESS", [["query1", ["candidate1", ...]], ["query2", ["candidate1", ...]], ...]]
    if (!data || data[0] !== 'SUCCESS') {
      return Array(expectedCount).fill([]);
    }

    const results: { character: string; score: number }[][] = [];
    const responseItems = data[1] || [];

    for (let i = 0; i < expectedCount; i++) {
      const candidates = responseItems[i]?.[1];
      if (!candidates || candidates.length === 0) {
        results.push([]);
        continue;
      }

      // Filter to single characters only, no punctuation - each cell is one character
      const punctuationRegex = /^[\p{P}\p{S}\p{M}]$/u; // Unicode punctuation, symbols, marks
      const singleCharResults = candidates
        .map((char: string) => char.replace(/\s+/g, ''))
        .filter((char: string) => {
          const chars = [...char];
          if (chars.length !== 1) return false; // Must be single character
          if (punctuationRegex.test(chars[0])) return false; // No punctuation
          return true;
        })
        .map((char: string, index: number) => ({
          character: char,
          score: Math.max(100 - index * 10, 10)
        }));

      results.push(singleCharResults);
    }

    return results;
  }

  private parseResponse(data: any): { character: string; score: number }[] {
    // Response format: ["SUCCESS", [["query", ["candidate1", "candidate2", ...]]]]
    if (!data || data[0] !== 'SUCCESS') {
      return [];
    }

    const candidates = data[1]?.[0]?.[1];
    if (!candidates || candidates.length === 0) {
      return [];
    }

    // Convert to scored results - first candidate is best match
    // Trim whitespace/newlines from API results
    return candidates.map((char: string, index: number) => ({
      character: char.replace(/\s+/g, ''),
      score: Math.max(100 - index * 10, 10)
    }));
  }

  getExpectedStrokeCount(character: string): number {
    return this.cardsService.getStrokeCount(character);
  }
}
