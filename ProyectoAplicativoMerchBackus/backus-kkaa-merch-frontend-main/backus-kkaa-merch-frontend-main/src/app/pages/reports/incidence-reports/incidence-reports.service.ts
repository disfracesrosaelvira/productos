import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IIncidenciaCompetenciaResponse } from '../../dto/incidenciaCompetencia.dto';
import { IIncidenciaMuebleAsignacionResponse } from '../../dto/incidenciaMuebleAsignacion.dto';
import { IIncidenciaMuebleMantenimientoResponse } from '../../dto/incidenciaMuebleMantenimiento.dto';
import { IIncidenciaMuebleRecojoResponse } from '../../dto/incidenciaMuebleRecojo.dto';

@Injectable({
  providedIn: 'root'
})
export class ExhibitionReportsService {

  constructor(private http: HttpClient) { }

  public async getIncidenceCompetencie(user_id: string, pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string): Promise<IIncidenciaCompetenciaResponse> {
    let params = new HttpParams()
      .set('user_id', user_id)
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('filterStartDate', filterStartDate)
      .set('filterEndDate', filterEndDate)
      .set('is_paginate', true);

    try {
      const obs$ = this.http.get<IIncidenciaCompetenciaResponse>(`${environment.backendUrl}/api/v1/incidencia/competencias`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async getIncidenciaMuebleAsignacion(user_id: string, pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string): Promise<IIncidenciaMuebleAsignacionResponse> {
    let params = new HttpParams()
      .set('user_id', user_id)
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('filterStartDate', filterStartDate)
      .set('filterEndDate', filterEndDate)
      .set('is_paginate', true);

    try {
      const obs$ = this.http.get<IIncidenciaMuebleAsignacionResponse>(`${environment.backendUrl}/api/v1/incidencia/mueble/asignaciones`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async getIncidenciaMuebleMantenimiento(user_id: string, pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string): Promise<IIncidenciaMuebleMantenimientoResponse> {
    let params = new HttpParams()
    .set('user_id', user_id)
    .set('page_index', pageIndex)
    .set('page_size', pageSize)
    .set('filterStartDate', filterStartDate)
    .set('filterEndDate', filterEndDate)
    .set('is_paginate', true);

    try {
      const obs$ = this.http.get<IIncidenciaMuebleMantenimientoResponse>(`${environment.backendUrl}/api/v1/incidencia/mueble/mantenimientos`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async getIncidenciaMuebleRecojo(user_id: string, pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string): Promise<IIncidenciaMuebleRecojoResponse> {
    let params = new HttpParams()
    .set('user_id', user_id)
    .set('page_index', pageIndex)
    .set('page_size', pageSize)
    .set('filterStartDate', filterStartDate)
    .set('filterEndDate', filterEndDate)
    .set('is_paginate', true);

    try {
      const obs$ = this.http.get<IIncidenciaMuebleRecojoResponse>(`${environment.backendUrl}/api/v1/incidencia/mueble/recojos`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public exportExcel(type: string, user_id: string, filterStartDate: string, filterEndDate: string): Observable<Blob> {    
    const params = new HttpParams()
    .set('type', type)
    .set('user_id', user_id)
    .set('filterStartDate', filterStartDate)
    .set('filterEndDate', filterEndDate);
    return this.http.get(`${environment.backendUrl}/api/v1/download/incidences`,{ params, responseType: 'blob' });
  }
}