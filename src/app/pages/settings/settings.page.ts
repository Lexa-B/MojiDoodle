import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonList, IonListHeader, IonLabel, IonItem, IonButton, IonToggle } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { CardsService } from '../../services/cards.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonList, IonListHeader, IonLabel, IonItem, IonButton, IonToggle],
})
export class SettingsPage implements OnInit {

  categories = [
    { id: 'hiragana', label: 'Hiragana' },
    { id: 'katakana', label: 'Katakana' },
    { id: 'genki', label: 'Genki Vocabulary' },
    { id: 'wanikani', label: 'WaniKani Lessons' },
    { id: 'joyo-kanji', label: 'Jōyō Kanji' },
    { id: 'jinmeiyo-kanji', label: 'Jinmeiyō Kanji' },
    { id: 'common-katakana-words', label: 'Common Katakana Words' },
  ];

  pausedDecks: Record<string, boolean> = {};

  constructor(
    private cardsService: CardsService,
    private alertCtrl: AlertController
  ) { }

  async ngOnInit() {
    await this.cardsService.initialize();
    this.loadPauseStates();
  }

  private loadPauseStates(): void {
    for (const cat of this.categories) {
      this.pausedDecks[cat.id] = this.cardsService.isCategoryHidden(cat.id);
    }
  }

  togglePauseDeck(category: { id: string; label: string }, event: any): void {
    const paused = event.detail.checked;
    this.cardsService.setCategoryHidden(category.id, paused);
    this.pausedDecks[category.id] = paused;
  }

  async resetCategory(category: { id: string; label: string }) {
    const alert = await this.alertCtrl.create({
      header: 'Reset Progression',
      message: `Are you sure you would like to reset your progression on ${category.label}? This is IRREVERSIBLE!`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reset',
          role: 'destructive',
          handler: async () => {
            await this.cardsService.resetCategory(category.id);
          }
        }
      ]
    });
    await alert.present();
  }

  async backupData() {
    const bundle = await this.cardsService.exportToBundle();
    const json = JSON.stringify(bundle);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `mojidoodle-backup-${timestamp}.json`;

    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async restoreData() {
    // Create file input and trigger click
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const bundle = JSON.parse(text);

        // Debug: log what we're restoring
        const cardsWithProgress = bundle.cards?.filter((c: any) => c.stage >= 0) ?? [];
        const lessonsUnlocked = bundle.lessons?.filter((l: any) => l.status !== 'locked') ?? [];
        console.log('Backup contains:', {
          totalCards: bundle.cards?.length ?? 0,
          cardsWithProgress: cardsWithProgress.length,
          totalLessons: bundle.lessons?.length ?? 0,
          lessonsUnlocked: lessonsUnlocked.length,
          sampleCard: cardsWithProgress[0],
          sampleLesson: lessonsUnlocked[0]
        });

        // Confirm restore
        const confirmAlert = await this.alertCtrl.create({
          header: 'Restore Progress',
          message: 'This will overwrite your current progress with the backup. Continue?',
          buttons: [
            { text: 'Cancel', role: 'cancel' },
            {
              text: 'Restore',
              handler: async () => {
                const result = await this.cardsService.restoreFromBundle(bundle);
                await this.showRestoreResult(result);
              }
            }
          ]
        });
        await confirmAlert.present();
      } catch (err) {
        const errorAlert = await this.alertCtrl.create({
          header: 'Error',
          message: 'Failed to read backup file. Make sure it is a valid JSON file.',
          buttons: ['OK']
        });
        await errorAlert.present();
      }
    };
    input.click();
  }

  private async showRestoreResult(result: {
    cardsUpdated: number;
    lessonsUpdated: number;
    cardsNotFound: number;
    lessonsNotFound: number;
  }) {
    const notFoundTotal = result.cardsNotFound + result.lessonsNotFound;
    let subHeader = `${result.cardsUpdated} cards, ${result.lessonsUpdated} lessons updated`;
    let message = '';
    if (notFoundTotal > 0) {
      const parts: string[] = [];
      if (result.cardsNotFound > 0) {
        parts.push(`${result.cardsNotFound} cards`);
      }
      if (result.lessonsNotFound > 0) {
        parts.push(`${result.lessonsNotFound} lessons`);
      }
      message = `Not found in current database: ${parts.join(', ')}`;
    }

    const alert = await this.alertCtrl.create({
      header: 'Restore Complete',
      subHeader,
      message: message || undefined,
      buttons: ['OK']
    });
    await alert.present();
  }
}
