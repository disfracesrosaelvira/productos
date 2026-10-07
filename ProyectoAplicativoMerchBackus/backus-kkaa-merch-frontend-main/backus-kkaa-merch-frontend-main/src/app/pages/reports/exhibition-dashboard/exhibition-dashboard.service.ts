import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExhibitionDashboardService {

  constructor(private http: HttpClient) { }

  // adicional start
  // conteo por mes de tipo de exhibicion adicional
  async getExhibitionAdditionalCountsByTypeMonthAndWeek(filters?: any): Promise<any> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/adicional/counts-by-type-month-and-week`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  async getExhibitionAdditionalCountsByBrandMonthAndWeek(filters: any, typesExhibitions: any): Promise<any> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/adicional/counts-by-brand-month-and-week`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  async getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek(filters: any, typesExhibitions: any, marcas: string []): Promise<any> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    if (marcas.length > 0) {
      params = params.set('marcas', JSON.stringify(marcas));
    }
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/adicional/counts-by-brand-and-description-month-and-week`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  // adicional end

  // contraprestada start
  // supervisores por mes y de cuanto de avance tienen
  getExhibitionContraMonthlySupervisorVigenteCounts(filters: any): Observable<any> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada/monthly-supervisor-vigente-counts`, { params });
  }

  // conteo por mes de tipo de exhibicion contraprestada
  public async getExhibitionContraprestadaCountsByTypeMonthAndWeek(filters: any): Promise<any> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada/counts-by-type-month-and-week`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async getExhibitionContraprestadaCountsByBrandMonthAndWeek(filters: any, typesExhibitions: any): Promise<any> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada/counts-by-brand-month-and-week`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  async getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek(filters: any, typesExhibitions: any, marcas: string []): Promise<any> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    if (marcas.length > 0) {
      params = params.set('marcas', JSON.stringify(marcas));
    }
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada/counts-by-brand-and-description-month-and-week`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
// contraprestada end

  // exports
  public exportExcelExhibitionAdicionalCountsByTypeMonthAndWeek(filters: any): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get(`${environment.backendUrl}/api/v1/download/exhibicion/adicional/counts-by-type-month-and-week`, { params, responseType: 'blob' });
  }
  public exportExcelExhibitionContraprestadaCountsByTypeMonthAndWeek(filters: any): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    return this.http.get(`${environment.backendUrl}/api/v1/download/exhibicion/contraprestada/counts-by-type-month-and-week`, { params, responseType: 'blob' });
  }

  public exportExcelExhibitionAdicionalCountsByBrandMonthAndWeek(filters: any, typesExhibitions: any): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/exhibicion/adicional/counts-by-brand-month-and-week`, { params, responseType: 'blob' });
  }
  public exportExcelExhibitionContraprestadaCountsByBrandMonthAndWeek(filters: any, typesExhibitions: any): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/exhibicion/contraprestada/counts-by-brand-month-and-week`, { params, responseType: 'blob' });
  }

  public exportExcelExhibitionAdicionalCountsByBrandAndDescriptionByMonthAndWeek(filters: any, typesExhibitions: any, marcas: string []): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    if (marcas.length > 0) {
      params = params.set('marcas', JSON.stringify(marcas));
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/exhibicion/adicional/counts-by-brand-and-description-month-and-week`, { params, responseType: 'blob' });
  }
  public exportExcelExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek(filters: any, typesExhibitions: any, marcas: string []): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters));
    if (typesExhibitions.length > 0) {
      params = params.set('typesExhibitions', JSON.stringify(typesExhibitions));
    }
    if (marcas.length > 0) {
      params = params.set('marcas', JSON.stringify(marcas));
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/exhibicion/contraprestada/counts-by-brand-and-description-month-and-week`, { params, responseType: 'blob' });
  }

  public exportExcelExhibitionContraprestadaMonthlySupervisorVigenteCounts(filters: any): Observable<any> {
    let params = new HttpParams();
    params = params.set('filterTable', JSON.stringify(filters))
    return this.http.get(`${environment.backendUrl}/api/v1/download/exhibicion/contraprestada/monthly-supervisor-vigente-counts`, { params, responseType: 'blob' });
  }
}