import { TestBed } from '@angular/core/testing';

import { TrocarSenha } from './trocar-senha';

describe('TrocarSenha', () => {
  let service: TrocarSenha;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrocarSenha);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
