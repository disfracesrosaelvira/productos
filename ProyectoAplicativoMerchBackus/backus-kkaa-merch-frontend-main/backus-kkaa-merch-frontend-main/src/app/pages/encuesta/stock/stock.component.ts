import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { format } from 'date-fns';

import { StockService } from './stock.service';
import { SharedDataService } from '../../app-backus/shared-data.service';
import Constantes from '../../../shared/constants/contants';
import { SharedService } from '../../../shared/services/shared.service';
import { v4 as uuidv4 } from 'uuid';
import { UtilService } from '@shared/services/util.service';
import { ILocationStorage, IPocStorage, IUserStorage } from '@pages/dto/dictionary.dto';
import { environment } from 'src/app/environments/environment';
import { StoreOfflineService } from '@shared/services/offline.service';
import { SkuService } from '@shared/services/offline/sku.service';
import { ProgressService } from '@shared/services/progress.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, NzCollapseModule, NzButtonModule, NzSelectModule, RouterModule, NzModalModule, NzTypographyModule, NzCardModule, NzInputModule, NzListModule, NzSpinModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.scss'
})
export class StockComponent {
  isCollapsed: boolean = false;

  otherComponentsEnabled = false;
  spiner = false;
  selectedSucursal: any = [];
  selectedCategoria: any = [];
  isSaveOK: boolean = false;
  isShowButton: boolean = true;
  loading = false;


  dataProductos: any[] = [];
  filteredItems: any[] = [];
  listProducto: any[] = [];
  listProductoOk: any[] = [];
  listSaveStock: any[] = [];
  producto: string[] = [];
  active: boolean = true;
  empresa_id =localStorage.getItem('empresa_id') || 'BK';
  selectPoc: IPocStorage | null = null;
  selectUser: IUserStorage | null = null;
  selectLocation: ILocationStorage | null = null;
  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;
  guardarDesabilitado: boolean = true;
  codeParent: string = '';
  listStock: any[] = [];
  table = 'stock';

  constructor(
    private stockService: StockService,
    private modalService: NzModalService,
    private router: Router,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService,
    private offlineService: StoreOfflineService,
    private utilService: UtilService,
    private skuService: SkuService,
    private progressService: ProgressService,
  ) {
    this.selectPoc = this.utilService.getPocFromLocalStorage();
    this.selectUser = this.utilService.getUserFromLocalStorage();
    this.selectLocation = this.utilService.getLocationFromLocalStorage();
  }

  ngOnInit(): void {
    this.loading = true;
    this.loadData();
  }

