import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IPoc, IPocResponse } from '../../dto/poc.dto';

@Injectable({
  providedIn: 'root'
})
export class PocReportsService {

  constructor(private http: HttpClient) { }

  async getPocs(pageIndex: number, pageSize: number, user_id: string, filters?: any): Promise<IPocResponse> {
    let params = new HttpParams()
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('user_id', user_id);
      // .set('is_paginate', true);
    if (filters.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters))
    }
    try {
      const obs$ = this.http.get<IPocResponse>(`${environment.backendUrl}/api/v1/pocs`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  
  getFilters(): Observable<any> {
    let params = new HttpParams();
    return this.http.get<any>(`${environment.backendUrl}/api/v1/pocs/filters`, { params });
  }

  createSku(newData: IPoc): Observable<IPoc> {
    return this.http.post<IPoc>(`${environment.backendUrl}/api/v1/pocs`, newData);
  }
  
  updateSku(updatedData: IPoc): Observable<IPoc> {
    return this.http.patch<IPoc>(`${environment.backendUrl}/api/v1/pocs/${updatedData._id}`, updatedData);
  }

  getSkuById(id: string): Observable<IPoc> {
    return this.http.get<IPoc>(`${environment.backendUrl}/api/v1/pocs/${id}`);
  }

  public exportExcel(user_id: string): Observable<Blob> {
    let params = new HttpParams()
    .set('user_id', user_id);
    
    return this.http.get(`${environment.backendUrl}/api/v1/download/poc`,{ params, responseType: 'blob' });
  }

  checkDuplicateName(nombre: string, id?: string): Observable<{ exists: boolean }> {
    let params = new HttpParams().set('nombre', nombre);
    if (id) {
      params = params.set('id', id)
    }
    return this.http.get<{ exists: boolean }>(`${environment.backendUrl}/api/v1/pocs/check-name`, { params });
  }
  checkDuplicatePocCadena(poc_cadena: string, id?: string): Observable<{ exists: boolean }> {
    let params = new HttpParams().set('poc_cadena', poc_cadena);
    if (id) {
      params = params.set('id', id)
    }
    return this.http.get<{ exists: boolean }>(`${environment.backendUrl}/api/v1/pocs/check-poc-cadena`, { params });
  }
  checkDuplicatePocBackus(poc_backus: string, id?: string): Observable<{ exists: boolean }> {
    let params = new HttpParams().set('poc_backus', poc_backus);
    if (id) {
      params = params.set('id', id)
    }
    return this.http.get<{ exists: boolean }>(`${environment.backendUrl}/api/v1/pocs/check-poc-backus`, { params });
  }
  checkDuplicateNamePlanning(nombre_planning: string, id?: string): Observable<{ exists: boolean }> {
    let params = new HttpParams().set('nombre_planning', nombre_planning);
    if (id) {
      params = params.set('id', id)
    }
    return this.http.get<{ exists: boolean }>(`${environment.backendUrl}/api/v1/pocs/check-name-planning`, { params });
  }

  getSupervisors(): Observable<any> {
    return this.http.get<any>(`${environment.backendUrl}/api/v1/pocs/list-supervisors`);
  }

  updateSupervisor(data: any, nombre_sv: string): Observable<any> {
    return this.http.patch<any>(`${environment.backendUrl}/api/v1/pocs/update-supervisor/${nombre_sv}`, data);
  }

  // carga masiva de pocs
  
  public async varifyExcelPocsMassiveLoad(data: FormData): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/pocs/varify-excel-pocs-massive-load`, data, { });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al guardar los datos de precio:', error);
      throw error;
    }
  }

  public async uploadExcelPocsMassiveLoad(data: FormData): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/pocs/upload-excel-pocs-massive-load`, data, { });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al guardar los datos de precio:', error);
      throw error;
    }
  }
}

// // 1 primer paso
// // supervisor antiguo: DIAZ FLORIAN, POL ERISSON 41810754
// // supervisor que lo reemplaza: LEON VARGAS, ALFIERI JESUS 76982595
// db.poc.updateMany(
//   { documento_sv: "41810754" },
//   { 
//     $set: { 
//       documento_sv: "76982595", 
//       nombre_sv: "LEON VARGAS, ALFIERI JESUS" 
//     }
//   }
// )
// // en los demas colecciones
// {
//   "poc.documento_sv": "41810754",
//   fecha_creacion: {
//     $gte: ISODate("2024-09-01T05:00:00.000Z")
//   }
// }

// db.stock.updateMany(
//   { 
//     "poc.documento_sv": "41810754",
//     "fecha_creacion": { $gte: ISODate("2024-09-01T05:00:00.000Z") }
//   },
//   { 
//     $set: { 
//       "poc.documento_sv": "76982595",
//       "poc.nombre_sv": "LEON VARGAS, ALFIERI JESUS"
//     }
//   }
// )
// /// los demas colecciones que tienen poc

// // 2 segundo paso
// // supervisor que se fue: GARCIA TORRE, JONATHAN SMITH 43903185
// // supervisor que lo reemplaza: DIAZ FLORIAN, POL ERISSON 41810754
// db.poc.updateMany(
//   { documento_sv: "43903185" },
//   { 
//     $set: { 
//       documento_sv: "41810754", 
//       nombre_sv: "DIAZ FLORIAN, POL ERISSON" 
//     }
//   }
// )
// // en los demas colecciones
// {
//   "poc.documento_sv": "43903185",
//   fecha_creacion: {
//     $gte: ISODate("2024-09-01T05:00:00.000Z")
//   }
// }
// db.stock.updateMany(
//   { 
//     "poc.documento_sv": "43903185",
//     "fecha_creacion": { $gte: ISODate("2024-09-01T05:00:00.000Z") }
//   },
//   { 
//     $set: { 
//       "poc.documento_sv": "41810754",
//       "poc.nombre_sv": "DIAZ FLORIAN, POL ERISSON"
//     }
//   }
// )