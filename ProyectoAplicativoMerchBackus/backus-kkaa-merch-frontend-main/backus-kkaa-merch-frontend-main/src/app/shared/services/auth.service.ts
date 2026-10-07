import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    getToken(): string | null {
      return localStorage.getItem('token');
    }
  
    isTokenExpired(): boolean {
      const token = this.getToken();
      if (!token) {
        return true;
      }
  
      const tokenPayload = this.getTokenParse(token);
      const expiration = tokenPayload.exp * 1000; // Convertir a milisegundos
      return Date.now() >= expiration;
    }

    removeToken(): void {
        localStorage.removeItem('token');
    }

    getTokenParse(token:any): any {
      // const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      // return tokenPayload;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const tokenPayload = JSON.parse(this.decodeBase64(base64));
      return tokenPayload;
    }

    decodeBase64(str: string): string {
      // Convierte Base64 a UTF-8
      return decodeURIComponent(Array.prototype.map.call(atob(str), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    }

  }