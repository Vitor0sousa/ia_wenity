import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobCreateComponent } from './job-create';

describe('JobCreate', () => {
  let component: JobCreateComponent;
  let fixture: ComponentFixture<JobCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
