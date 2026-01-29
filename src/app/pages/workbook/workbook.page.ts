import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-workbook',
  templateUrl: './workbook.page.html',
  styleUrls: ['./workbook.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton],
})
export class WorkbookPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
