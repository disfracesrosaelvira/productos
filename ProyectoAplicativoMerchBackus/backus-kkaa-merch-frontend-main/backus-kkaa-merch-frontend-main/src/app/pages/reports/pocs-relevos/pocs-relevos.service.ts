import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IPriceResponse } from '../../dto/price.dto';

@Injectable({
  providedIn: 'root'
})
export class PocsRelevosService {

  constructor(private http: HttpClient) { }

  async getPocsRelevos(pageIndex: number, pageSize: number, filterStartDate: string, filterEndDate: string, searchName: string): Promise<IPriceResponse> {
    let params = new HttpParams()
      .set('page_index', pageIndex)
      .set('page_size', pageSize)
      .set('filterStartDate', filterStartDate)
      .set('filterEndDate', filterEndDate);
      // .set('is_paginate', true);
    if (searchName) {
      params = params.set('searchName', searchName);
    }
    try {
      const obs$ = this.http.get<IPriceResponse>(`${environment.backendUrl}/api/v1/pocs/relevos`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
}
