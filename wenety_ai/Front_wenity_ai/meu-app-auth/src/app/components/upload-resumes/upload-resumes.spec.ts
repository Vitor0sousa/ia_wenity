import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadResumes } from './upload-resumes';

describe('UploadResumes', () => {
  let component: UploadResumes;
  let fixture: ComponentFixture<UploadResumes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadResumes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadResumes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
