import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class StockService {

  constructor(private http: HttpClient) {
  }

  public async getProductos(app: string): Promise<any> {
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/producto/${app}`, {  });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async saveStockInput(data: any): Promise<any> {
    const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/stock`, data, { });
    return await firstValueFrom(obs$);
    // try {
    //   const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/stock`, data, { });
    //   return await firstValueFrom(obs$);
    // } catch (error) {
    //   console.error('Error al guardar los datos de precio:', error);
    //   throw error;
    // }
  }

}
