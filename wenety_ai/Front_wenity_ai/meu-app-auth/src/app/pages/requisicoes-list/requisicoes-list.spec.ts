import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequisicoesListComponent } from './requisicoes-list';

describe('RequisicoesList', () => {
  let component: RequisicoesListComponent;
  let fixture: ComponentFixture<RequisicoesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequisicoesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequisicoesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
