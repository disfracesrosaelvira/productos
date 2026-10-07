import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzModalService } from 'ng-zorro-antd/modal';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { v4 as uuidv4 } from 'uuid';
import { FrenteService } from './frente.service';
import { PhotoUploadComponent } from '../../../../shared/components/photo-upload/photo-upload.component';
import { SpinnerLoadingComponent } from '../../../../shared/components/spinner-loading/spinner-loading.component';
import Constantes from '../../../../shared/constants/contants';
import { UtilService } from '@shared/services/util.service';
import { ILocationStorage, IPocStorage, IUserStorage } from '@pages/dto/dictionary.dto';
import { SharedService } from '@shared/services/shared.service';
import { environment } from 'src/app/environments/environment';
import { StoreOfflineService } from '@shared/services/offline.service';
import { SkuService } from '@shared/services/offline/sku.service';
@Component({
  selector: 'app-frentes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PhotoUploadComponent,
    SpinnerLoadingComponent,
    NzModalModule,
    NzCollapseModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzButtonModule,
    NzSelectModule,
    NzTypographyModule,
    NzCardModule,
    NzInputModule,
    NzListModule,
    NzIconModule,
  ],
  templateUrl: './frentes.component.html',
  styleUrl: './frentes.component.scss',
})
export class FrentesPernodComponent {

  otherComponentsEnabled = false;
  spiner = false;
  selectedSucursal: any = [];
  selectedCategoria: any = [];
  empresa_id =localStorage.getItem('empresa_id') || 'BK';
  checked = false;
  loading = false;
  savedSuccessfully: boolean = false;
  productosModificados: any[] = [];
  data: any = {
    sumTotalOptions: '',
    maxTotal: '',
    listadoOptionsCompetenciaPE: [],
    listadoOptionsPE: []
  }
  uploadFiles:any = [];
  selectPoc: IPocStorage | null = null;
  selectUser: IUserStorage | null = null;
  selectLocation: ILocationStorage | null = null;
  table = 'frente';
  nameContainer = 'frente';
  codeParent: string = '';

