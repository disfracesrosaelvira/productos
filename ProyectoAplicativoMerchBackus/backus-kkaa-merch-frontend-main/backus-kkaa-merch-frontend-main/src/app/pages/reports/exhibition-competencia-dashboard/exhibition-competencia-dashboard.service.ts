import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExhibitionACompetenciaDashboardService {

  constructor(private http: HttpClient) { }

  // conteo por mes de tipo de exhibicion competencia
  getExhibitionCompetenciaCountsByTypeMonthAndWeek(filters: any): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/competencia/counts-by-type-month-and-week`, { params });
  }

  getExhibitionCompetenciaCountsByBrandMonthAndWeek(filters: any, typesExhibitions: any): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    return this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/competencia/counts-by-brand-month-and-week`, { params });
  }

  getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek(filters: any, typesExhibitions: any, marcas: string []): Observable<any> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters))
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    if (marcas.length > 0) {
      params = params.set('marcas', JSON.stringify(marcas));
    }
    return this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/competencia/counts-by-brand-and-description-month-and-week`, { params });
  }

  public exportExcelExhibitionCompetenciaCountsByTypeMonthAndWeek(filters: any): Observable<Blob> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get(`${environment.backendUrl}/api/v1/download/exhibicion/competencia/counts-by-type-month-and-week`, { params, responseType: 'blob' });
  }

  public exportExcelExhibitionCompetenciaCountsByBrandMonthAndWeek(filters: any, typesExhibitions: any): Observable<Blob> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/exhibicion/competencia/counts-by-brand-month-and-week`, { params, responseType: 'blob' });
  }

  public exportExcelExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek(filters: any, typesExhibitions: any, marcas: string []): Observable<Blob> {
    let params = new HttpParams()
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    if (marcas.length > 0) {
      params = params.set('marcas', JSON.stringify(marcas));
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/exhibicion/competencia/counts-by-brand-and-description-month-and-week`, { params, responseType: 'blob' });
  }
}