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
import { PhotoUploadComponent } from '../../../shared/components/photo-upload/photo-upload.component';
import { SpinnerLoadingComponent } from '../../../shared/components/spinner-loading/spinner-loading.component';
import Constantes from '../../../shared/constants/contants';
import { UtilService } from '@shared/services/util.service';
import { ILocationStorage, IPocStorage, IUserStorage } from '@pages/dto/dictionary.dto';
import { SharedService } from '@shared/services/shared.service';
import { StoreOfflineService } from '@shared/services/offline.service';
import { SkuService } from '@shared/services/offline/sku.service';
import { ConfigValueService } from '@shared/services/offline/config_value.service';
import { environment } from 'src/app/environments/environment';
import { ProgressService } from '@shared/services/progress.service';
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
export class FrentesComponent {

  otherComponentsEnabled = false;
  spiner = false;
  selectedSucursal: any = [];
  selectedCategoria: any = [];
  empresa_id =localStorage.getItem('empresa_id') || 'BK';
  rol = localStorage.getItem('rol') || '';
  checked = false;
  loading = false;
  savedSuccessfully: boolean = false;
  productosModificados: any[] = [];
  data: any = {
    sumTotalOptions: '',
    maxTotal: '',
    listadoOptionsCompentenciaBK: [],
    listadoOptionsBK: [],
  }
  uploadFiles:any = [];
  selectPoc: IPocStorage | null = null;
  selectUser: IUserStorage | null = null;
  selectLocation: ILocationStorage | null = null;
  codeParent: string = '';
  table = 'frente';
  nameContainer = 'frente';
  codigoValues: string = 'sku_linea_marca';
  skuLineaMarcasNoCompetencia: any[] = [];
  routeCliente:any = this.empresa_id =='BK' ? Constantes.ROUTES.APP.BK : Constantes.ROUTES.APP.PERNORP;
  lineaMarcas: any = [];

