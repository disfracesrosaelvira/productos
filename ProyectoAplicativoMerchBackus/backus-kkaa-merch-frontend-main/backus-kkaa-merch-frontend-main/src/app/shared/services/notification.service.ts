import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  readonly VAPID_PUBLIC_KEY = 'YOUR_PUBLIC_VAPID_KEY';

  constructor(private swPush: SwPush) { }

  subscribeToNotifications() {
    this.swPush.requestSubscription({
      serverPublicKey: this.VAPID_PUBLIC_KEY
    })
    .then(sub => {
      // Enviar la suscripción al servidor
    })
    .catch(err => console.error('Could not subscribe to notifications', err));
  }
}
