import { Injectable } from '@angular/core';
import { StoreOfflineService } from '../offline.service';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExhibicionContraprestadaService {

  constructor(
    private offlineService: StoreOfflineService, 
  ) {
  }

  // poc
  // 1349
  // nombre
  // "PLAZA VEA CHICLAYO REAL PLAZA"
  async getExhibicionesContraprestadas(empresa_id: string, poc: string, acction: string, usuario_id: string): Promise<any[]> {
    const isAlerted = acction == 'alertas' ? false : true;
    const exhibiciones = (await this.offlineService.getAllDocuments(environment.tb_index_exhibicion_contraprestada)).filter((item: any) => item.empresa_id === empresa_id && item.poc?.poc == poc && item.vigente === isAlerted);
    return exhibiciones;
  }

}
