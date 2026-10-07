import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { Router, RouterModule } from '@angular/router';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
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
import { CommonModule } from '@angular/common';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { EncuestaPrecioService } from '../../menu-precio/encuesta-precio/encuesta-precio.service';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule, NzDatePickerComponent } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { v4 as uuidv4 } from 'uuid';
import { formatISO, format, parseISO } from 'date-fns';
import { MenuExhibicionesService } from '../menu-exhibiciones.service';
import Constantes from '../../../../shared/constants/contants';
import { PhotoUploadComponent } from '../../../../shared/components/photo-upload/photo-upload.component';
import { SpinnerLoadingComponent } from '../../../../shared/components/spinner-loading/spinner-loading.component';
import { IExhibicionCompetencia } from '@pages/dto/exhibicionCompetencia.dto';
import { ExhibitionReportsService } from '@pages/reports/exhibition-reports/exhibition-reports.service';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzElementPatchModule } from 'ng-zorro-antd/core/element-patch';
import { UtilService } from '@shared/services/util.service';
import { IPocStorage, IUserStorage } from '@pages/dto/dictionary.dto';
import { SharedService } from '@shared/services/shared.service';
import { SkuService } from '@shared/services/offline/sku.service';
import { ConfigValueService } from '@shared/services/offline/config_value.service';
import { StoreOfflineService } from '@shared/services/offline.service';
import { environment } from 'src/app/environments/environment';
import { ExhibicionCompetenciaRenovacionService } from '@shared/services/offline/exhibicion_competencia_renovacion.service';
import { ProgressService } from '@shared/services/progress.service';

@Component({
  selector: 'app-exhibiciones-competencia',
  standalone: true,
  imports: [CommonModule, RouterModule,NzElementPatchModule,FormsModule,NzPaginationModule,NzToolTipModule, PhotoUploadComponent, SpinnerLoadingComponent, NzTabsModule,NzDrawerModule, NzGridModule, NzCollapseModule, NzSegmentedModule, NzButtonModule, NzPageHeaderModule, NzPopoverModule, NzSpaceModule, NzBreadCrumbModule, NzSelectModule, NzModalModule, NzLayoutModule, NzMenuModule, NzIconModule, NzAvatarModule, NzTypographyModule, NzCardModule, NzInputModule, NzListModule, NzCheckboxModule, NzDatePickerModule, NzDividerModule],
  templateUrl: './exhibiciones-competencia.component.html',
  styleUrl: './exhibiciones-competencia.component.scss'
})
export class ExhibicionesCompetenciaComponent {
  @ViewChild('filterEndDatePicker') filterEndDatePicker!: NzDatePickerComponent;
  @ViewChild('button', { static: true }) button!: ElementRef;
  objectExhibicions:any ={products:[],zona:'',tipo_exhibicion:'',dia_vigencia:'1',file:'',contraprestada:false};
  productos: any[] = [];
  productosFiltrados: any[] = [];
  searchTerm = '';
  name_product='';
  filteredItems: any[] = [];
  loading = false;
  selectProduct:any='';
  selectedFile: any = {};
  checked = false;
  isCollapsed: boolean = false;
  guardadoExitoso = false;
  listExhibitionsHeader:any = [];
  listExhibitionsHeaderRenovable:any = [];
  dateRange: [Date, Date] = [new Date(), new Date()];
  startOfMonth: any = new Date();
  endOfMonth: any = new Date();
  poc_id = parseInt(localStorage.getItem('poc_id') || '0');
  empresa_id =localStorage.getItem('empresa_id') || 'BK';
  user: any = localStorage.getItem('user');
  user_id = this.user ? JSON.parse(this.user).userId : '0';
  userName = this.user ? JSON.parse(this.user).userName : '-';
  table = 'exhibicion_competencia';
  uploadFiles:any = [];
  nameContainer = 'exhibicion/competencia';
  today = new Date();
  cantidadExhibicion: any;
  isCantidad: boolean = false;
  comentarioExhibicion: string = '';
  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;
  valueStatusProduct:any = 'error'
  competenceExhibitionData: IExhibicionCompetencia[] = [];
  competenceExhibitionDataRenovable: IExhibicionCompetencia[] = [];
  loadingCompetenceExhibition: boolean = false;
  competenceExhibitionPageIndex: number = 1;
  competenceExhibitionPageRenavableIndex: number = 1;
  competenceExhibitionPageSize: number = 5;
  competenceExhibitionTotal: number = 0;
  competenceExhibitionTotalRenovable: number = 0;
  isPopoverVisibleCompetencia = false;
  isBlink: boolean = true;
  selectPoc: IPocStorage | null = null;
  selectUser: IUserStorage | null = null;

