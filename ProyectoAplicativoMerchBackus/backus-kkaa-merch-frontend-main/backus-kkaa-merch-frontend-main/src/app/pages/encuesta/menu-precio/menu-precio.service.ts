import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MenuPrecioService {

  constructor(private http: HttpClient) {
  }

  public async getMarca(empresa_id: string): Promise<any> {
    try {
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/marca/${empresa_id}`, {  });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }
}
