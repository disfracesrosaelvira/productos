import { Component } from '@angular/core';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { format } from 'date-fns';
import { SharedService } from '../../../../shared/services/shared.service';
import { MenuIncidenciaService } from '../menu_incidencia.service';
import { SharedDataService } from '../../../app-backus/shared-data.service';
import { PhotoUploadComponent } from '../../../../shared/components/photo-upload/photo-upload.component';
import { SpinnerLoadingComponent } from '../../../../shared/components/spinner-loading/spinner-loading.component';
import Constantes from '../../../../shared/constants/contants';
import { UtilService } from '@shared/services/util.service';
import { IPocStorage, IUserStorage } from '@pages/dto/dictionary.dto';
import { v4 as uuidv4 } from 'uuid';
import { SkuService } from '@shared/services/offline/sku.service';
import { StoreOfflineService } from '@shared/services/offline.service';
import { ConfigValueService } from '@shared/services/offline/config_value.service';
import { environment } from 'src/app/environments/environment';
import { ProgressService } from '@shared/services/progress.service';

@Component({
  selector: 'app-incidencias-competencia',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PhotoUploadComponent, SpinnerLoadingComponent, NzGridModule, NzSegmentedModule, NzButtonModule, NzPageHeaderModule, NzPopoverModule, NzSpaceModule, NzBreadCrumbModule, NzSelectModule, NzModalModule, NzLayoutModule, NzMenuModule, NzIconModule, NzAvatarModule, NzTypographyModule, NzCardModule, NzInputModule, NzListModule,],
  templateUrl: './incidencias-competencia.component.html',
  styleUrl: './incidencias-competencia.component.scss',
})
export class IncidenciasCompetenciaComponent {

  loading = false;
  selectedIncidenciaCompetenciaOk: boolean = false;
  selectedTipo: string = '';
  selectedMarca: string = '';
  comentarios: string = '';

  user = localStorage.getItem('user');
  poc_id = parseInt(localStorage.getItem('poc_id') || '0');
  empresa_id =localStorage.getItem('empresa_id') || 'BK';
  latitude = parseFloat(localStorage.getItem('latitude') || '0');
  longitude = parseFloat(localStorage.getItem('longitude') || '0');
  table = 'incidencia_competencia';
  nameContainer = 'incidencia/compentencia';
  uploadFiles:any = [];
  codigoValues: string = 'tipo_incidencia_competencia';
  dataTipo: any[] = [];
  dataMarca: any[] = [];
  isFormValidFlag: boolean = false;
  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;
  selectPoc: IPocStorage | null = null;
  selectUser: IUserStorage | null = null;
  codeParent: string = '';
  constructor(
    private modalService: NzModalService,
    private router: Router,
    private sharedDataService: SharedDataService,
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
    this.sharedDataService.currentselectedIncidenciaCompetenciaOk.subscribe(detallIncidenciaCompotenciaOk => {
      this.selectedIncidenciaCompetenciaOk = detallIncidenciaCompotenciaOk;
    });
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.codeParent = uuidv4();
    if(navigator.onLine) {
      this.sharedService.getMarcaCompetencia(this.empresa_id).then((response) => {
        if (response) {
          this.dataMarca = response?.listMarcas?.map((marca: any) => ({
            value: marca,
            label: marca,
          })).sort((a: any, b: any) => a.label.localeCompare(b.label));
        }
      }).catch((error) => {
        console.error('Error al cargar los datos:', error);
      });
      this.sharedService.configurationValues(this.codigoValues).then((response) => {
        if (response.success) {
          this.dataTipo = response?.result?.filter((item: any) => item.codigo == Constantes.CONFIG_VALUES.TIPO_INCIDENCIA_COMPETENCIA).map((item: any) => item.valor)[0].sort((a: any, b: any) => a.label.localeCompare(b.label));
        }
      }).catch((error) => {
        console.error('Error al cargar los datos:', error);
      });
    }else{
      const marcasCompetencia = await this.skuService.getMarcas(this.empresa_id, 1);
      console.log('marcasCompetencia', marcasCompetencia)
      this.dataMarca = marcasCompetencia?.map((marca: any) => ({
        value: marca.marca,
        label: marca.marca,
      })).sort((a: any, b: any) => a.label.localeCompare(b.label));
      this.dataTipo = await this.configValueService.getValores(Constantes.CONFIG_VALUES.TIPO_INCIDENCIA_COMPETENCIA);
      console.log('dataZonas offline', this.dataTipo);
    }
    this.loading = false;
  }

  updateIsFormValid(): void {
    this.isFormValidFlag = !!this.selectedTipo && !!this.selectedMarca && (this.uploadFiles.length > 0);
  }
  selectTipo(event:any): void {
    this.updateIsFormValid();
  }
  selectMarca(event:any): void {
    this.updateIsFormValid();
  }
  async guardarIncidencia(): Promise<void> {
    if (!this.isFormValidFlag) {
      this.modalService.warning({
        nzTitle: '¡Advertencia!',
        nzContent: 'Debe seleccionar todos los campos.',
      });
      return;
    }
    this.loading = true;

    let request = {
      incidencia_competencia_id: this.codeParent,
      tipo: this.selectedTipo,
      marca: this.selectedMarca,
      comentario: this.comentarios,
      imagenes: this.uploadFiles.map((foto: any) => ({
        nombre: foto.name_file,
        imagen_url: foto.imagen_url
      })),
      latitud: this.latitude,
      longitud: this.longitude,
      poc: this.selectPoc || {},
      usuario: this.selectUser || {},
      empresa_id:this.empresa_id,
      fecha_creacion: new Date().toUTCString(),
    } as any;
    if (navigator.onLine && !this.uploadFiles.some((file: any) => file.isOffline == true)) {
      try {
        for (const data of this.uploadFiles) { // elimina imagenes de indexDB
          await this.offlineService.deleteDocumentById(`${environment.tb_index_imagen}`, data._id);
        }
      } catch (error) {
        console.error('Error al eliminar documentos:', error);
      }
      request.offline = 0;
      this.menuIncidenciaService.saveIncidenciaCompetencia(request).then((response) => {
        if (response?.success) {
          this.selectedIncidenciaCompetenciaOk = true;
        }
        this.loading = false;
      }).catch((error) => {
        this.loading = false;
      });
    } else {
      request.imagenes = [];
      request.offline = 1;
      const dataToStore = {
        data: request,
        // id_store: this.codeParent,
        table: this.table,
        codeParent: this.codeParent,
        stateUploadAzure: false,
      }
      try {
        await this.offlineService.addDocument(`${environment.tb_index_incidencia_competencia}`, dataToStore, `encuestas`);
        this.modalService.success({
          nzTitle: 'Guardado Exitoso Offline',
          nzContent:
            'Los datos se han guardado correctamente de forma local.',
        });
        this.loading = false;
        this.selectedIncidenciaCompetenciaOk = true;
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
  }

  volverMenu() {
    this.router.navigate([
      `/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._INCIDENCIA}`,
    ]);
  }

  onFilesChanged(files: any[]) {
    this.uploadFiles = files;
    this.updateIsFormValid();
  }
}
