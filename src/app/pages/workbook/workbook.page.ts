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

  constructor(
    private strokeRecognition: StrokeRecognitionService,
    private lessonsService: LessonsService
  ) {
    addIcons({ backspace });
  }

  ngOnInit() {
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

  private setCanvasStyle() {
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private handleMouseDown(e: MouseEvent) {
    this.isDrawing = true;
    const pos = this.getMousePos(e);
    this.currentStroke = [pos];
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDrawing) return;
    const pos = this.getMousePos(e);
    this.currentStroke.push(pos);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  private handleMouseUp() {
    if (this.isDrawing && this.currentStroke.length > 0) {
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
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  private handleTouchMove(e: TouchEvent) {
    if (!this.isDrawing) return;
    e.preventDefault();
    const pos = this.getTouchPos(e);
    this.currentStroke.push(pos);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  private handleTouchEnd() {
    if (this.isDrawing && this.currentStroke.length > 0) {
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
      if (stroke.length < 2) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        this.ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      this.ctx.stroke();
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
