import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuPrecioComponent } from './menu-precio.component';

describe('MenuPrecioComponent', () => {
  let component: MenuPrecioComponent;
  let fixture: ComponentFixture<MenuPrecioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuPrecioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MenuPrecioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
