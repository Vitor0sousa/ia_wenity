import { TestBed } from '@angular/core/testing';

import { JobPosition } from './job-position';

describe('JobPosition', () => {
  let service: JobPosition;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JobPosition);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
