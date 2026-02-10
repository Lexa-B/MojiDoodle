import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GlossaryPageRoutingModule } from './glossary-routing.module';

import { GlossaryPage } from './glossary.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GlossaryPageRoutingModule,
    GlossaryPage
  ]
})
export class GlossaryPageModule {}
