import { Component } from '@angular/core';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { MenuPrecioService } from './menu-precio.service';
import { SharedDataService } from '../../app-backus/shared-data.service';
import Constantes from '../../../shared/constants/contants';
import { SkuService } from '@shared/services/offline/sku.service';

@Component({
  selector: 'app-menu-precio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ,NzButtonModule, NzSelectModule, RouterModule, NzModalModule, FormsModule, NzTypographyModule, NzCardModule, NzSpinModule],
  templateUrl: './menu-precio.component.html',
  styleUrl: './menu-precio.component.scss'
})
export class MenuPrecioComponent {
  isCollapsed: boolean = false;
  isSelectedPrice: boolean = false;
  otherComponentsEnabled = false;
  spiner = false;
  selectedCategoria: any = [];
  selectedGondola: any = [];
  selectedSucursal: any = [];
  selectedDetallPriceOk: boolean = false;
  dataSucursales: string[] = [];
  dataMarca: any[] = [];
  filteredItems: any[] = [];
  loading: boolean = false;
  productosGuardados: any[] = [];

  user: any = {};
  empresa_id:any =localStorage.getItem('empresa_id') || 'BK';
  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;
  
  constructor(
    private menuPrecioService: MenuPrecioService,
    private modalService: NzModalService,
    private router: Router,
    private sharedDataService: SharedDataService,
    private skuService: SkuService,
  ) { }

  ngOnInit(): void {
    this.sharedDataService.currentSelectedSucursal.subscribe(sucursal => {           
      this.selectedSucursal = sucursal;
      // this.validateSucursal();
    });
    this.sharedDataService.currentComponents.subscribe(components => {
      if (components) {
        this.otherComponentsEnabled = components.otherComponentsEnabled;
      }
    });
    this.sharedDataService.clearSelectedMarca();
    this.sharedDataService.currentSelectedMarca.subscribe((marca) => {
      this.selectedGondola = marca;
      if (this.selectedGondola) {
        this.loadData();
      }
    });
    this.sharedDataService.currentSelectedDetallPriceOk.subscribe(detallPriceOk => {
      this.selectedDetallPriceOk = detallPriceOk;
    });

    this.loadData();
    this.datosReturn();
  }

  datosReturn() {
    const productosGuardads = localStorage.getItem('encuesta-precio-create');
    if (productosGuardads !== null) {
      this.productosGuardados = JSON.parse(productosGuardads);
      console.log('Productos guardados:', this.productosGuardados);
    } else {
      console.log('No se encontraron productos guardados en localStorage.');
    }
  }
  async loadData() {
    try {
      this.loading = true;
      // const empresa_id = localStorage.getItem("empresa_id");
      if(navigator.onLine) {
        const getMarca: any = await this.menuPrecioService.getMarca(this.empresa_id);
        if (Array.isArray(getMarca.listMarcas)) {
          const marcas = getMarca.listMarcas.map((marca: any) => marca.marca);
          const marcasStrings: any[] = marcas.filter((marca: any) => typeof marca === 'string');
  
          const marcasUnicas = new Set<string>();
  
          marcasStrings.forEach(marca => {
            // if (marca === 'Heineken' || marca === 'Tres Cruces' || marca === 'Amstel') {
              marcasUnicas.add(marca);
            // }
          });
  
          this.dataMarca = Array.from(marcasUnicas).sort();
          this.loading = false;
        } else {
          this.loading = false;
          console.error('La propiedad listMarcas no es un array.');
        }
      }else{
        const marcasCompetencia = await this.skuService.getMarcas(this.empresa_id, 1);
        console.log('marcasCompetencia', marcasCompetencia);
        this.dataMarca = marcasCompetencia?.map((marcaCompetencia: any) => marcaCompetencia.marca );
        console.log("dataMarca", this.dataMarca);
        this.loading = false;
      }
    } catch (error) {
      this.loading = false;
      console.error('Error al cargar los datos:', error);
    }
  }

  changeOptionGondola() {
    this.isSelectedPrice = false;
    this.selectedGondola = null;
    let marca = `/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._PRECIO}`;
    this.router.navigate([marca]);
  }

  onGondolaChange(marca: string) {
    this.selectedGondola = marca;
    this.isSelectedPrice = true;
    this.sharedDataService.changeSelectedMarca(this.selectedGondola);
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.PRECIO_DETALLE}`]);
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
    this.router.navigate([`/` + this.routeCliente + ``]);
  }

  validateSucursal() {
    if (!this.selectedSucursal) {
      // this.router.navigate([`/` + this.routeCliente + ``]);
    }
  }
  volerMenu(){
    this.sharedDataService.changeSelectedDetallPriceOk(false);
    this.selectedGondola = null;
    this.isSelectedPrice = false;
    this.sharedDataService.changeSelectedMarca('');
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._CLIENTE_BK}`]);
  }
}
