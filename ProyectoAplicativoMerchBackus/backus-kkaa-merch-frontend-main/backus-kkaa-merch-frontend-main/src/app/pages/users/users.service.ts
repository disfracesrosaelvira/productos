import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) {
  }

  public async insertUsuario(usuario: any): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/usuario`, usuario);
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al insertar el usuario:', error);
      throw error;
    }
  }

  public async updateUsuario(id: string, usuario: any): Promise<any> {
    try {
      const obs$ = this.http.put<any>(`${environment.backendUrl}/api/v1/usuarios/${id}`, usuario);
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      throw error;
    }
  }

  public async deleteUsuario(id: string): Promise<any> {
    try {
      const obs$ = this.http.delete<any>(`${environment.backendUrl}/api/v1/usuarios/${id}`);
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      throw error;
    }
  }

  public async getUsuarios(pageIndex: number, pageSize: number, filters?: any): Promise<any> {
    let params = new HttpParams()
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('is_paginate', true);
    if (filters.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters))
    }
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/usuarios`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los usuarios:', error);
      throw error;
    }
  }

  getFilters(): Observable<any> {
    let params = new HttpParams();
    return this.http.get<any>(`${environment.backendUrl}/api/v1/usuarios/filters`, { params });
  }

  public exportExcel(): Observable<Blob> {  
    return this.http.get(`${environment.backendUrl}/api/v1/download/usuario`, { responseType: 'blob' });
  }
}
