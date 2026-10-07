import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalService } from 'ng-zorro-antd/modal';
import { HttpErrorResponse } from '@angular/common/http';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { LoginService } from './login.service';
import { LoginOfflineService } from './login-offline.service';
import { RouterModule, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import Constantes from '../../shared/constants/contants';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../../shared/services/auth.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NetworkService } from '@shared/services/network.service';
import { StoreOfflineService } from '@shared/services/offline.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  imports: [ReactiveFormsModule, NzFormModule, CommonModule, NzInputModule, NzButtonModule, NzModalModule, RouterModule, NzSpinModule, NzIconModule],
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  validateForm: FormGroup;
  user: any = {};
  userId: string = '';
  loading = false;
  private checkPermissionsInterval: any;
  passwordVisible = false;
  clicked = false;

  latitude: number | null = null;
  longitude: number | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NzModalService,
    private auth: LoginService,
    private authOffline: LoginOfflineService,
    private router: Router,
    private message: NzMessageService,
    private authService: AuthService,
    private networkService: NetworkService,
  ) {
    this.validateForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  async ngOnInit() {
    this.startCheckingPermissions();
    const token = localStorage.getItem('token');
    await this.isTokenValid(token) ? this.router.navigate([`/${Constantes.ROUTES._HOME}`]) : ''
  }

  ngOnDestroy(): void {
    this.stopCheckingPermissions();
  }

  isTokenValid(token: string | null): boolean {
    if (!token) return false;

    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.exp * 1000 >= Date.now();
    } catch (error) {
      return false;
    }
  }

  async login(): Promise<void> {
    if (!this.validateForm.valid) {
      return;
    }

    this.clicked = true; // Deshabilitar el botón al hacer clic
    let tokenParse: any;
    let response: any;

    const loginData = {
      userId: this.validateForm.controls['userName'].value,
      password: this.validateForm.controls['password'].value,
    };

    try {
      if (navigator.onLine) {
        response = await this.auth.login(loginData);
      } else {
        // response = await this.authOffline.login(loginData);
      }
      console.log('response-login', response);
      tokenParse = this.authService.getTokenParse(response.token);
      console.log('tokenParse', tokenParse);
      this.userId = tokenParse.user_id;
      localStorage.setItem('user', JSON.stringify({ userId: tokenParse.user_id, userName: tokenParse.name, rol: tokenParse.rol}));
      localStorage.setItem('rol',tokenParse.rol);
      await this.showConfirmationModal(this.userId);
    } catch (error) {
      this.handleLoginError(error);
    } finally {
      this.clicked = false; // Reactivar el botón después de éxito o fracaso
    }
  }

  private markAllFieldsAsTouched(): void {
    for (const key in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(key)) {
        this.validateForm.controls[key].markAsTouched();
      }
    }
  }

  onBlurUserName(): void {
    const userNameControl = this.validateForm.controls['userName'];
    if (!userNameControl.value) {
      userNameControl.setErrors({ required: true });
    }
  }

  private updateFormErrors(): void {
    for (const i in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(i)) {
        this.validateForm.controls[i].markAsDirty();
        this.validateForm.controls[i].updateValueAndValidity();
      }
    }
  }

  async showConfirmationModal(userId: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.modalService.confirm({
        nzTitle: 'Permisos Requeridos',
        nzContent: 'Esta aplicación necesita acceso a la cámara y ubicación. ¿Deseas otorgar estos permisos?',
        nzOkText: 'Sí',
        nzCancelText: 'No',
        nzOnOk: async () => {
          await this.startCameraAndLocation(userId);
          resolve();
        },
        nzOnCancel: () => {
          console.log('Inicio de Sesión Bloqueado por el usuario');
          this.handlePermissionsRevoked();
          resolve();
        },
      });
    });
  }

  private handleLoginError(error: any): void {
    let errorMsg = 'Intente nuevamente, credenciales incorrectas!';
    if (error.message === 'Usuario incorrecto') {
      errorMsg = 'El usuario ingresado no es correcto. Intente nuevamente.';
      this.validateForm.controls['userName'].setErrors({ incorrect: true });
    } else if (error.message === 'Contraseña incorrecta') {
      errorMsg = 'La contraseña ingresada no es correcta. Intente nuevamente.';
      this.validateForm.controls['password'].setErrors({ incorrect: true });
    } else if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        errorMsg = 'Intente nuevamente, credenciales incorrectas';
      } else {
        errorMsg = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    this.modalService.error({
      nzTitle: 'Error de inicio de sesión',
      nzContent: errorMsg,
      nzOnOk: () => {
        console.log('Error modal closed');
        //this.clicked = false;
      }
    });
  }

  redirectAccount(user: any) {
    switch (user.userId) {
      default:
        this.router.navigate([`${Constantes.ROUTES._HOME}`]);
        break;
    }
  }

  private async startCameraAndLocation(userId: string): Promise<void> {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Permisos de cámara aceptados');
      if ('geolocation' in navigator) {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Permisos de ubicación aceptados');
              this.latitude = position.coords.latitude;
              this.longitude = position.coords.longitude;
              localStorage.setItem('latitude', this.latitude.toString());
              localStorage.setItem('longitude', this.longitude.toString());
              resolve();
            },
            (error) => {
              console.error('Error al obtener la ubicación:', error);
              reject(error);
            }
          );
        });
      } else {
        console.error('La geolocalización no está disponible en este dispositivo.');
      }
      this.showWelcomeModal(userId);
      this.redirectAccount({ userId });
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      this.handlePermissionsRevoked();
    }
  }

  private startCheckingPermissions(): void {
    this.checkPermissionsInterval = setInterval(() => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !('geolocation' in navigator)) {
        this.handlePermissionsRevoked();
      }
    }, 5000);
  }

  private stopCheckingPermissions(): void {
    if (this.checkPermissionsInterval) {
      clearInterval(this.checkPermissionsInterval);
    }
  }

  private handlePermissionsRevoked(): void {
    console.error('Permisos revocados');
    localStorage.clear();
    this.modalService.error({
      nzTitle: 'ERROR DE PERMISOS SOLICITADOS',
      nzContent: 'Necesita otorgar permisos de Localización y Cámara para poder Continuar...',
      nzOnOk: () => {
        this.router.navigate([`${Constantes.ROUTES._LOGIN}`]);
        //this.clicked = false;
      }
    });
  }

  private showWelcomeModal(userName: string): void {
    this.modalService.info({
      nzTitle: `¡Bienvenido ${userName} a la aplicación para encuesta Backus!`,
      nzContent: 'Esperamos que disfrute utilizando nuestra aplicación.',
      nzOnOk: () => console.log('Modal de Bienvenida cerrado')
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}
