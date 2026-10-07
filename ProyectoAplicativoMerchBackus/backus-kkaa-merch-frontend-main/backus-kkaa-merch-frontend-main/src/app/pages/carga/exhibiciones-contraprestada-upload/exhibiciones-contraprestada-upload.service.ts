import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ExhibitionContraprestadaUploadService {

  constructor(private http: HttpClient) {
  }

  insertManyExhibicionContraprestada(exhibicionesContraprestadas: any): Observable<any> {
    return this.http.post<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada/bulk-upload`, exhibicionesContraprestadas);
  }
  
  public async uploadFileExcel(data: FormData): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/upload-data/file`, data, { });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al guardar los datos de precio:', error);
      throw error;
    }
  }
  public async validateRecordsInTheDatabase(data: FormData): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/exhibicion/contraprestada/validate-records-database`, data, { });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al guardar los datos de precio:', error);
      throw error;
    }
  }
}
