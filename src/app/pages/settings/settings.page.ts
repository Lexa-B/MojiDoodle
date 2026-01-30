import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonList, IonListHeader, IonLabel, IonItem, IonButton } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { CardsService } from '../../services/cards.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonList, IonListHeader, IonLabel, IonItem, IonButton],
})
export class SettingsPage implements OnInit {

  categories = [
    { id: 'hiragana', label: 'Hiragana' },
    { id: 'katakana', label: 'Katakana' },
    { id: 'kanji', label: 'Kanji' },
    { id: 'katakana-words', label: 'Katakana Words' },
    { id: 'kanji-words', label: 'Kanji Words' },
  ];

  constructor(
    private cardsService: CardsService,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
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
}