  constructor(
    private modalService: NzModalService,
    private router: Router,
    private frenteService: FrenteService,
    private sharedService: SharedService,
    private utilService: UtilService,
    private offlineService: StoreOfflineService,
    private skuService: SkuService,
  ) {
    this.selectPoc = this.utilService.getPocFromLocalStorage();
    this.selectUser = this.utilService.getUserFromLocalStorage();
    this.selectLocation = this.utilService.getLocationFromLocalStorage();
   }
  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.codeParent = uuidv4();
    this.loading = true;
    if(navigator.onLine) {
      this.sharedService.getMarca(this.empresa_id).then((response) => {
        if (response) {
          this.data.listadoOptionsPE = response?.listMarcas?.map((marca: any) => ({
            title: marca,
            value: 0,
          })).sort((a: any, b: any) => a.title.localeCompare(b.title));
        }
      }).catch((error) => {
        console.error('Error al cargar los datos:', error);
      });
      this.sharedService.getMarcaCompetencia(this.empresa_id).then((response) => {
        if (response) {
          this.data.listadoOptionsCompetenciaPE = response?.listMarcas?.map((marca: any) => ({
            title: marca,
            value: 0,
          })).sort((a: any, b: any) => a.title.localeCompare(b.title));
        }
      }).catch((error) => {
        console.error('Error al cargar los datos:', error);
      });
      this.loading = false;
    } else {
      console.log('Cargando productos de forma offline...');
      try {
        const marcas = await this.skuService.getMarcas(this.empresa_id, 0);
        const marcasCompetencia = await this.skuService.getMarcas(this.empresa_id, 1);
        console.log('marcas', marcas)
        console.log('marcasCompetencia', marcasCompetencia)
        this.data.listadoOptionsBK = marcas?.map((marca: any) => ({
          title: marca.marca,
          value: 0,
        })).sort((a: any, b: any) => a.title.localeCompare(b.title));
        this.data.listadoOptionsCompentenciaBK = marcasCompetencia?.map((marca: any) => ({
          title: marca.marca,
          value: 0,
        })).sort((a: any, b: any) => a.title.localeCompare(b.title));

      }catch (error) {
        this.loading = false;
        console.error('Error al cargar los productos de forma local:', error);
      }
      this.loading = false;
    }
  }

  calculateTotal() {
    this.data.sumTotalOptions = [...this.data.listadoOptionsCompetenciaPE, ...this.data.listadoOptionsPE]
      .reduce((accumulator, currentValue) => accumulator + currentValue.value, 0);
    console.log('sumTotalOptions', this.data.sumTotalOptions);
    this.data.maxTotal = this.data.sumTotalOptions;
  }

  isFormValid(): boolean {
    if (!this.data.maxTotal || this.data.maxTotal <= 0) {
      return false;
    }
    const atLeastOneOptionFilled = this.data.listadoOptionsCompetenciaPE.some((item: any) => item.value > 0) || this.data.listadoOptionsPE.some((item: any) => item.value > 0);
    return atLeastOneOptionFilled && (this.uploadFiles.length > 0);
  }

  async guardarOptions() {
    const isFormValid = this.isFormValid();
    if (!isFormValid) {
      return;
    }
    if (this.uploadFiles.length == 0) {
      this.modalService.warning({
        nzTitle: 'Advertencia',
        nzContent: 'Seleccione una imagen.',
      });
      return;
    }
    const skusCompetencia = this.data.listadoOptionsCompetenciaPE.filter((item:any) => item.value > 0).map((item: any) => ({marca: item.title, cantidad: item.value}));
    const skusPernod = this.data.listadoOptionsPE.filter((item:any) => item.value > 0).map((item: any) => ({marca: item.title, cantidad: item.value}));
    let request: any = {
      frente_id: uuidv4(),
      frente_total: this.data.maxTotal,
      skus: [...skusCompetencia, ...skusPernod],
      latitud: this.selectLocation?.latitude || 0 ,
      longitud: this.selectLocation?.longitude || 0,
      imagenes: this.uploadFiles.map((foto: any) => ({
        nombre: foto.name_file,
        imagen_url: foto.imagen_url,
        fecha_creacion: foto.fecha_creacion,
      })),
      poc: this.selectPoc || {},
      usuario: this.selectUser || {},
      empresa_id:this.empresa_id,
      fecha_creacion: new Date().toISOString(),
    }
    this.loading = true;
    try {
      if (navigator.onLine && !this.uploadFiles.some((file: any) => file.isOffline == true)) {
        request.offline = 0;
        this.frenteService.saveFrente(request).then((response) => {
          console.log('response | saveFrente =>', response);
          this.modalService.success({
            nzTitle: 'Guardado Exitoso',
            nzContent: 'Los datos se han guardado correctamente.',
          });
          this.loading = false;
          this.savedSuccessfully = true;
        }).catch((error) => {
          this.loading = false;
          console.log('error | saveFrente =>', error);
        });
      }else{
        request.imagenes = [];
        request.offline = 1;
        const dataToStore = {
          data: request,
          // id_store: this.codeParent,
          table: this.table,
          codeParent: this.codeParent,
        }
        try {
          await this.offlineService.addDocument(`${environment.tb_index_frente}`, dataToStore, `encuestas`);
          this.modalService.success({
            nzTitle: 'Guardado Exitoso Offline',
            nzContent:
              'Los datos de la exhibicion se han guardado correctamente de forma local.',
          });
          this.loading = false;
          this.savedSuccessfully = true;

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
      console.error('Hubo un error al guardar:', error);
      this.modalService.error({
        nzTitle: 'No se guardarón',
        nzContent: 'Hubo un error al guardar los datos.',
      });
      this.loading = false;
    }
  }
  validateNumberInputInteger(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];

    if (!allowedKeys.includes(event.key) && !/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
    if (input.value.length >= 4 && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }
  restrictMaxLength(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 4) {
      input.value = input.value.slice(0, 4);
    }
    input.value = input.value.replace(/[^0-9]/g, '');
  }

  updateItemValue(event: any, item: any, panelTitle: string) {
    const newValue = event.target.value.replace(/[^0-9]/g, '');
    item.value = newValue ? parseInt(newValue, 10) : 0;
    this.calculateTotal();
    const modifiedItem = { ...item, panelTitle: panelTitle };
    const existingItemIndex = this.productosModificados.findIndex(modificado => modificado.title === item.title);
    if (existingItemIndex > -1) {
      this.productosModificados[existingItemIndex] = modifiedItem;
    } else {
      this.productosModificados.push(modifiedItem);
    }
  }

  volverMenu() {
    this.router.navigate([
      `/${Constantes.ROUTES.APP.BK}/${Constantes.ROUTES._CLIENTE_BK}`,
    ]);
  }
  onFilesChanged(files: any[]) {
    this.uploadFiles = files;
  }
}
