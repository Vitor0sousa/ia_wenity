import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetRequirements } from './set-requirements';

describe('SetRequirements', () => {
  let component: SetRequirements;
  let fixture: ComponentFixture<SetRequirements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetRequirements]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetRequirements);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
