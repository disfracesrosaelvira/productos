import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { UploadService } from '../../services/upload.service';
import { SpinnerLoadingComponent } from '../spinner-loading/spinner-loading.component';
import { StoreOfflineService } from '@shared/services/offline.service';
import { environment } from 'src/app/environments/environment';
import { UtilService } from '@shared/services/util.service';
import { IInformationTable } from '@pages/dto/dictionary.dto';
import { ProgressService } from '@shared/services/progress.service';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule, NzButtonModule, SpinnerLoadingComponent, NzCollapseModule, NzIconModule],
  templateUrl: './photo-upload.component.html',
  styleUrl: './photo-upload.component.scss'
})
export class PhotoUploadComponent {
  @Output() filesChanged = new EventEmitter<any[]>();
  @Input() table: string = '';
  @Input() nameContainer: string = '';
  @Input() maxImages: number = 5;
  @Input() maxWidth: string = '185px';
  @Input() codeParent: string = '';
  @Input() useForPhotoCamera: boolean = true;
  uploadFiles: any[] = [];
  loading = false;
  empresa_id =localStorage.getItem('empresa_id') || 'BK';
  uploadFileDisabled = false;
  isOffline : boolean = false;
  informationTable!: IInformationTable;
  constructor(
    private uploadService: UploadService,
    private offlineService: StoreOfflineService,
    private utilService: UtilService
  ) {

  }

  async onFileChange(event: any): Promise<void> {
    const file = event.target.files[0];
    console.log("peso original: " + file.size);
    const fotoNombreExtension = file.name;
    const lastDotIndex = fotoNombreExtension.lastIndexOf('.');
    const fotoNombre = fotoNombreExtension.substring(0, lastDotIndex);
    const fotoExtension = 'webp'; // Cambiamos la extensión a WebP
    const fotoContentType = 'image/webp'; // Cambiamos el tipo de contenido a WebP
    try {
      const compressedImage = await this.uploadService.compressAndConvertToWebP(file);
      const compressedFile = new File([compressedImage], `${fotoNombre}.${fotoExtension}`, { type: fotoContentType });
      console.log("peso comprimido: " + compressedFile.size);

      await this.guardarImagen(compressedFile, `${fotoNombre}.${fotoExtension}`, fotoNombre, fotoExtension);
    } catch (error) {
      console.error('Error al comprimir la imagen:', error);
    }

    const inputToClear = document.getElementById('input-image') as HTMLInputElement;
    if (inputToClear) {
      inputToClear.value = '';
    }
  }