  constructor(
    private modalService: NzModalService,
    private router: Router,
    private frenteService: FrenteService,
    private sharedService: SharedService,
    private utilService: UtilService,
    private offlineService: StoreOfflineService,
    private skuService: SkuService,
    private configValueService: ConfigValueService,
    private progressService: ProgressService,
  ) {
    this.selectPoc = this.utilService.getPocFromLocalStorage();
    this.selectUser = this.utilService.getUserFromLocalStorage();
    this.selectLocation = this.utilService.getLocationFromLocalStorage();
   }
  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.codeParent = uuidv4();
    if(navigator.onLine) {
      try {
        let marcasNoCompetencia: string [];
        const responseMarcas = await this.sharedService.getMarca(this.empresa_id);
        if (responseMarcas) {
          marcasNoCompetencia = responseMarcas?.listMarcas;
          this.data.listadoOptionsBK = marcasNoCompetencia?.map((marca: any) => ({
            title: marca,
            value: 0,
          })).sort((a: any, b: any) => a.title.localeCompare(b.title));
        }

        const responseMarcasCompetencia = await this.sharedService.getMarcaCompetencia(this.empresa_id);
        if (responseMarcasCompetencia) {
          this.data.listadoOptionsCompentenciaBK = responseMarcasCompetencia?.listMarcas?.map((marca: any) => ({
            title: marca,
            value: 0,
          })).sort((a: any, b: any) => a.title.localeCompare(b.title));
        }

        const responseConfigValues = await this.sharedService.configurationValues(this.codigoValues);
        if (responseConfigValues.success) {
          let data = responseConfigValues?.result?.filter((item: any) => item.codigo == Constantes.CONFIG_VALUES.SKU_LINEA_MARCA).map((item: any) => item.valor)[0];
          this.lineaMarcas = JSON.parse(JSON.stringify(data));
          data = data.filter((item: any) => item.competencia == 0 && item.empresa_id == this.empresa_id);
          data.forEach((element: any) => {
            element.marcas = element.marcas.filter((item: string) => marcasNoCompetencia.includes(item)); // solo considera los skus que se encuentran en la base de datos
          });
          this.skuLineaMarcasNoCompetencia = data.filter((item: any) => item.marcas.length != 0)
        }
      } catch (error) {
        this.loading = false;
        console.error('Error al cargar los datos:', error);
      } finally {
        this.loading = false;
      }
    }else{
      console.log('Cargando productos de forma offline...');
      try {
        const marcas = await this.skuService.getMarcas(this.empresa_id, 0);
        let marcasNoCompetencia = marcas?.map((marca: any) => marca.marca);
        const marcasCompetencia = await this.skuService.getMarcas(this.empresa_id, 1);
        console.log('marcas', marcas)
        // console.log('marcasCompetencia', marcasCompetencia)
        this.data.listadoOptionsBK = marcas?.map((marca: any) => ({
          title: marca.marca,
          value: 0,
        })).sort((a: any, b: any) => a.title.localeCompare(b.title));
        this.data.listadoOptionsCompentenciaBK = marcasCompetencia?.map((marca: any) => ({
          title: marca.marca,
          value: 0,
        })).sort((a: any, b: any) => a.title.localeCompare(b.title));
        let data = await this.configValueService.getValoresSinOrder(Constantes.CONFIG_VALUES.SKU_LINEA_MARCA);
        this.lineaMarcas = JSON.parse(JSON.stringify(data));
        data = data.filter((item: any) => item.competencia == 0 && item.empresa_id == this.empresa_id);
        data.forEach((element: any) => {
          element.marcas = element.marcas.filter((item: string) => marcasNoCompetencia.includes(item)); // solo considera los skus que se encuentran en la base de datos
        });
        this.skuLineaMarcasNoCompetencia = data.filter((item: any) => item.marcas.length != 0)
      }catch (error) {
        this.loading = false;
        console.error('Error al cargar los productos de forma local:', error);
      }
      this.loading = false;
    }
  }

  findItemByTitle(title: string) {
    return this.data.listadoOptionsBK.find((item: any) => item.title === title);
  }

  getHeaderText(): string {
    return 'FRENTES POR MARCA - ' + (this.empresa_id === 'BK' ? 'BACKUS' : 'PERNOD');
  }

  calculateTotal() {
    this.data.sumTotalOptions = [...this.data.listadoOptionsCompentenciaBK, ...this.data.listadoOptionsBK]
      .reduce((accumulator, currentValue) => accumulator + currentValue.value, 0);
    console.log('sumTotalOptions', this.data.sumTotalOptions);
    this.data.maxTotal = this.data.sumTotalOptions;
  }

  isFormValid(): boolean {
    if (!this.data.maxTotal || this.data.maxTotal <= 0) {
      return false;
    }
    const atLeastOneOptionFilled = this.data.listadoOptionsCompentenciaBK.some((item: any) => item.value > 0) ||
      this.data.listadoOptionsBK.some((item: any) => item.value > 0);
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
    // const createdAt = new Date().toISOString();
    // const formattedDate = format(new Date(createdAt), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const skusCompetencia = this.data.listadoOptionsCompentenciaBK.filter((item:any) => item.value > 0).map((item: any) => ({marca: item.title, cantidad: item.value}));
    const skusBackus = this.data.listadoOptionsBK.filter((item:any) => item.value > 0).map((item: any) => ({marca: item.title, cantidad: item.value}));

    const empresaIDNotCompetenciaLineaMarcas = this.lineaMarcas.filter((item: any) => item.empresa_id === this.empresa_id && item.competencia === 0);
    const empresaIDAndCompetenciaLineaMarcas = this.lineaMarcas.filter((item: any) => item.empresa_id === this.empresa_id && item.competencia === 1);

    skusCompetencia.forEach((element: any) => { // aqui se agrega linea
      for(let i = 0; i < empresaIDAndCompetenciaLineaMarcas.length; i++) {
        if (empresaIDAndCompetenciaLineaMarcas[i].marcas.includes(element.marca)) {
          element.linea = empresaIDAndCompetenciaLineaMarcas[i].linea;
          break;
        }
      }
    });

    skusBackus.forEach((element: any) => { // aqui se agrega linea
      for(let i = 0; i < empresaIDNotCompetenciaLineaMarcas.length; i++) {
        if (empresaIDNotCompetenciaLineaMarcas[i].marcas.includes(element.marca)) {
          element.linea = empresaIDNotCompetenciaLineaMarcas[i].linea;
          break;
        }
      }
    });
    let total_cerveza = 0;
    skusCompetencia.forEach((element: any) => {
      if (element.linea === 'Cervezas') {
        console.log('element', element)
        total_cerveza += element.cantidad;
      }
    });
    skusBackus.forEach((element: any) => {
      if (element.linea === 'Cervezas') {
        console.log('element', element)
        total_cerveza += element.cantidad;
      }
    });

    const request: any = {
      frente_id: uuidv4(),
      frente_total: this.data.maxTotal,
      skus: [...skusCompetencia, ...skusBackus],
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
      fecha_creacion: new Date().toUTCString(),
      total_cerveza: total_cerveza,
    }
    console.log('request', request)
    this.loading = true;
    try {
      if (navigator.onLine && !this.uploadFiles.some((file: any) => file.isOffline == true)) {
        try {
          for (const data of this.uploadFiles) { // elimina imagenes de indexDB
            await this.offlineService.deleteDocumentById(`${environment.tb_index_imagen}`, data._id);
          }
        } catch (error) {
          console.error('Error al eliminar documentos:', error);
        }
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
      } else {
        console.log('Guardando datos de forma offline...');
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
          await this.offlineService.addDocument(`${environment.tb_index_frente}`, dataToStore, `encuestas`);
          this.modalService.success({
            nzTitle: 'Guardado Exitoso Offline',
            nzContent:
              'Los datos se han guardado correctamente de forma local.',
          });
          this.loading = false;
          this.savedSuccessfully = true;
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
      `/${this.routeCliente}/${Constantes.ROUTES._CLIENTE_BK}`,
    ]);
  }
  onFilesChanged(files: any[]) {
    this.uploadFiles = files;
  }
}
// db.poc.find({}).forEach(function(pocDoc) {
//   db.exhibicion_competencia.updateMany(
//       { "poc.poc": pocDoc.poc },
//       {
//           $set: {
//               "poc.nombre": pocDoc.nombre || null,
//               "poc.nombre_planning": pocDoc.nombre_planning || null,
//               "poc.tipo": pocDoc.tipo || null,
//               "poc.poc_backus": pocDoc.poc_backus || null,
//               "poc.poc_cadena": pocDoc.poc_cadena || null,
//               "poc.documento_sv": pocDoc.documento_sv || null,
//               "poc.nombre_sv": pocDoc.nombre_sv || null,
//               "poc.poc_livetrade": pocDoc.poc_livetrade || null
//           }
//       }
//   );
// });


