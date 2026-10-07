import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IInformationTable, ILocationStorage, IPocStorage, IUserStorage } from '@pages/dto/dictionary.dto';
import Constantes from '@shared/constants/contants';
import { environment } from 'src/app/environments/environment';
import { StoreOfflineService } from './offline.service';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

    constructor(
        private router: Router,
        private offlineService: StoreOfflineService,
    ) { }

    savePocToLocalStorage(poc: IPocStorage): void {
      localStorage.setItem('poc', JSON.stringify(poc));
      localStorage.setItem('poc_id', poc.poc ? String(poc.poc) : '');
      localStorage.setItem('poc_nombre', poc.nombre);
    }

    getPocFromLocalStorage(): IPocStorage | null {
        const poc = localStorage.getItem('poc');
        if (!poc) {
            return null;
        }
        return JSON.parse(poc);
    }

    removePocFromLocalStorage(): void {
        localStorage.removeItem('poc');
        localStorage.removeItem('poc_id');
        localStorage.removeItem('poc_nombre');
    }

    convertPocJson(selectSucursal : any){
        const pocJson = {
          poc: Number(selectSucursal.poc),
          nombre: selectSucursal.poc_nombre,
          poc_cadena: selectSucursal.poc_cadena || null,
          poc_backus: selectSucursal.poc_backus || null,
          nombre_planning: selectSucursal.nombre_planning || null,
          tipo: selectSucursal.tipo || null,
          documento_sv: selectSucursal.documento_sv || null,
          nombre_sv: selectSucursal.nombre_sv || null,
          poc_livetrade: selectSucursal.poc_livetrade || null,
          cadena: selectSucursal.cadena || null,
          gerencia: selectSucursal.gerencia || null,
          region: selectSucursal.region || null
        } as IPocStorage;
        return pocJson;
    }

    validatePoc(){
        const poc = localStorage.getItem('poc');
        if (!poc) {
            this.removePocFromLocalStorage();
            this.volverAppSelected();
            return false;
        }
        return true;
    }

    volverAppSelected(){
        const empresa_id = localStorage.getItem('empresa_id');
        console.log('volverAppSelected-empresa_id',empresa_id);
        if(empresa_id){
            if(empresa_id == 'BK'){
                this.router.navigate([`${Constantes.ROUTES.APP.BK}`]);
            }
            if(empresa_id == 'PE'){
                this.router.navigate([`${Constantes.ROUTES.APP.PERNORP}`]);
            }
            return false;
        }
        this.router.navigate([`${Constantes.ROUTES._HOME}`]);
        return false;
    }

    getUserFromLocalStorage(): IUserStorage | null {
        const user = localStorage.getItem('user');
        if (!user) {
            return null;
        }
        const userParse = JSON.parse(user);
        return {
            usuario_id: userParse.userId,
            nombre: userParse.userName,
            rol: userParse.rol,
        } as IUserStorage;
    }

    getLocationFromLocalStorage(): ILocationStorage | null {
        return {
            latitude: parseFloat(localStorage.getItem('latitude') || '0'),
            longitude: parseFloat(localStorage.getItem('longitude') || '0')
        } as ILocationStorage;
    }

    convertirArchivoABase64(archivo: File): Promise<string> {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(archivo);
        });
      }

    getInformationTable(table: string): IInformationTable {
        switch (table) {
            case 'exhibicion_adicional':
                return {
                    table: 'exhibicion_adicional',
                    nameContainer: 'exhibicion/adicional',
                    nameBDIndex: `${environment.tb_index_exhibicion_adicional}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
            case 'exhibicion_competencia':
                return {
                    table: 'exhibicion_competencia',
                    nameContainer: 'exhibicion/competencia',
                    nameBDIndex: `${environment.tb_index_exhibicion_competencia}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
            case 'exhibicion_contraprestada':
                return {
                    table: 'exhibicion_contraprestada',
                    nameContainer: 'exhibicion/contraprestada',
                    nameBDIndex: `${environment.tb_index_exhibicion_contraprestada}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
            case 'exhibiciones-contraprestadas':
                return {
                    table: 'exhibiciones-contraprestadas',
                    nameContainer: 'exhibicion/contraprestada',
                    nameBDIndex: `${environment.tb_index_exhibicion_contraprestada}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
            case 'frente':
                return {
                    table: 'frente',
                    nameContainer: 'frente',
                    nameBDIndex: `${environment.tb_index_frente}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
            case 'stock':
                return {
                    table: 'stock',
                    nameContainer: 'stock',
                    nameBDIndex: `${environment.tb_index_stock}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
             case 'precio':
                return {
                    table: 'precio',
                    nameContainer: 'precio',
                    nameBDIndex: `${environment.tb_index_precio}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
            case 'incidencia_competencia':
                return {
                    table: 'incidencia_competencia',
                    nameContainer: 'incidencia/compentencia',
                    nameBDIndex: `${environment.tb_index_incidencia_competencia}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
            case 'incidencia_mueble_asignacion':
                return {
                    table: 'incidencia_mueble_asignacion',
                    nameContainer: 'incidencia/mueble/asignacion',
                    nameBDIndex: `${environment.tb_index_incidencia_mueble_asignacion}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
             case 'incidencia_mueble_mantenimiento':
                return {
                    table: 'incidencia_mueble_mantenimiento',
                    nameContainer: 'incidencia/mueble/mantenimiento',
                    nameBDIndex: `${environment.tb_index_incidencia_mueble_mantenimiento}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
            case 'incidencia_mueble_recojo':
                return {
                    table: 'incidencia_mueble_recojo',
                    nameContainer: 'incidencia/mueble/recojo',
                    nameBDIndex: `${environment.tb_index_incidencia_mueble_recojo}`,
                    nameCollectionPhotos: 'photos',
                    nameCollectionEncuestas: 'encuestas',
                };
            case 'exhibicion_adicional_renovable':
              return {
                  table: 'exhibicion_adicional',
                  nameContainer: 'exhibicion/adicional',
                  nameBDIndex: `${environment.tb_index_exhibicion_adicional_renovable}`,
                  nameCollectionPhotos: 'photos',
                  nameCollectionEncuestas: 'encuestas',
              };
            case 'exhibicion_competencia_renovable':
              return {
                  table: 'exhibicion_competencia',
                  nameContainer: 'exhibicion/competencia',
                  nameBDIndex: `${environment.tb_index_exhibicion_competencia_renovable}`,
                  nameCollectionPhotos: 'photos',
                  nameCollectionEncuestas: 'encuestas',
              };
            default:
                return {
                    table: '',
                    nameContainer: '',
                    nameBDIndex: '',
                    nameCollectionPhotos: '',
                    nameCollectionEncuestas: '',
                };
        }
    }

    // photos por cargar a azure
    async isPhotosUploadsToAzure(): Promise<boolean> {
      const photos = (await this.offlineService.getAllDocuments(`${environment.tb_index_imagen}`)).filter((photo: any) => photo.stateUploadAzure === false);
        return photos.length > 0;
    }

    async getTotalEncuestas() {
        const [
          responseExhiContraprestada,
          responseExhiAdicional,
          responseExhiCompetencia,
          responsePrecio,
          responseFrente,
          responseStock,
          responseInciCompetencia,
          responseInciMuebleAsginanacion,
          responseInciMuebleMantenimiento,
          responseInciMuebleRecojo,
          responseExhiAdicionalRenovacion,
          responseExhiCompetenciaRenovacion
        ] = await Promise.all([
            this.offlineService.getAllDocuments(environment.tb_index_exhibicion_contraprestada, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_exhibicion_adicional, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_exhibicion_competencia, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_precio, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_frente, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_stock, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_incidencia_competencia, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_incidencia_mueble_asignacion, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_incidencia_mueble_mantenimiento, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_incidencia_mueble_recojo, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_exhibicion_adicional_renovable, 'encuestas'),
            this.offlineService.getAllDocuments(environment.tb_index_exhibicion_competencia_renovable, 'encuestas'),
        ]);
        console.log('responseExhiContraprestada',responseExhiContraprestada);
        // const totalEncuestas = responseExhiAdicional?.length ?? 0;
        // const totalEncuestasCompetencia = responseExhiCompetencia?.length ?? 0;
        // return totalEncuestas + totalEncuestasCompetencia;
        return [
            { descripcion: `Se sincronizaron ${responseExhiContraprestada?.length ?? 0} Exhibición Contrapresta`, table: "exhibicion_contraprestada", total: responseExhiContraprestada?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responseExhiAdicional?.length ?? 0} Exhibición Adicional`, table: "exhibicion_adicional", total: responseExhiAdicional?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responseExhiCompetencia?.length ?? 0} Exhibición Competencia`, table: "exhibicion_competencia",  total: responseExhiCompetencia?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responsePrecio?.length ?? 0} Precio`, table: "precio",  total: responsePrecio?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responseFrente?.length ?? 0} Frentes`, table: "frente",  total: responseFrente?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responseStock?.length ?? 0} Stock`, table: "stock",  total: responseStock?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responseInciCompetencia?.length ?? 0} Incidencia Competencia`, table: "incidencia_competencia",  total: responseInciCompetencia?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responseInciMuebleAsginanacion?.length ?? 0} Incidencia Mueble Asignación`, table: "incidencia_mueble_asignacion",  total: responseInciMuebleAsginanacion?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responseInciMuebleMantenimiento?.length ?? 0} Incidencia Mueble Mantenimiento`, table: "incidencia_mueble_mantenimiento",  total: responseInciMuebleMantenimiento?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responseInciMuebleRecojo?.length ?? 0} Incidencia Mueble Recojo`, table: "incidencia_mueble_recojo",  total: responseInciMuebleRecojo?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responseExhiAdicionalRenovacion?.length ?? 0} Exhibición Adicional Renovación`, table: "exhibicion_adicional_renovable",  total: responseExhiAdicionalRenovacion?.length ?? 0 },
            { descripcion: `Se sincronizaron ${responseExhiCompetenciaRenovacion?.length ?? 0} Exhibición Competencia Renovación`, table: "exhibicion_competencia_renovable",  total: responseExhiCompetenciaRenovacion?.length ?? 0 },
        ];
    }

  async getEncuestasPorSubir() {
    const [
      responseExhiContraprestada,
      responseExhiAdicional,
      responseExhiCompetencia,
      responsePrecio,
      responseFrente,
      responseStock,
      responseInciCompetencia,
      responseInciMuebleAsginanacion,
      responseInciMuebleMantenimiento,
      responseInciMuebleRecojo,
      responseExhiAdicionalRenovacion,
      responseExhiCompetenciaRenovacion
    ] = await Promise.all([
      this.offlineService.getAllDocuments(environment.tb_index_exhibicion_contraprestada, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_exhibicion_adicional, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_exhibicion_competencia, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_precio, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_frente, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_stock, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_incidencia_competencia, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_incidencia_mueble_asignacion, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_incidencia_mueble_mantenimiento, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_incidencia_mueble_recojo, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_exhibicion_adicional_renovable, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_exhibicion_competencia_renovable, 'encuestas'),
    ]);
    console.log('responseExhiContraprestada',responseExhiContraprestada);
    // const totalEncuestas = responseExhiAdicional?.length ?? 0;
    // const totalEncuestasCompetencia = responseExhiCompetencia?.length ?? 0;
    // return totalEncuestas + totalEncuestasCompetencia;
    return [
      { table: "exhibicion_contraprestada", total: responseExhiContraprestada?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "exhibicion_adicional", total: responseExhiAdicional?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "exhibicion_competencia",  total: responseExhiCompetencia?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "precio",  total: responsePrecio?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "frente",  total: responseFrente?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "stock",  total: responseStock?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "incidencia_competencia",  total: responseInciCompetencia?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "incidencia_mueble_asignacion",  total: responseInciMuebleAsginanacion?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "incidencia_mueble_mantenimiento",  total: responseInciMuebleMantenimiento?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "incidencia_mueble_recojo",  total: responseInciMuebleRecojo?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "exhibicion_adicional_renovable",  total: responseExhiAdicionalRenovacion?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
      { table: "exhibicion_competencia_renovable",  total: responseExhiCompetenciaRenovacion?.filter((response:any) => response.stateUploadAzure == false).length ?? 0 },
    ];
  }

  async getDocumentsUploaded() {
    const [
      responseExhiContraprestada,
      responseExhiAdicional,
      responseExhiCompetencia,
      responsePrecio,
      responseFrente,
      responseStock,
      responseInciCompetencia,
      responseInciMuebleAsginanacion,
      responseInciMuebleMantenimiento,
      responseInciMuebleRecojo,
      responseExhiAdicionalRenovacion,
      responseExhiCompetenciaRenovacion
    ] = await Promise.all([
      this.offlineService.getAllDocuments(environment.tb_index_exhibicion_contraprestada, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_exhibicion_adicional, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_exhibicion_competencia, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_precio, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_frente, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_stock, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_incidencia_competencia, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_incidencia_mueble_asignacion, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_incidencia_mueble_mantenimiento, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_incidencia_mueble_recojo, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_exhibicion_adicional_renovable, 'encuestas'),
      this.offlineService.getAllDocuments(environment.tb_index_exhibicion_competencia_renovable, 'encuestas'),
    ]);
    let documentsUploaded: any[] = [];
    responseExhiContraprestada.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    responseExhiAdicional.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    responseExhiCompetencia.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    responsePrecio.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas', skus: response.data.skus});
    });
    responseFrente.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    responseStock.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    responseInciCompetencia.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    responseInciMuebleAsginanacion.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    responseInciMuebleMantenimiento.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    responseInciMuebleRecojo.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    responseExhiAdicionalRenovacion.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    responseExhiCompetenciaRenovacion.forEach((response: any) => {
      if(response.stateUploadAzure == true)  documentsUploaded.push({codeParent: response.codeParent, nameStore: response.table, nameCollection: 'encuestas'});
    });
    return documentsUploaded;
  }

}
