import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WorkbookPage } from './workbook.page';

const routes: Routes = [
  {
    path: '',
    component: WorkbookPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkbookPageRoutingModule {}
