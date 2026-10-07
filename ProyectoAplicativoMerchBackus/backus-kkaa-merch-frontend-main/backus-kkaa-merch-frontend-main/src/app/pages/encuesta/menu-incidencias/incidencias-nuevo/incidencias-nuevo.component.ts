import { Component } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RouterModule, Router } from '@angular/router';

import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { CommonModule } from '@angular/common';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { SharedDataService } from '../../../app-backus/shared-data.service';

import { format } from 'date-fns';
import { IncidenciaNuevoService } from './incidencia-nuevo.service';
import Constantes from '../../../../shared/constants/contants';

@Component({
  selector: 'app-incidencias-nuevo',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NzDrawerModule, NzButtonModule, NzSpaceModule, NzBreadCrumbModule, NzLayoutModule, NzIconModule, NzAvatarModule, NzTypographyModule, NzCardModule],
  templateUrl: './incidencias-nuevo.component.html',
  styleUrl: './incidencias-nuevo.component.scss'
})
export class IncidenciasNuevoComponent {
  isCollapsed: boolean = false;
  size: NzButtonSize = 'large';

  otherComponentsEnabled = false;
  spiner = false;
  selectedSucursal: any = [];
  selectedCategoria: any = [];
  loading = false;

  guardadoExitoso = false;

  dataCategoria: any[] = [];
  filteredItems: any[] = [];

  selectedOption: string = '';

  selectedValue = 0; // Valor inicial seleccionado
  typeOptionIncidenciaMueble: string = 'asignacion';
  empresa_id:any =localStorage.getItem('empresa_id') || 'BK';
  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;
  rol = localStorage.getItem('rol') || '';
  showRol:any = {
    asignacion: false,
    recojo: false,
    mantenimiento: false
  }
  validateRol:any = {
    admin: {
      asignacion: true,
      recojo: true,
      mantenimiento: true
    },
    backoffice: {
      asignacion: true,
      recojo: true,
      mantenimiento: true
    },
    supervisor: {
      asignacion: true,
      recojo: true,
      mantenimiento: true
    },
    bdr: {
      asignacion: false,
      recojo: false,
      mantenimiento: true
    }
  }
  constructor(
    private modalService: NzModalService,
    private router: Router,
  ) {  }

  ngOnInit(): void {
    this.typeOptionIncidenciaMueble = localStorage.getItem('typeOptionIncidenciaMueble') || '';
    this.showRol = this.validateRol[this.rol];

    this.routeToIncidenciaMueble();
    // this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_NUEVO_ASIGNACION}`]);
    this.selectedOption = this.typeOptionIncidenciaMueble;
  }

  routeToIncidenciaMueble() {
    if (this.typeOptionIncidenciaMueble == 'asignacion') {
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_NUEVO_ASIGNACION}`]);
    } else if (this.typeOptionIncidenciaMueble == 'recojo') {
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_NUEVO_RECOJO}`]);
    } else if (this.typeOptionIncidenciaMueble == 'mantenimiento') {
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_NUEVO_MANTENIMIENTO}`]);
    } else {
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_NUEVO_ASIGNACION}`]);
    }
  }
  
  navigateGuardar() {
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_MUEBLES}`]);
  }

  volverMenu() {
    this.router.navigate([
      `/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_MUEBLES}`,
    ]);
  }

  selectOptionAndNavigate(option: string): void {
    this.selectedOption = option;
    if (option === 'asignacion') {
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_NUEVO_ASIGNACION}`]);
    } else if (option === 'recojo') {
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_NUEVO_RECOJO}`]);
    } else {
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_NUEVO_MANTENIMIENTO}`]);
    }
  }
}
