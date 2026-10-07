import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { AppBackusService } from './app-backus.service';
import { SharedDataService } from './shared-data.service';
import Constantes from '../../shared/constants/contants';
// import { validate } from 'uuid';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
// import { Observable, catchError, map, of } from 'rxjs';
// import { HttpClient } from '@angular/common/http';
// import { AuthService } from '@shared/services/auth.service';
// import { environment } from 'src/app/environments/environment';
import { IPocStorage } from '@pages/dto/dictionary.dto';
import { UtilService } from '@shared/services/util.service';
import { PocService } from '@shared/services/offline/poc.service';

@Component({
  selector: 'app-backus',
  standalone: true,
  templateUrl: './app-backus.component.html',
  imports: [RouterModule, FormsModule, CommonModule, NzSelectModule, NzLayoutModule, NzIconModule, SpinnerLoadingComponent, NzTypographyModule, NzCardModule, NzTagModule, NzButtonModule, NzSpinModule],
  styleUrl: './app-backus.component.scss',
})

export class AppBackusComponent implements OnInit {
  otherComponentsEnabled = false;
  spiner = false;
  isCollapsed: boolean = false;
  isSelectedSucursal: boolean = false;
  isShowChange: boolean = true;
  selectedSucursal: any = [];
  dataSucursales: any[] = [];
  dataSucursalesResponse: any[] = [];
  filteredItems: any[] = [];

  user: any = localStorage.getItem('user');
  user_id = this.user ? JSON.parse(this.user).userId : '0';
  rol:any = localStorage.getItem('rol');
  loading = false;
  poc_id = parseInt(localStorage.getItem('poc_id') || '0');
  empresa_id:any =localStorage.getItem('empresa_id') || 'BK';
  optionList: string[] = [];
  filterSectedValue :any =localStorage.getItem("poc_nombre") || '';
  appPageIndex: number = 0;
  appPageSize: number = 10;
  appTotal: number = 0;
  isOffline: boolean = false;

  selectPoc: IPocStorage | null = null;

  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;
  constructor(
    private appBackusService: AppBackusService,
    private sharedDataService: SharedDataService,
    private router: Router,
    private utilService: UtilService,
    private pocService: PocService
  ) {}

  ngOnInit(): void {
    this.selectedSucursal = [];
    this.isOffline = !navigator.onLine;
    this.loadData(true, true);
  }
  onSearch(event:any){
    this.filterSectedValue=event;
    this.appPageIndex = 0;
    this.loadData(false);
  }
  async loadData(scroll:boolean, isInitialLoad = false) {
    try {
      // const app = 'BK';
      this.appPageIndex ++;
      if(isInitialLoad) this.loading = true;
      this.spiner = true;
      this.isOffline = !navigator.onLine;
      // console.log('isOffline-value',this.isOffline);
      // const getSucursales: any = await this.appBackusService.getStore4User(this.user_id,this.rol,this.appPageIndex + 1,this.appPageSize).then((response: any) => {
      if(!this.isOffline){
        console.log("modo online");
        this.appBackusService.getStoreList(this.appPageIndex, this.appPageSize, this.rol, this.user_id,this.filterSectedValue).subscribe(response => {
          if (Array.isArray(response)) {
            // console.log('appBackus-loadData-response',response);
            const sucursales = response.map((sucursal: any) => sucursal.poc_nombre);
            const sucursalesStrings: any[] = sucursales.filter((sucursal: any) => typeof sucursal === 'string');
            const sucursalesUnicas = Array.from(new Set(sucursalesStrings));
            this.dataSucursales = sucursalesUnicas;
            if (scroll) {
              console.log('if-scroll',scroll);
              this.dataSucursalesResponse = [...this.dataSucursalesResponse, ...response];
              this.optionList = [...this.optionList, ...this.dataSucursales];
            }else{
              console.log('else-scroll',scroll);
              this.optionList = [...this.dataSucursales];
              this.dataSucursalesResponse = [...response];
            }
  
            if (this.poc_id > 0){
              this.validateSucursal();
            }
            this.validateRoute();
          } else {
            console.error('La propiedad listSucursales no es un array.');
          }
          // this.loading = false;
          if(isInitialLoad) this.loading = false;
          this.spiner = false;
        });
      }else{
        console.log("modo offline");
        try {
          this.dataSucursalesResponse = await this.pocService.getSucursales();
          this.dataSucursales = await this.dataSucursalesResponse.map((sucursal: any) => sucursal.poc_nombre);
          // console.log('dataSucursales offline', this.dataSucursales);
          if (this.poc_id > 0){
            this.validateSucursal();
          }
          this.validateRoute();
          this.loading = false;
        } catch (error) {
          console.error('Error al cargar los productos de forma local:', error);
        }
      }

    } catch (error) {
      console.error('Error al cargar los datos:', error);
      if(isInitialLoad) this.loading = false;
      this.spiner = false;
      if (!navigator.onLine) {
        console.log('Cargando productos de forma offline...');
        
      }
    }
  }

  async selectItem(sucursal: string) {
    // try {
    //   this.loading = true;
    //   await this.appBackusService.findStorePoc(sucursal).then((response: any) => {
    //     localStorage.setItem('poc_id',response.sucursal.id);
    //     this.loading = false;
    //   });

    // } catch (error) {
    //   console.error('Error al cargar los datos:', error);
    //   this.loading = false;
    // }
    // para sacar el poc_id y guardar en el localstorage -gilder
    console.log('sucursal',sucursal);
    if(sucursal != null){
      let findDataSucursalSelect= this.dataSucursalesResponse.find((item:any)=> item.poc_nombre == sucursal);
      // console.log('findDataSucursalSelect',findDataSucursalSelect);
      if (findDataSucursalSelect) {
        this.utilService.savePocToLocalStorage(this.utilService.convertPocJson(findDataSucursalSelect));
      }
      this.selectedSucursal = sucursal;
      this.isSelectedSucursal = true;
      this.onSelectChange();
      this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._CLIENTE_BK}`]);
    }

  }

  onSelectChange() {
    this.otherComponentsEnabled = !!this.selectedSucursal;
    this.sharedDataService.changeSelectedSucursal(this.selectedSucursal);
    this.sharedDataService.changeComponentState({
      otherComponentsEnabled: this.otherComponentsEnabled,
    });
  }

  cancelarSucursal(){
    this.isSelectedSucursal = false;
    this.selectedSucursal = null;
    this.utilService.removePocFromLocalStorage();
    this.poc_id=0;
    // this.loadData();
    this.isOffline = !navigator.onLine;
    this.sharedDataService.changeSelectedSucursal('');
    this.router.navigate([`/` + this.routeCliente + ``]);
  }

  validateSucursal(){
    console.log('validateSucursal-poc_id',this.poc_id);
    const sucursal = this.dataSucursalesResponse.filter((sucursal: any) => {
      return sucursal.poc == this.poc_id
    });
    if (sucursal.length > 0) {
      this.selectedSucursal = sucursal[0].poc_nombre;
      this.isSelectedSucursal = true;
    }
  }

  validateRoute(){
    if(this.router.url == '/app-backus' && this.poc_id > 0){
      this.isSelectedSucursal = true;
      let findDataSucursalSelect = this.dataSucursalesResponse.filter((sucursal: any) => {
        return sucursal.poc == this.poc_id
      });
      if (findDataSucursalSelect?.length > 0) {
        this.selectedSucursal = findDataSucursalSelect[0].poc_nombre;
        this.isSelectedSucursal = true;
        this.onSelectChange();
        this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._CLIENTE_BK}`]);
      }
    }
  }

}
