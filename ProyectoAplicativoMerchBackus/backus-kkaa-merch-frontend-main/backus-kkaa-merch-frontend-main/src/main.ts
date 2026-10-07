import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/ngsw-worker.js').then(registration => {
      console.log('Service Worker registrado con éxito:', registration);
    }).catch(error => {
      console.log('Error al registrar el Service Worker:', error);
    });
  });
}
