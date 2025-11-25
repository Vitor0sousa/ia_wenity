import { TestBed } from '@angular/core/testing';

import { Job } from './job';

describe('Job', () => {
  let service: Job;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Job);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
