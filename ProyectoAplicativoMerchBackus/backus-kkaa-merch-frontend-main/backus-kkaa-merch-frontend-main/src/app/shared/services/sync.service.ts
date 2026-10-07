import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StoreOfflineService } from './offline.service';
import { environment } from 'src/app/environments/environment';
import { formatISO, parseISO, format } from 'date-fns';
import { UploadService } from './upload.service';
import { MenuExhibicionesService } from '@pages/encuesta/menu-exhibiciones/menu-exhibiciones.service';
import { ProgressService } from './progress.service';
import { UtilService } from './util.service';
import { FrenteService  as FrentePernodService} from '@pages/encuesta/pernod/frentes/frente.service';
import { FrenteService } from '@pages/encuesta/frentes/frente.service';
import { StockService } from '@pages/encuesta/stock/stock.service';
import { EncuestaPrecioService } from '@pages/encuesta/menu-precio/encuesta-precio/encuesta-precio.service';
import { MenuIncidenciaService } from '@pages/encuesta/menu-incidencias/menu_incidencia.service';
import {IResponseService} from "@pages/dto/responseService.dto";

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  // constructor(private offlineService: StoreOfflineService, private http: HttpClient) {
  //   window.addEventListener('online', this.syncData.bind(this));
  // }
  // private saveTablesExhibiciones = ['exhibicion_adicional', 'exhibicion_competencia'];
  private saveEncuestasSuccess: any[] = [];
  private responseError = { success: false, isError: true, message: '', data: [] } as IResponseService;
  constructor(
    private offlineService: StoreOfflineService,
    private uploadService: UploadService,
    private _menuExhibicionesService: MenuExhibicionesService,
    private http: HttpClient,
    private progressService: ProgressService,
    private utilService: UtilService,
    private frenteService: FrenteService,
    private frentePernodService: FrentePernodService,
    private encuestaPrecioService: EncuestaPrecioService,
    private stockService: StockService,
    private menuIncidenciaService: MenuIncidenciaService,
  ) {
  }

  async syncDataOnline() {
    console.log('Offline now!');
  }
  async syncDataOffline() {
    // todas las fotos que no se subieron a azure
    const photos = await this.offlineService.getAllDocuments(`${environment.tb_index_imagen}`);
    const photosNotUploadedAzure = photos.filter((photo: any) => photo.stateUploadAzure === false);
    const batchPhotoSize = 2; // Tamaño del lote
    for (let i = 0; i < photosNotUploadedAzure.length; i += batchPhotoSize) {
      const batchPhoto = photosNotUploadedAzure.slice(i, i + batchPhotoSize);
      await this.uploadBatch(batchPhoto);
    }

    await this.delay(500); // Retraso de 500ms
    this.progressService.updateProgress(35);
    console.log('All photos uploaded successfully');
    const isHavePhotosUploadsToAzure = await this.utilService.isPhotosUploadsToAzure();
    console.log('isHavePhotosUploadsToAzure', isHavePhotosUploadsToAzure);
    if(!isHavePhotosUploadsToAzure){
      try{
        //no hay por subir al azure
        const tablasIndex = await this.utilService.getEncuestasPorSubir();
        const tablasRegistradas = tablasIndex.filter((tabla : any) => tabla.total > 0).map((tabla: any) => tabla.table);
        //guardamos las exhibiciones
        for (const table of tablasRegistradas) {
          const tableInformation = this.utilService.getInformationTable(table);
          console.log("tableeeeeee", table)
          console.log("tableInformation", tableInformation)
          //save Stock
          if(table == 'stock'){
            const tableEncuesta = (await this.offlineService.getAllDocuments(tableInformation.nameBDIndex, tableInformation.nameCollectionEncuestas)).filter((encuesta: any) => encuesta.stateUploadAzure == false);
            console.log('Encuestas indexDB-stock:', tableEncuesta);
            for (const encuesta of tableEncuesta) {
              await this.saveEncuestaStock(tableInformation.nameBDIndex, encuesta, tableInformation.nameCollectionEncuestas)
            }
            this.progressService.updateIsCompleteEncuestaStock(true);
            continue;
          }

          //save incidencia-mueble-asignacion
          if(table == 'incidencia_mueble_asignacion'){
            const tableEncuesta = (await this.offlineService.getAllDocuments(tableInformation.nameBDIndex, tableInformation.nameCollectionEncuestas)).filter((encuesta: any) => encuesta.stateUploadAzure == false);
            console.log('Encuestas indexDB-incidencia_mueble_asignacion:', tableEncuesta);
            for (const encuesta of tableEncuesta) {
              await this.saveEncuestaIncidencias(tableInformation.nameBDIndex, encuesta, tableInformation.nameCollectionEncuestas)
            }
            this.progressService.updateIsCompleteEncuestaInciMuebleAsignacion(true);
            continue;
          }

          let photosUploadedAzure;
          if(table == 'exhibicion_adicional_renovable') {
            photosUploadedAzure = (await this.offlineService.getAllDocuments(`${environment.tb_index_imagen}`))
              .filter((photo: any) => photo.stateUploadAzure === true && photo.table === 'exhibicion_adicional');
          } else if(table == 'exhibicion_competencia_renovable') {
            photosUploadedAzure = (await this.offlineService.getAllDocuments(`${environment.tb_index_imagen}`))
              .filter((photo: any) => photo.stateUploadAzure === true && photo.table === 'exhibicion_competencia');
          } else {
            photosUploadedAzure = (await this.offlineService.getAllDocuments(`${environment.tb_index_imagen}`))
              .filter((photo: any) => photo.stateUploadAzure === true && photo.table === table);
          }
          
          if (photosUploadedAzure.length == 0) continue;

          console.log("photosUploadedAzure", photosUploadedAzure)

          const tableEncuesta = (await this.offlineService.getAllDocuments(tableInformation.nameBDIndex, tableInformation.nameCollectionEncuestas)).filter((encuesta: any) => encuesta.stateUploadAzure == false);
          console.log('Encuestas indexDB-tableEncuesta:', tableEncuesta);

          //save exhibiciones adiciones o competencia
          if(table == 'exhibicion_adicional' || table == 'exhibicion_competencia'){
            const newEncuestasTransform = this.transformEncuestasExhibicion(tableEncuesta, photosUploadedAzure);
            console.log('Encuestas indexDB-transformEncuestasExhibicion:', newEncuestasTransform);
            for (const encuesta of newEncuestasTransform) {
              await this.saveEncuestaExhibcion(tableInformation.nameBDIndex, encuesta, tableInformation.nameCollectionEncuestas)
            }
            if(table == 'exhibicion_adicional'){
              this.progressService.updateIsCompleteEncuestaExhiAdicional(true);
            }else{
              this.progressService.updateIsCompleteEncuestaExhiCompetencia(true);
            }
          }

          //save exhibiciones contraprestadas
          if(table == 'exhibicion_contraprestada'){
            const newEncuestasTransform = this.transformEncuestasExhibicionContraprestada(tableEncuesta, photosUploadedAzure);
            console.log('Encuestas indexDB-transformEncuestasExhibicion:', newEncuestasTransform);
            for (const encuesta of newEncuestasTransform) {
              await this.saveEncuestaExhibcionContraprestada(tableInformation.nameBDIndex, encuesta, tableInformation.nameCollectionEncuestas)
            }
            this.progressService.updateIsCompleteEncuestaExhiContraprestada(true);
          }

          //save frente
          if(table == 'frente'){
            const newEncuestasTransform = this.transformEncuestasFrente(tableEncuesta, photosUploadedAzure);
            console.log('Encuestas indexDB-transformEncuestasFrente:', newEncuestasTransform)
            for (const encuesta of newEncuestasTransform) {
              await this.saveEncuestaFrente(tableInformation.nameBDIndex, encuesta, tableInformation.nameCollectionEncuestas)
            }
            this.progressService.updateIsCompleteEncuestaFrente(true);
          }

          //save Precio
          if(table == 'precio'){
            const newEncuestasTransform = this.transformEncuestasPrecio(tableEncuesta, photosUploadedAzure);
            console.log('Encuestas indexDB-transformEncuestasPrecio:', newEncuestasTransform)
            for (const encuesta of newEncuestasTransform) {
              await this.saveEncuestaPrecio(tableInformation.nameBDIndex, encuesta, tableInformation.nameCollectionEncuestas)
            }
            this.progressService.updateIsCompleteEncuestaPrecio(true);
          }

          //save Incidencias
          if(table == 'incidencia_competencia' || table == 'incidencia_mueble_recojo' || table == 'incidencia_mueble_mantenimiento'){
            const newEncuestasTransform = this.transformEncuestasIncidencias(tableEncuesta, photosUploadedAzure);
            console.log('Encuestas indexDB-transformEncuestasIncidencias:', newEncuestasTransform)
            for (const encuesta of newEncuestasTransform) {
              await this.saveEncuestaIncidencias(tableInformation.nameBDIndex, encuesta, tableInformation.nameCollectionEncuestas)
            }
            if(table == 'incidencia_competencia'){
              this.progressService.updateIsCompleteEncuestaInciCompetencia(true);
            }else if(table == 'incidencia_mueble_recojo'){
              this.progressService.updateIsCompleteEncuestaInciMuebleRecojo(true);
            }else if(table == 'incidencia_mueble_mantenimiento'){
            this.progressService.updateIsCompleteEncuestaInciMuebleMantenimiento(true);
            }
          }

          if(table == 'exhibicion_adicional_renovable'){
            const newEncuestasTransform = this.transformEncuestasExcibicionAdicionalRenovar(tableEncuesta, photosUploadedAzure);
            console.log('Encuestas indexDB-transformExhibicionAdicional-Renovable:', newEncuestasTransform)
            for (const encuesta of newEncuestasTransform) {
              await this.saveEncuestaExhibcionAdicionalRenovar(tableInformation.nameBDIndex, encuesta, tableInformation.nameCollectionEncuestas)
            }
            this.progressService.updateIsCompleteEncuestaPrecio(true);
          }

          if(table == 'exhibicion_competencia_renovable'){
            const newEncuestasTransform = this.transformEncuestasExcibicionCompetenciaRenovar(tableEncuesta, photosUploadedAzure);
            console.log('Encuestas indexDB-transformExhibicionAdicional-Renovable:', newEncuestasTransform)
            for (const encuesta of newEncuestasTransform) {
              await this.saveEncuestaExhibcionCompetenciaRenovar(tableInformation.nameBDIndex, encuesta, tableInformation.nameCollectionEncuestas)
            }
            this.progressService.updateIsCompleteEncuestaPrecio(true);
          }

        }

        await this.delay(500); // Retraso de 500ms
        this.progressService.updateProgress(90);

        console.log('this.saveEncuestasSuccess', this.saveEncuestasSuccess)
        // eliminar encuestas guardadas
        const documentsRemove = await this.utilService.getDocumentsUploaded();
        console.log('documentsRemove', documentsRemove);
        await this.deleteAllDocumentsAndImgs(documentsRemove);

        await this.delay(800); // Retraso de 500ms
        this.progressService.updateProgress(100);

        const responseSucess = {
          success: true,
          isError: false,
          message: 'Sincronización exitosa.',
          data: []
        } as IResponseService;
        this.progressService.updateResponseService(responseSucess);
      }catch (error) {
        this.responseError.message = 'Error al subir las encuestas. Por favor vuelva a intentar Sincronizar';
        this.progressService.updateResponseService(this.responseError);
      }

    }else{
      this.responseError.message = 'Imagenes por subir al Azure. Por favor vuelva a intentar Sincronizar';
      this.progressService.updateResponseService(this.responseError);
    }

    // const encuestasRegistradas = await this.utilService.getTotalEncuestas();
    // const totalEncuestas = encuestasRegistradas.reduce((acumulador, objetoActual) => acumulador + objetoActual.total, 0);
    // return totalEncuestas;
  }

  async uploadBatch(batch: any[]) {
    const maxRetries = 3; // numeros de intentos
    let attempt = 0; // intento actual
    while (attempt < maxRetries) {
      try {
        const uploadPhotosPromises = batch.map((photo: any) => this.uploadPhotoToAzure(photo));
        await Promise.all(uploadPhotosPromises);
        return; // Salir del bucle si la subida es exitosa
      } catch (error) {
        attempt++;
        console.error(`Attempt ${attempt} failed. Retrying...`, error);
        if (attempt === maxRetries) {
          this.responseError.message = 'Error al subir las fotos a Azure. Por favor vuelva a intentar Sincronizar';
          this.progressService.updateResponseService(this.responseError);
        }
      }
    }
  }

  async uploadPhotoToAzure(photo:any) {
    const file = this.convertBase64ToFile(photo.file, photo.foto_nombre_extension);
    const formData = new FormData();
    formData.append('table', photo.table);
    formData.append('uuid', photo._id);
    formData.append('nameContainer', photo.nameContainer);
    formData.append('data', JSON.stringify(photo.data));
    formData.append('file', file);
    await this.uploadService.uploadPhoto(formData)
      .then(async (response) => {
        console.log('uploadService.uploadPhoto-response', response);
        //actualizar el estado de la foto
        await this.offlineService.updateStatePhoto(photo._id, response?.data.imgUrl, response?.data.nameFile);
        //this.offlineService.updateDocument(photo._id, {stateUploadAzure: true});
      });

    return null;
  }

  async saveEncuestaStock(storeName:string, encuesta:any, collection:string) {
    console.log("saveEncuestaStock", encuesta);
    const maxRetries = 3; // numeros de intentos
    let attempt = 0; // intento actual
    while (attempt < maxRetries) {
      try {
        await this.stockService.saveStockInput(encuesta.data).then(async (response) => {
          await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
          this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
        });
        return;
      } catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          this.responseError.message = 'Error al subir los stock. Por favor vuelva a intentar Sincronizar';
          this.progressService.updateResponseService(this.responseError);
          throw new Error('Error en la encuesta de Stock.');
        }
      }
    }
  }

  async saveEncuestaExhibcion(storeName:string, encuesta:any, collection:string) {
    const maxRetries = 3; // numeros de intentos
    let attempt = 0; // intento actual
    while (attempt < maxRetries) {
      try {
        const formData = new FormData();
        formData.append('table', encuesta.table);
        formData.append('data', JSON.stringify(encuesta.data));
        await this._menuExhibicionesService.saveExhibicion(formData).then(async (response) => {
          await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
          this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
        });
        return;
      }catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          this.responseError.message = 'Error al subir las Exhibiciones. Por favor vuelva a intentar Sincronizar';
          this.progressService.updateResponseService(this.responseError);
          throw new Error('Error en la encuesta de Exhibiciones.');
        }
      }
    }
  }

  async saveEncuestaExhibcionContraprestada(storeName:string, encuesta:any, collection:string) {
    const maxRetries = 3; // numeros de intentos
    let attempt = 0; // intento actual
    while (attempt < maxRetries) {
      try {
        const formData = new FormData();
        formData.append('table', encuesta.table);
        formData.append('nameContainer', encuesta.nameContainer);
        formData.append('data', JSON.stringify(encuesta.data));
        await this._menuExhibicionesService.updateExhibicionesContraprestadasVigente(encuesta._id, formData).then(async (response) => {
          await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
          this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
        });
        return;
      }catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          this.responseError.message = 'Error al subir las Exhibiciones Contraprestadas. Por favor vuelva a intentar Sincronizar';
          this.progressService.updateResponseService(this.responseError);
          throw new Error('Error en la encuesta de Exhibiciones Contraprestadas.');
        }
      }
    }
  }

  async saveEncuestaFrente(storeName:string, encuesta:any, collection:string) {
    const maxRetries = 3; // numeros de intentos
    let attempt = 0; // intento actual
    while (attempt < maxRetries) {
      try {
        await this.frenteService.saveFrente(encuesta.data).then(async (response) => {
          await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
          this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
        });
        return;
      }catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          this.responseError.message = 'Error al subir Frentes. Por favor vuelva a intentar Sincronizar';
          this.progressService.updateResponseService(this.responseError);
          throw new Error('Error en la encuesta de Frente.');
        }
      }
    }
  }

  async saveEncuestaPrecio(storeName:string, encuesta:any, collection:string) {
    const maxRetries = 3; // numeros de intentos
    let attempt = 0; // intento actual
    while (attempt < maxRetries) {
      try {
        await this.encuestaPrecioService.savePrecioInput(encuesta.data).then(async (response) => {
          await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
          this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
        });
        return;
      }catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          this.responseError.message = 'Error al subir los Precios. Por favor vuelva a intentar Sincronizar';
          this.progressService.updateResponseService(this.responseError);
          throw new Error('Error en la encuesta de Precio.');
        }
      }
    }
  }

  async saveEncuestaIncidencias(storeName:string, encuesta:any, collection:string) {
    const maxRetries = 3; // numeros de intentos
    let attempt = 0; // intento actual
    while (attempt < maxRetries) {
      try {
        if(storeName == 'incidencia_mueble_recojo'){
          await this.menuIncidenciaService.saveIncidenciaMuebleRecojo(encuesta.data).then(async (response) => {
            await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
            this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
          });
        }
        if (storeName == 'incidencia_mueble_mantenimiento') {
          await this.menuIncidenciaService.saveIncidenciaMuebleMantenimiento(encuesta.data).then(async (response) => {
            await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
            this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
          });
        }
        if(storeName == 'incidencia_mueble_asignacion'){
          await this.menuIncidenciaService.saveIncidenciaMuebleAsignacion(encuesta.data).then(async (response) => {
            await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
            this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
          });
        }
        if(storeName == 'incidencia_competencia'){
          await this.menuIncidenciaService.saveIncidenciaCompetencia(encuesta.data).then(async (response) => {
            await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
            this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
          });
        }
        return;
      }catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          this.responseError.message = 'Error al subir las incidencias. Por favor vuelva a intentar Sincronizar';
          this.progressService.updateResponseService(this.responseError);
          throw new Error('Error en la encuesta de Incidencias.');
        }
      }
    }
  }

  async saveEncuestaExhibcionAdicionalRenovar(storeName:string, encuesta:any, collection:string) {
    const maxRetries = 3; // numeros de intentos
    let attempt = 0; // intento actual
    while (attempt < maxRetries) {
      try {
        await this._menuExhibicionesService.updateExhibicionAdicionalRenovar(encuesta.data).then(async (response) => {
          await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
          this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
        });
        return;
      } catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          this.responseError.message = 'Error al subir las renovaciones. Por favor vuelva a intentar Sincronizar';
          this.progressService.updateResponseService(this.responseError);
          throw new Error('Error en la encuesta de exhibiciones adicional renovar.');
        }
      }
    }
  }

  async saveEncuestaExhibcionCompetenciaRenovar(storeName:string, encuesta:any, collection:string) {
    const maxRetries = 3; // numeros de intentos
    let attempt = 0; // intento actual
    while (attempt < maxRetries) {
      try {
        await this._menuExhibicionesService.updateExhibicionCompetenciaRenovar(encuesta.data).then(async (response) => {
          await this.offlineService.updateStateDocument(storeName, encuesta.codeParent, collection);
          this.saveEncuestasSuccess.push({codeParent: encuesta.codeParent, nameStore: encuesta.table, nameCollection: collection});
        });
        return;
      } catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          this.responseError.message = 'Error al subir las renovaciones. Por favor vuelva a intentar Sincronizar';
          this.progressService.updateResponseService(this.responseError);
          throw new Error('Error en la encuesta de exhibiciones adicional renovar.');
        }
      }
    }
  }

  async syncDataOffline_U() { // al parecer ya no hace nada
    console.log('Online again!');
    console.log('Syncing data...');
    // add exhibicion adicional
    // get photos exhibicion adicional
    const tablasIndex = await this.utilService.getTotalEncuestas();
    console.log(" tablasIndex", tablasIndex);
    const tablasRegistradas = tablasIndex.filter((tabla : any) => tabla.total > 0).map((tabla: any) => tabla.table);
    console.log("tablas registradas", tablasRegistradas);
    let dataUpload = [];

    await this.delay(500); // Retraso de 500ms
    this.progressService.updateProgress(35);

    let uploadPhotoTable:any = [];
    let uploadEncuestaExhibicion:any = [];
    let uploadEncuestaFrente:any = [];
    let uploadEncuestaStock:any = [];
    let uploadEncuestaPrecio:any = [];
    let uploadEncuestaIncidenciaCompetencia:any = [];
    let uploadEncuestaIncidenciaMuebleRecojo:any = [];
    let uploadEncuestaIncidenciaMuebleMantenimiento:any = [];
    let uploadEncuestaMuebleAsignacion:any = [];
    //save Exhibiciones adicional y competencia
    for (const table of tablasRegistradas) {
      const tableInformation = this.utilService.getInformationTable(table);

      //save Stock
      if(table == 'stock'){
        const tableEncuesta = await this.offlineService.getAllDocuments(tableInformation.nameBDIndex, tableInformation.nameCollectionEncuestas);
        console.log('Encuestas indexDB:', tableEncuesta);
        const uploadPromises = tableEncuesta.map(encuesta => this.saveStockEncuesta(encuesta, tableInformation.nameCollectionEncuestas));
        const uploadStock = await Promise.all(uploadPromises);
        uploadEncuestaStock = [...uploadEncuestaStock, ...uploadStock];
        this.progressService.updateIsCompleteEncuestaStock(true);
        continue;
      }

      //save incidencia-mueble-asignacion
      if(table == 'incidencia_mueble_asignacion'){
        const tableEncuesta = await this.offlineService.getAllDocuments(tableInformation.nameBDIndex, tableInformation.nameCollectionEncuestas);
        console.log('Encuestas indexDB:', tableEncuesta);
        const uploadPromises = tableEncuesta.map(encuesta => this.saveIncidenciaMuebleAsignacionEncuesta(encuesta, tableInformation.nameCollectionEncuestas));
        const uploadIncidenciaMuebleAsignacion = await Promise.all(uploadPromises);
        uploadEncuestaMuebleAsignacion = [...uploadEncuestaMuebleAsignacion, ...uploadIncidenciaMuebleAsignacion];
        this.progressService.updateIsCompleteEncuestaInciMuebleAsignacion(true);
        continue;
      }

      const photosExhiAditi = await this.offlineService.getAllDocuments(tableInformation.nameBDIndex, tableInformation.nameCollectionPhotos);
      if (photosExhiAditi.length == 0) continue; // cuando no hay nada que guardar en funcion a las fotos

      const photosNotUploadedAzure: any = []; // fotos que no fueron subidas a azure
      const photosUploadedAzure: any = []; // fotos que fueron subidas a azure
      photosExhiAditi.forEach((photo) => {
        if(photo.isOffline) {
          photosNotUploadedAzure.push(photo);
        } else {
          photosUploadedAzure.push(photo);
        }
      });
      const uploadPhotosPromises = photosNotUploadedAzure.map((photo: any) => this.uploadPhotoAndCreateFormData(photo));
      const uploadPhotosTable = await Promise.all(uploadPhotosPromises);

      // const uploadPhotosTable = await Promise.all(uploadPhotosPromises);
      console.log('Photos uploadPhotosPromises:', uploadPhotosPromises);
      console.log('Photos indexDB:', uploadPhotosTable);

      const tableEncuesta = await this.offlineService.getAllDocuments(tableInformation.nameBDIndex, tableInformation.nameCollectionEncuestas);
      console.log('Encuestas indexDB:', tableEncuesta);

      const photos = photosUploadedAzure.concat(uploadPhotosTable); // se suman las fotos recien subidas + las antiguas
      console.log("lo que tiene photos-array", photos)

      //save exhibiciones adiciones o competencia
      if(table == 'exhibicion_adicional' || table == 'exhibicion_competencia'){
        const newEncuestasTransform = this.transformEncuestasExhibicion(tableEncuesta, photos);
        console.log('Encuestas indexDB-transformEncuestasExhibicion:', newEncuestasTransform);
        const uploadExhibicionPromises = newEncuestasTransform.map(encuesta => this.saveExhibcionEncuesta(encuesta, tableInformation.nameCollectionEncuestas));
        const uploadExhibicion = await Promise.all(uploadExhibicionPromises);
        uploadEncuestaExhibicion = [...uploadEncuestaExhibicion, ...uploadExhibicion];
        if(table == 'exhibicion_adicional'){
          this.progressService.updateIsCompleteEncuestaExhiAdicional(true);
        }else{
          this.progressService.updateIsCompleteEncuestaExhiCompetencia(true);
        }
      }

      //save exhibiciones contraprestadas
      if(table == 'exhibicion_contraprestada'){
        const newEncuestasTransform = this.transformEncuestasExhibicionContraprestada(tableEncuesta, photos);
        console.log('Encuestas indexDB-transformEncuestasExhibicion:', newEncuestasTransform);
        const uploadExhibicionPromises = newEncuestasTransform.map(encuesta => this.saveExhibcionContraprestadaEncuesta(encuesta, tableInformation.nameCollectionEncuestas));
        const uploadExhibicion = await Promise.all(uploadExhibicionPromises);
        uploadEncuestaExhibicion = [...uploadEncuestaExhibicion, ...uploadExhibicion];
        this.progressService.updateIsCompleteEncuestaExhiContraprestada(true);
      }

      //save frente
      if(table == 'frente'){
        const newEncuestasTransform = this.transformEncuestasFrente(tableEncuesta, photos);
        console.log('Encuestas indexDB-transformEncuestasFrente:', newEncuestasTransform)
        const uploadPromises = newEncuestasTransform.map(encuesta => this.saveFrenteEncuesta(encuesta, tableInformation.nameCollectionEncuestas));
        const uploadFrente = await Promise.all(uploadPromises);
        uploadEncuestaFrente = [...uploadEncuestaFrente, ...uploadFrente];
        this.progressService.updateIsCompleteEncuestaFrente(true);
      }

      //save Precio
      if(table == 'precio'){
        const newEncuestasTransform = this.transformEncuestasPrecio(tableEncuesta, photos);
        console.log('Encuestas indexDB-transformEncuestasPrecio:', newEncuestasTransform)
        const uploadPromises = newEncuestasTransform.map(encuesta => this.savePrecioEncuesta(encuesta, tableInformation.nameCollectionEncuestas));
        const uploadPrecio = await Promise.all(uploadPromises);
        uploadEncuestaPrecio = [...uploadEncuestaPrecio, ...uploadPrecio];
        this.progressService.updateIsCompleteEncuestaPrecio(true);
      }

      //save incidencia-competencia
      if(table == 'incidencia_competencia'){
        const newEncuestasTransform = this.transformEncuestasIncidencias(tableEncuesta, photos);
        console.log('Encuestas indexDB-transformEncuestasIncidenciaCompetencia:', newEncuestasTransform);
        const uploadIncidenciasPromises = newEncuestasTransform.map(encuesta => this.saveIncidenciaCompetenciaEncuesta(encuesta, tableInformation.nameCollectionEncuestas));
        const uploadIncidenciaCompetencia = await Promise.all(uploadIncidenciasPromises);
        uploadEncuestaIncidenciaCompetencia = [...uploadEncuestaIncidenciaCompetencia, ...uploadIncidenciaCompetencia];
        this.progressService.updateIsCompleteEncuestaInciCompetencia(true);
      }

      //save incidencia-mueble-asignacion
      if(table == 'incidencia_mueble_recojo'){
        const newEncuestasTransform = this.transformEncuestasIncidencias(tableEncuesta, photos);
        console.log('Encuestas indexDB-transformEncuestasIncidenciaMuebleRecojo:', newEncuestasTransform);
        const uploadIncidenciasPromises = newEncuestasTransform.map(encuesta => this.saveIncidenciaMuebleRecojoEncuesta(encuesta, tableInformation.nameCollectionEncuestas));
        const uploadIncidenciaRecojo = await Promise.all(uploadIncidenciasPromises);
        uploadEncuestaIncidenciaMuebleRecojo = [...uploadEncuestaIncidenciaMuebleRecojo, ...uploadIncidenciaRecojo];
        this.progressService.updateIsCompleteEncuestaInciMuebleRecojo(true);
      }

      //save incidencia-mueble-manetnimiento
      if(table == 'incidencia_mueble_mantenimiento'){
        const newEncuestasTransform = this.transformEncuestasIncidencias(tableEncuesta, photos);
        console.log('Encuestas indexDB-transformEncuestasIncidenciaMuebleMantenimiento:', newEncuestasTransform);
        const uploadIncidenciasPromises = newEncuestasTransform.map(encuesta => this.saveIncidenciaMuebleMantenimientoEncuesta(encuesta, tableInformation.nameCollectionEncuestas));
        const uploadIncidenciaMantenimiento = await Promise.all(uploadIncidenciasPromises);
        uploadEncuestaIncidenciaMuebleMantenimiento = [...uploadEncuestaIncidenciaMuebleMantenimiento, ...uploadIncidenciaMantenimiento];
        this.progressService.updateIsCompleteEncuestaInciMuebleMantenimiento(true);
      }

      uploadPhotoTable = [...uploadPhotoTable, ...photos];
    }

    await this.delay(500); // Retraso de 500ms
    this.progressService.updateProgress(90);
    console.log('uploadPhotoTable', uploadPhotoTable);
    console.log('uploadEncuestaExhibicion', uploadEncuestaExhibicion);
    console.log('uploadEncuestaFrente', uploadEncuestaFrente);
    console.log('uploadEncuestaStock', uploadEncuestaStock);
    console.log('uploadEncuestaPrecio', uploadEncuestaPrecio);
    console.log('uploadEncuestaIncidenciaCompetencia', uploadEncuestaIncidenciaCompetencia);
    console.log('uploadEncuestaIncidenciaMuebleRecojo', uploadEncuestaIncidenciaMuebleRecojo);
    console.log('uploadEncuestaIncidenciaMuebleMantenimiento', uploadEncuestaIncidenciaMuebleMantenimiento);
    console.log('uploadEncuestaMuebleAsignacion', uploadEncuestaMuebleAsignacion);
    dataUpload = [...uploadPhotoTable, ...uploadEncuestaExhibicion, ...uploadEncuestaFrente, ...uploadEncuestaStock, ...uploadEncuestaPrecio, ...uploadEncuestaIncidenciaCompetencia, ...uploadEncuestaIncidenciaMuebleRecojo, ...uploadEncuestaIncidenciaMuebleMantenimiento, ...uploadEncuestaMuebleAsignacion]
    console.log('dataUpload', dataUpload);
    //delete photos and encuestas exhibicion adicional
    // dataUpload.forEach(async (data:any) => {
    //   console.log('Deleting document:', data);
    //   await this.offlineService.deleteDocument(data.nameStore, data.id_store, data.nameCollection);
    // });
    await this.deleteAllDocuments(dataUpload);
    await this.delay(800); // Retraso de 500ms
    this.progressService.updateProgress(100);
    // const totalEncuestas = await this.utilService.getTotalEncuestas();
    const encuestasRegistradas = await this.utilService.getTotalEncuestas();
    const totalEncuestas = encuestasRegistradas.reduce((acumulador, objetoActual) => acumulador + objetoActual.total, 0);

    return totalEncuestas;
  }

  async uploadPhotoAndCreateFormData(photo:any) {
    const file = this.convertBase64ToFile(photo.file, photo.foto_nombre_extension);
    const formData = new FormData();
    formData.append('table', photo.table);
    formData.append('uuid', photo.foto_id);
    formData.append('nameContainer', photo.nameContainer);
    formData.append('data', JSON.stringify(photo.data));
    formData.append('file', file);
    const response = await this.uploadService.uploadPhoto(formData);
    if (response) {
      // console.log('response', response);
      return {
        codeParent: photo.codeParent,
        name_file: response.data.nameFile,
        imagen_url: response.data.imgUrl,
        fecha_creacion: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        // id_store: photo.id_store,
        nameStore: photo.table,
        nameCollection: `photos`,
      };
    }
    return null;
  }

  transformEncuestasExhibicion(encuestas: any[], fotosSubidas: any[]): any[] {
    return encuestas.map(encuesta => ({
      ...encuesta,
      data: {
        ...encuesta.data,
        validaciones: encuesta.data.validaciones.map((validacion : any) => ({
          ...validacion,
          imagenes: fotosSubidas.filter(foto => foto.codeParent === encuesta.codeParent)
            .map(foto => ({
              nombre: foto.name_file,
              imagen_url: foto.imagen_url,
              fecha_creacion: foto.fecha_creacion,
              offline: foto.isOffline ? 1 : 0,
            }))
        }))
      }
    }));
  }

  transformEncuestasExhibicionContraprestada(encuestas: any[], fotosSubidas: any[]): any[] {
    return encuestas.map(encuesta => ({
      ...encuesta,
      data: {
        ...encuesta.data,
        imagenes: fotosSubidas.filter(foto => foto.codeParent === encuesta.codeParent)
          .map(foto => ({
            nombre: foto.name_file,
            url: foto.imagen_url,
            fecha_creacion: foto.fecha_creacion,
            offline: foto.isOffline ? 1 : 0,
          }))
      }
    }));
  }

  transformEncuestasFrente(encuestas: any[], fotosSubidas: any[]): any[] {
    return encuestas.map(encuesta => ({
      ...encuesta,
      data: {
        ...encuesta.data,
        imagenes: fotosSubidas.filter(foto => foto.codeParent === encuesta.codeParent)
          .map(foto => ({
            nombre: foto.name_file,
            imagen_url: foto.imagen_url,
            fecha_creacion: foto.fecha_creacion,
            offline: foto.isOffline ? 1 : 0,
          }))
      }
    }));
  }

  transformEncuestasPrecio(encuestas: any[], fotosSubidas: any[]): any[] {
    // console.log("encuestas-transformEncuestasPrecio", encuestas);
    // console.log("fotosSubidas-transformEncuestasPrecio", fotosSubidas);
    return encuestas.map(encuesta => ({
      ...encuesta,
      data: {
        ...encuesta.data,
        skus: encuesta.data.skus.map((sku:any) => ({
          ...sku,
          imagen_url: fotosSubidas.filter(foto => foto.codeParent === sku.codeParent)
          .map(foto => foto.imagen_url)[0]
        })),
      }
    }));
  }

  transformEncuestasIncidencias(encuestas: any[], fotosSubidas: any[]): any[] {
    return encuestas.map(encuesta => ({
      ...encuesta,
      data: {
        ...encuesta.data,
        imagenes: fotosSubidas.filter(foto => foto.codeParent === encuesta.codeParent)
          .map(foto => ({
            nombre: foto.name_file,
            imagen_url: foto.imagen_url,
            fecha_creacion: foto.fecha_creacion,
            offline: foto.isOffline ? 1 : 0,
          }))
      }
    }));
  }

  transformEncuestasExcibicionAdicionalRenovar(encuestas: any[], fotosSubidas: any[]): any[] {
    return encuestas.map(encuesta => ({
      ...encuesta,
      data: {
        ...encuesta.data,
        validaciones: encuesta.data.validaciones.map((validacion: any) => ({
          ...validacion,
          imagenes: fotosSubidas.filter(foto => foto.codeParent === encuesta.codeParent)
          .map(foto => ({
            nombre: foto.name_file,
            imagen_url: foto.imagen_url,
            fecha_creacion: foto.fecha_creacion,
            offline: foto.isOffline ? 1 : 0,
          }))
        })),
      }
    }));
  }

  transformEncuestasExcibicionCompetenciaRenovar(encuestas: any[], fotosSubidas: any[]): any[] {
    return encuestas.map(encuesta => ({
      ...encuesta,
      data: {
        ...encuesta.data,
        validaciones: encuesta.data.validaciones.map((validacion: any) => ({
          ...validacion,
          imagenes: fotosSubidas.filter(foto => foto.codeParent === encuesta.codeParent)
          .map(foto => ({
            nombre: foto.name_file,
            imagen_url: foto.imagen_url,
            fecha_creacion: foto.fecha_creacion,
            offline: foto.isOffline ? 1 : 0,
          }))
        })),
      }
    }));
  }

  async saveExhibcionEncuesta(encuesta:any, collection:string) {
    const formData = new FormData();
    formData.append('table', encuesta.table);
    formData.append('data', JSON.stringify(encuesta.data));
    const response = await this._menuExhibicionesService.saveExhibicion(formData);
    if (response) {
      // console.log('response', response);
      return {
        codeParent: encuesta.codeParent,
        // id_store: encuesta.id_store,
        nameStore: encuesta.table,
        nameCollection: collection,
      };
    }
    return null;
  }

  async saveExhibcionContraprestadaEncuesta(encuesta:any, collection:string) {
    const formData = new FormData();
    formData.append('table', encuesta.table);
    formData.append('nameContainer', encuesta.nameContainer);
    formData.append('data', JSON.stringify(encuesta.data));
    const response = await this._menuExhibicionesService.updateExhibicionesContraprestadasVigente(encuesta._id, formData);
    if (response) {
      // console.log('response', response);
      return {
        codeParent: encuesta.codeParent,
        // id_store: encuesta.id_store,
        nameStore: encuesta.table,
        nameCollection: collection,
      };
    }
    return null;
  }

  async saveFrenteEncuesta(encuesta:any, collection:string) {
    // console.log("frenteEncuesta", encuesta);
    const response = await this.frenteService.saveFrente(encuesta.data);
    if (response) {
      // console.log('response', response);
      return {
        codeParent: encuesta.codeParent,
        // id_store: encuesta.id_store,
        nameStore: encuesta.table,
        nameCollection: collection,
      };
    }
    return null;
  }

  async savePrecioEncuesta(encuesta:any, collection:string) {
    // console.log("PrecioEncuesta", encuesta);
    const response = await this.encuestaPrecioService.savePrecioInput(encuesta.data);
    if (response) {
      // console.log('response', response);
      return {
        codeParent: encuesta.codeParent,
        // id_store: encuesta.id_store,
        nameStore: encuesta.table,
        nameCollection: collection,
      };
    }
    return null;
  }

  async saveStockEncuesta(encuesta:any, collection:string) {
    // console.log("stockEncuesta", encuesta);
    // const response = await this.frenteService.saveFrente(encuesta.data);
    const response = this.stockService.saveStockInput(encuesta.data);
    if (response) {
      console.log('response', response);
      return {
        codeParent: encuesta.codeParent,
        // id_store: encuesta.id_store,
        nameStore: encuesta.table,
        nameCollection: collection,
      };
    }
    return null;
  }

  async saveIncidenciaCompetenciaEncuesta(encuesta:any, collection:string) {
    // console.log("saveIncidenciaCompetenciaEncuesta", encuesta);
    const response = await this.menuIncidenciaService.saveIncidenciaCompetencia(encuesta.data);
    if (response) {
      // console.log('response', response);
      return {
        codeParent: encuesta.codeParent,
        // id_store: encuesta.id_store,
        nameStore: encuesta.table,
        nameCollection: collection,
      };
    }
    return null;
  }

  async saveIncidenciaMuebleRecojoEncuesta(encuesta:any, collection:string) {
    // console.log("saveIncidenciaMuebleRecojoEncuesta", encuesta);
    const response = await this.menuIncidenciaService.saveIncidenciaMuebleRecojo(encuesta.data);
    if (response) {
      // console.log('response', response);
      return {
        codeParent: encuesta.codeParent,
        // id_store: encuesta.id_store,
        nameStore: encuesta.table,
        nameCollection: collection,
      };
    }
    return null;
  }

  async saveIncidenciaMuebleMantenimientoEncuesta(encuesta:any, collection:string) {
    // console.log("saveIncidenciaMuebleMantenimientoEncuesta", encuesta);
    const response = await this.menuIncidenciaService.saveIncidenciaMuebleMantenimiento(encuesta.data);
    if (response) {
      // console.log('response', response);
      return {
        codeParent: encuesta.codeParent,
        // id_store: encuesta.id_store,
        nameStore: encuesta.table,
        nameCollection: collection,
      };
    }
    return null;
  }

  async saveIncidenciaMuebleAsignacionEncuesta(encuesta:any, collection:string) {
    // console.log("saveIncidenciaMuebleAsignacionEncuesta", encuesta);
    // const response = await this.frenteService.saveFrente(encuesta.data);
    const response = this.menuIncidenciaService.saveIncidenciaMuebleAsignacion(encuesta.data);
    if (response) {
      console.log('response', response);
      return {
        codeParent: encuesta.codeParent,
        // id_store: encuesta.id_store,
        nameStore: encuesta.table,
        nameCollection: collection,
      };
    }
    return null;
  }

  async deleteAllDocuments(dataUpload: any[]) {
    try {
      for (const data of dataUpload) {
        await this.offlineService.deleteDocument(data.nameStore, data.codeParent, data.nameCollection);
      }
      console.log('Todos los documentos han sido eliminados.');
    } catch (error) {
      console.error('Error al eliminar documentos:', error);
    }
  }

  async deleteAllDocumentsAndImgs(dataUpload: any[]) {
    try {
      for (const data of dataUpload) {
        //eliminamos las encuestas
        await this.offlineService.deleteDocument(data.nameStore, data.codeParent, data.nameCollection);
        if (data.nameStore == 'precio') {
          //eliminamos las imagenes
          for (const sku of data.skus) {
            await this.offlineService.deleteDocument(`${environment.tb_index_imagen}`, sku.codeParent);
          }
        } else {
          //eliminamos las imagenes
          await this.offlineService.deleteDocument(`${environment.tb_index_imagen}`, data.codeParent);
        }  
      }
      console.log('Todos los documentos han sido eliminados.');
    } catch (error) {
      console.error('Error al eliminar documentos:', error);
    }
  }

  convertBase64ToFile(base64: string, nombreArchivo: string): File {
    // Eliminar metadatos de base64 (si existen)
    const base64SinMetadata = base64.split(';base64,').pop()!;
    // Convertir base64 a un array de bytes
    const bytes = atob(base64SinMetadata);
    const array = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes.charCodeAt(i);
    }
    // Crear un Blob con el array de bytes
    const blob = new Blob([array], {type: 'image/jpeg'}); // Ajusta el tipo MIME según sea necesario
    // Crear y devolver un objeto File
    return new File([blob], nombreArchivo, {type: 'image/jpeg'}); // Ajusta el tipo MIME según sea necesario
  }

  public delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
