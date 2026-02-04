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
    await this.checkVersion();
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

      // Check if user has existing data in IndexedDB
      const hasExistingData = await this.cardsService.hasStoredData();

      if (storedTimestamp && storedTimestamp !== serverTimestamp) {
        // Version mismatch - show warning
        await this.showUpdateAlert(serverTimestamp);
      } else if (!storedTimestamp && hasExistingData) {
        // No version stored but has existing data - likely pre-version-system data
        await this.showUpdateAlert(serverTimestamp);
      } else if (!storedTimestamp) {
        // First time with no data - store the version
        localStorage.setItem(VERSION_KEY, serverTimestamp);
      }
    } catch (err) {
      console.warn('Failed to check version:', err);
    }
  }

  private async showUpdateAlert(serverTimestamp: string) {
    const alert = await this.alertCtrl.create({
      header: 'Update Available',
      message: 'New content is available. Migrate will preserve your progress. Reset will delete all progress.',
      buttons: [
        {
          text: 'Migrate',
          handler: async () => {
            await this.migrateProgress(serverTimestamp);
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
  }

  private async migrateProgress(serverTimestamp: string) {
    // Export current progress
    const backup = await this.cardsService.exportToBundle();

    // Rebuild database with new data
    localStorage.setItem(VERSION_KEY, serverTimestamp);
    await this.cardsService.rebuild();

    // Restore progress
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
}
