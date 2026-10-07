import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzImageModule } from 'ng-zorro-antd/image';

import { format } from 'date-fns';
import { PriceReportsService } from './price-reports.service';
import { IPrice } from '../../dto/price.dto';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { SelectDatePickerComponent } from '@shared/components/select-date-picker/select-date-picker.component';
import { DateService } from '@shared/services/date.service';
import { NzModalModule } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-price-reports',
  standalone: true,
  imports: [CommonModule, SpinnerLoadingComponent, SelectDatePickerComponent, NzPaginationModule, NzTableModule, NzAvatarModule, NzIconModule, NzButtonModule, NzModalModule, NzImageModule],
  templateUrl: './price-reports.component.html',
  styleUrl: './price-reports.component.scss'
})
export class PriceReportsComponent {
  prices: IPrice[] = [];
  pageIndex: number = 1;
  pageSize: number = 10;
  totalDocs: number = 0;
  isLoading: boolean = false;
  isLoadingExportExcel: boolean = false;
  filterDate: { filterEndDate: Date, filterStartDate: Date } = { 
    filterEndDate: new Date(), 
    filterStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Primer día del mes actual
  };

  user: any = localStorage.getItem('user');
  user_id = this.user ? JSON.parse(this.user).userId : '0';
  imagenSeleccionado: string = '';
  isVisibleModalImagen = false;
  angle = 0;

  constructor(
    private priceReportsService: PriceReportsService,
    private dateService: DateService,
    private nzImageService: NzImageService,
  ) {}
  
  ngOnInit() {
    this.dataLoading();
  }

  async dataLoading() {
    try {
      this.isLoading = true;
      const filterStartDate =  format(new Date(this.filterDate.filterStartDate), "yyyy-MM-dd") + "T00:00:00Z";
      // const filterEndDate = format(new Date(this.filterDate.filterEndDate), "yyyy-MM-dd'T'HH:mm:ss'Z'"); // en el boton de buscar lo llega a estableces a 23:59:59 del dia
      const filterEndDate = format(new Date(this.filterDate.filterEndDate), "yyyy-MM-dd") + "T23:59:59Z";
      const data = await this.priceReportsService.getPrices(
        this.user_id,
        this.pageIndex,
        this.pageSize,
        filterStartDate,
        filterEndDate,
      );
      this.prices = data.docs;
      this.totalDocs = data.totalDocs;
      this.isLoading = false;
      
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.isLoading = false;
    }
  }

  exportExcel(): void {
    this.isLoadingExportExcel = true;
    const filterStartDate =  format(new Date(this.filterDate.filterStartDate), "yyyy-MM-dd") + "T00:00:00Z";
    const filterEndDate = format(new Date(this.filterDate.filterEndDate), "yyyy-MM-dd") + "T23:59:59Z";
    this.priceReportsService.exportExcel(this.user_id, filterStartDate, filterEndDate).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        const startDate = this.dateService.generateFormattedDate(this.filterDate.filterStartDate);
        const endDate = this.dateService.generateFormattedDate(this.filterDate.filterEndDate);
        a.download = this.dateService.generateFormattedDateForExport()+'-precio'+'-'+startDate+'_'+endDate+'.xlsx';
        a.click();
        URL.revokeObjectURL(objectUrl);
        this.isLoadingExportExcel = false;
      },
      error: (error) => {
        console.error('Error al Exportar:', error);
        this.isLoadingExportExcel = false;
      }
    });
  }

  onChangedDate(event: { filterEndDate: Date; filterStartDate: Date; }){   
    this.filterDate.filterStartDate = event.filterStartDate;
    this.filterDate.filterEndDate = event.filterEndDate;
    this.dataLoading();
  }

  getGoogleMapsLink(latitud: any, longitud: any): string {
    return `https://www.google.com/maps?q=${latitud},${longitud}`;
  }

  handlePageEvent(pageIndex: number) {
    this.pageIndex = pageIndex;
    this.dataLoading();
  }

  setFixedToNumber(colum: number) {
    return colum.toLocaleString('en-US', {});
  }

  showModalImagen(url: string): void {
    this.resetImage();
    this.isVisibleModalImagen = true;
    this.imagenSeleccionado = url;
  }

  handleCancelModalImagen() {
    this.isVisibleModalImagen = false;
  }

  rotateLeft() {
    this.angle -= 90;
  }

  rotateRight() {
    this.angle += 90;
  }

  resetImage() {
    this.angle = 0;
  }

  showFullImage() {
    const images = [{
      src: this.imagenSeleccionado,
      width: '250px',
      height: 'auto',
      alt: 'Imagen'
    }];
    this.nzImageService.preview(images, { nzZoom: 1.5, nzRotate: this.angle });
  }

  // viewImagen(url: string): void {
  //   const modalRef:NzModalRef  = this.modal.create({
  //     nzContent: '<img  width="100%"   src="' + url + '" />',
  //     nzFooter: [
  //       {
  //         label: 'Cerrar',
  //         shape: 'round',
  //         onClick: () => modalRef.destroy()
  //       }     
  //     ],
  //     nzWidth: '93%',
  //     nzMaskClosable: true
  //   });
  // }
}
