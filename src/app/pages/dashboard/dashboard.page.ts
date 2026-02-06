import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonButton, ViewWillEnter } from '@ionic/angular/standalone';
import { CardsService, Lesson } from '../../services/cards.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonButton],
})
export class DashboardPage implements OnInit, ViewWillEnter {
  availableLessons: Lesson[] = [];
  upcomingUnlocks: { hour: number; count: number; segments: { stage: number; count: number; color: string }[]; label: string }[] = [];
  nowUnlocks: { count: number; segments: { stage: number; count: number; color: string }[] } = { count: 0, segments: [] };
  maxUnlockCount = 0;

  constructor(
    private cardsService: CardsService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cardsService.initialize();
    this.loadData();
  }

  async ionViewWillEnter() {
    await this.cardsService.initialize();
    this.loadData();
  }

  private loadData() {
    this.availableLessons = this.cardsService.getAvailableLessons();
    this.upcomingUnlocks = this.cardsService.getUpcomingUnlocksByHour(48);
    this.nowUnlocks = this.cardsService.getAvailableCardsByStage();
    this.maxUnlockCount = Math.max(...this.upcomingUnlocks.map(u => u.count), this.nowUnlocks.count, 1);
  }

  get hasUpcomingUnlocks(): boolean {
    return this.nowUnlocks.count > 0 || this.upcomingUnlocks.some(u => u.count > 0);
  }

  getBarHeight(count: number): string {
    if (this.maxUnlockCount === 0) return '0%';
    return (count / this.maxUnlockCount * 100) + '%';
  }

  getSegmentHeight(count: number): string {
    if (this.maxUnlockCount === 0) return '0%';
    return (count / this.maxUnlockCount * 100) + '%';
  }

  get yAxisTicks(): number[] {
    const max = this.maxUnlockCount;
    if (max <= 5) {
      // For small counts, show each integer from max down to 0
      const ticks: number[] = [];
      for (let i = max; i >= 0; i--) {
        ticks.push(i);
      }
      return ticks;
    }
    // For larger counts, pick ~5 nice integer ticks
    const step = Math.ceil(max / 4);
    const ticks: number[] = [];
    for (let i = 4; i >= 0; i--) {
      const tick = Math.min(step * i, max);
      if (ticks.length === 0 || ticks[ticks.length - 1] !== tick) {
        ticks.push(tick);
      }
    }
    return ticks;
  }

  get xAxisTicks(): { label: string; position: number }[] {
    const ticks: { label: string; position: number }[] = [];
    // Show ticks at 12h, 24h, 36h, 48h (Now is a separate section)
    const hours = [0, 12, 24, 36, 48];
    for (const h of hours) {
      const position = (h / 48) * 100;
      ticks.push({ label: h === 0 ? '' : `+${h}h`, position });
    }
    return ticks;
  }

  goToWorkbook() {
    this.router.navigate(['/workbook']);
  }

  unlockLesson(lesson: Lesson) {
    this.cardsService.unlockLesson(lesson.id);
    this.loadData();
  }

  get hasAnyToUnlock(): boolean {
    return this.availableLessons.length > 0;
  }
}
