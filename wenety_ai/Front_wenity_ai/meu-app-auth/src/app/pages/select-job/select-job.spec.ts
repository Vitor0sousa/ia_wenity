import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectJob } from './select-job';

describe('SelectJob', () => {
  let component: SelectJob;
  let fixture: ComponentFixture<SelectJob>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectJob]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectJob);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
