import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
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
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { MenuExhibicionesService } from '../menu-exhibiciones.service';
import { SharedDataService } from '../../../app-backus/shared-data.service';
import { PhotoUploadComponent } from '../../../../shared/components/photo-upload/photo-upload.component';
import { SpinnerLoadingComponent } from '../../../../shared/components/spinner-loading/spinner-loading.component';
import { v4 as uuidv4 } from 'uuid';
import { ExhibicionContraprestadaService } from '@shared/services/offline/exhibicion_contraprestada.service';
import { StoreOfflineService } from '@shared/services/offline.service';
import { environment } from 'src/app/environments/environment';
import { ProgressService } from '@shared/services/progress.service';
import { UtilService } from '@shared/services/util.service';
import { IPocStorage } from '@pages/dto/dictionary.dto';
@Component({
  selector: 'app-exhibiciones-contraprestadas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PhotoUploadComponent, SpinnerLoadingComponent, NzTabsModule, NzGridModule, NzCollapseModule, NzButtonModule, NzSelectModule, NzModalModule, NzTypographyModule, NzCardModule, NzInputModule, NzListModule, NzSpinModule,NzIconModule, NzCheckboxModule],
  templateUrl: './exhibiciones-contraprestadas.component.html',
  styleUrl: './exhibiciones-contraprestadas.component.scss'
})
export class ExhibicionesContraprestadasComponent {
  isCollapsed: boolean = false;
  listExhibitionsHeader: any = [];
  loading = false;
  poc_id : any;
  type_contra:string = '';
  // poc_nombre = localStorage.getItem('poc_nombre') || '-';
  selectedFile: any = {};
  empresa_id : any;
  titleModal: string = '';
  user: any = localStorage.getItem('user');
  user_id = this.user ? JSON.parse(this.user).userId : '0';
  userName = this.user ? JSON.parse(this.user).userName : '-';
  objectConfirm: any={};
  contraprestadaSearch: any={};
  selectIndex: number=0;
  isVisible = false;
  selectedSucursal: any = [];
  uploadFiles:any = [];
  table: string ='exhibicion_contraprestada'
  nameContainer = 'exhibicion/contraprestada';
  codeParent: string = '';
  selectPoc: IPocStorage | null = null;

  constructor(
    private _menuExhibicionesService: MenuExhibicionesService,
    private modalService: NzModalService,
    private sharedDataService: SharedDataService,
    private exhibicionContraprestadaService: ExhibicionContraprestadaService,
    private offlineService: StoreOfflineService,
    private progressService: ProgressService,
    private utilService: UtilService,
  ) {
    this.selectPoc = this.utilService.getPocFromLocalStorage();
    console.log('this.selectPoc', this.selectPoc);
  }

  ngOnInit(): void {
    this.poc_id = parseInt(localStorage.getItem('poc_id') || '0');
    this.empresa_id = localStorage.getItem('empresa_id') || 'BK';
    this.sharedDataService.currentSelectedSucursal.subscribe((sucursal) => {
      this.selectedSucursal = sucursal;
    });
    this.loadData('alertas');
  }

  async loadData(accion:string): Promise<void> {
    this.codeParent = uuidv4();
    this.loading = true;
    if(navigator.onLine) {
      try {
        const response = await this._menuExhibicionesService.getExhibicionesContraprestadasAlertasVigente(this.empresa_id,this.poc_id,accion,this.user_id);
        if (Array.isArray(response.listContraprestadas)) {
          this.listExhibitionsHeader  = this.transformObjects(response.listContraprestadas, accion);
        }
      } catch (error) {
        this.loading = false;
        console.error('Error al cargar los datos:', error);
      } finally {
        this.loading = false;
      }
    }else{
      const result = await this.exhibicionContraprestadaService.getExhibicionesContraprestadas(this.empresa_id,this.poc_id,accion,this.user_id);
      const contraprestadas = result.sort((a, b) => {
        // Convertir los valores de correlativo a números para asegurarse de que se comparan correctamente
        return Number(a.correlativo) - Number(b.correlativo);
      });
      console.log('contraprestadas', contraprestadas);
      this.listExhibitionsHeader  = this.transformObjects(contraprestadas, accion);
      this.loading = false;
    }
  }

  selectTypeSearch(accion:string){
    this.listExhibitionsHeader=[];
    this.loadData(accion);
  }

