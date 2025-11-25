import { TestBed } from '@angular/core/testing';

import { HiringProcess } from './hiring-process';

describe('HiringProcess', () => {
  let service: HiringProcess;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HiringProcess);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
