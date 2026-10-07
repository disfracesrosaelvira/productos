import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ISku, ISkuResponse } from '../../dto/sku.dto';

@Injectable({
  providedIn: 'root'
})
export class SkuReportsService {

  constructor(private http: HttpClient) { }

  async getSkus(pageIndex: number, pageSize: number, filters?: any): Promise<ISkuResponse> {
    let params = new HttpParams()
      .set('page_index', pageIndex)
      .set('page_size', pageSize);
      // .set('is_paginate', true);
    if (filters.length > 0) {
      params = params.set('filterTable', JSON.stringify(filters))
    }
    try {
      const obs$ = this.http.get<ISkuResponse>(`${environment.backendUrl}/api/v1/skus`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  getFilters(): Observable<any> {
    let params = new HttpParams();
    return this.http.get<any>(`${environment.backendUrl}/api/v1/skus/filters`, { params });
  }

  createSku(newData: ISku): Observable<ISku> {
    return this.http.post<ISku>(`${environment.backendUrl}/api/v1/skus`, newData);
  }
  
  updateSku(updatedData: ISku): Observable<ISku> {
    return this.http.patch<ISku>(`${environment.backendUrl}/api/v1/skus/${updatedData._id}`, updatedData);
  }

  getSkuById(id: string): Observable<ISku> {
    return this.http.get<ISku>(`${environment.backendUrl}/api/v1/skus/${id}`);
  }

  public exportExcel(): Observable<Blob> {
    return this.http.get(`${environment.backendUrl}/api/v1/download/sku`, { responseType: 'blob' });
  }
}