import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WorkbookPageRoutingModule } from './workbook-routing.module';

import { WorkbookPage } from './workbook.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WorkbookPageRoutingModule,
    WorkbookPage
  ]
})
export class WorkbookPageModule {}
