import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IStockResponse } from '../../dto/stock.dto';

@Injectable({
  providedIn: 'root'
})
export class StockReportsService {

  constructor(private http: HttpClient) { }

  async getStocks(user_id: string, pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string): Promise<IStockResponse> {
    let params = new HttpParams()
      .set('user_id', user_id)
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('filterStartDate', filterStartDate)
      .set('filterEndDate', filterEndDate);
      // .set('is_paginate', true);

    try {
      const obs$ = this.http.get<IStockResponse>(`${environment.backendUrl}/api/v1/stocks`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public exportExcel(user_id: string, filterStartDate: string, filterEndDate: string): Observable<Blob> {
    let params = new HttpParams()
    .set('user_id', user_id)
    .set('filterStartDate', filterStartDate)
    .set('filterEndDate', filterEndDate)    
    return this.http.get(`${environment.backendUrl}/api/v1/download/stock`, { params, responseType: 'blob' });
  }
}