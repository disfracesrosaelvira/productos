import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient) {}

  public async login(loginData: any): Promise<any> {
    const body = {
      userId: loginData.userId,
      password: loginData.password
    };

    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/login`, body);
      const response = await firstValueFrom(obs$);
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        // Lanzar error específico según el mensaje del backend
        if (error.status === 403) {
          if (error.error.message === 'Usuario incorrecto') {
            throw new Error('Usuario incorrecto');
          } else if (error.error.message === 'Contraseña incorrecta') {
            throw new Error('Contraseña incorrecta');
          }
        }
        throw new Error('Intente nuevamente, credenciales incorrectas');
      }
      throw error;
    }
  }
}
