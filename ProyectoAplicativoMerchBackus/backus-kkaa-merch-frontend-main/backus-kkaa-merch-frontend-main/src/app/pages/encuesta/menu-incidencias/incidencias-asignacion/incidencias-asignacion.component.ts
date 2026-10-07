import { Component, OnInit } from '@angular/core';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
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
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { format } from 'date-fns';
import { SharedService } from '../../../../shared/services/shared.service';
import { MenuIncidenciaService } from '../menu_incidencia.service';
import { SpinnerLoadingComponent } from '../../../../shared/components/spinner-loading/spinner-loading.component';
import Constantes from '../../../../shared/constants/contants';
import { UtilService } from '@shared/services/util.service';
import { IPocStorage, IUserStorage } from '@pages/dto/dictionary.dto';
import { v4 as uuidv4 } from 'uuid';
import { StoreOfflineService } from '@shared/services/offline.service';
import { ConfigValueService } from '@shared/services/offline/config_value.service';
import { SkuService } from '@shared/services/offline/sku.service';
import { environment } from 'src/app/environments/environment';
import { ProgressService } from '@shared/services/progress.service';

@Component({
  selector: 'app-incidencias-asignacion',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerLoadingComponent, NzDrawerModule, NzGridModule, NzSpinModule, NzCollapseModule, NzButtonModule, NzPageHeaderModule, NzSpaceModule, NzBreadCrumbModule, NzSelectModule, NzModalModule, NzLayoutModule, NzMenuModule, NzIconModule, NzAvatarModule, NzTypographyModule, NzCardModule, NzInputModule, NzListModule],
  templateUrl: './incidencias-asignacion.component.html',
  styleUrl: './incidencias-asignacion.component.scss'
})
export class IncidenciasAsignacionComponent {
  loading = false;
  guardadoExitoso = false;
  selectedMarcaMuebles: string | null = null;
  selectedTipoMueble: string | null = null;
  user = localStorage.getItem('user');
  poc_id = parseInt(localStorage.getItem('poc_id') || '0');
  empresa_id =localStorage.getItem('empresa_id') || 'BK';
  latitude = parseFloat(localStorage.getItem('latitude') || '0');
  longitude = parseFloat(localStorage.getItem('longitude') || '0');
  table = 'incidencia_mueble_asignacion';
  nameContainer = 'incidencia/mueble/asignacion';
  codigoValues: string = 'tipo_mueble';
  isFormValidFlag: boolean = false;
  dataMarcaMuebles: any[] = [];
  dataTipoMueble: any[] = [];
  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;
  selectPoc: IPocStorage | null = null;
  selectUser: IUserStorage | null = null;
  codeParent: string = '';
  constructor(
    private modalService: NzModalService,
    private router: Router,
    private menuIncidenciaService: MenuIncidenciaService,
    private sharedService: SharedService,
    private utilService: UtilService,
    private offlineService: StoreOfflineService,
    private skuService: SkuService,
    private configValueService: ConfigValueService,
    private progressService: ProgressService,
  ) {
    this.selectPoc = this.utilService.getPocFromLocalStorage();
    this.selectUser = this.utilService.getUserFromLocalStorage();
  }

  ngOnInit(): void {
    this.loading = true;
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.codeParent = uuidv4();
    if(navigator.onLine) {
      this.sharedService.getMarca(this.empresa_id).then((response) => {
        if (response) {
          this.dataMarcaMuebles = response?.listMarcas?.map((marca: any) => ({
            value: marca,
            label: marca,
          })).sort((a: any, b: any) => a.label.localeCompare(b.label));
        }
      }).catch((error) => {
        console.error('Error al cargar los datos:', error);
      });
      this.sharedService.configurationValues(this.codigoValues).then((response) => {
        if (response.success) {
          this.dataTipoMueble = response?.result?.filter((item: any) => item.codigo == Constantes.CONFIG_VALUES.TIPO_MUEBLE)
          .map((item: any) => item.valor)[0].sort((a: any, b: any) => a.label.localeCompare(b.label)); // Ordena de forma alfabética descendente;
        }
      }).catch((error) => {
        console.error('Error al cargar los datos:', error);
      });
    }else{
      const marcas = await this.skuService.getMarcas(this.empresa_id, 0);
      this.dataMarcaMuebles = marcas?.map((marca: any) => ({
        label: marca.marca,
        value: marca.marca,
      })).sort((a: any, b: any) => a.label.localeCompare(b.label));
      this.dataTipoMueble = await this.configValueService.getValores(Constantes.CONFIG_VALUES.TIPO_MUEBLE);
    }
    this.loading = false;
  }

  updateIsFormValid(): void {
    this.isFormValidFlag = !!this.selectedMarcaMuebles && !!this.selectedTipoMueble;
  }

  selectMarca(event: any): void {
    this.updateIsFormValid();
  }

  selectTipoMueble(event: any): void {
    this.updateIsFormValid();
  }

  async saveAsignacion() {
    if (!this.isFormValidFlag) {
      this.modalService.warning({
        nzTitle: '¡Advertencia!',
        nzContent: 'Debe seleccionar todos los campos.',
      });
      return;
    }
    this.loading = true;
    // const createdAt = new Date().toISOString();
    let request = {
      incidencia_mueble_asignacion_id: this.codeParent,
      marca: this.selectedMarcaMuebles,
      tipo_mueble: this.selectedTipoMueble,
      latitud: this.latitude,
      longitud: this.longitude,
      poc: this.selectPoc || {},
      usuario: this.selectUser || {},
      empresa_id:this.empresa_id,
      fecha_creacion: new Date().toUTCString(),
    } as any;
    if (navigator.onLine){
      request.offline = 0;
      await this.menuIncidenciaService.saveIncidenciaMuebleAsignacion(request).then((response) => {
        if (response?.success) {
          this.clearModels();
          this.guardadoExitoso = true;
        }
        this.loading = false;
      }).catch((error) => {
        this.loading = false;
      });
    } else {
      request.offline = 1;
      const dataToStore = {
        data: request,
        // id_store: this.codeParent,
        table: this.table,
        codeParent: this.codeParent,
        stateUploadAzure: false,
      }
      try {
        await this.offlineService.addDocument(`${environment.tb_index_incidencia_mueble_asignacion}`, dataToStore, `encuestas`);
        this.modalService.success({
          nzTitle: 'Guardado Exitoso Offline',
          nzContent:
            'Los datos se han guardado correctamente de forma local.',
        });
        this.loading = false;
        this.guardadoExitoso = true;
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
    this.loading = false;
  }

  clearModels(){
    this.selectedMarcaMuebles = null;
    this.selectedTipoMueble = null;
  }

  volverMenu() {
    this.router.navigate([
      `/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.INCIDENCIA_MUEBLES}`,
    ]);
  }

}
