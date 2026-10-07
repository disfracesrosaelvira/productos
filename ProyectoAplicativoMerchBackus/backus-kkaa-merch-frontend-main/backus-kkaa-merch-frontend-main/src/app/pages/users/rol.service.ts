import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RolService {

  constructor(private http: HttpClient) {
  }

  public async insertRol(rol: any): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/roles`, rol);
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al insertar el rol:', error);
      throw error;
    }
  }

  public async updateRol(id: string, rol: any): Promise<any> {
    try {
      const obs$ = this.http.put<any>(`${environment.backendUrl}/api/v1/roles/${id}`, rol);
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al actualizar el rol:', error);
      throw error;
    }
  }

  public async deleteRol(id: string): Promise<any> {
    try {
      const obs$ = this.http.delete<any>(`${environment.backendUrl}/api/v1/roles/${id}`);
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al eliminar el rol:', error);
      throw error;
    }
  }

  public async getRoles(pageIndex: number, pageSize: number, filters?: any): Promise<any> {
    let params = new HttpParams()
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('is_paginate', true);
    if (filters.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters))
    }
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/roles`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los roles:', error);
      throw error;
    }
  }

  getFilters(): Observable<any> {
    let params = new HttpParams();
    return this.http.get<any>(`${environment.backendUrl}/api/v1/roles/filters`, { params });
  }
}
