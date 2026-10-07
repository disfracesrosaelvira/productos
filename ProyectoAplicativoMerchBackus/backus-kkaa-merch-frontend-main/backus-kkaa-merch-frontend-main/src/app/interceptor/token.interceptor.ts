import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../shared/services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router, private message: NzMessageService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (!this.authService.isTokenExpired()) {
        // console.log('TokenInterceptor => isTokenExpired IF', this.authService.isTokenExpired());
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${this.authService.getToken()}`
        }
      });
    }else{
        localStorage.clear();
    }
    // console.log('TokenInterceptor => Interceptor', this.authService.isTokenExpired());

    return next.handle(request).pipe(
      tap(
        (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            // Si la solicitud tiene éxito, puedes hacer algo aquí si es necesario
            // console.log('TokenInterceptor => HttpResponse');
          }
        },
        (error) => {
          if (error.status === 401 && !this.router.url.includes('login')) {
            this.message.error(
                'Tu sesion se ha acabado o cerrado, te redirecionaremos al inicio de sesion'
              );
            // console.log('TokenInterceptor => 401');
            this.authService.removeToken();
            this.router.navigate([""]);
          }
        }
      )
    );
  }
}