  codigoValues: string = 'tipo_exhibiciones,tipo_zonas';
  dataTipoExibiciones: any[] = [];
  dataZonas: any[] = [];

  isVisibleModalRenovar = false;
  objectExhibicionRenovar: any = { id: '', photos: [], endOfMonth: new Date(), comentario: '', fecha_inicio_vigencia: '' };
  codeParent: string = '';
  isOnline: boolean = navigator.onLine;
  constructor(
    private encuestaPrecioService: EncuestaPrecioService,
    private modalService: NzModalService,
    private _menuExhibicionesService:MenuExhibicionesService,
    private router:Router,private exhibitionReportsService: ExhibitionReportsService,
    private cdr: ChangeDetectorRef,
    private utilService: UtilService,
    private sharedService: SharedService,
    private skuService: SkuService,
    private configValueService: ConfigValueService,
    private offlineService: StoreOfflineService,
    private exhibicionCompetenciaRenovacionService: ExhibicionCompetenciaRenovacionService,
    private progressService: ProgressService,
  ){
    // this.utilService.validatePoc();
    this.selectPoc = this.utilService.getPocFromLocalStorage();
    this.selectUser = this.utilService.getUserFromLocalStorage();
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }
  updateOnlineStatus() {
    this.isOnline = navigator.onLine;
  }
  ngOnInit(): void {
    const now = new Date();
    // const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.startOfMonth= new Date();
    this.endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.dateRange = [this.startOfMonth, this.endOfMonth];
    this.loadData();
    this.listExhibitions();
  }

    onValueChange(event: any): void {
      this.selectProduct = event;
      this.onProductSelect();
    }

    onProductSelect(){
      if(!this.objectExhibicions.products)this.objectExhibicions.products=[];
      if(this.selectProduct!=undefined){
        let findByIdproduct= this.objectExhibicions.products.find((e:any)=>e._id==this.selectProduct._id);

        if(findByIdproduct ==undefined) {
          this.isBlink = false;
          this.productos.splice(this.productos.findIndex(i=>i._id==this.selectProduct._id),1);
          this.objectExhibicions.products.push({_id:this.selectProduct._id,descripcion:this.selectProduct.descripcion,sku:this.selectProduct.sku,imagen:this.selectProduct.imagen,marca:this.selectProduct.marca,linea:this.selectProduct.linea});
        }
        this.selectProduct=undefined;
        this.cdr.detectChanges();
      }

    }
    removeItemProduct(index:number,item:any): void {
      this.productos.push({_id:item._id,descripcion:item.descripcion,codigo:item.sku,imagen: item.imagen, marca: item.marca, linea: item.linea});
      this.objectExhibicions.products.splice(index,1);
      if(this.objectExhibicions.products.length==0) this.isBlink = true;
    }

