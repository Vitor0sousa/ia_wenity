import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequisicaoDetalhe } from './requisicao-detalhe';

describe('RequisicaoDetalhe', () => {
  let component: RequisicaoDetalhe;
  let fixture: ComponentFixture<RequisicaoDetalhe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequisicaoDetalhe]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequisicaoDetalhe);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
