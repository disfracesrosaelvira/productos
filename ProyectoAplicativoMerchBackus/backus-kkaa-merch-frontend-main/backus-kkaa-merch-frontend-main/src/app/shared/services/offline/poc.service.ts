import { Injectable } from '@angular/core';
import { StoreOfflineService } from '../offline.service';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PocService {

  constructor(
    private offlineService: StoreOfflineService, 
  ) {
  }

  async getSucursales(): Promise<any[]> {
    const pocEmpresa = (await this.offlineService.getAllDocuments(environment.tb_index_poc)).map((poc: any) => ({ ...poc, poc_nombre: poc.nombre }));
    const pocsUnicas = await this.obtenerObjetosUnicosPorClave(pocEmpresa, 'poc_nombre'); 
    return pocsUnicas.sort((a:any, b:any) => a.poc_nombre.localeCompare(b.poc_nombre));
  }


  obtenerObjetosUnicosPorClave<T>(arreglo: T[], clave: keyof T): T[] {
    const unicosMap = new Map<any, T>();
    arreglo.forEach((objeto) => { 
      const valorClave = objeto[clave];
      if (!unicosMap.has(valorClave)) { 
        unicosMap.set(valorClave, objeto); 
      }
    });
    return Array.from(unicosMap.values()); 
  }

}
