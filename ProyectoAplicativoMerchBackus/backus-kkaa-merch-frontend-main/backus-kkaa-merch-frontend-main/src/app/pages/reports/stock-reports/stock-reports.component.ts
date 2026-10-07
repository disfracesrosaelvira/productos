import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { format } from 'date-fns';
import { StockReportsService } from './stock-reports.service';
import { IStock } from '../../dto/stock.dto';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { DateService } from '@shared/services/date.service';
import { SelectDatePickerComponent } from '@shared/components/select-date-picker/select-date-picker.component';

@Component({
  selector: 'app-stock-reports',
  standalone: true,
  imports: [CommonModule, SpinnerLoadingComponent, SelectDatePickerComponent, NzPaginationModule, NzTableModule, NzAvatarModule, NzIconModule],
  templateUrl: './stock-reports.component.html',
  styleUrl: './stock-reports.component.scss'
})
export class StockReportsComponent {
  stocks: IStock[] = [];
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

  constructor(
    private stockReportsService: StockReportsService,
    private dateService: DateService,
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
      const data: any = await this.stockReportsService.getStocks(this.user_id, this.pageIndex, this.pageSize, filterStartDate, filterEndDate);
      this.stocks = data.docs;
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
    this.stockReportsService.exportExcel(this.user_id, filterStartDate, filterEndDate).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        const startDate = this.dateService.generateFormattedDate(this.filterDate.filterStartDate);
        const endDate = this.dateService.generateFormattedDate(this.filterDate.filterEndDate);
        a.download = this.dateService.generateFormattedDateForExport()+'-stock'+'-'+startDate+'_'+endDate+'.xlsx';
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

  getGoogleMapsLink(latitude: any, longitude: any): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  handlePageEvent(pageIndex: number) {
    this.pageIndex = pageIndex;
    this.dataLoading();
  }

  setFixedToNumber(colum: number) {
    return colum.toLocaleString('en-US', {});
  }
}
