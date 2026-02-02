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