    async loadData(): Promise<void> {
      try {
        this.codeParent = uuidv4();
        this.loading = true;
        // const app = 'BK';
        // Llama al servicio para obtener todos los productos
        const data = await this._menuExhibicionesService.getProductosAllCompetencia(this.empresa_id);
        // Verifica si la respuesta contiene la lista de productos
        if (data && data.listProductos) {
          // Filtra los productos por la categoría seleccionada
          const productosFiltradosCategoria = data.listProductos;
          // Filtra los productos por contenido válido y no vacios o nulos en los campos "nombre_cadena" y "categoria_backus"
          const productosFiltrados = productosFiltradosCategoria.filter(
            (producto: any) =>
              producto.descripcion &&
              producto.descripcion.trim() !== '' &&
              producto.descripcion &&
              producto.descripcion.trim() !== '-'
          );
          // Asigna los productos filtrados al arreglo this.productos
          this.productos = productosFiltrados.map((producto: any) => ({
            _id: producto._id,
            sku:producto.sku,
            descripcion: producto.descripcion,
            imagen: producto.imagen,
            marca: producto.marca,
            linea: producto.linea
          })).sort((a:any, b:any) => a.descripcion.localeCompare(b.descripcion));
          // this.filterProductsByCategory();
          this.sharedService.configurationValues(this.codigoValues).then((response) => {
            if (response.success) {
              this.dataTipoExibiciones = response?.result?.filter((item: any) => item.codigo == Constantes.CONFIG_VALUES.TIPO_EXHIBICIONES).map((item: any) => item.valor)[0].sort((a: any, b: any) => a.label.localeCompare(b.label));
              this.dataZonas = response?.result?.filter((item: any) => item.codigo == Constantes.CONFIG_VALUES.TIPO_ZONAS).map((item: any) => item.valor)[0].sort((a: any, b: any) => a.label.localeCompare(b.label));
            }
          }).catch((error) => {
            console.error('Error al cargar los datos:', error);
          });
          this.loading = false;
        } else {
          this.loading = false;
          console.error( 'Error: La respuesta del servicio no contiene la lista de productos');
        }
      } catch (error) {
        this.loading = false;
        console.error('Error al cargar los datos:', error);
        if (!navigator.onLine) {
          // console.log('Cargando productos de forma offline...');
          try {
            this.productos = await this.skuService.getProductos(this.empresa_id, 1);
            // console.log('productos offline', this.productos);
            this.dataTipoExibiciones = await this.configValueService.getValores(Constantes.CONFIG_VALUES.TIPO_EXHIBICIONES);
            // console.log('dataTipoExibiciones offline', this.dataTipoExibiciones);
            this.dataZonas = await this.configValueService.getValores(Constantes.CONFIG_VALUES.TIPO_ZONAS);
            // console.log('dataZonas offline', this.dataZonas);
          } catch (error) {
            console.error('Error al cargar los productos de forma local:', error);
          }
        }
      }

    }

    validateExhibicion(objeto:any) {
      return (objeto.zona &&
          objeto.tipo_exhibicion &&
          this.uploadFiles.length > 0
      );
    }

