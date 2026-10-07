import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { parseISO, format } from 'date-fns';
import { MenuIncidenciaService } from '../menu_incidencia.service';
import { SpinnerLoadingComponent } from '../../../../shared/components/spinner-loading/spinner-loading.component';
import Constantes from '../../../../shared/constants/contants';

@Component({
  selector: 'app-incidencias-muebles',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerLoadingComponent, NzTabsModule, NzDrawerModule, NzGridModule, NzCollapseModule, NzButtonModule, NzSpaceModule, NzSelectModule, NzIconModule, NzAvatarModule, NzTypographyModule, NzCardModule, NzInputModule, NzListModule],
  templateUrl: './incidencias-muebles.component.html',
  styleUrl: './incidencias-muebles.component.scss'
})
export class IncidenciasMueblesComponent {
  loading = false;
  poc_id = parseInt(localStorage.getItem('poc_id') || '0');
  empresa_id =localStorage.getItem('empresa_id') || 'BK';
  listAsignacionesHeader:any = [];
  listRecojosHeader:any = [];
  listMantenimientoHeader:any = [];
  typeOptionIncidenciaMueble = 'asignacion';
  selectedIndex = 0;
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
  isOnline: boolean = navigator.onLine;

  constructor(
    private modalService: NzModalService,
    private router: Router,
    private menuIncidenciaService: MenuIncidenciaService,
  ) { 
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  ngOnInit(): void {
    this.typeOptionIncidenciaMueble = localStorage.getItem('typeOptionIncidenciaMueble') || '';
    console.log("typeOptionIncidenciaMueble", this.typeOptionIncidenciaMueble);
    // this.listAsignaciones();
    this.showRol = this.validateRol[this.rol];
    this.changeTab();
    console.log("rol", this.rol);
    console.log("showRol", this.showRol);
  }
  
  updateOnlineStatus() {
    this.isOnline = navigator.onLine;
  }

  changeTab() {
    console.log("changeTab", this.typeOptionIncidenciaMueble);
    if (this.typeOptionIncidenciaMueble == 'asignacion' && this.showRol.asignacion) {
      this.selectedIndex = 0;
      this.listAsignaciones();
    } else if (this.typeOptionIncidenciaMueble == 'recojo' && this.showRol.recojo) {
      this.selectedIndex = 1;
      this.listRecojos();
    } else if (this.typeOptionIncidenciaMueble == 'mantenimiento' && this.showRol.mantenimiento) {
      this.selectedIndex = 2;
      this.listMatenimientos();
    } else if(this.rol == 'bdr' && !this.typeOptionIncidenciaMueble){
      this.selectedIndex = 2;
      this.listMatenimientos();
    } else {
      this.selectedIndex = 0;
      this.listAsignaciones();
    }
  }
  async listAsignaciones(): Promise<void> {
    try {
      localStorage.setItem('typeOptionIncidenciaMueble', 'asignacion');
      this.loading = true;
      const response = await this.menuIncidenciaService.getIncidenciaMuebleAsignacion(this.empresa_id,this.poc_id);
      if (Array.isArray(response.listAsignacion)) {
        this.listAsignacionesHeader  = this.transformObjectsAsignacion(response.listAsignacion);
        console.log(this.listAsignacionesHeader);
      }
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    } finally {
      this.loading = false;
    }
  }

  transformObjectsAsignacion(objects: any) {
    return objects.map((obj: any) => ({
      nombre: obj.tipo_mueble,
        listAsignacionesOptions: [
            { typeOption: "Marca:", value:obj.marca, code: "marca" },
            { typeOption: "Tipo Mueble:", value: obj.tipo_mueble, code: "tipo_mueble" },
            { typeOption: "Fecha Creacion:", value: format(parseISO(obj.fecha_creacion), 'yyyy-MM-dd hh:mm:ss a'), code: "fec_creacion" },
            // { typeOption: "Imagen ", value: obj.images, code: "file"}            
        ]
    }));
  }

  async listRecojos(): Promise<void> {
    try {
      localStorage.setItem('typeOptionIncidenciaMueble', 'recojo');
      this.loading = true;
      const response = await this.menuIncidenciaService.getIncidenciaMuebleRecojo(this.empresa_id,this.poc_id);
      if (Array.isArray(response.data)) {
        this.listRecojosHeader  = this.transformObjectsRecojo(response.data);
        console.log(this.listRecojosHeader);
      }
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    } finally {
      this.loading = false;
    }
  }

  transformObjectsRecojo(objects:any) {
    return objects.map((obj:any) => ({
      nombre: obj.marca + ' - ' + obj.motivo_recojo,
        listRecojoOptions: [
            { typeOption: "Marca:", value:obj.marca, code: "marca" },
            { typeOption: "Tipo Mueble:", value: obj.tipo_mueble, code: "tipo_mueble" },
            { typeOption: "Motivo de Recojo:", value: obj.motivo_recojo, code: "motivo_recojo" },
            { typeOption: "Fecha Creación:", value: format(parseISO(obj.fecha_creacion), 'yyyy-MM-dd hh:mm:ss a'), code: "fec_creacion" },
            { typeOption: "Imágenes:", value: obj.imagenes, code: "imagenes" },
            // { typeOption: "Imagen ", value: obj.images, code: "file"}            
        ]
    }));
  }

  async listMatenimientos(): Promise<void> {
    try {
      localStorage.setItem('typeOptionIncidenciaMueble', 'mantenimiento');
      this.loading = true;
      const response = await this.menuIncidenciaService.getIncidenciaMuebleMantenimiento(this.empresa_id,this.poc_id);
      console.log("listMatenimientos", response);
      if (Array.isArray(response.data)) {
        this.listMantenimientoHeader = this.transformObjectsMantenimientos(response.data);
        console.log(this.listMantenimientoHeader);
      }
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    } finally {
      this.loading = false;
    }
  }

  transformObjectsMantenimientos(objects:any) {
    return objects.map((obj:any) => ({
      nombre: obj.marca + ' - ' + obj.tipo_mantenimiento,
        listMantenimientoOptions: [
            { typeOption: "Marca:", value:obj.marca, code: "marca" },
            { typeOption: "Tipo Mueble:", value: obj.tipo_mueble, code: "tipo_mueble" },
            { typeOption: "Tipo Mantenimiento:", value: obj.tipo_mantenimiento, code: "tipo_mantenimiento" },
            { typeOption: "Fecha Creación:", value: format(parseISO(obj.fecha_creacion), 'yyyy-MM-dd hh:mm:ss a'), code: "fec_creacion" },
            { typeOption: "Imágenes:", value: obj.imagenes, code: "imagenes" },
            // { typeOption: "Imagen ", value: obj.images, code: "file"}            
        ]
    }));
  }

  navigateToMueblesNuevo() {
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_NUEVO}`]);
  }
}
