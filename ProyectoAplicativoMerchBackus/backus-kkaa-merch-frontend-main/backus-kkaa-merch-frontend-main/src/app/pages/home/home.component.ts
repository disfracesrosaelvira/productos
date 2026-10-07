import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

import { MenuService } from '../menu/menu.service';
import Constantes from '../../shared/constants/contants';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NzLayoutModule, NzIconModule,NzTypographyModule, NzImageModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  constructor(
    private router: Router,
    private menuService: MenuService,
  ) { }

  ngOnInit() {
    console.log('MenuComponent => menuService => ', this.menuService.typeApp);
    this.menuService.typeApp = '';
  }

  handleChangeStore(menuApp : string){
    localStorage.removeItem('poc_id');  
    console.log('menuApp',menuApp);
    this.menuService.typeApp = menuApp;
    this.selectMenu(menuApp);
  }

  selectMenu(menu: string) {
    switch (menu) {
      case 'Backus':
        localStorage.setItem('empresa_id', 'BK');
        this.router.navigate([`${Constantes.ROUTES.APP.BK}`]);
        break;
      case 'Pernod':
        localStorage.setItem('empresa_id', 'PE');
        this.router.navigate([`${Constantes.ROUTES.APP.PERNORP}`]);
        break;
      default:
        this.router.navigate([`${Constantes.ROUTES._HOME}`]);
        ;  
    }
  }
}
