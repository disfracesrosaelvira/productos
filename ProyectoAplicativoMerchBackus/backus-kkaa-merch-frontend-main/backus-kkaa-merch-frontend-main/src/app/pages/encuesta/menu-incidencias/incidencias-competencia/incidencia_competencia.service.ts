import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class IncidenciaCompetenciaService {

  constructor(private http: HttpClient) {
  }

  public async saveUploadImg(data: FormData): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/photo-price/upload`, data, { });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al guardar los datos de precio:', error);
      throw error;
    }
  }

  public async uploadPhoto(data:any): Promise<any> {
    try {      
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/photo/upload`,data);
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async deletePhoto(nameFile:string, containerName:string): Promise<any> {
    try {      
      const params: any = {
        nameFile, containerName
      }; 
      const obs$ = this.http.delete<any>(`${environment.backendUrl}/api/v1/photo/delete`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

}
