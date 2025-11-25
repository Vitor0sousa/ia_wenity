import { TestBed } from '@angular/core/testing';

import { ResumeAnalysis } from './resume-analysis';

describe('ResumeAnalysis', () => {
  let service: ResumeAnalysis;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResumeAnalysis);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
