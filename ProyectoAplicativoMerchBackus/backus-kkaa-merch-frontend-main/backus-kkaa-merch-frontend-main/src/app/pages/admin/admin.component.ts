import { Component } from '@angular/core';
import { CargarService } from './upload.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {

  products: any[] = [];

  constructor(
    private uploadService: CargarService,
    private message: NzMessageService)
    { }

    onFileChange(evt: any) {
      const target: DataTransfer = <DataTransfer>(evt.target);
      if (target.files.length !== 1) throw new Error('Cannot use multiple files');

      const reader: FileReader = new FileReader();
      reader.onload = (e: any) => {
        const arrayBuffer = e.target.result;
        const dataView = new DataView(arrayBuffer);
        let bstr = '';
        for(let i = 0; i < dataView.byteLength; i++) {
          bstr += String.fromCharCode(dataView.getUint8(i));
        }

        const data = this.uploadService.importFromFile(bstr);
        const header: string[] = data[0];
        const importedData = data.slice(1);

        this.products = importedData.map(arr => {
          const obj: any = {};
          for (let i = 0; i < header.length; i++) {
            obj[header[i]] = arr[i];
          }
          return obj;
        });

        console.log(this.products);
        this.message.success('File imported successfully');
      };
      reader.readAsArrayBuffer(target.files[0]);
    }


  uploadProducts(): void {
    if (this.products.length > 0) {
      const contraprestadas = {products:this.products, header: 'exhibiciones_contraprestadas' }
      this.uploadService.fileInput(contraprestadas)
        .then(response => {
          this.message.success('Products uploaded successfully');
        })
        .catch(error => {
          this.message.error('Error uploading products');
        });
    } else {
      this.message.warning('No products to upload');
    }
  }

}
