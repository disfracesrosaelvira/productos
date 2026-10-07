import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
// import { HttpHeaders } from '@angular/common/http';
import { IExhibicionAdicionalResponse } from '../../dto/exhibicionAdicional.dto';
import { IExhibicionCompetenciaResponse } from '../../dto/exhibicionCompetencia.dto';
import { IExhibicionContraprestadaResponse } from '../../dto/exhibicionContraprestada.dto';

@Injectable({
  providedIn: 'root'
})
export class ExhibitionReportsService {

  constructor(private http: HttpClient) {
  }

  // es reutilizado en otros componentes
  public async getAditionalExhibition(empresa_id: string, pageIndex: number, pageSize: number,startOfMonth:string,endOfMonth:string,user_id:string,filters?: any): Promise<IExhibicionAdicionalResponse> {
    let params = new HttpParams()
      .set('empresa_id', empresa_id)
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('startOfMonth', startOfMonth)
      .set('endOfMonth', endOfMonth)
      .set('user_id', user_id)
      .set('is_paginate', true);
    if (filters?.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters))
    }
    try {
      const obs$ = this.http.get<IExhibicionAdicionalResponse>(`${environment.backendUrl}/api/v1/exhibicion/adicionales`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async getAditionalExhibitionVigente(empresa_id: string,poc:number, pageIndex: number, pageSize: number,user_id:string): Promise<IExhibicionAdicionalResponse> {
    let params = new HttpParams()
      .set('empresa_id', empresa_id)
      .set('poc', poc)
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('user_id', user_id)
      .set('is_paginate', true);

    try {
      const obs$ = this.http.get<IExhibicionAdicionalResponse>(`${environment.backendUrl}/api/v1/exhibicion/adicional/vigentes`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async getAditionalExhibitionRenovable(empresa_id: string,poc:number, pageIndex: number, pageSize: number,user_id:string): Promise<IExhibicionAdicionalResponse> {
    let params = new HttpParams()
      .set('empresa_id', empresa_id)
      .set('poc', poc)
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('user_id', user_id)
      .set('is_paginate', true);

    try {
      const obs$ = this.http.get<IExhibicionAdicionalResponse>(`${environment.backendUrl}/api/v1/exhibicion/adicional/renovables`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  // es reutilizado en otros componentes
  public async getCompetenceExhibition(empresa_id: string, pageIndex: number, pageSize: number,startOfMonth:string,endOfMonth:string,user_id:string,filters?: any): Promise<IExhibicionCompetenciaResponse> {
    let params = new HttpParams()
      .set('empresa_id', empresa_id)
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('startOfMonth', startOfMonth)
      .set('endOfMonth', endOfMonth)
      .set('user_id', user_id)
      .set('is_paginate', true);
    if (filters?.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters))
    }
    try {
      const obs$ = this.http.get<IExhibicionCompetenciaResponse>(`${environment.backendUrl}/api/v1/exhibicion/competencias`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async getCompetenceExhibitionVigente(empresa_id: string,poc:number, pageIndex: number, pageSize: number,user_id:string): Promise<IExhibicionCompetenciaResponse> {
    let params = new HttpParams()
      .set('empresa_id', empresa_id)
      .set('poc', poc)
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('user_id', user_id)
      .set('is_paginate', true);

    try {
      const obs$ = this.http.get<IExhibicionCompetenciaResponse>(`${environment.backendUrl}/api/v1/exhibicion/competencia/vigentes`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async getCompetenceExhibitionRenovable(empresa_id: string,poc:number, pageIndex: number, pageSize: number,user_id:string): Promise<IExhibicionCompetenciaResponse> {
    let params = new HttpParams()
      .set('empresa_id', empresa_id)
      .set('poc', poc)
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('user_id', user_id)
      .set('is_paginate', true);

    try {
      const obs$ = this.http.get<IExhibicionCompetenciaResponse>(`${environment.backendUrl}/api/v1/exhibicion/competencia/renovables`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  // es reutilizado en otros componentes
  public async getContraExhibition(empresa_id: string, pageIndex: number, pageSize: number,startOfMonth:string,endOfMonth:string,user_id:string,filters?: any): Promise<IExhibicionContraprestadaResponse> {
    let params = new HttpParams()
    .set('empresa_id', empresa_id)
    .set('page_index', pageIndex)
    .set('page_size', pageSize)
    .set('startOfMonth', startOfMonth)
    .set('endOfMonth', endOfMonth)
    .set('user_id', user_id)
    .set('is_paginate', true);
    if (filters?.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters));
    }
    try {
      const obs$ = this.http.get<IExhibicionContraprestadaResponse>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public exportExcelAdicionales(startOfMonth: string, endOfMonth: string, user_id: string, filters: any): Observable<Blob> {    
    let params = new HttpParams()
    .set('startOfMonth', startOfMonth)
    .set('endOfMonth', endOfMonth)
    .set('user_id', user_id);
    if (filters.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters));
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/adicional`,{ params,responseType: 'blob' });
  }
  public exportExcelContraprestada(startOfMonth: string, endOfMonth: string, user_id: string, filters: any): Observable<Blob> {    
    let params = new HttpParams()
    .set('startOfMonth', startOfMonth)
    .set('endOfMonth', endOfMonth)
    .set('user_id', user_id);
    if (filters.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters));
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/contraprestada`, {params, responseType: 'blob' });
  }
  public exportExcelCompetencia(startOfMonth: string, endOfMonth: string, user_id: string, filters: any): Observable<Blob> {  
    let params = new HttpParams()
    .set('startOfMonth', startOfMonth)
    .set('endOfMonth', endOfMonth)
    .set('user_id', user_id);
    if (filters.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters));
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/competencia`, {params, responseType: 'blob' });
  }

  getFiltersAdicional(startOfMonth:string, endOfMonth:string): Observable<any> {
    let params = new HttpParams()
    .set('startOfMonth', startOfMonth)
    .set('endOfMonth', endOfMonth);
    return this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/adicionales/filters`, { params });
  }
  getFiltersCompetencia(startOfMonth:string, endOfMonth:string): Observable<any> {
    let params = new HttpParams()
    .set('startOfMonth', startOfMonth)
    .set('endOfMonth', endOfMonth);
    return this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/competencias/filters`, { params });
  }
  getFiltersContraprestada(startOfMonth:string, endOfMonth:string): Observable<any> {
    let params = new HttpParams()
    .set('startOfMonth', startOfMonth)
    .set('endOfMonth', endOfMonth);
    return this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada/filters`, { params });
  }
}
