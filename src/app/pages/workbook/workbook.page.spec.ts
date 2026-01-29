import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkbookPage } from './workbook.page';

describe('WorkbookPage', () => {
  let component: WorkbookPage;
  let fixture: ComponentFixture<WorkbookPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkbookPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
