import { Injectable } from '@angular/core';
import { StoreOfflineService } from '../offline.service';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExhibicionCompetenciaRenovacionService {

  constructor(
    private offlineService: StoreOfflineService, 
  ) {
  }

  async getExhibicionesCompetenciaRenovacion(empresa_id: string, poc: number): Promise<any[]> {
    const exhibiciones = (await this.offlineService.getAllDocuments(environment.tb_index_exhibicion_competencia_renovable)).filter((item: any) => item.empresa_id === empresa_id && item.poc?.poc == poc);
    return exhibiciones;
  }

}
