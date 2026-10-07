import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, firstValueFrom, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppBackusService {
  private token: string | null;
  private headers: HttpHeaders;

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem('token');
    this.headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
  }

  public async getSucursales(empresa_id: string): Promise<any> {
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/sucursales/${empresa_id}`, { headers: this.headers });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error; // Propaga el error para manejarlo en el componente que llama a este servicio
    }
  }
  public async getStore4User(user_id: string,rol:string ): Promise<any> {

      let params = new HttpParams()
      .set('rol', rol)
      .set('user_id', user_id)
      .set('is_paginate', false);

    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/store4UserType`, { params, headers: this.headers });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error; // Propaga el error para manejarlo en el componente que llama a este servicio
    }
  }
  public async findStorePoc(poc_nombre: string): Promise<any> {
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/storePoc/${poc_nombre}`, { headers: this.headers });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error; // Propaga el error para manejarlo en el componente que llama a este servicio
    }
  }

  getStoreList(pageIndex: number, pageSize: number, rol: string, user_id: string,filter: string): Observable<string[]> {
    let params = new HttpParams()
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('rol', rol)
      .set('user_id', user_id)
      .set('filter',filter)
      .set('is_paginate', true);
    return this.http.get<any>(`${environment.backendUrl}/api/v1/store4UserType`,{ params,headers: this.headers }).pipe(
      catchError(() => of({ docs: [] })),
      map((res: any) => res.docs),
      map((list: any) => list.map((item: any) => ({...item, poc_nombre:`${item.poc_nombre}`, poc:`${item.poc}`})))
    );
  }
}

