import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigValueReportsService {

  constructor(private http: HttpClient) { }

  createConfigValue(newData: any): Observable<any> {
    return this.http.post<any>(`${environment.backendUrl}/api/v1/config/values`, newData);
  }

  // para crear sku_linea_marca y sku_linea_categorias
  createSkuLineaMarcaOrCategorias(newData: any): Observable<any> {
    return this.http.post<any>(`${environment.backendUrl}/api/v1/config/sku-linea-marcas-or-categorias`, newData);
  }
}