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

  constructor(
    private cardsService: CardsService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cardsService.initialize();
    this.loadAvailableLessons();
  }

  async ionViewWillEnter() {
    await this.cardsService.initialize();
    this.loadAvailableLessons();
  }

  private loadAvailableLessons() {
    this.availableLessons = this.cardsService.getAvailableLessons();
  }

  unlockLesson(lesson: Lesson) {
    this.cardsService.unlockLesson(lesson.id);
    this.loadAvailableLessons();
    this.router.navigate(['/workbook']);
  }

  get hasAnyToUnlock(): boolean {
    return this.availableLessons.length > 0;
  }
}
