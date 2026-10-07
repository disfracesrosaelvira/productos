import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class FrenteService {

  constructor(private http: HttpClient) {
  }

  public async saveFrente(data: any): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/frente`, data, { });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al guardar los datos de frente:', error);
      throw error;
    }
  }
  public async saveUploadImg(data: FormData): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/photo/upload`, data, { });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al guardar los datos de precio:', error);
      throw error;
    }
  }

}
