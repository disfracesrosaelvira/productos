import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class EncuestaPrecioService {

  constructor(private http: HttpClient) {
  }

  public async getProductos(empresa_id: string, marca: string):Promise<any>  {
    try {
      const params: any = {
        empresa_id, marca
      };
      console.log(params);
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/producto`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async getProductosAllByApp(empresa_id: string):Promise<any>  {
    try {
      const params: any = {empresa_id};
      console.log(params);
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/productos-all`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
  public async savePrecioInput(data: any): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/precio`, data, { });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al guardar los datos de precio:', error);
      throw error;
    }
  }

  // public async saveUploadImg(data: FormData): Promise<any> {
  //   try {
  //     const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/photo-price/upload`, data, { });
  //     return await firstValueFrom(obs$);
  //   } catch (error) {
  //     console.error('Error al guardar los datos de precio:', error);
  //     throw error;
  //   }
  // }
}
