import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { IonContent, IonMenuButton, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { backspace, trashOutline, brushOutline, ellipseOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { StrokeRecognitionService } from '../../services/stroke-recognition.service';
import { CardsService, Card } from '../../services/cards.service';
import { CollectionService } from '../../services/collection.service';
import { Segmenter, SegmentResult, Point } from 'mojidoodle-algo-segmenter';

@Component({
  selector: 'app-workbook',
  templateUrl: './workbook.page.html',
  styleUrls: ['./workbook.page.scss'],
  standalone: true,
  imports: [IonContent, IonMenuButton, IonButton, IonIcon, IonSpinner, CommonModule],
})
export class WorkbookPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private resizeObserver!: ResizeObserver;
  private strokes: Point[][] = [];
  private currentStroke: Point[] = [];
  private drawStartTime = 0; // timestamp when drawing started

  // Current card
  currentCard: Card | undefined;
  currentCharacter = '';
  promptText = '';
  promptColor = '#FFFFFF';
  noCardsAvailable = false;

  isChecking = false;
  showResults = false;
  resultStatus: 'correct' | 'befuddled' | 'wrong' | '' = '';
  resultFeedback = '';
  strokeCountInfo = '';
  topMatches: { character: string; score: number }[] = [];
  displayMatches: { character: string; score: number }[] = [];
  correctAnswer = '';

  // Subscription for card availability polling
  private cardAvailabilitySubscription: Subscription | null = null;

  // Segmentation state
  private segmentationTimer: ReturnType<typeof setTimeout> | null = null;
  private segmentResult: SegmentResult | null = null;
  private readonly SEGMENTATION_DELAY_MS = 500;

  // Segmenter instance
  private segmenter = new Segmenter();

  // SVG overlays (bound in template)
  lassoSvgContent: SafeHtml = '';
  segmentationSvgContent: SafeHtml = '';

  // Batch recognition results for multi-character grading
  private lastBatchResults: { character: string; score: number }[][] = [];

  // Drawing mode: brush (default) or lasso
  drawMode: 'brush' | 'lasso' = 'brush';

  // Lasso state
  private lassos: { points: {x: number, y: number}[] }[] = [];
  private currentLasso: {x: number, y: number}[] = [];
  private lassoStartPos: {x: number, y: number} | null = null;

  // Lasso hues in lug-nut pattern (24 pastel colors distributed around color wheel)
  // Pattern skips by 11 positions (coprime with 24) like tightening lug nuts
  private readonly LASSO_HUES = [
    0, 165, 330, 135, 300, 105, 270, 75, 240, 45, 210, 15,
    180, 345, 150, 315, 120, 285, 90, 255, 60, 225, 30, 195
  ];

  /**
   * Get lasso color as hsla string.
   * Pastel colors: 55% saturation, 78% lightness.
   */
  private getLassoColorFromIndex(index: number, opacity: number = 1.0): string {
    const hue = this.LASSO_HUES[index % this.LASSO_HUES.length];
    return `hsla(${hue}, 55%, 78%, ${opacity})`;
  }

  // Small kana → big kana mapping for fuzzy matching
  // The API often returns big kana when user writes small kana
  private static readonly SMALL_TO_BIG_KANA: Record<string, string> = {
    // Hiragana
    'っ': 'つ', 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ',
    'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お',
    'ゎ': 'わ',
    // Katakana
    'ッ': 'ツ', 'ャ': 'ヤ', 'ュ': 'ユ', 'ョ': 'ヨ',
    'ァ': 'ア', 'ィ': 'イ', 'ゥ': 'ウ', 'ェ': 'エ', 'ォ': 'オ',
    'ヮ': 'ワ',
  };

  // Chōon (長音) mark equivalents - vertical line characters (全角/半角)
  // that the API returns when drawing the prolonged sound mark vertically
  private static readonly CHOON_EQUIVALENTS = new Set([
    'ー',  // U+30FC Katakana-Hiragana Prolonged Sound Mark
    '|',  // U+007C Vertical Line (halfwidth)
    '｜', // U+FF5C Fullwidth Vertical Line
  ]);

  // Wave dash equivalents - the API often returns ASCII tilde for wave dash
  private static readonly WAVE_DASH_EQUIVALENTS = new Set([
    '〜', // U+301C Wave Dash (Japanese)
    '~',  // U+007E Tilde (ASCII)
    '～', // U+FF5E Fullwidth Tilde
  ]);

  /**
   * Check if two characters match, treating small/big kana as equivalent,
   * chōon mark as equivalent to various line characters,
   * and wave dash as equivalent to tilde characters.
   * e.g., 'っ' matches 'つ', 'ッ' matches 'ツ', 'ー' matches '|', '〜' matches '~'
   */
  private kanaMatch(target: string, candidate: string): boolean {
    if (target === candidate) return true;

    // Check chōon equivalence
    if (WorkbookPage.CHOON_EQUIVALENTS.has(target) &&
        WorkbookPage.CHOON_EQUIVALENTS.has(candidate)) {
      return true;
    }

    // Check wave dash equivalence
    if (WorkbookPage.WAVE_DASH_EQUIVALENTS.has(target) &&
        WorkbookPage.WAVE_DASH_EQUIVALENTS.has(candidate)) {
      return true;
    }

    // Check if target's big form matches candidate
    const targetBig = WorkbookPage.SMALL_TO_BIG_KANA[target];
    if (targetBig && targetBig === candidate) return true;
    // Check if candidate's big form matches target
    const candidateBig = WorkbookPage.SMALL_TO_BIG_KANA[candidate];
    if (candidateBig && candidateBig === target) return true;
    // Check if both normalize to the same big form
    if (targetBig && candidateBig && targetBig === candidateBig) return true;
    return false;
  }

  private correctFeedback = [
    '正解!',
    'まる!',
    'はなまる!',
    'よくやった!',
    'すごい!',
    'かんぺき!',
    'ばっちり!',
    'その調子!',
  ];

  private wrongFeedback = [
    'ちがう!',
    'ざんねん!',
    'はずれ!',
    'ふせいかい!',
    'バツ!',
  ];

  private checkButtonLabels = [
    'よし!',
    '判定!',
    'できた!',
    'いざ!',
    '確認',
  ];

  private dismissButtonLabels = [
    '次!',
    'つぎ!',
    'よし!',
    'オッケー!',
    'はい!',
    '了解!',
    'いくぞ!',
  ];

  checkButtonText = '';
  dismissButtonText = '';

  constructor(
    private strokeRecognition: StrokeRecognitionService,
    private cardsService: CardsService,
    private collectionService: CollectionService,
    private sanitizer: DomSanitizer
  ) {
    addIcons({ backspace, trashOutline, brushOutline, ellipseOutline });
  }

  async ngOnInit() {
    this.checkButtonText = this.randomFrom(this.checkButtonLabels);
    await this.cardsService.initialize();
    this.loadRandomCard();

    // Subscribe to card availability for auto-loading when cards become available
    this.cardAvailabilitySubscription = this.cardsService.cardAvailability$.subscribe(count => {
      if (this.noCardsAvailable && count > 0) {
        this.loadRandomCard();
      }
    });
  }

  private loadRandomCard() {
    this.currentCard = this.cardsService.getRandomUnlockedCard();
    if (this.currentCard) {
      // Use first answer as the primary display character
      this.currentCharacter = this.currentCard.answers[0];
      this.promptText = this.currentCard.prompt;
      this.promptColor = this.cardsService.getStageColor(this.currentCard.stage);
      this.noCardsAvailable = false;
    } else {
      this.noCardsAvailable = true;
      this.promptText = '';
      this.promptColor = '#FFFFFF';
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.setupCanvas(), 100);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.cardAvailabilitySubscription) {
      this.cardAvailabilitySubscription.unsubscribe();
    }
    this.cancelSegmentation();
  }

  private setupCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;

    if (!container) return;

    this.resizeCanvas();

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(container);

    this.ctx = canvas.getContext('2d')!;
    this.setCanvasStyle();

    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (this.ctx) {
        this.setCanvasStyle();
      }
    }
  }

  // Brush settings for shodo-style strokes
  private readonly minBrushSize = 3;
  private readonly maxBrushSize = 24;
  private readonly brushSmoothing = 0.05; // How quickly brush responds to speed changes

  private setCanvasStyle() {
    this.ctx.fillStyle = '#fff';
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private lastBrushSize = 0;

  private handleMouseDown(e: MouseEvent) {
    this.cancelSegmentation();
    this.isDrawing = true;
    const pos = this.getMousePos(e);

    if (this.drawMode === 'lasso') {
      // Lasso mode: start new lasso or check for tap-to-delete
      this.lassoStartPos = { x: pos.x, y: pos.y };
      this.currentLasso = [{ x: pos.x, y: pos.y }];
    } else {
      // Brush mode: normal stroke drawing
      this.currentStroke = [pos];
      this.lastBrushSize = (this.minBrushSize + this.maxBrushSize) / 2;
      this.drawBrushPoint(pos.x, pos.y, this.minBrushSize * 1.5);
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDrawing) return;
    const pos = this.getMousePos(e);

    if (this.drawMode === 'lasso') {
      // Lasso mode: capture lasso points
      this.currentLasso.push({ x: pos.x, y: pos.y });
      this.fullRedraw();
    } else {
      // Brush mode: normal stroke drawing
      const prevPos = this.currentStroke[this.currentStroke.length - 1];
      this.currentStroke.push(pos);
      this.drawBrushSegment(prevPos, pos);
    }
  }

  private handleMouseUp() {
    if (!this.isDrawing) return;

    if (this.drawMode === 'lasso') {
      // Check if this was a tap (very few points) vs a drawn lasso
      if (this.lassoStartPos && this.currentLasso.length > 0) {
        // If we have enough points to be a real lasso, complete it
        // Otherwise treat as a tap to delete
        if (this.currentLasso.length >= 5) {
          this.completeLasso();
        } else {
          // Tap detected - try to delete a lasso
          this.handleLassoTap(this.lassoStartPos.x, this.lassoStartPos.y);
          this.currentLasso = [];
        }
      }
      this.lassoStartPos = null;
    } else {
      // Brush mode: complete stroke
      if (this.currentStroke.length > 0) {
        this.drawHarai(this.currentStroke);
        this.strokes.push([...this.currentStroke]);
        this.currentStroke = [];
        this.scheduleSegmentation();
      }
    }

    this.isDrawing = false;
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    this.cancelSegmentation();
    this.isDrawing = true;
    const pos = this.getTouchPos(e);

    if (this.drawMode === 'lasso') {
      // Lasso mode: start new lasso or check for tap-to-delete
      this.lassoStartPos = { x: pos.x, y: pos.y };
      this.currentLasso = [{ x: pos.x, y: pos.y }];
    } else {
      // Brush mode: normal stroke drawing
      this.currentStroke = [pos];
      this.lastBrushSize = (this.minBrushSize + this.maxBrushSize) / 2;
      this.drawBrushPoint(pos.x, pos.y, this.minBrushSize * 1.5);
    }
  }

  private handleTouchMove(e: TouchEvent) {
    if (!this.isDrawing) return;
    e.preventDefault();
    const pos = this.getTouchPos(e);

    if (this.drawMode === 'lasso') {
      // Lasso mode: capture lasso points
      this.currentLasso.push({ x: pos.x, y: pos.y });
      this.fullRedraw();
    } else {
      // Brush mode: normal stroke drawing
      const prevPos = this.currentStroke[this.currentStroke.length - 1];
      this.currentStroke.push(pos);
      this.drawBrushSegment(prevPos, pos);
    }
  }

  private handleTouchEnd() {
    if (!this.isDrawing) return;

    if (this.drawMode === 'lasso') {
      // Check if this was a tap (very few points) vs a drawn lasso
      if (this.lassoStartPos && this.currentLasso.length > 0) {
        // If we have enough points to be a real lasso, complete it
        // Otherwise treat as a tap to delete
        if (this.currentLasso.length >= 5) {
          this.completeLasso();
        } else {
          // Tap detected - try to delete a lasso
          this.handleLassoTap(this.lassoStartPos.x, this.lassoStartPos.y);
          this.currentLasso = [];
        }
      }
      this.lassoStartPos = null;
    } else {
      // Brush mode: complete stroke
      if (this.currentStroke.length > 0) {
        this.drawHarai(this.currentStroke);
        this.strokes.push([...this.currentStroke]);
        this.currentStroke = [];
        this.scheduleSegmentation();
      }
    }

    this.isDrawing = false;
  }

  private getMousePos(e: MouseEvent): Point {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const now = Date.now();

    // Set start time on first point
    if (this.drawStartTime === 0) {
      this.drawStartTime = now;
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      t: now - this.drawStartTime
    };
  }

  private getTouchPos(e: TouchEvent): Point {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const now = Date.now();

    // Set start time on first point
    if (this.drawStartTime === 0) {
      this.drawStartTime = now;
    }

    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
      t: now - this.drawStartTime
    };
  }

  /**
   * Calculate brush size based on drawing velocity.
   * Slower drawing = thicker stroke (like pressing harder with a brush)
   * Faster drawing = thinner stroke (like a quick flick)
   */
  private calculateBrushSize(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dt = Math.max(p2.t - p1.t, 1); // Avoid division by zero
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = distance / dt; // pixels per millisecond

    // Map velocity to brush size (inverse relationship)
    // Typical velocity range: 0.1 (slow) to 2.0 (fast) px/ms
    const normalizedVelocity = Math.min(velocity / 1.5, 1);
    const targetSize = this.maxBrushSize - normalizedVelocity * (this.maxBrushSize - this.minBrushSize);

    // Smooth the brush size transition for natural feel
    const smoothedSize = this.lastBrushSize + (targetSize - this.lastBrushSize) * this.brushSmoothing;
    this.lastBrushSize = smoothedSize;

    return smoothedSize;
  }

  /**
   * Draw a single brush point (used for stroke start)
   */
  private drawBrushPoint(x: number, y: number, size: number) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Draw a brush segment between two points with variable width
   */
  private drawBrushSegment(p1: Point, p2: Point) {
    const brushSize = this.calculateBrushSize(p1, p2);

    // Draw the segment as a thick line with rounded ends
    this.ctx.lineWidth = brushSize;
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();

    // Draw circle at the end point for smooth connection
    this.drawBrushPoint(p2.x, p2.y, brushSize);
  }

  /**
   * Draw harai (払い) - the tapered flick at the end of a stroke
   * Calculates direction and velocity from the last points and extends
   * with a tapering tail
   */
  private drawHarai(stroke: Point[]) {
    if (stroke.length < 3) return;

    // Get the last few points to calculate direction and velocity
    const numPoints = Math.min(5, stroke.length);
    const recentPoints = stroke.slice(-numPoints);

    const lastPoint = recentPoints[recentPoints.length - 1];
    const earlierPoint = recentPoints[0];

    // Calculate direction vector
    const dx = lastPoint.x - earlierPoint.x;
    const dy = lastPoint.y - earlierPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) return; // Too short, no flick needed

    // Normalize direction
    const dirX = dx / distance;
    const dirY = dy / distance;

    // Calculate velocity to determine flick length
    const dt = Math.max(lastPoint.t - earlierPoint.t, 1);
    const velocity = distance / dt;

    // Flick length based on velocity (faster = longer flick)
    const flickLength = Math.min(velocity * 20, 40);

    if (flickLength < 8) return; // Too slow, no visible flick

    // Draw tapered flick
    const steps = 8;
    const startSize = this.lastBrushSize;

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const nextT = (i + 1) / steps;

      // Ease out for natural taper
      const easeT = 1 - Math.pow(1 - t, 2);
      const easeNextT = 1 - Math.pow(1 - nextT, 2);

      const x1 = lastPoint.x + dirX * flickLength * easeT;
      const y1 = lastPoint.y + dirY * flickLength * easeT;
      const x2 = lastPoint.x + dirX * flickLength * easeNextT;
      const y2 = lastPoint.y + dirY * flickLength * easeNextT;

      // Taper the brush size to a point
      const size = startSize * (1 - nextT);

      if (size > 0.5) {
        this.ctx.lineWidth = size;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      }
    }
  }

  /**
   * Check the user's handwriting against the current card's answer.
   *
   * FLOW:
   * 1. Segment strokes into character cells using the segmenter module
   * 2. Characters are already sorted in Japanese reading order by the module
   * 3. Send cells to API:
   *    - Single cell: regular recognition
   *    - Multiple cells: batch recognition (one request per cell)
   * 4. Grade by working BACKWARDS from the answer:
   *    - Split target answer into characters
   *    - Check if each character appears in corresponding cell's top 5 results
   *    - All match = correct, any miss = check befuddlers, then wrong
   */
  async onCheck() {
    if (this.strokes.length === 0 || !this.currentCard) return;

    this.isChecking = true;

    try {
      const canvas = this.canvasRef.nativeElement;

      // Calculate max answer length to determine if segmentation is needed
      const maxAnswerLength = Math.max(...this.currentCard.answers.map(a => [...a.replace(/\s+/g, '')].length));

      let results: { character: string; score: number }[];

      // Run segmentation for multi-character answers
      if (maxAnswerLength > 1) {
        const result = this.segmenter.segment({
          strokes: this.strokes,
          lassos: this.lassos,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          maxCharacters: maxAnswerLength,
        });
        this.segmentResult = result;

        if (result.characters.length <= 1) {
          // Single character — regular recognition
          this.lastBatchResults = [];
          results = await this.strokeRecognition.recognize(
            this.strokes,
            canvas.width,
            canvas.height
          );
        } else {
          // Multi-character — batch recognition, already sorted in reading order
          const cellData = result.characters.map(c => ({
            strokes: c.strokes,
            bounds: { width: c.bounds.width, height: c.bounds.height }
          }));

          const batchResults = await this.strokeRecognition.recognizeBatch(cellData);

          // Store batch results for answer checking
          this.lastBatchResults = batchResults;

          // Build display results from top candidate of each cell
          const topChars = batchResults.map(r => r[0]?.character || '?').join('');
          results = [{ character: topChars, score: 100 }];

          // Also add individual cell interpretations for debugging
          console.log('Cell interpretations (Japanese reading order):', batchResults.map((r, i) => ({
            cell: i,
            top5: r.slice(0, 5).map(c => c.character)
          })));
        }
      } else {
        // Single character card — no segmentation needed
        this.segmentResult = null;
        this.lastBatchResults = [];
        results = await this.strokeRecognition.recognize(
          this.strokes,
          canvas.width,
          canvas.height
        );
      }

      // Top matches for display
      this.topMatches = results.slice(0, 5);

      // Normalize all valid answers for comparison
      const normalizedAnswers = this.currentCard.answers.map(a => a.replace(/\s+/g, ''));

      // Check if answer matches - different logic for single vs multi-character
      let isCorrect = false;
      let matchedAnswer = '';

      if (this.lastBatchResults.length > 0) {
        // Multi-character: check if each char of ANY valid answer is in corresponding cell's results
        for (const normalizedTarget of normalizedAnswers) {
          const targetChars = [...normalizedTarget]; // Split into characters (unicode-safe)

          if (targetChars.length !== this.lastBatchResults.length) continue;

          // Check each character against its cell's top 5 candidates (with kana fuzzy matching)
          const allMatch = targetChars.every((char, idx) => {
            const cellCandidates = this.lastBatchResults[idx].slice(0, 5).map(r => r.character);
            const matched = cellCandidates.some(candidate => this.kanaMatch(char, candidate));
            console.log(`  Cell ${idx}: target='${char}' (code=${char.charCodeAt(0)}), candidates=[${cellCandidates.map(c => `'${c}'(${c.charCodeAt(0)})`).join(', ')}], matched=${matched}`);
            return matched;
          });

          if (allMatch) {
            isCorrect = true;
            matchedAnswer = normalizedTarget;
            break;
          }
        }

        console.log('Grading multi-char:', {
          targets: normalizedAnswers,
          cellResults: this.lastBatchResults.map(r => r.slice(0, 5).map(c => c.character)),
          isCorrect,
          matchedAnswer
        });
      } else {
        // Single character: check if ANY valid answer is in top 5 (with kana fuzzy matching)
        const top5Characters = this.topMatches.map(r => r.character);
        for (const target of normalizedAnswers) {
          if (top5Characters.some(candidate => this.kanaMatch(target, candidate))) {
            isCorrect = true;
            matchedAnswer = target;
            break;
          }
        }
      }

      if (isCorrect) {
        this.resultStatus = 'correct';
        this.resultFeedback = this.randomFrom(this.correctFeedback);
        // Show the matched answer, not the raw API result
        this.displayMatches = [{ character: matchedAnswer, score: 1 }];
        this.correctAnswer = '';
        // Advance card to next SRS stage
        this.cardsService.advanceCard(this.currentCard.id);
      } else {
        // Check for befuddlers using same backwards logic
        let matchedBefuddler: { answers: string[]; toast: string } | undefined;

        if (this.lastBatchResults.length > 0) {
          // Multi-character: check if ANY befuddler answer matches cell results (with kana fuzzy matching)
          console.log('Checking befuddlers:', this.currentCard.befuddlers.map(b => ({ answers: b.answers, toast: b.toast.slice(0, 30) })));
          matchedBefuddler = this.currentCard.befuddlers.find(b => {
            console.log('  Befuddler answers:', b.answers);
            return b.answers.some(answer => {
              const befuddlerChars = [...answer.replace(/\s+/g, '')];
              console.log(`    Checking "${answer}": ${befuddlerChars.length} chars vs ${this.lastBatchResults.length} cells`);
              if (befuddlerChars.length !== this.lastBatchResults.length) return false;
              const allMatch = befuddlerChars.every((char, idx) => {
                const cellCandidates = this.lastBatchResults[idx].slice(0, 5).map(r => r.character);
                const matched = cellCandidates.some(candidate => this.kanaMatch(char, candidate));
                console.log(`      Cell ${idx}: '${char}' vs [${cellCandidates.join(',')}] = ${matched}`);
                return matched;
              });
              console.log(`    Result: ${allMatch}`);
              return allMatch;
            });
          });
        } else {
          // Single character: check if ANY befuddler answer is in top 5 (with kana fuzzy matching)
          const top5Characters = this.topMatches.map(r => r.character);
          matchedBefuddler = this.currentCard.befuddlers.find(b =>
            b.answers.some(answer =>
              top5Characters.some(candidate => this.kanaMatch(answer.replace(/\s+/g, ''), candidate))
            )
          );
        }

        if (matchedBefuddler) {
          this.resultStatus = 'befuddled';
          this.resultFeedback = matchedBefuddler.toast;
          this.displayMatches = this.topMatches;
          this.correctAnswer = '';
        } else {
          this.resultStatus = 'wrong';
          this.resultFeedback = this.randomFrom(this.wrongFeedback);
          this.displayMatches = this.topMatches;
          this.correctAnswer = this.currentCard.answers[0];
          // Demote card (respects invulnerability)
          this.cardsService.demoteCard(this.currentCard.id);
        }
      }

      // Get stroke count info
      const expectedStrokes = this.strokeRecognition.getExpectedStrokeCount(this.currentCharacter);
      this.strokeCountInfo = `Strokes: ${this.strokes.length}/${expectedStrokes}`;

      // Export sample for segmentation training data
      this.exportCollectionSample(isCorrect);

    } catch (error: any) {
      console.error('Recognition error:', error);
      this.resultStatus = 'wrong';
      this.resultFeedback = error.message || 'Recognition failed. Please try on a device.';
      this.topMatches = [];
      this.displayMatches = [];
      this.strokeCountInfo = '';
    }

    this.isChecking = false;
    this.checkButtonText = this.randomFrom(this.checkButtonLabels);
    this.dismissButtonText = this.randomFrom(this.dismissButtonLabels);
    this.showResults = true;
  }

  dismissResults() {
    this.showResults = false;
    this.clearCanvas();

    // Load new lesson if correct or wrong, keep same if befuddled
    if (this.resultStatus === 'correct' || this.resultStatus === 'wrong') {
      this.loadRandomCard();
    }
  }

  onUndo() {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      this.fullRedraw();
      this.scheduleSegmentation();
    }
  }

  clearCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.strokes = [];
    this.lassos = [];
    this.currentLasso = [];
    this.drawStartTime = 0;
    this.drawMode = 'brush';
    this.cancelSegmentation();
    this.segmentResult = null;
    this.lassoSvgContent = '';
    this.segmentationSvgContent = '';
  }

  private randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ============================================================
  // Lasso Mode Methods
  // ============================================================

  /**
   * Switch between brush and lasso drawing modes.
   */
  setDrawMode(mode: 'brush' | 'lasso'): void {
    this.drawMode = mode;
  }

  /**
   * Clear all strokes and lassos.
   */
  onClearAll(): void {
    this.clearCanvas();
    this.lassos = [];
  }

  /**
   * Point-in-polygon test using ray casting algorithm.
   * Used for lasso tap-to-delete detection.
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
   * Get stroke color based on segmentation result lasso assignments.
   */
  private getStrokeColorFromResult(strokeIndex: number): string {
    if (!this.segmentResult) return '#fff';
    for (let i = 0; i < this.segmentResult.lassos.length; i++) {
      if (this.segmentResult.lassos[i].strokeIndices.includes(strokeIndex)) {
        return this.getLassoColorFromIndex(i);
      }
    }
    return '#fff';
  }

  /**
   * Handle tap on lasso to delete it (only in lasso mode).
   * Returns true if a lasso was deleted.
   */
  private handleLassoTap(x: number, y: number): boolean {
    // Check if tap is inside any lasso (reverse order so newest is checked first)
    for (let i = this.lassos.length - 1; i >= 0; i--) {
      if (this.isPointInPolygon({x, y}, this.lassos[i].points)) {
        this.lassos.splice(i, 1);
        this.analyzeAndVisualize();
        return true;
      }
    }
    return false;
  }

  /**
   * Complete the current lasso being drawn.
   */
  private completeLasso(): void {
    if (this.currentLasso.length < 3) {
      this.currentLasso = [];
      return;
    }

    this.lassos.push({ points: [...this.currentLasso] });
    this.currentLasso = [];
    this.analyzeAndVisualize();
  }

  /**
   * Draw the current lasso being drawn (not yet complete).
   */
  private drawCurrentLasso(): void {
    if (this.currentLasso.length < 2) return;

    this.ctx.save();
    this.ctx.strokeStyle = this.getLassoColorFromIndex(this.lassos.length, 0.5);
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([6, 4]);

    this.ctx.beginPath();
    this.ctx.moveTo(this.currentLasso[0].x, this.currentLasso[0].y);
    for (let i = 1; i < this.currentLasso.length; i++) {
      this.ctx.lineTo(this.currentLasso[i].x, this.currentLasso[i].y);
    }
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * Draw a single stroke with a specific color.
   */
  private drawStrokeWithColor(stroke: Point[], color: string): void {
    if (stroke.length === 0) return;

    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;

    // Reset brush size for this stroke
    this.lastBrushSize = (this.minBrushSize + this.maxBrushSize) / 2;

    // Draw initial point
    this.ctx.beginPath();
    this.ctx.arc(stroke[0].x, stroke[0].y, this.minBrushSize * 1.5 / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw segments with brush effect
    for (let i = 1; i < stroke.length; i++) {
      const brushSize = this.calculateBrushSize(stroke[i - 1], stroke[i]);
      this.ctx.lineWidth = brushSize;
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[i - 1].x, stroke[i - 1].y);
      this.ctx.lineTo(stroke[i].x, stroke[i].y);
      this.ctx.stroke();

      // Draw circle at end point
      this.ctx.beginPath();
      this.ctx.arc(stroke[i].x, stroke[i].y, brushSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw harai flick at the end (inline to preserve color)
    if (stroke.length >= 3) {
      const numPoints = Math.min(5, stroke.length);
      const recentPoints = stroke.slice(-numPoints);
      const lastPoint = recentPoints[recentPoints.length - 1];
      const earlierPoint = recentPoints[0];

      const dx = lastPoint.x - earlierPoint.x;
      const dy = lastPoint.y - earlierPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance >= 5) {
        const dirX = dx / distance;
        const dirY = dy / distance;
        const dt = Math.max(lastPoint.t - earlierPoint.t, 1);
        const velocity = distance / dt;
        const flickLength = Math.min(velocity * 20, 40);

        if (flickLength >= 8) {
          const steps = 8;
          const startSize = this.lastBrushSize;

          for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const nextT = (i + 1) / steps;
            const easeT = 1 - Math.pow(1 - t, 2);
            const easeNextT = 1 - Math.pow(1 - nextT, 2);

            const x1 = lastPoint.x + dirX * flickLength * easeT;
            const y1 = lastPoint.y + dirY * flickLength * easeT;
            const x2 = lastPoint.x + dirX * flickLength * easeNextT;
            const y2 = lastPoint.y + dirY * flickLength * easeNextT;

            const size = startSize * (1 - nextT);
            if (size > 0.5) {
              this.ctx.lineWidth = size;
              this.ctx.beginPath();
              this.ctx.moveTo(x1, y1);
              this.ctx.lineTo(x2, y2);
              this.ctx.stroke();
            }
          }
        }
      }
    }

    this.ctx.restore();
  }

  /**
   * Full redraw including strokes with lasso colors and SVG overlays.
   */
  private fullRedraw(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update SVG overlays (sanitized for Angular innerHTML binding)
    this.lassoSvgContent = this.sanitizer.bypassSecurityTrustHtml(
      this.segmentResult?.lassoSvg ?? ''
    );
    this.segmentationSvgContent = this.sanitizer.bypassSecurityTrustHtml(
      this.segmentResult?.segmentationSvg ?? ''
    );

    // Draw current lasso being drawn (interactive, stays on canvas)
    if (this.currentLasso.length > 1) {
      this.drawCurrentLasso();
    }

    // Draw strokes — use module's annotated stroke data for coloring
    if (this.segmentResult) {
      for (const annotated of this.segmentResult.strokes) {
        const color = this.getStrokeColorFromResult(annotated.index);
        this.drawStrokeWithColor(this.strokes[annotated.index], color);
      }
    } else {
      for (const stroke of this.strokes) {
        this.drawStrokeWithColor(stroke, '#fff');
      }
    }
  }

  /**
   * Schedule segmentation analysis after a delay.
   * Debounces rapid stroke completions.
   */
  private scheduleSegmentation(): void {
    this.cancelSegmentation();

    if (this.strokes.length === 0) {
      this.segmentResult = null;
      this.lassoSvgContent = '';
      this.segmentationSvgContent = '';
      return;
    }

    this.segmentationTimer = setTimeout(() => {
      this.analyzeAndVisualize();
    }, this.SEGMENTATION_DELAY_MS);
  }

  /**
   * Cancel any pending segmentation analysis.
   */
  private cancelSegmentation(): void {
    if (this.segmentationTimer !== null) {
      clearTimeout(this.segmentationTimer);
      this.segmentationTimer = null;
    }
  }

  /**
   * Run segmentation analysis and redraw with visualization.
   * Skips segmentation for single-character cards to avoid false positives.
   */
  private analyzeAndVisualize(): void {
    if (this.strokes.length === 0 || !this.currentCard) {
      this.segmentResult = null;
      this.fullRedraw();
      return;
    }

    const maxAnswerLength = Math.max(
      ...this.currentCard.answers.map(a => [...a.replace(/\s+/g, '')].length)
    );
    if (maxAnswerLength <= 1) {
      this.segmentResult = null;
      this.fullRedraw();
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    this.segmentResult = this.segmenter.segment({
      strokes: this.strokes,
      lassos: this.lassos,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      maxCharacters: maxAnswerLength,
    });

    this.fullRedraw();
  }

  /**
   * Export sample data for segmentation model training.
   * Called after every grading to collect training data.
   */
  private exportCollectionSample(success: boolean): void {
    if (!this.currentCard) return;

    const canvas = this.canvasRef.nativeElement;

    // Build recognition results array
    // For single-char: wrap topMatches in array (one cell)
    // For multi-char: use lastBatchResults directly
    let recognitionResults: { character: string; score: number }[][] | null = null;
    if (this.lastBatchResults.length > 0) {
      recognitionResults = this.lastBatchResults;
    } else if (this.topMatches.length > 0) {
      recognitionResults = [this.topMatches];
    }

    this.collectionService.exportSample({
      strokes: this.strokes,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      segmentResult: this.segmentResult,
      answers: this.currentCard.answers,
      recognitionResults,
      success,
      cardId: this.currentCard.id,
    });
  }
}
