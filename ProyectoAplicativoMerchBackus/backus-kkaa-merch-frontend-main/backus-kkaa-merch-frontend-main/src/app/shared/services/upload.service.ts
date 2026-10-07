import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { NgxImageCompressService } from 'ngx-image-compress';

@Injectable({
  providedIn: 'root',
})
export class UploadService {

  constructor(
    private http: HttpClient,
    private imageCompress: NgxImageCompressService,
  ) {}

  public async uploadPhoto(data: any): Promise<any> {
    const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/photo/upload`,  data );
    return await firstValueFrom(obs$);

    // try {
    //   const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/photo/upload`,  data );
    //   return await firstValueFrom(obs$);
    // } catch (error) {
    //   console.error('Error al cargar uploadPhoto:', error);
    //   throw error;
    // }
  }

  public async uploadPhotoPrice(data: FormData): Promise<any> {
    try {
      const obs$ = this.http.post<any>(`${environment.backendUrl}/api/v1/photo-price/upload`, data, { });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al guardar los datos de precio:', error);
      throw error;
    }
  }

  public async deletePhoto(nameFile: string, containerName: string): Promise<any> {
    try {
      const params: any = { nameFile, containerName};
      const obs$ = this.http.delete<any>(`${environment.backendUrl}/api/v1/photo/delete`, { params } );
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  public async downloadExcelPlantilla(entity: string): Promise<any> {
    try {
      const params: any = { entity };
      const obs$ = this.http.get<any>(`${environment.backendUrl}/api/v1/download/excel-plantilla`, { params });
      return await firstValueFrom(obs$);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      throw error;
    }
  }

  async compressAndConvertToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        this.imageCompress.compressFile(event.target.result, -1, 50, 50).then(
          (compressedResult: string) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error('Failed to convert image to WebP'));
                  }
                }, 'image/webp', 0.6); // Ajusta la calidad (0.6 = 60%) según tus necesidades
              } else {
                reject(new Error('Failed to get canvas context'));
              }
            };
            img.onerror = () => {
              reject(new Error('Failed to load image'));
            };
            img.src = compressedResult;
          }
        ).catch(error => reject(error));
      };
      reader.onerror = (error) => reject(error);
    });
  }
}
