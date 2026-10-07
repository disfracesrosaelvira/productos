import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {jwtDecode} from 'jwt-decode';
import Constantes from '../shared/constants/contants';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(private router: Router) {}

  canActivate(): boolean {
    // Obtener el token del almacenamiento local
    const token = localStorage.getItem('token');

    if (token) {
      const decodedToken: any = jwtDecode(token);
      const expirationDate = new Date(decodedToken.exp * 1000);
      const isTokenValid = expirationDate > new Date();
      if(!isTokenValid) this.router.navigate([Constantes.ROUTES._LOGIN]);
      return isTokenValid;
    } else {
      // Si no hay un token en el almacenamiento local, redirigimos al usuario a la página de inicio de sesión
      this.router.navigate([Constantes.ROUTES._LOGIN]);
      return false;
    }
  }
}