  transformObjects(objects:any, accion:string) {
      if(accion == 'alertas'){
        return objects.map((obj:any) => ({
          tipo_exhibicion: obj.tipo_exhibicion,
          correlativo: obj.correlativo,
          producto: obj.skus,
          _id:obj._id,
          listExhibitionsOptions: [
            { typeOption: "Zona", value: obj.zona, code: "zona" },
            { typeOption: "Tienda", value: obj.tienda, code: "tienda" },
            { typeOption: "Campaña", value: obj.campaña, code: "campaña" },
            { typeOption: "Producto", value: obj.skus, code: "skus" },
            { typeOption: "Marca", value: obj.marca, code: "marca" },
            { typeOption: "Fecha Inicio", value: obj.fecha_inicio, code: "fecha_inicio" },
            { typeOption: "Fecha Fin", value: obj.fecha_fin, code: "fecha_fin" },
            { typeOption: "Usuario ID", value: obj.usuario.usuario_id, code: "usuario_id" },
            { typeOption: "Nombre Usuario", value: obj.usuario.nombre, code: "usuario_nombre" },
          ]
        }));
      }
      console.log('objects--vigentes', objects);
      return objects.map((obj:any) => ({
        tipo_exhibicion: obj.tipo_exhibicion,
        correlativo: obj.correlativo,
        producto: obj.skus,
        _id:obj._id,
        listExhibitionsOptions: [
          { typeOption: "Zona", value: obj.zona, code: "zona" },
          { typeOption: "Tienda", value: obj.tienda, code: "tienda" },
          { typeOption: "Campaña", value: obj.campaña, code: "campaña" },
          { typeOption: "Producto", value: obj.skus, code: "skus" },
          { typeOption: "Marca", value: obj.marca, code: "marca" },
          { typeOption: "Fecha Inicio", value: obj.fecha_inicio, code: "fecha_inicio" },
          { typeOption: "Fecha Fin", value: obj.fecha_fin, code: "fecha_fin" },
          { typeOption: "Usuario ID", value: obj.usuario.usuario_id, code: "usuario_id" },
          { typeOption: "Nombre Usuario", value: obj.usuario.nombre, code: "usuario_nombre" },
          { typeOption: "Validaciones", value: obj.validaciones, code: "validaciones" },
        ]
      }));
  }

  isFechaItem(itemCode: string): boolean {
    return itemCode === 'fecha_inicio' || itemCode === 'fecha_fin';
  }

  get isOkDisabledModal(): boolean {
    return !this.objectConfirm.comentario || this.uploadFiles.length === 0;
  }