  async guardarImagen(selectedImage: File, fotoNombreExtension: string, fotoNombre: string, fotoExtension: string): Promise<void> {
    const latitude = localStorage.getItem('latitude');
    const longitude = localStorage.getItem('longitude');
    const user: any = localStorage.getItem('user');
    const uuid = uuidv4();
    const formData = new FormData();
    const isConnected = navigator.onLine;
    this.informationTable = this.utilService.getInformationTable(this.table);
    if(isConnected) {
      try {
        this.loading = true;
        if (user) {
          formData.append('user', JSON.parse(user).userId);
        }
        formData.append('table', this.table); // Reemplaza con tu tabla
        formData.append('uuid', uuid);
        formData.append('nameContainer', this.nameContainer); // Reemplaza con tu nombre de contenedor
        formData.append('data', JSON.stringify({
          latitud: latitude,
          longitud: longitude,
        }));
        formData.append('file', selectedImage);
        const response = await this.uploadService.uploadPhoto(formData);
        if (response) {
          console.log('response', response)
          const dataToStore = {
            // foto_id: uuid,
            _id: uuid,
            foto_nombre_extension: fotoNombreExtension,
            fotoName: fotoNombre,
            fotoExtension: fotoExtension,
            viewImg: response.data.viewImg,
            name_file: response.data.nameFile,
            imagen_url: response.data.imgUrl,
            fecha_creacion: new Date().toUTCString(),
            isOffline: false,
            codeParent: this.codeParent,
            stateUploadAzure: true,
            // id_store: uuid, // su indenficador en indexDB
            nameStore: this.table, // para ver en que tabla de indexDB se esta guardando
            nameCollection: `photos`, // coleccion
            table: this.table,
          };
          this.uploadFiles.push(dataToStore);
          this.filesChanged.emit(this.uploadFiles);
          // await this.offlineService.addDocument(this.informationTable.nameBDIndex, dataToStore, this.informationTable.nameCollectionPhotos);
          await this.offlineService.addDocument(`${environment.tb_index_imagen}`, dataToStore);
        }
        this.loading = false;
      } catch(error) {
        this.loading = false;
        console.log('ocurrio un error:', error);
      }
    } else {
      let imageBase64 = '';
      await this.utilService.convertirArchivoABase64(selectedImage).then(base64 => {
        // console.log('Imagen en base64:', base64);
        imageBase64 = base64; // Aquí tienes tu imagen en base64
      }).catch(error => {
        // console.error("Error al convertir el archivo a base64", error);
      });
      // console.log('this.table:', this.table);
      // this.informationTable = this.utilService.getInformationTable(this.table);
      const dataToStore = {
        _id: uuid,
        codeParent: this.codeParent,
        table: this.table,
        foto_nombre_extension: fotoNombreExtension,
        fotoName: fotoNombre,
        fotoExtension: fotoExtension,
        // Campos adicionales de formData
        // nameStore: this.table,
        // nameCollection: 'photos',
        // foto_id: uuid,
        // id_store: uuid,
        nameContainer: this.nameContainer,
        data: {
          latitud: latitude,
          longitud: longitude,
        },
        file: imageBase64, // Aquí solo se guarda el nombre del archivo para el ejemplo3
        isOffline: true,
        stateUploadAzure: false,
        imagen_url: '',
        name_file: '',
        fecha_creacion: new Date().toUTCString()
      };

      try {
        await this.offlineService.addDocument(`${environment.tb_index_imagen}`, dataToStore);
        this.uploadFiles.push(dataToStore);
        console.log('Imagen guardada en offlinfasade:', dataToStore);
        this.filesChanged.emit(this.uploadFiles);
      } catch (error) {
        console.error(`Error al guardar imagen:`, error);
      }
    }
    if (this.uploadFiles.length >= this.maxImages) this.uploadFileDisabled = true;
    // try {
    //   this.loading = true;
    //   if (user) {
    //     formData.append('user', JSON.parse(user).userId);
    //   }
    //   formData.append('table', this.table); // Reemplaza con tu tabla
    //   formData.append('uuid', uuid);
    //   formData.append('nameContainer', this.nameContainer); // Reemplaza con tu nombre de contenedor
    //   formData.append('data', JSON.stringify({
    //     latitud: latitude,
    //     longitud: longitude,
    //   }));
    //   formData.append('file', selectedImage);
    //   const response = await this.uploadService.uploadPhoto(formData);
    //   if (response) {
    //     console.log('response', response)
    //     this.uploadFiles.push({
    //       foto_id: uuid,
    //       foto_nombre_extension: fotoNombreExtension,
    //       fotoName: fotoNombre,
    //       fotoExtension: fotoExtension,
    //       viewImg: response.data.viewImg,
    //       name_file: response.data.nameFile,
    //       imagen_url: response.data.imgUrl,
    //       fecha_creacion: response.data.created_at
    //     });
    //     this.filesChanged.emit(this.uploadFiles);
    //     if (this.uploadFiles.length >= this.maxImages) this.uploadFileDisabled = true;
    //   }
    //   this.loading = false;
    // } catch (error) {
    //   this.loading = false;
    //   let imageBase64 = '';
    //   await this.convertirArchivoABase64(selectedImage).then(base64 => {
    //     // console.log('Imagen en base64:', base64);
    //     imageBase64 = base64; // Aquí tienes tu imagen en base64
    //   }).catch(error => {
    //     // console.error("Error al convertir el archivo a base64", error);
    //   });
    //   // console.log('this.table:', this.table);
    //   this.informationTable = this.utilService.getInformationTable(this.table);
    //   const dataToStore = {
    //     codeParent: this.codeParent,
    //     foto_nombre_extension: fotoNombreExtension,
    //     fotoName: fotoNombre,
    //     fotoExtension: fotoExtension,
    //     // Campos adicionales de formData
    //     table: this.table,
    //     foto_id: uuid,
    //     id_store: uuid,
    //     nameContainer: this.nameContainer,
    //     data: {
    //       latitud: latitude,
    //       longitud: longitude,
    //     },
    //     file: imageBase64 // Aquí solo se guarda el nombre del archivo para el ejemplo
    //   };
    //   if (!isConnected) {
    //     try {
    //       await this.offlineService.addDocument(this.informationTable.nameBDIndex, dataToStore, this.informationTable.nameCollectionPhotos);
    //       this.uploadFiles.push(dataToStore);
    //       console.log('Imagen guardada en offlinfasade:', dataToStore);
    //       this.filesChanged.emit(this.uploadFiles);
    //     } catch (error) {
    //       console.error(`Error al guardar imagen:`, error);
    //     }
    //   }

    // }
  }

  async removeItemImg(index: number, item: any): Promise<void> {
    this.isOffline = navigator.onLine;
    let isDeletePhoto = false;
    if (this.isOffline && item.isOffline == false) {
      this.loading = true;
      console.log('item-removeItemImg =>', item);
      await this.uploadService.deletePhoto(item.name_file, this.nameContainer).then((response) => {
        console.log('response =>', response);
        this.uploadFiles.splice(index, 1);
        isDeletePhoto = true;
        this.uploadFileDisabled = false;
        this.filesChanged.emit(this.uploadFiles);
        this.loading = false;
      }).catch((error) => {
        console.log('error | removeItemImg =>', error);
        this.loading = false;
      });
    }

    await this.offlineService.deleteDocumentById(`${environment.tb_index_imagen}`, item._id).then(() => {
      if (!isDeletePhoto) {
        this.uploadFiles.splice(index, 1);
      }
      this.uploadFileDisabled = false;
      this.filesChanged.emit(this.uploadFiles);
      this.loading = false;
    }).catch((error) => {
      console.error('Error al eliminar la imagen:', error);
    });
  }
}
