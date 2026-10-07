import { Component, HostListener, TemplateRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzNotificationModule,  NzNotificationComponent, NzNotificationService } from 'ng-zorro-antd/notification';
import { interval } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NzNotificationModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'backus-kkaa-merch-front';
  @ViewChild('notificationBtnTpl', { static: true }) btnTemplate!: TemplateRef<{ $implicit: NzNotificationComponent }>;
  deferredPrompt: any;

  constructor(
    private notification: NzNotificationService,
  ) {}

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event) {
    event.preventDefault();
    this.deferredPrompt = event;
    // Aquí puedes mostrar un botón o una notificación
    // if (!localStorage.getItem('pwaInstalled')) {
    //   this.notification.blank(
    //     'Notificación de instalación',
    //     '¿Deseas instalar la aplicación en tu dispositivo?',
    //     {
    //       nzButton: this.btnTemplate
    //     }
    //   );
    // }
  }

  installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: { outcome: string; }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
          localStorage.setItem('pwaInstalled', 'true');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        this.deferredPrompt = null;
      });
    }
  }

}
