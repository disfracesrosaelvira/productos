import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { StoreOfflineService } from '@shared/services/offline.service';

@Injectable({
  providedIn: 'root',
})
export class LoginOfflineService {
  constructor(
    private http: HttpClient,
    private offlineService: StoreOfflineService
  ) {}

  public async login(loginData: any): Promise<any> {
    const body = {
      userId: loginData.userId,
      password: loginData.password,
    };

    try {
      // const data = await this.offlineService.getSecureAllDocuments(`${environment.tb_index_users}`, `collection`);
      const data = [];
      // if (productos.length != this.productos.length) {
      //   await this.offlineService.replaceCollectionWithNewList(`${environment.tb_index_exhibicion_adicional}`, this.productos, `productos_${this.empresa_id}`);
      // }
      // const user = data.find((item: any) => item.usuario_id === loginData.userId);
      const user: any = [];

      if (user) {
        const token = localStorage.getItem('token');
        console.log(`Token: ${token}`);
        return { token };
      } else {
        console.log(
          `No se encontró ningún usuario con el ID: ${loginData.userId}`
        );
        throw new Error(
          `No se encontró ningún usuario con el ID: ${loginData.userId}`
        );
      }
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw new Error('Error al obtener usuario:');
    }
  }
}
