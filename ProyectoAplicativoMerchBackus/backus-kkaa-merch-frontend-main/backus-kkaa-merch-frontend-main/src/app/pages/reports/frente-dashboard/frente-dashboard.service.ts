import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FrenteDashboardService {

  constructor(private http: HttpClient) { }

  getFrenteCountsByBrandMonthAndWeek(filters: any): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get<any>(`${environment.backendUrl}/api/v1/frente/counts-by-brand-month-and-week`, { params });
  }

  getFrenteCountsByPocAndBrandMonthAndWeek(filters: any): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get<any>(`${environment.backendUrl}/api/v1/frente/counts-by-poc-and-brand-month-and-week`, { params });
  }

  public exportExcelFrenteCountsByBrandMonthAndWeek(filters: any): Observable<Blob> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get(`${environment.backendUrl}/api/v1/download/frente/counts-by-brand-month-and-week`, { params, responseType: 'blob' });
  }
}
