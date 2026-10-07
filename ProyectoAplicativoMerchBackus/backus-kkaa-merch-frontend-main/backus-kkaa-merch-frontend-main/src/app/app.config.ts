import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { en_US, es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import es from '@angular/common/locales/es'; // Importa los datos de localización para el español
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient } from '@angular/common/http';
import { TokenInterceptor } from './interceptor/token.interceptor';
import { FormsModule } from '@angular/forms';
import { NgxImageCompressService } from 'ngx-image-compress';

registerLocaleData(en);
registerLocaleData(es); // Registra los datos de localización para el español

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideNzI18n(es_ES),
    importProvidersFrom(FormsModule),
    importProvidersFrom(HttpClientModule),
    provideAnimations(),
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    NgxImageCompressService
  ]
};
