import { Injectable } from '@angular/core';
import * as localforage from 'localforage';
// import * as CryptoJS from 'crypto-js';
import { environment } from 'src/app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SecureStorageService {
  private storage = localforage.createInstance({
    name: 'authStorage',
  });

  private secretKey = environment.secret_key; // Debes usar una clave más segura en producción

  // async setItem(key: string, value: string): Promise<void> {
  //   const encrypted = CryptoJS.AES.encrypt(value, this.secretKey).toString();
  //   await this.storage.setItem(key, encrypted);
  // }

  // async getItem(key: string): Promise<string | null> {
  //   const encrypted = await this.storage.getItem<string>(key);
  //   if (!encrypted) return null;

  //   const decrypted = CryptoJS.AES.decrypt(encrypted, this.secretKey).toString(CryptoJS.enc.Utf8);
  //   return decrypted;
  // }

  async removeItem(key: string): Promise<void> {
    await this.storage.removeItem(key);
  }
}
