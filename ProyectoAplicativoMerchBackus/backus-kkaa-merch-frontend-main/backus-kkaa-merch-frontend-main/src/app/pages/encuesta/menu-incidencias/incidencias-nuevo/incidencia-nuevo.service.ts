import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class IncidenciaNuevoService {

  constructor(private http: HttpClient) {
  }

  public async saveIncidenciasMueblesInput(data: any): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/incidencia_muebles_input`, data, {});
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al guardar los datos de precio:', error);
      throw error;
    }
  }
}