    async guardarExhibiciones(): Promise<void> {
      const latitude = localStorage.getItem('latitude');
      const longitude = localStorage.getItem('longitude');
      if (!this.validateExhibicion(this.objectExhibicions)) {
          console.warn('Hay campos incompletos');
          this.modalService.warning({
            nzTitle: 'Datos incompletos',
            nzContent: 'Complete los datos por favor.',
          });
          return;
      }

      if (this.objectExhibicions.products.length === 0) {
        this.modalService.warning({
          nzTitle: '¡Advertencia!',
          nzContent: 'No hay productos para guardar.',
        });
        return;
      }
      if (this.uploadFiles.length === 0) {
        this.modalService.warning({
          nzTitle: '¡Advertencia!',
          nzContent: 'No hay Imagenes para guardar.',
        });
        return;
      }
        try {
          this.loading = true;
          if (navigator.onLine && !this.uploadFiles.some((file: any) => file.isOffline == true)) {
            try {
              for (const data of this.uploadFiles) { // elimina imagenes de indexDB
                await this.offlineService.deleteDocumentById(`${environment.tb_index_imagen}`, data._id);
              }
            } catch (error) {
              console.error('Error al eliminar documentos:', error);
            }
            const formData = new FormData();
            formData.append('table', this.table);
            formData.append('uuid', uuidv4());
            formData.append('nameContainer', this.nameContainer);
            formData.append('data', JSON.stringify({
              exhibicion_competencia_id: uuidv4(),
              zona: this.objectExhibicions.zona,
              tipo_exhibicion: this.objectExhibicions.tipo_exhibicion,
              cantidad: parseInt(this.cantidadExhibicion) || 0,
              skus: this.objectExhibicions.products.map((producto:any)=>({
                descripcion:producto.descripcion,
                sku:producto.sku,
                marca: producto.marca,
                imagen:(producto?.imagen?.split("?"))[0],
                linea: producto.linea
              })),
              contraprestada:this.objectExhibicions.contraprestada,
              validaciones: [
                {
                  fecha_inicio_vigencia:  format(new Date(this.startOfMonth), "yyyy-MM-dd")+'T00:00:00Z',
                  fecha_fin_vigencia:  format(new Date(this.endOfMonth), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                  imagenes: this.uploadFiles.map((imagen: any) => ({
                    nombre: imagen.name_file,
                    imagen_url: imagen.imagen_url,
                    offline: 0,
                  })),
                  fecha_creacion:new Date().toUTCString(),
                  usuario: this.selectUser || {},
                  comentario: this.comentarioExhibicion,
                }
              ],
              latitud: latitude,
              longitud: longitude,
              fecha_inicio_vigencia:  format(new Date(this.startOfMonth),  "yyyy-MM-dd")+'T00:00:00Z',
              fecha_fin_vigencia:  format(new Date(this.endOfMonth), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
              poc: this.selectPoc || {},
              usuario: this.selectUser || {},
              empresa_id:this.empresa_id,
              fecha_creacion:new Date().toUTCString(),
              fecha_ultimo_relevo:new Date().toUTCString(),
              offline: 0
          }));
          this._menuExhibicionesService.saveExhibicion(formData).then((response) => {
            if (response) {
              this.modalService.success({
                nzTitle: 'Guardado Exitoso',
                nzContent:
                  'Los datos de la exhibicion se han guardado correctamente.',
              });
              this.guardadoExitoso = true;
            }
            this.loading = false;
          });
        } else {
          const dataToStore = {
            // id_store: this.codeParent,
            table: this.table,
            codeParent: this.codeParent,
            stateUploadAzure: false,
            data: {
              exhibicion_competencia_id: uuidv4(),
              zona: this.objectExhibicions.zona,
              tipo_exhibicion: this.objectExhibicions.tipo_exhibicion,
              cantidad: parseInt(this.cantidadExhibicion) || 0,
              skus: this.objectExhibicions.products.map((producto:any)=>({
                // _id:producto._id,
                descripcion:producto.descripcion,
                sku:producto.sku,
                marca: producto.marca,
                imagen:(producto?.imagen?.split("?"))[0],
                linea: producto.linea
              })),
              contraprestada:this.objectExhibicions.contraprestada,
              validaciones: [
                {
                  fecha_inicio_vigencia:  format(new Date(this.startOfMonth), "yyyy-MM-dd")+'T00:00:00Z',
                  fecha_fin_vigencia:  format(new Date(this.endOfMonth), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                  imagenes: [],
                  fecha_creacion:new Date().toUTCString(),
                  usuario: this.selectUser || {},
                  comentario: this.comentarioExhibicion,
                }
              ],
              latitud: latitude,
              longitud: longitude,
              fecha_inicio_vigencia:  format(new Date(this.startOfMonth),  "yyyy-MM-dd")+'T00:00:00Z',
              fecha_fin_vigencia:  format(new Date(this.endOfMonth), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
              poc: this.selectPoc || {},
              usuario: this.selectUser || {},
              empresa_id:this.empresa_id,
              fecha_creacion:new Date().toUTCString(),
              fecha_ultimo_relevo:new Date().toUTCString(),
              offline: 1
            }
          };
          try {
            await this.offlineService.addDocument(`${environment.tb_index_exhibicion_competencia}`, dataToStore, `encuestas`);
            this.modalService.success({
              nzTitle: 'Guardado Exitoso Offline',
              nzContent:
                'Los datos de la exhibicion se han guardado correctamente de forma local.',
            });
            this.guardadoExitoso = true;
            this.loading = false;

          } catch (error) {
            this.modalService.error({
              nzTitle: 'Error Guardado Offline',
              nzContent:
                'Error al guardar los datos de la exhibicion de forma local.',
            });
            this.loading = false;
          }
        }
          // await this.encuestaPrecioService.guardarProductos(formData);
        } catch (error) {
          this.loading = false;
          console.error(
            `Error al guardar Exhibiciones ${this.objectExhibicions.tipo_exhibicion}:`,
            error
          );
        }


      // this.modalService.success({
      //   nzTitle: 'Exitoso',
      //   nzContent: 'Se guardo los datos correctamente.',
      // });
      // this.navigateToMenuPrecio();
    }

    async listExhibitions(): Promise<void> {
      try {
        this.loading = true;
        const response = await this._menuExhibicionesService.getExhibicionesCompetencia(this.empresa_id,this.poc_id,this.user_id);
        if (Array.isArray(response.listContraprestadas)) {
          this.listExhibitionsHeader  = this.transformObjects(response.listContraprestadas);
        }
      } catch (error) {
        console.error('Error al cargar los datos:', error);
      } finally {
        this.loading = false;
      }
    }

    transformObjects(objects:any) {
      // format(obj.fecha_fin_vigencia, 'yyyy-MM-dd')
      return objects.map((obj:any) => ({
          nombre: obj.zona + ' - ' + obj.tipo_exhibicion,
          code_id: obj._id,
          listExhibitionsOptions: [
              { typeOption: "Zona", value:obj.zona, code: "zona" },
              { typeOption: "Tipo Exhibicion", value: obj.tipo_exhibicion, code: "tipo_exhibicion" },
              { typeOption: "Cantidad ", value: obj.cantidad, code: "cantidad"},
              { typeOption: "Fecha Inicio", value: obj.fecha_inicio_vigencia, code: "fec_ini_vigencia" },
              { typeOption: "Fecha Fin", value: obj.fecha_fin_vigencia, code: "fec_ini_vigencia" },
              { typeOption: "Fecha Creación", value: obj.fecha_creacion, code: "fecha_creacion" },
              { typeOption: "Usuario ID", value: obj.usuario.usuario_id, code: "usuario_id" },
              { typeOption: "Nombre Usuario", value: obj.usuario.nombre, code: "usuario_nombre" },
              // { typeOption: "Productos ", value: obj.productos, code: "productos"},
              // { typeOption: "Imágenes ", value: obj.imagenes, code: "imagenes"},
              { typeOption: "Validaciones", value: obj.validaciones, code: "validaciones" }
          ]
      }));
  }
  disabledStartDate = (endValue: Date): boolean => {
    if (!this.startOfMonth) {
      return false;
    }
    // Convierte startOfMonth a un objeto Date si aún no lo es
    const startValue = new Date(this.startOfMonth);

    // Ajusta las horas para comparar solo las fechas, no el tiempo exacto
    startValue.setHours(0, 0, 0, 0);
    endValue.setHours(0, 0, 0, 0);

    // Retorna true si endValue es anterior a startValue, permitiendo el mismo día
    return endValue.getTime() < startValue.getTime();
    // return endValue.getTime() <= this.startOfMonth.getTime();
  };
  disabledFilterStartDate = (startValue: Date): boolean => {
    // if (!this.startOfMonth) {
    //   return false;
    // }
    // Obtén la fecha actual sin la hora
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    // return startValue.getTime() <= this.today.getTime();
    // Compara la fecha actual con la fecha del calendario
    // Retorna true si la fecha del calendario es anterior a hoy, deshabilitándola
    return startValue.getTime() < today.getTime();
  };
  handleFilterStartDateOpenChange(open: boolean): void {
    if (!open) {
      if (this.startOfMonth > this.endOfMonth) {
        this.endOfMonth = new Date(this.startOfMonth);
    }
      this.filterEndDatePicker.open();
    }
  }
  deleteItemValidity(item:any, event: Event){
    event.stopPropagation();
    console.log("deleteItemValidity - item ", item);
    this.modalService.confirm({
      nzTitle: '¿Estás seguro de eliminar?',
      nzContent: `<b style="color: red;">${item.nombre}</b>`,
      nzOkText: 'Sí',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        console.log('OK');
        this.loading = true;
        this._menuExhibicionesService.deleteExhibicionCompetencia(item.code_id).then((response) => {
          if (response.success){
            this.loadCompetenceExhibition();
            this.loading = false;
          }
          console.log('Respuesta del backend:', response);
        }).catch((error) => {
          this.loading = false;
          console.log('error al eliminar la exhibicion:', error);
        });
      },
      nzCancelText: 'No',
      nzOnCancel: () => console.log('Cancel')
    });
  }
  deleteItemValidityRenovable(item:any, event: Event){
    event.stopPropagation();
    console.log("deleteItemValidity - item ", item);
    this.modalService.confirm({
      nzTitle: '¿Estás seguro de eliminar?',
      nzContent: `<b style="color: red;">${item.nombre}</b>`,
      nzOkText: 'Sí',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        console.log('OK');
        this.loading = true;
        this._menuExhibicionesService.deleteExhibicionCompetencia(item.code_id).then((response) => {
          if (response.success){
            this.loadCompetenceExhibitionRenovable();
            this.loading = false;
          }
          console.log('Respuesta del backend:', response);
        }).catch((error) => {
          this.loading = false;
          console.log('error al eliminar la exhibicion:', error);
        });
      },
      nzCancelText: 'No',
      nzOnCancel: () => console.log('Cancel')
    });
  }

  renovarExhibicion(item:any, event: Event){
    event.stopPropagation();
    this.objectExhibicionRenovar = {
      id: item.code_id,
      photos: [],
      endOfMonth: new Date(),
      fecha_inicio_vigencia: item.listExhibitionsOptions[3].value,
      comentario: '',
      codeParent: uuidv4(),
    }
    this.isVisibleModalRenovar = true;
  }

  volverMenu(){
    // this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._CLIENTE_BK}`]);
    this.clearDataModel();
    this.loadData();
    this.guardadoExitoso = false;
  }
  onDateChange(event: [Date, Date]) {
    console.log(event); // Imprime el rango de fechas seleccionado
  }
  onStartDateChange(event: Date) {
    console.log(event); // Imprime la fecha de inicio seleccionada

  }
  onEndDateChange(event: Date) {
    console.log(event); // Imprime la fecha de inicio seleccionada

  }

  validateNumberInputInteger(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Elimina cualquier carácter que no sea dígito
    
    // Verifica si el valor es solo un '0'
    if (value === '0') {
      value = '';
    } else {
      // Elimina ceros a la izquierda
      value = value.replace(/^0+/, '');
    }

    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    if (value !== input.value) {
      input.value = value;
      this.cantidadExhibicion = value;
    }
  }

  selectTypeExhibicion(event: any) {
    this.isCantidad = event == 'Cross' ? true : false;
  }
  onFilesChanged(files: any[]) {
    this.uploadFiles = files;
  }

  handleCompetenceExhibition(pageIndex: number) {
    this.competenceExhibitionPageIndex = pageIndex;

    this.loadCompetenceExhibition();
  }
  async loadCompetenceExhibition() {
    try {
      this.loading = true;
      const competenceExhibitionList = await this.exhibitionReportsService.getCompetenceExhibitionVigente(this.empresa_id,this.poc_id, this.competenceExhibitionPageIndex, this.competenceExhibitionPageSize,this.user_id);
      this.competenceExhibitionData = competenceExhibitionList.docs;
      this.competenceExhibitionTotal = competenceExhibitionList.totalDocs;
      this.loading = false;
      this.listExhibitionsHeader  = this.transformObjects(this.competenceExhibitionData);
    } catch (error) {
      this.loading = false;
      console.error('Error al cargar los datos:', error);
    }
  }
  handleCompetenceExhibitionRenovable(pageIndex: number) {
    this.competenceExhibitionPageRenavableIndex = pageIndex;

    this.loadCompetenceExhibitionRenovable();
  }
  async loadCompetenceExhibitionRenovable() {
    this.loading = true;
    if(navigator.onLine) {
      try {
        
        const competenceExhibitionList = await this.exhibitionReportsService.getCompetenceExhibitionRenovable(this.empresa_id,this.poc_id, this.competenceExhibitionPageIndex, this.competenceExhibitionPageSize,this.user_id);
        this.competenceExhibitionDataRenovable = competenceExhibitionList.docs;
        this.competenceExhibitionTotalRenovable = competenceExhibitionList.totalDocs;
        this.listExhibitionsHeaderRenovable  = this.transformObjects(this.competenceExhibitionDataRenovable);
        this.loading = false;
      } catch (error) {
        this.loading = false;
        console.error('Error al cargar los datos:', error);
      }
    } else {
      const aditionalExhibitionList = await this.exhibicionCompetenciaRenovacionService.getExhibicionesCompetenciaRenovacion(this.empresa_id,this.poc_id);
      this.listExhibitionsHeaderRenovable  = this.transformObjects(aditionalExhibitionList);
      this.loading = false;
    }  
  }
  clearDataModel() {
    this.isBlink = true;
    this.cantidadExhibicion = 0;
    this.isCantidad = false;
    this.uploadFiles = [];
    this.comentarioExhibicion = '';
    this.objectExhibicions = {products:[],zona:'',tipo_exhibicion:'',dia_vigencia:'1',file:'',contraprestada:false};
  }

  isFormValid(): boolean {
    if (!this.objectExhibicions.zona || !this.objectExhibicions.tipo_exhibicion) return false;

    if (this.isCantidad && !this.cantidadExhibicion) return false

    if (this.objectExhibicions.products.length === 0) return false;

    return (this.uploadFiles.length > 0);
  }

  handleCancelModalRenovar(): void {
    this.isVisibleModalRenovar = false;
  }

  async handleSaveModalRenovar() {
    this.loading = true;
    let payload: any = {
      id: this.objectExhibicionRenovar.id,
      fecha_fin_vigencia: format(new Date(this.objectExhibicionRenovar.endOfMonth), "yyyy-MM-dd")+'T00:00:00Z',
      validaciones: [
        {
          fecha_inicio_vigencia:  this.objectExhibicionRenovar.fecha_inicio_vigencia,
          fecha_fin_vigencia: format(new Date(this.objectExhibicionRenovar.endOfMonth), "yyyy-MM-dd")+'T00:00:00Z',
          imagenes: [],
          fecha_creacion: new Date().toUTCString(),
          usuario: this.selectUser || {},
          comentario: this.objectExhibicionRenovar.comentario,
        }
      ],
      fecha_ultimo_relevo:new Date().toUTCString(),
    }
    if (navigator.onLine && !this.objectExhibicionRenovar.photos.some((file: any) => file.isOffline == true)) {
      try {
        for (const data of this.objectExhibicionRenovar.photos) { // elimina imagenes de indexDB
          await this.offlineService.deleteDocumentById(`${environment.tb_index_imagen}`, data._id);
        }
      } catch (error) {
        console.error('Error al eliminar documentos:', error);
      }
      payload['offline'] = 0;
      payload['validaciones'][0]['imagenes'] = this.objectExhibicionRenovar.photos.map((imagen: any) => ({
        nombre: imagen.name_file,
        imagen_url: imagen.imagen_url,
        offline: 0,
      }));

      // this._menuExhibicionesService.updateExhibicionCompetenciaRenovar(payload).subscribe({
      //   next: () => {
      //     this.loading = false;
      //     this.isVisibleModalRenovar = false;
      //     this.loadCompetenceExhibitionRenovable();
      //     this.modalService.success({
      //       nzTitle: 'Guardado Exitoso',
      //       nzContent:
      //         'La renovación se ha guardado correctamente.',
      //     });
      //   },
      //   error: (error) => {
      //     this.loading = false;
      //     this.isVisibleModalRenovar = false;
      //   }
      // });
      this._menuExhibicionesService.updateExhibicionCompetenciaRenovar(payload)
      .then(() => {
        this.loading = false;
        this.isVisibleModalRenovar = false;
        this.modalService.success({
          nzTitle: 'Guardado Exitoso',
          nzContent: 'La renovación se ha guardado correctamente.',
        });
        this.loadCompetenceExhibitionRenovable();
      })
      .catch((error) => {
        console.error('Error al actualizar la exhibición adicional:', error);
        this.loading = false;
        this.isVisibleModalRenovar = false;
        this.modalService.error({
          nzTitle: 'Error',
          nzContent: 'Hubo un problema al guardar la renovación. Por favor, intente nuevamente.',
        });
      });
    } else {
      payload['offline'] = 1;
      const dataToStore = {
        table: 'exhibicion_competencia_renovable',
        codeParent: this.objectExhibicionRenovar.codeParent,
        stateUploadAzure: false,
        data: payload,
      };
      try {
        await this.offlineService.addDocument(`${environment.tb_index_exhibicion_competencia_renovable}`, dataToStore, `encuestas`);
        this.modalService.success({
          nzTitle: 'Guardado Exitoso Offline',
          nzContent:
            'Los datos de la exhibicion se han guardado correctamente de forma local.',
        });
        await this.offlineService.deleteDocumentById(`${environment.tb_index_exhibicion_competencia_renovable}`, this.objectExhibicionRenovar.id)
        this.guardadoExitoso = true;
        this.loading = false;
        this.isVisibleModalRenovar = false;
        if(navigator.onLine){
          // !Permite actualizar el total de encuestas guardadas en offline
          this.progressService.updateIsSaveEncuesta(true);
        }
        this.loadCompetenceExhibitionRenovable();
      } catch (error) {
        this.modalService.error({
          nzTitle: 'Error Guardado Offline',
          nzContent:
            'Error al guardar los datos de la exhibicion de forma local.',
        });
        this.loading = false;
        this.isVisibleModalRenovar = false;
      }
    }
  }

  get isOkDisabledModalRenovar(): boolean {
    return this.objectExhibicionRenovar.photos.length == 0;
  }

  onFilesChangeExhibicionRenovar(files: any[]) {
    this.objectExhibicionRenovar.photos = files;
  }
}
