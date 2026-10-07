import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SharedService {

  constructor(private http: HttpClient) {}

  public async getMarca(empresa_id: string): Promise<any> {
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/sku/marca/${empresa_id}`, {  });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos-getMarca:', error);
      throw error;
    }
  }

  public async getMarcaPE(empresa_id: string): Promise<any> {
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/sku/marca/pernod/${empresa_id}`, {  });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos-getMarca:', error);
      throw error;
    }
  }

  public async getMarcaCompetencia(empresa_id: string): Promise<any> {
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/sku/marca_competencia/${empresa_id}`, {  });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos-getMarcaCompetencia:', error);
      throw error;
    }
  }

  public async getProductosCompetencia(empresa_id: string): Promise<any> {
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/sku/producto_competencia/${empresa_id}`, {  });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos-getProductosCompetencia:', error);
      throw error;
    }
  }

  public async configurationValues(codigo:string): Promise<any> {
    try {      
      const params: any = { codigo }; 
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/config/values`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos-configurationValues:', error);
      throw error;
    }
  }

  async getFiltersDashboard(filters: { [key: string]: any }): Promise<any> {
    try {      
      let params = new HttpParams();
      params = params.set('filters', JSON.stringify(filters));
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/pocs/filters-dashboard`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos-configurationValues:', error);
      throw error;
    }
  }
}