// Array para almacenar las operaciones de actualización
// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.exhibicion_competencia.bulkWrite(bulkOperations);
// }

// --------------------------------------------------------------------------

// exhibicion_adicional
// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.exhibicion_adicional.bulkWrite(bulkOperations);
// }

// // exhibicion_competencia
// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.exhibicion_competencia.bulkWrite(bulkOperations);
// }


// // exhibicion_contraprestada
// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.exhibicion_contraprestada.bulkWrite(bulkOperations);
// }


// // frente
// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.frente.bulkWrite(bulkOperations);
// }

// // incidencia_competencia  convertir a entero lo de string
// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.incidencia_competencia.bulkWrite(bulkOperations);
// }

// // incidencia_mueble_asignacion
// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.incidencia_mueble_asignacion.bulkWrite(bulkOperations);
// }

// //incidencia_mueble_mantenimiento
// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.incidencia_mueble_mantenimiento.bulkWrite(bulkOperations);
// }

// //incidencia_mueble_recojo
// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.incidencia_mueble_recojo.bulkWrite(bulkOperations);
// }


// // 
// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.precio.bulkWrite(bulkOperations);
// }


// const bulkOperations = [];
// db.poc.find({}).forEach(function(pocDoc) {
//     bulkOperations.push({
//         updateMany: {
//             filter: { "poc.poc": pocDoc.poc },
//             update: {
//                 $set: {
//                     "poc.nombre": pocDoc.nombre || null,
//                     "poc.nombre_planning": pocDoc.nombre_planning || null,
//                     "poc.tipo": pocDoc.tipo || null,
//                     "poc.poc_backus": pocDoc.poc_backus || null,
//                     "poc.poc_cadena": pocDoc.poc_cadena || null,
//                     "poc.documento_sv": pocDoc.documento_sv || null,
//                     "poc.nombre_sv": pocDoc.nombre_sv || null,
//                     "poc.poc_livetrade": pocDoc.poc_livetrade || null
//                 }
//             }
//         }
//     });
// });
// if (bulkOperations.length > 0) {
//     db.stock.bulkWrite(bulkOperations);
// }

// db.stock.updateMany(
//   { "poc.poc": { $type: "string" } }, // Filtra solo los documentos donde poc.poc es un string
//   [
//     {
//       $set: {
//         "poc.poc": { $toInt: "$poc.poc" } // Convierte el valor de poc.poc a entero
//       }
//     }
//   ]
// )