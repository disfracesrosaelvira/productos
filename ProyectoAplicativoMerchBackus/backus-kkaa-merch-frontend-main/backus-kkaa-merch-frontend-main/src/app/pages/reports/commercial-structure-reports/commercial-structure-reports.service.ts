import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IEstructuraComercial, IEstructuraComercialResponse } from '@pages/dto/estructuraComercial.dto';

@Injectable({
  providedIn: 'root'
})
export class CommercialStructureReportsService {
  private token: string | null;
  private headers: HttpHeaders;
  constructor(private http: HttpClient) {
    this.token = localStorage.getItem('token');
    this.headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
   }

  async getListEstructuraComercial(pageIndex: number, pageSize: number, filters?: any): Promise<IEstructuraComercialResponse> {
    let params = new HttpParams()
      .set('page_index', pageIndex)
      .set('page_size', pageSize);
      // .set('is_paginate', true);
    // if (filters) {
    //   Object.keys(filters).forEach(key => {
    //     if (filters[key].length) {
    //       params = params.set(key, filters[key].join(','));
    //     }
    //   });
    // }
    if (filters.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters))
    }
    // if (filterTable !== undefined) {
    //   params = { filterTable: JSON.stringify(filterTable),pageSize,pageLimit };
    // }else{
    //   params = {
    //     pageSize,
    //     pageLimit
    //   }
    // }
    try {
      const obs$ = this.http.get<IEstructuraComercialResponse>(`${environment.backendUrl}/api/v1/commercial-structure`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  createEstructuraComercial(newData: IEstructuraComercial): Observable<IEstructuraComercial> {
    return this.http.post<IEstructuraComercial>(`${environment.backendUrl}/api/v1/commercial-structure`, newData);
  }
  
  updateEstructuraComercial(updatedData: IEstructuraComercial): Observable<IEstructuraComercial> {
    return this.http.patch<IEstructuraComercial>(`${environment.backendUrl}/api/v1/commercial-structure/${updatedData._id}`, updatedData);
  }

  getEstructuraComercialById(id: string): Observable<IEstructuraComercial> {
    return this.http.get<IEstructuraComercial>(`${environment.backendUrl}/api/v1/commercial-structure/${id}`);
  }

  getFilters(): Observable<any> {
    // return this.http.get(`${this.apiUrl}/filters`);
    let params = new HttpParams();
    return this.http.get<any>(`${environment.backendUrl}/api/v1/commercial-structure/filters`, { params });
  }

  public exportExcel(): Observable<Blob> {
    return this.http.get(`${environment.backendUrl}/api/v1/download/commercial-structure`,{ responseType: 'blob' });
  }
}