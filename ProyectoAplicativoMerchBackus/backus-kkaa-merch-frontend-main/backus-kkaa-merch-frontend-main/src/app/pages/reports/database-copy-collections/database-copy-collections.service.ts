import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DatabaseCopyCollectionsService {

  constructor(private http: HttpClient) {}

  generateBackup(collectionName: string, filterStartDate: string | null, filterEndDate: string | null): Observable<any> {
    let params = new HttpParams().set('collectionName', collectionName);
    if (filterStartDate && filterEndDate) {
      params = params.set('filterStartDate', filterStartDate);
      params = params.set('filterEndDate', filterEndDate);
    }
    return this.http.get(`${environment.backendUrl}/api/v1/download/backup`, {
      params: params,
      responseType: 'blob',  // Importante: esto indica que esperamos un blob
      observe: 'response'    // Para acceder a los headers
    });
  }
}
