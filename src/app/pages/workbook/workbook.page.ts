import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { IonContent, IonMenuButton, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { backspace } from 'ionicons/icons';
import { StrokeRecognitionService } from '../../services/stroke-recognition.service';
import { LessonsService, Lesson } from '../../services/lessons.service';

interface Point {
  x: number;
  y: number;
  t: number; // timestamp relative to drawing start
}

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

  // Current lesson
  currentLesson: Lesson | undefined;
  currentCharacter = '';
  promptText = '';

  isChecking = false;
  showResults = false;
  resultStatus: 'correct' | 'befuddled' | 'wrong' | '' = '';
  resultFeedback = '';
  strokeCountInfo = '';
  topMatches: { character: string; score: number }[] = [];

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
    'よし！',
    '判定！',
    'できた！',
    'いざ！',
    '確認',
  ];

  checkButtonText = '';

  constructor(
    private strokeRecognition: StrokeRecognitionService,
    private lessonsService: LessonsService
  ) {
    addIcons({ backspace });
  }

  ngOnInit() {
    this.checkButtonText = this.randomFrom(this.checkButtonLabels);
    this.loadRandomLesson();
  }

  private loadRandomLesson() {
    this.currentLesson = this.lessonsService.getRandomUnlockedLesson();
    if (this.currentLesson) {
      this.currentCharacter = this.currentLesson.answer;
      this.promptText = this.currentLesson.prompt;
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.setupCanvas(), 100);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
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
  private readonly minBrushSize = 4;
  private readonly maxBrushSize = 32;
  private readonly brushSmoothing = 0.05; // How quickly brush responds to speed changes

  private setCanvasStyle() {
    this.ctx.fillStyle = '#fff';
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private lastBrushSize = 0;

  private handleMouseDown(e: MouseEvent) {
    this.isDrawing = true;
    const pos = this.getMousePos(e);
    this.currentStroke = [pos];
    // Start with a medium brush size, will taper in
    this.lastBrushSize = (this.minBrushSize + this.maxBrushSize) / 2;
    // Draw initial dot
    this.drawBrushPoint(pos.x, pos.y, this.minBrushSize * 1.5);
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDrawing) return;
    const pos = this.getMousePos(e);
    const prevPos = this.currentStroke[this.currentStroke.length - 1];
    this.currentStroke.push(pos);
    this.drawBrushSegment(prevPos, pos);
  }

  private handleMouseUp() {
    if (this.isDrawing && this.currentStroke.length > 0) {
      this.drawHarai(this.currentStroke);
      this.strokes.push([...this.currentStroke]);
      this.currentStroke = [];
    }
    this.isDrawing = false;
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    this.isDrawing = true;
    const pos = this.getTouchPos(e);
    this.currentStroke = [pos];
    // Start with a medium brush size
    this.lastBrushSize = (this.minBrushSize + this.maxBrushSize) / 2;
    // Draw initial dot
    this.drawBrushPoint(pos.x, pos.y, this.minBrushSize * 1.5);
  }

  private handleTouchMove(e: TouchEvent) {
    if (!this.isDrawing) return;
    e.preventDefault();
    const pos = this.getTouchPos(e);
    const prevPos = this.currentStroke[this.currentStroke.length - 1];
    this.currentStroke.push(pos);
    this.drawBrushSegment(prevPos, pos);
  }

  private handleTouchEnd() {
    if (this.isDrawing && this.currentStroke.length > 0) {
      this.drawHarai(this.currentStroke);
      this.strokes.push([...this.currentStroke]);
      this.currentStroke = [];
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

  async onCheck() {
    if (this.strokes.length === 0 || !this.currentLesson) return;

    this.isChecking = true;

    try {
      const canvas = this.canvasRef.nativeElement;
      const results = await this.strokeRecognition.recognize(
        this.strokes,
        canvas.width,
        canvas.height
      );

      // Top 5 matches
      this.topMatches = results.slice(0, 5);
      const top5Characters = this.topMatches.map(r => r.character);

      // Check if target character is in top 5
      const targetIndex = top5Characters.indexOf(this.currentCharacter);

      if (targetIndex >= 0 && targetIndex < 5) {
        this.resultStatus = 'correct';
        this.resultFeedback = this.randomFrom(this.correctFeedback);
      } else {
        // Answer not in top 5 - check for befuddlers
        const befuddler = this.currentLesson.befuddlers.find(b =>
          top5Characters.includes(b.answer)
        );

        if (befuddler) {
          this.resultStatus = 'befuddled';
          this.resultFeedback = befuddler.toast;
        } else {
          this.resultStatus = 'wrong';
          this.resultFeedback = this.randomFrom(this.wrongFeedback);
        }
      }

      // Get stroke count info
      const expectedStrokes = this.strokeRecognition.getExpectedStrokeCount(this.currentCharacter);
      this.strokeCountInfo = `Strokes: ${this.strokes.length}/${expectedStrokes}`;

    } catch (error: any) {
      console.error('Recognition error:', error);
      this.resultStatus = 'wrong';
      this.resultFeedback = error.message || 'Recognition failed. Please try on a device.';
      this.topMatches = [];
      this.strokeCountInfo = '';
    }

    this.isChecking = false;
    this.showResults = true;
  }

  dismissResults() {
    this.showResults = false;
    this.clearCanvas();

    // Load new lesson if correct or wrong, keep same if befuddled
    if (this.resultStatus === 'correct' || this.resultStatus === 'wrong') {
      this.loadRandomLesson();
    }
  }

  onUndo() {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      this.redrawStrokes();
    }
  }

  private redrawStrokes() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.setCanvasStyle();

    for (const stroke of this.strokes) {
      if (stroke.length === 0) continue;

      // Reset brush size for each stroke
      this.lastBrushSize = (this.minBrushSize + this.maxBrushSize) / 2;

      // Draw initial point
      this.drawBrushPoint(stroke[0].x, stroke[0].y, this.minBrushSize * 1.5);

      // Draw segments with brush effect
      for (let i = 1; i < stroke.length; i++) {
        this.drawBrushSegment(stroke[i - 1], stroke[i]);
      }

      // Draw harai flick at the end
      this.drawHarai(stroke);
    }
  }

  clearCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.strokes = [];
    this.drawStartTime = 0;
  }

  private randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
