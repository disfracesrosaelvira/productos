import { Injectable } from '@angular/core';
import { StoreOfflineService } from '../offline.service';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigValueService {

  constructor(
    private offlineService: StoreOfflineService, 
  ) {
  }

  async getValores(codigo: string): Promise<any[]> {
    const valores = (await this.offlineService.getAllDocuments(environment.tb_index_config_value)).filter((item: any) => item.codigo === codigo);
    return valores.map((item: any) => item.valor)[0].sort((a: any, b: any) => a.label.localeCompare(b.label));
  }

  async getValoresSinOrder(codigo: string): Promise<any[]> {
    const valores = (await this.offlineService.getAllDocuments(environment.tb_index_config_value)).filter((item: any) => item.codigo === codigo);
    return valores.map((item: any) => item.valor)[0];
  }

}
