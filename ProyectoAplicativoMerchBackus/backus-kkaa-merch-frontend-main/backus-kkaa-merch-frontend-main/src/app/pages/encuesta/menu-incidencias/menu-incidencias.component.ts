import { Component } from '@angular/core';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { SharedDataService } from '../../app-backus/shared-data.service';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { CommonModule } from '@angular/common';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import Constantes from '../../../shared/constants/contants';

@Component({
  selector: 'app-menu-incidencias',
  standalone: true,
  imports: [CommonModule,RouterModule, NzGridModule, NzSegmentedModule, NzButtonModule, NzPageHeaderModule, NzPopoverModule, NzSpaceModule, NzBreadCrumbModule, NzSelectModule, NzModalModule,FormsModule, NzLayoutModule, NzMenuModule, NzIconModule, NzAvatarModule, NzTypographyModule, NzCardModule, NzInputModule, NzListModule],
  templateUrl: './menu-incidencias.component.html',
  styleUrl: './menu-incidencias.component.scss'
})
export class MenuIncidenciasComponent {
  isCollapsed: boolean = false;
  size: NzButtonSize = 'large';
  selectedOption: string = '';

  otherComponentsEnabled = false;
  spiner = false;
  selectedSucursal: any = [];
  selectedCategoria: any = [];

  dataSucursales: string[] = [];
  dataCategoria: any[] = [];
  searchTerm = '';
  filteredItems: any[] = [];
  user: any = {};
  currentUrl: string = '';
  empresa_id:any =localStorage.getItem('empresa_id') || 'BK';
  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;
  constructor(
    private modalService: NzModalService,
    private sharedDataService: SharedDataService,
    private router: Router,
  ) { }

  ngOnInit() {
    const currentUrl = this.router.url.slice(1).split('/');
    this.selectedOption = currentUrl[currentUrl.length - 1];
  }

  selectOptionAndNavigate(route: string): void {
    // Seleccionar la opción
    // if (route === 'competencia' || route === 'muebles') {
      this.selectedOption = route;
    // }

    // Redirigir a la ruta especificada
    const ruta = this.getRoute(route);
    this.router.navigate([ruta]);
  }

  getRoute(route: string): string {
    switch (route) {
      case 'competencia':
        return `/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_COMPETENCIA}`;
      case 'muebles':
        return `/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_MUEBLES}`;
      default:
        return '';
    }
  }

  onSelectChange() {
    this.otherComponentsEnabled = !!this.selectedSucursal;
    this.sharedDataService.changeSelectedSucursal(this.selectedSucursal);
    this.sharedDataService.changeComponentState({
      otherComponentsEnabled: this.otherComponentsEnabled,
    });
  }

  navigateToMueblesNuevo() {
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_NUEVO}`]);
  }

  validateSucursal() {
    if (!this.selectedSucursal) {
      this.router.navigate([`/` + this.routeCliente + ``]);
    }
  }
//coment
}
