import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class MenuIncidenciaService {

  constructor(private http: HttpClient) {
  }

  public async saveIncidenciaCompetencia(data: any): Promise<any> {
    const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/incidencia/competencia`, data, { });
    return await firstValueFrom(obs$);
    // try {
    //   const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/incidencia/competencia`, data, { });
    //   return await firstValueFrom(obs$);
    // } catch (error) {
    //   console.error('Error al guardar los datos de saveIncidenciaCompetencia:', error);
    //   throw error;
    // }
  }

  public async saveIncidenciaMuebleAsignacion(data: any): Promise<any> {
    const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/incidencia/mueble/asignacion`, data, { });
    return await firstValueFrom(obs$);
    // try {
    //   const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/incidencia/mueble/asignacion`, data, { });
    //   return await firstValueFrom(obs$);
    // } catch (error) {
    //   console.error('Error al guardar los datos de saveIncidenciaCompetencia:', error);
    //   throw error;
    // }
  }

  public async getIncidenciaMuebleAsignacion(empresa_id: string,poc:number): Promise<any> {
    try {
      const params: any = {
        empresa_id, poc
      };
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/incidencia/mueble/asignaciones`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async saveIncidenciaMuebleMantenimiento(data: any): Promise<any> {
    const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/incidencia/mueble/mantenimiento`, data, { });
    return await firstValueFrom(obs$);
    // try {
    //   const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/incidencia/mueble/mantenimiento`, data, { });
    //   return await firstValueFrom(obs$);
    // } catch (error) {
    //   console.error('Error al guardar los datos de saveIncidenciaCompetencia:', error);
    //   throw error;
    // }
  }

  public async getIncidenciaMuebleMantenimiento(empresa_id: string,poc:number): Promise<any> {
    try {
      const params: any = {
        empresa_id, poc
      };
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/incidencia/mueble/mantenimientos`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async saveIncidenciaMuebleRecojo(data: any): Promise<any> {
    const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/incidencia/mueble/recojo`, data, { });
    return await firstValueFrom(obs$);
    // try {
    //   const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/incidencia/mueble/recojo`, data, { });
    //   return await firstValueFrom(obs$);
    // } catch (error) {
    //   console.error('Error al guardar los datos de saveIncidenciaCompetencia:', error);
    //   throw error;
    // }
  }

  public async getIncidenciaMuebleRecojo(empresa_id: string,poc:number): Promise<any> {
    try {
      const params: any = {
        empresa_id, poc
      };
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/incidencia/mueble/recojos`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

}
