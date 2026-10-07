import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import {NzTabsModule} from 'ng-zorro-antd/tabs';
import { SharedDataService } from '../../app-backus/shared-data.service';
import Constantes from '../../../shared/constants/contants';

@Component({
  selector: 'app-menu-exhibiciones',
  standalone: true,
  imports: [ CommonModule, RouterModule, NzButtonModule, NzSelectModule, FormsModule, NzTypographyModule, NzCardModule, NzInputModule, NzTabsModule, NzSegmentedModule],
  templateUrl: './menu-exhibiciones.component.html',
  styleUrl: './menu-exhibiciones.component.scss'
})
export class MenuExhibicionesComponent {
  otherComponentsEnabled = false;
  selectedSucursal: any = [];
  empresa_id:any =localStorage.getItem('empresa_id') || 'BK';
  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;
  // options = ['Exhibiciones Contraprestadas', 'Exhibiciones Adicionales', 'Exhibiciones Competencia'];
  options = ['Contraprestada', 'Adicional', 'Competencia'];

  constructor(
    private router: Router,
    private sharedDataService: SharedDataService
  ) { }

  ngOnInit(): void {
    this.sharedDataService.currentSelectedSucursal.subscribe(sucursal => {
      this.selectedSucursal = sucursal;
      this.validateSucursal();
    });
    this.sharedDataService.currentComponents.subscribe(components => {
      if (components) {
        this.otherComponentsEnabled = components.otherComponentsEnabled;
      }
    });
    
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._EXHIBICIONES}/${Constantes.ROUTES.ENCUESTA.EXHIBICIONES.CONTRAPRESTADAS}`]);
  }
 

  validateSucursal() {
    if (!this.selectedSucursal) {
      this.router.navigate([`/` + this.routeCliente + ``]);
    }
  }

  handleIndexChange(position: number): void {
    if (position === 0) { 
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._EXHIBICIONES}/${Constantes.ROUTES.ENCUESTA.EXHIBICIONES.CONTRAPRESTADAS}`]);
    } else if (position === 1) {
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._EXHIBICIONES}/${Constantes.ROUTES.ENCUESTA.EXHIBICIONES.ADICIONALES}`]);
    } else {
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._EXHIBICIONES}/${Constantes.ROUTES.ENCUESTA.EXHIBICIONES.COMPETENCIA}`]);
    }
  }
}
