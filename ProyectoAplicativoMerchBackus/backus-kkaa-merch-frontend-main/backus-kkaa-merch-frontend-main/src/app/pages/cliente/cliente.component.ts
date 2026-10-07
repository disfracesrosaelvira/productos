import { Component, OnInit } from '@angular/core';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { SharedDataService } from '../app-backus/shared-data.service';
import { RouterModule, Router } from '@angular/router';

import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzUploadModule} from 'ng-zorro-antd/upload';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import Constantes from '../../shared/constants/contants';

@Component({
  selector: 'cliente',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule,NzDrawerModule, NzButtonModule, NzGridModule, NzSwitchModule, CommonModule, NzCollapseModule, NzUploadModule, NzImageModule, NzPageHeaderModule, NzPopoverModule, NzSpaceModule, NzBreadCrumbModule, NzSelectModule, RouterModule, NzModalModule, FormsModule, NzLayoutModule, NzMenuModule, NzIconModule, NzAvatarModule, NzTypographyModule, NzCardModule, NzInputModule, NzListModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent {
  otherComponentsEnabled = false;
  spiner = false;
  isCollapsed: boolean = false;
  selectedSucursal: any = [];
  user: any = {};
  isShowModule: boolean = false;
  size: NzButtonSize = 'large';
  empresa_id:any =localStorage.getItem('empresa_id') || 'BK';
  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;
  constructor(
    private modalService: NzModalService,
    private router: Router,
    private sharedDataService: SharedDataService
  ) {}

  ngOnInit(): void {
    this.isShowModule = this.empresa_id == 'BK' ? true : false;
    this.sharedDataService.currentSelectedSucursal.subscribe(sucursal => {
      this.selectedSucursal = sucursal;
      console.log('selectedSucursalcliente', this.selectedSucursal);
      // this.validateSucursal();
    });
    this.sharedDataService.currentComponents.subscribe(components => {
      if (components) {
        this.otherComponentsEnabled = components.otherComponentsEnabled;
      }
    });
  }

  onSelectChange() {
    this.otherComponentsEnabled = !!this.selectedSucursal;
    this.sharedDataService.changeSelectedSucursal(this.selectedSucursal);
    this.sharedDataService.changeComponentState({
      otherComponentsEnabled: this.otherComponentsEnabled,
    });
  }

  changeOption() {
    this.otherComponentsEnabled = false;
    this.router.navigate([`/`+ this.routeCliente]);
  }

  navigateToHome(){
    this.router.navigate([`/`+ this.routeCliente]);
  }

  navigateToGeneral() {
    this.router.navigate([this.routeCliente+`/${Constantes.ROUTES._CLIENTE_BK}`]);
  }

  navigateReturnBack() {
    this.router.navigate([`/` + this.routeCliente]);
  }

  navigateToMenuPrecio() {
    console.log(this.routeCliente);
    
    this.router.navigate([this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._PRECIO}`]);
  }

  navigateToMenuExhibiciones() {
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._EXHIBICIONES}`]);
  }

  navigateToFrentes() {
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._FRENTES}`]);
  }

  navigateToMenuIncidencias() {
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._INCIDENCIA}`]);
  }

  navigateToStock() {
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._STOCK}`]);
  }
  validateSucursal() {
    if (!this.selectedSucursal) {
      this.router.navigate([`/` + this.routeCliente ]);
    }
  }
}
