import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { CardsService } from './services/cards.service';

const VERSION_KEY = 'mojidoodle-version';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'home' },
    { title: 'Workbook', url: '/workbook', icon: 'book' },
    { title: 'Settings', url: '/settings', icon: 'settings' },
  ];

  constructor(
    private alertCtrl: AlertController,
    private cardsService: CardsService
  ) {}

  async ngOnInit() {
    // CRITICAL: Load existing DB FIRST, before version checking.
    // This ensures the backup captures real user progress before any
    // race condition with page components calling initialize() concurrently.
    await this.cardsService.initialize();
    await this.checkVersion();
    await this.checkDataCollection();
  }

  private async checkVersion() {
    try {
      // Fetch the current version from the server
      const response = await fetch(this.getBaseUrl() + 'data/version.json');
      if (!response.ok) {
        console.warn('Version check: failed to fetch version.json');
        return;
      }

      const serverVersion = await response.json();
      const serverTimestamp = serverVersion.timestamp;

      // Get stored version from localStorage
      const storedTimestamp = localStorage.getItem(VERSION_KEY);

      console.log('Version check:', { server: serverTimestamp, stored: storedTimestamp });

      // Already up to date
      if (storedTimestamp === serverTimestamp) return;

      // Capture backup IMMEDIATELY from the already-loaded DB.
      // This must happen before showing any alert, so no race condition
      // can corrupt or rebuild the DB before we've saved the user's progress.
      const backup = await this.cardsService.exportToBundle();
      const hasProgress = backup.cards?.some((c: any) => c.stage >= 0) ?? false;

      if (!hasProgress) {
        // No user progress to preserve (fresh install or already-reset) - update silently
        localStorage.setItem(VERSION_KEY, serverTimestamp);
        return;
      }

      console.log('Pre-migration backup captured:', {
        cards: backup.cards?.filter((c: any) => c.stage >= 0).length ?? 0,
        lessons: backup.lessons?.filter((l: any) => l.status !== 'locked').length ?? 0
      });

      await this.showUpdateAlert(serverTimestamp, backup);
    } catch (err) {
      console.warn('Failed to check version:', err);
    }
  }

  private async showUpdateAlert(serverTimestamp: string, backup: { cards?: any[]; lessons?: any[]; user_uuid?: string; data_collection?: any }) {
    const alert = await this.alertCtrl.create({
      header: 'Update Available',
      message: 'New content is available. Migrate will preserve your progress. Reset will delete all progress.',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Migrate',
          handler: async () => {
            await this.migrateProgress(serverTimestamp, backup);
          }
        },
        {
          text: 'Later',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            // Store version so we don't keep asking
            localStorage.setItem(VERSION_KEY, serverTimestamp);
          }
        },
        {
          text: 'Reset',
          cssClass: 'secondary',
          handler: async () => {
            localStorage.setItem(VERSION_KEY, serverTimestamp);
            await this.cardsService.rebuild();
            window.location.reload();
          }
        }
      ]
    });
    await alert.present();
    await alert.onDidDismiss();
  }

  private async migrateProgress(serverTimestamp: string, backup: { cards?: any[]; lessons?: any[]; user_uuid?: string; data_collection?: any }) {
    // Backup was already captured BEFORE the alert was shown,
    // so it's guaranteed to have the user's real progress regardless
    // of any concurrent initialize() calls from page components.
    console.log('Migration backup:', {
      cards: backup.cards?.filter((c: any) => c.stage >= 0).length ?? 0,
      lessons: backup.lessons?.filter((l: any) => l.status !== 'locked').length ?? 0
    });

    // Rebuild database with new data
    localStorage.setItem(VERSION_KEY, serverTimestamp);
    await this.cardsService.rebuild();

    // Restore progress from the pre-captured backup
    const result = await this.cardsService.restoreFromBundle(backup);

    // Show result
    const notFoundTotal = result.cardsNotFound + result.lessonsNotFound;
    let subHeader = `${result.cardsUpdated} cards, ${result.lessonsUpdated} lessons migrated`;
    let message = '';
    if (notFoundTotal > 0) {
      const parts: string[] = [];
      if (result.cardsNotFound > 0) {
        parts.push(`${result.cardsNotFound} cards`);
      }
      if (result.lessonsNotFound > 0) {
        parts.push(`${result.lessonsNotFound} lessons`);
      }
      message = `Items removed in update: ${parts.join(', ')}`;
    }

    const resultAlert = await this.alertCtrl.create({
      header: 'Migration Complete',
      subHeader,
      message: message || undefined,
      buttons: ['OK']
    });
    await resultAlert.present();
  }

  private getBaseUrl(): string {
    const base = document.baseURI || '/';
    return base.endsWith('/') ? base : base + '/';
  }

  private async checkDataCollection() {
    try {
      // cardsService already initialized in ngOnInit before checkVersion
      const status = this.cardsService.getDataCollectionStatus();
      if (status === 'no-response') {
        await this.showDataCollectionAlert();
      }
    } catch (err) {
      console.warn('Failed to check data collection status:', err);
    }
  }

  private async showDataCollectionAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Data Collection Notice',
      subHeader: 'Totally optional:',
      message: 'We would like to collect data from your workbook sessions so that we can create a better model for character segmentation. This will greatly improve the app experience, especially for longer responses like those needed by Genki cards.\n\nWould you like to take part and help make the app better?',
      buttons: [
        {
          text: 'Yes!',
          handler: () => {
            this.cardsService.setDataCollectionStatus('opted-in');
          }
        },
        {
          text: 'No.',
          handler: () => {
            this.cardsService.setDataCollectionStatus('opted-out');
          }
        },
        {
          text: 'Maybe later',
          role: 'cancel',
          cssClass: 'secondary'
          // Keep as 'no-response' - will ask again next time
        }
      ]
    });
    await alert.present();
  }
}
