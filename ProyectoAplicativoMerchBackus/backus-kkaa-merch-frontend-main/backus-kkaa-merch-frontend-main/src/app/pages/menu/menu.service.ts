import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { StoreOfflineService } from "@shared/services/offline.service";
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { ProgressService } from '@shared/services/progress.service';
import { UtilService } from '@shared/services/util.service';
import { IUserStorage } from '@pages/dto/dictionary.dto';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  typeApp: string = '';
  // selectUser: IUserStorage | null = null;
  constructor(
    private http: HttpClient,
    private storeOfflineService: StoreOfflineService,
    private progressService: ProgressService,
    private utilService: UtilService,
  ) {
    // this.selectUser = this.utilService.getUserFromLocalStorage();
  }

  public delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async handleRequest<T>(request: Promise<T>, retries: number = 3): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await request;
      } catch (error) {
        attempt++;
        console.error(`Attempt ${attempt} failed. Retrying...`, error);
        if (attempt === retries) {
          throw new Error('Max retries reached. Request failed.');
        }
      }
    }
    throw new Error('Request failed after maximum retries.');
  }

  public async syncOffline(): Promise<any> {
    try {
      // Eliminar la base de datos antes de sincronizar
      await this.storeOfflineService.deleteDatabase();
      this.progressService.updateProgress(0);
      const requests = [
        this.http.get<any>(`${environment.backendUrl}/api/v1/config/values`),
        this.http.get<any>(`${environment.backendUrl}/api/v1/skus-offline`),
        this.http.get<any>(`${environment.backendUrl}/api/v1/poc-offline`),
        this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada-offline`),
        // this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/adicional/renovables-offline`, { params: { usuario_id: this.selectUser?.usuario_id ? this.selectUser?.usuario_id : '' }}),
        this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/adicional/renovables-offline`),
        this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/competencia/renovables-offline`),
        // this.handleRequest(this.http.get<any>(`${environment.backendUrl}/api/v1/config/values`).toPromise()),
        // this.handleRequest(this.http.get<any>(`${environment.backendUrl}/api/v1/skus-offline`).toPromise()),
        // this.handleRequest(this.http.get<any>(`${environment.backendUrl}/api/v1/poc-offline`).toPromise()),
        // this.handleRequest(this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada-offline`).toPromise()),
        // this.http.get<any>(`${environment.backendUrl}/api/v1/usuarios-offline`)
      ];
      // const [response, response1, response2, response3] = await Promise.all(requests.map(req => firstValueFrom(req)));
      const [
        configValue,
        skus,
        pocs,
        contraprestadas,
        exhibicionAdicionalRenovables,
        exhibicionCompetenciaRenovables
      ] = await Promise.all(requests.map(req => firstValueFrom(req)));
      await this.delay(500); // Retraso de 500ms
      this.progressService.updateProgress(40); // Actualiza el progreso después de obtener las respuestas

      await this.storeOfflineService.replaceCollectionWithNewList(environment.tb_index_config_value, configValue?.result);
      await this.delay(500); // Retraso de 500ms
      this.progressService.updateIsCompleteConfigValue(true);
      this.progressService.updateCountCompletedConfigValue(configValue?.result.length);
      this.progressService.updateProgress(50); // Actualiza el progreso después de cada inserción

      await this.storeOfflineService.replaceCollectionWithNewList(environment.tb_index_sku, skus);
      await this.delay(500); // Retraso de 500ms
      this.progressService.updateIsCompleteSku(true);
      this.progressService.updateCountCompletedSku(skus.length);
      this.progressService.updateProgress(60);

      await this.storeOfflineService.replaceCollectionWithNewList(environment.tb_index_poc, pocs);
      await this.delay(500); // Retraso de 500ms
      this.progressService.updateIsCompletePoc(true);
      this.progressService.updateCountCompletedPoc(pocs.length);
      this.progressService.updateProgress(70);

      // await this.storeOfflineService.replaceCollectionWithNewList('users', contraprestadas);
      await this.storeOfflineService.replaceCollectionWithNewList(environment.tb_index_exhibicion_contraprestada, contraprestadas?.result);
      await this.delay(500); // Retraso de 500ms
      this.progressService.updateIsCompleteExhiContraprestada(true);
      this.progressService.updateCountCompletedExhiContraprestada(contraprestadas?.result.length);
      this.progressService.updateProgress(80);
      
      await this.storeOfflineService.replaceCollectionWithNewList(environment.tb_index_exhibicion_adicional_renovable, exhibicionAdicionalRenovables?.result);
      await this.delay(500); // Retraso de 500ms
      this.progressService.updateIsCompleteExhiAdicionalRenovacion(true);
      this.progressService.updateCountCompletedExhiAdicionalRenovacion(exhibicionAdicionalRenovables?.result.length);
      this.progressService.updateProgress(90);

      await this.storeOfflineService.replaceCollectionWithNewList(environment.tb_index_exhibicion_competencia_renovable, exhibicionCompetenciaRenovables?.result);
      await this.delay(500); // Retraso de 500ms
      this.progressService.updateIsCompleteExhiCompetenciaRenovacion(true);
      this.progressService.updateCountCompletedExhiCompetenciaRenovacion(exhibicionCompetenciaRenovables?.result.length);
      this.progressService.updateProgress(100);

      return { success: true };
    } catch (error) {
      console.error('Error al sincronizar los datos:', error);
      return { success: error, message: 'Error al sincronizar los datos' };
    }
  }
}