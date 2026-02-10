import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GlossaryPage } from './glossary.page';

const routes: Routes = [
  {
    path: '',
    component: GlossaryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GlossaryPageRoutingModule {}
