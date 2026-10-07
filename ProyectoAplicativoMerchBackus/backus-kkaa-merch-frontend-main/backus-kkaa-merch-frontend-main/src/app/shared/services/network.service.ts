import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  private updateOnlineStatus() {
    this.onlineSubject.next(navigator.onLine);
  }

  get isOnline(): Observable<boolean> {
    return this.onlineSubject.asObservable();
  }
}