  async loadData() {
    try {
      console.log('Cargando datos de productos',this.empresa_id);
      this.codeParent = uuidv4();
      if(navigator.onLine) {
        this.sharedService.getProductosCompetencia(this.empresa_id).then((response) => {
          if (response) {
            this.listStock = response?.listProductos?.map((producto: any) => {
              return {
                descripcion: producto.descripcion,
                active: false,
                disabled: false,
                sku: producto.sku,
                imagen: producto.imagen,
                marca: producto.marca,
                listadoOptions: [
                  { typeOption: 'Gondola', value: null, code: 'gondola_stock' },
                  { typeOption: 'Exhibiciones', value: null, code: 'exhibiciones_stock' }
                ],
                recordExists:false
              };
            }).sort((a: any, b: any) => a.descripcion.localeCompare(b.descripcion));
            this.loading = false;
            // console.log(this.listStock);

          }
        }).catch((error) => {
          this.loading = false;
          console.error('Error al cargar los datos:', error);
        });
      }else{
        const productoCompetencia = await this.skuService.getProductos(this.empresa_id, 1);
        console.log('productoCompetencia', productoCompetencia);
        this.listStock = productoCompetencia?.map((producto: any) => {
          return {
            descripcion: producto.descripcion,
            active: false,
            disabled: false,
            sku: producto.sku,
            imagen: producto.imagen,
            marca: producto.marca,
            listadoOptions: [
              { typeOption: 'Gondola', value: null, code: 'gondola_stock' },
              { typeOption: 'Exhibiciones', value: null, code: 'exhibiciones_stock' }
            ],
            recordExists:false
          };
        }).sort((a: any, b: any) => a.descripcion.localeCompare(b.descripcion));
        this.loading = false;
      }
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  async validateRecord(){
    this.listStock.map((item) => {
      // let isNotContent = item.listadoOptions[0].value || item.listadoOptions[1].value ? true : false;
      let isValue = item.listadoOptions[0].value != null || item.listadoOptions[1].value != null ? true : false;
      if(isValue){
        item.recordExists=true
      }else{
        item.recordExists=false
      }
    });
    this.guardarDesabilitado =  !this.listStock.some(item => item.recordExists === true);
  }
  async saveStock() {
    this.loading = true;
    let listStockSave = this.listStock.map((item) => {
      let isNotContent = item.listadoOptions[0].value != null || item.listadoOptions[1].value != null ? true : false;
      let isValue = item.listadoOptions[0].value && item.listadoOptions[1].value? true : false;
      let stock = {
        code: `${item.empresa_id}0${item.sku}`,
        descripcion: item.descripcion,
        gondola_stock: item.listadoOptions[0].value,
        exhibiciones_stock: item.listadoOptions[1].value,
        sku: item.sku,
        marca: item.marca,
        isValue: isValue,
        isNotContent: isNotContent
      }
      return stock;
    });
    if (!listStockSave.some((item) => item.isNotContent == true)){
      this.loading = false;
      this.modalService.warning({
        nzTitle: '¡Advertencia!',
        nzContent: 'No hay datos para guardar.',
      });
      return;
    }
    const createdAt = new Date().toISOString();
    const formattedDate = format(new Date(createdAt), "yyyy-MM-dd'T'HH:mm:ss'Z'");

    this.listProductoOk = listStockSave.filter((item) => item.isNotContent == true).map((item) => {
      return {
        sku: item.sku,
        descripcion: item.descripcion,
        marca: item.marca,
        gondola_stock: item.gondola_stock ? item.gondola_stock : 0,
        exhibicion_stock: item.exhibiciones_stock ? item.exhibiciones_stock : 0,
      }
    });

    let request: any = {
      stock_id: uuidv4(),
      skus: this.listProductoOk,
      latitud: this.selectLocation?.latitude || 0 ,
      longitud: this.selectLocation?.longitude || 0,
      poc: this.selectPoc || {},
      usuario: this.selectUser || {},
      empresa_id:this.empresa_id,
      fecha_creacion: new Date().toUTCString(),
    }
    try {
      if (navigator.onLine){
        request.offline = 0;
        await this.stockService.saveStockInput(request).then((response) => {
          if (response.success) {
            this.modalService.success({
              nzTitle: 'Guardado Exitoso',
              nzContent:
                'Los datos se han guardado correctamente.',
            });
            console.log(`Producto guardado exitosamente`);
            this.loading = false;
            this.isSaveOK = true;
            this.isShowButton = false;
          }
        }).catch((error) => {
          this.loading = false;
          console.error('Error al guardar los datos de precio:', error);
          this.modalService.error({
            nzTitle: 'Error al guardar los datos',
            nzContent:
              'Hubo un error al guardar los datos.',
          });
          // throw error;
        });
      }else{
        request.offline = 1;
        const dataToStore = {
          data: request,
          // id_store: this.codeParent,
          table: this.table,
          codeParent: this.codeParent,
          stateUploadAzure: false,
        }
        try {
          await this.offlineService.addDocument(`${environment.tb_index_stock}`, dataToStore, `encuestas`);
          this.modalService.success({
            nzTitle: 'Guardado Exitoso Offline',
            nzContent:
              'Los datos de la exhibicion se han guardado correctamente de forma local.',
          });
          this.loading = false;
          this.isSaveOK = true;
          this.isShowButton = false;
          if(navigator.onLine){
            // !Permite actualizar el total de encuestas guardadas en offline
            this.progressService.updateIsSaveEncuesta(true);
          }
        } catch (error) {
          this.modalService.error({
            nzTitle: 'Error Guardado Offline',
            nzContent:
              'Error al guardar los datos de la exhibicion de forma local.',
          });
          this.loading = false;
        }
      }

    } catch (error) {
      this.loading = false;
    }

  }

  validateNumberInput(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];

    if (!allowedKeys.includes(event.key) && !/[0-9]/.test(event.key)) {
      event.preventDefault();
    }

    if (input.value.length >= 4 && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  volerMenu() {
    this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._CLIENTE_BK}`]);
  }

}
