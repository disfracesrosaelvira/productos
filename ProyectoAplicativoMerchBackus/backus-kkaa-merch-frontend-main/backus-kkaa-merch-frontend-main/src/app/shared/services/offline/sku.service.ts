import { Injectable } from '@angular/core';
import { StoreOfflineService } from '../offline.service';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SkuService {

  constructor(
    private offlineService: StoreOfflineService, 
  ) {
  }

  async getMarcas(empresa_id: string, isCompetencia : number = 0): Promise<any[]> {
    console.log('getMarcas');
    const marcaEmpresa = (await this.offlineService.getAllDocuments(environment.tb_index_sku)).filter((marca: any) => marca.empresa_id === empresa_id && marca.competencia == isCompetencia);
    console.log('marcaEmpresa', marcaEmpresa);
    const marcasUnicas = await this.obtenerObjetosUnicosPorClave(marcaEmpresa, 'marca'); 
    return marcasUnicas.sort((a:any, b:any) => a.marca.localeCompare(b.marca));
  }

  async getProductos(empresa_id: string, isCompetencia : number = 0): Promise<any[]> {
    console.log('getProductos');
    const productosEmpresa = (await this.offlineService.getAllDocuments(environment.tb_index_sku)).filter((marca: any) => marca.empresa_id === empresa_id && marca.competencia == isCompetencia);
    console.log('productosEmpresa', productosEmpresa);
    const productosUnicos = this.obtenerObjetosUnicosPorClave(productosEmpresa, 'descripcion'); 
    return productosUnicos.sort((a:any, b:any) => a.descripcion.localeCompare(b.descripcion));
  }

  async getProductosPorMarca(empresa_id: string, marcas: string, isCompetencia : number = 0): Promise<any[]> {
    console.log('getProductos');
    const productosEmpresa = (await this.offlineService.getAllDocuments(environment.tb_index_sku)).filter((marca: any) => marca.empresa_id === empresa_id && marca.marca == marcas && marca.competencia == isCompetencia);
    console.log('productosEmpresa', productosEmpresa);
    const productosUnicos = this.obtenerObjetosUnicosPorClave(productosEmpresa, 'descripcion'); 
    return productosUnicos.sort((a:any, b:any) => a.descripcion.localeCompare(b.descripcion));
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
