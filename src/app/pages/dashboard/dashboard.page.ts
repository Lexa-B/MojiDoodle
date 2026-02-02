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
  upcomingUnlocks: { hour: number; count: number; label: string }[] = [];
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
    this.maxUnlockCount = Math.max(...this.upcomingUnlocks.map(u => u.count), 1);
  }

  get hasUpcomingUnlocks(): boolean {
    return this.upcomingUnlocks.some(u => u.count > 0);
  }

  getBarHeight(count: number): string {
    if (this.maxUnlockCount === 0) return '0%';
    return (count / this.maxUnlockCount * 100) + '%';
  }

  get yAxisTicks(): number[] {
    const ticks: number[] = [];
    const max = this.maxUnlockCount;
    // Create 5 ticks from max to 0
    for (let i = 0; i <= 4; i++) {
      ticks.push(Math.round(max * (4 - i) / 4));
    }
    return ticks;
  }

  get xAxisTicks(): { label: string; position: number }[] {
    const ticks: { label: string; position: number }[] = [];
    // Show ticks at 0h, 12h, 24h, 36h, 48h
    const hours = [0, 12, 24, 36, 48];
    for (const h of hours) {
      const position = (h / 48) * 100;
      let label: string;
      if (h === 0) {
        label = 'Now';
      } else {
        label = `+${h}h`;
      }
      ticks.push({ label, position });
    }
    return ticks;
  }

  unlockLesson(lesson: Lesson) {
    this.cardsService.unlockLesson(lesson.id);
    this.loadData();
    this.router.navigate(['/workbook']);
  }

  get hasAnyToUnlock(): boolean {
    return this.availableLessons.length > 0;
  }
}