  async confirmAlert() {
    if (!this.objectConfirm.comentario || this.uploadFiles.length === 0) {
        this.modalService.warning({nzTitle: 'Datos incompletos',nzContent: 'Complete los datos por favor.',});
        return;
    }
    // if (this.uploadFiles.length === 0) {
    //   this.modalService.warning({
    //     nzTitle: '¡Advertencia!',
    //     nzContent: 'No hay Imagenes para guardar.',
    //   });
    //   return;
    // }
    let request = {
      comentario: this.objectConfirm.comentario,
      comentarios_adicionales: this.objectConfirm.comentarios_adicionales,
      usuario_id: this.user_id,
      usuario_nombre: this.userName,
      type_contra:this.type_contra,
      poc: this.poc_id,
      imagenes: this.uploadFiles.map((foto: any) => ({
        nombre: foto.name_file,
        url: foto.imagen_url,
        fecha_creacion: new Date().toUTCString(),
        offline: 0, //agregar a todos los objetos de imagenes
      })),
      fecha_ultimo_relevo:new Date().toUTCString(),
    } as any;
    if (this.selectPoc?.tipo === 'SMK') request['tipo_mueble'] = this.objectConfirm.tipo_mueble ? 1 : 0;
    this.loading = true;
    if (navigator.onLine && !this.uploadFiles.some((file: any) => file.isOffline == true)) {
      try {
        for (const data of this.uploadFiles) { // elimina imagenes de indexDB
          await this.offlineService.deleteDocumentById(`${environment.tb_index_imagen}`, data._id);
        }
      } catch (error) {
        console.error('Error al eliminar documentos:', error);
      }
      request.offline = 0;
      const formData = new FormData();
      formData.append('table', this.table);
      formData.append('nameContainer', this.nameContainer);
      formData.append('data', JSON.stringify(request));
      this._menuExhibicionesService.updateExhibicionesContraprestadasVigente(this.objectConfirm._id,formData).then((response) => {
        if (response) {
          this.selectIndex = this.type_contra === 'confirmar' ? 0 : 1;
          this.loadData(this.type_contra === 'confirmar' ? 'alertas' : 'vigentes');
          this.isVisible = false;
          this.objectConfirm={};
          this.modalService.success({
            nzTitle: 'Exitoso',
            nzContent: 'Se actualizó los datos correctamente.',
          });
        }
      });

      this.loading = false;
    } else {
      request.imagenes = this.uploadFiles?.map((foto: any) => (foto.file ? foto.file : foto.viewImg)); // necesario para visualizarlo
      // request.imagenes = [];
      request.offline = 1;
      request.fecha_creacion = new Date().toUTCString();
      const dataToStore = {
        _id: this.objectConfirm._id,
        data: request,
        tipo_contraprestada: this.type_contra,
        // id_store: this.objectConfirm.codeParent,
        table: this.table,
        nameContainer: this.nameContainer,
        codeParent: this.objectConfirm.codeParent,
        stateUploadAzure: false,
      }
      try {
        // sino le encuentra en el indexDB se rompe la aplicacion y muestra "Ocurrio un error al guardar la exhibición, vuelva a realizar la sincronización por favor"
        this.contraprestadaSearch = await this.offlineService.getDocumentBy_Id(`${environment.tb_index_exhibicion_contraprestada}`, this.objectConfirm._id);
        // console.log('elementIndexDB-encontrado', this.contraprestadaSearch);
        // Verifica si this.contraprestadaSearch.validaciones existe, si no, inicialízalo como un array vacío

        if (!this.contraprestadaSearch.validaciones) {
          // console.log('ingreso al revalidar')
          this.contraprestadaSearch.validaciones = [];
        }
        this.contraprestadaSearch.vigente = true;
        this.contraprestadaSearch.validaciones.push(request);
        // console.log(`this.contraprestadaSearch-${this.type_contra}`, this.contraprestadaSearch);
        await this.offlineService.updateDocumentBy_Id(`${environment.tb_index_exhibicion_contraprestada}`, this.objectConfirm._id, this.contraprestadaSearch);
        // console.log('this.uploadFiles', this.uploadFiles);
        await this.offlineService.addDocument(`${environment.tb_index_exhibicion_contraprestada}`, dataToStore, `encuestas`);
        this.isVisible = false;
        this.objectConfirm={};
        // this.selectIndex=1;
        this.modalService.success({
          nzTitle: 'Guardado Exitoso Offline',
          nzContent:
          'Los datos se han guardado correctamente de forma local.',
        });
        if(navigator.onLine){
          // !Permite actualizar el total de encuestas guardadas en offline
          this.progressService.updateIsSaveEncuesta(true);
        }
        this.loadData(this.type_contra === 'confirmar' ? 'alertas' : 'vigentes');
        this.selectIndex = this.type_contra === 'confirmar' ? 0 : 1;
        // this.loadData('vigentes');
        this.loading = false;
      } catch (error) {
        console.log('error-Offline', error);
        this.modalService.error({
          nzTitle: 'Error Guardado Offline',
          nzContent:
            'Ocurrio un error al guardar la exhibición, vuelva a realizar la sincronización por favor',
        });
        this.loading = false;
      }
      this.loading = false;
    }
  }

  revalidateCurrent(item:any, event: Event){
    event.stopPropagation();
  }

  async showModal(item:any, event: Event,type_event:string){
    event.stopPropagation();
    this.titleModal = item.tipo_exhibicion;
    this.objectConfirm._id = item._id;
    this.type_contra = type_event;
    this.isVisible = true;
    this.codeParent = uuidv4();
    this.objectConfirm.codeParent = this.codeParent;
    if (this.selectPoc?.tipo === 'SMK') {
      this.objectConfirm.tipo_mueble = false;
    }
    // if (!navigator.onLine){
      // this.contraprestadaSearch = await this.offlineService.getDocumentBy_Id(`${environment.tb_index_exhibicion_contraprestada}`, item._id);
      // console.log('elementIndexDB-encontrado', this.contraprestadaSearch);
    // }
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  onFilesChanged(files: any[]) {
    this.uploadFiles = files;
  }

  dataComentarios = [
    { label: 'Ejecutado OK', value: 'Ejecutado OK' },
    { label: 'Ejecutado con bajo stock', value: 'Ejecutado con bajo stock' },
    { label: 'Ejecutado con otro sku', value: 'Ejecutado con otro sku' },
    { label: 'Ejecutado con otro elemento', value: 'Ejecutado con otro elemento' },
    { label: 'Ejecutado en otra zona', value: 'Ejecutado en otra zona' },
    { label: 'No ejecutado porque no figura en programación', value: 'No ejecutado porque no figura en programación' },
    { label: 'No ejecutado por falta de mobiliario/elemento', value: 'No ejecutado por falta de mobiliario/elemento' },
    { label: 'No ejecutado por remodelación de tienda',value:'No ejecutado por remodelación de tienda'},
    { label: 'No ejecutado por falta de stock',value:'No ejecutado por falta de stock'},
  ];
}
