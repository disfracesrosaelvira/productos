import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockDashboardService {

  constructor(private http: HttpClient) { }
  
  getStockAverageByDescriptionMonthAndWeek(filters: any): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get<any>(`${environment.backendUrl}/api/v1/stock/average-by-description-month-and-week`, { params });
  }

  getStockSeparateAveragesByDescriptionMonthAndWeek(filters: any): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get<any>(`${environment.backendUrl}/api/v1/stock/separate-average-by-description-month-and-week`, { params });
  }

  getStoreAveragesByDescriptionMonthAndWeek(filters: any): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get<any>(`${environment.backendUrl}/api/v1/stock/store-average-by-description-month-and-week`, { params });
  }

  public exportExcelStockAverageByDescriptionMonthAndWeek(filters: any): Observable<Blob> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get(`${environment.backendUrl}/api/v1/download/stock/average-by-description-month-and-week`, { params, responseType: 'blob' });
  }

  exportExcelStockSeparateAveragesByBrandAndDescriptionByMonthAndWeek(filters: any): Observable<Blob> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get(`${environment.backendUrl}/api/v1/download/stock/separate-average-by-description-month-and-week`, { params, responseType: 'blob' });
  }
}