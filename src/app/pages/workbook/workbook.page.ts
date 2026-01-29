import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { IonContent, IonMenuButton, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { backspace } from 'ionicons/icons';

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-workbook',
  templateUrl: './workbook.page.html',
  styleUrls: ['./workbook.page.scss'],
  standalone: true,
  imports: [IonContent, IonMenuButton, IonButton, IonIcon],
})
export class WorkbookPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private resizeObserver!: ResizeObserver;
  private strokes: Point[][] = [];
  private currentStroke: Point[] = [];

  constructor() {
    addIcons({ backspace });
  }

  ngOnInit() { }

  ngAfterViewInit() {
    // Delay setup to ensure DOM is ready
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

    // Set canvas size
    this.resizeCanvas();

    // Watch for container resize
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(container);

    // Get context
    this.ctx = canvas.getContext('2d')!;
    this.setCanvasStyle();

    // Mouse events
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    // Touch events
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

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private getTouchPos(e: TouchEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    };
  }

  onCheck() {
    // TODO: Implement character recognition
    console.log('Check button pressed');
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
  }
}
