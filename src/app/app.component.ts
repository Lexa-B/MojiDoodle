import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'home' },
    { title: 'Workbook', url: '/workbook', icon: 'book' },
    { title: 'Settings', url: '/settings', icon: 'settings' },
  ];
  constructor() {}
}
