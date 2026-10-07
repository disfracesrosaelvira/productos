import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { format } from 'date-fns';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { SelectDatePickerComponent } from '@shared/components/select-date-picker/select-date-picker.component';
import { PocsRelevosService } from './pocs-relevos.service';

@Component({
  selector: 'app-relevos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzTableModule,
    NzPaginationModule,
    NzInputModule,
    SpinnerLoadingComponent,
    SelectDatePickerComponent,
  ],
  templateUrl: './pocs-relevos.component.html',
  styleUrl: './pocs-relevos.component.scss',
})
export class PocsRelevosComponent {
  pocs: any[] = [];
  pageIndex: number = 1;
  pageSize: number = 10;
  totalDocs: number = 0;
  isLoading: boolean = false;
  isLoadingGeneric: boolean = false;
  filterDate: { filterEndDate: Date, filterStartDate: Date } = { 
    filterEndDate: new Date(), 
    filterStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Primer día del mes actual
  };
  searchName: string = '';

  constructor(
    private pocsRelevosService: PocsRelevosService,
    // private dateService: DateService,
    // private notification: NzNotificationService,
  ) {}

  ngOnInit() {
    this.dataLoading();
    // this.loadFilters();
  }

  async dataLoading() {
    try {
      this.isLoading = true;
      const filterStartDate =  format(new Date(this.filterDate.filterStartDate), "yyyy-MM-dd") + "T00:00:00Z";
      const filterEndDate = format(new Date(this.filterDate.filterEndDate), "yyyy-MM-dd") + "T23:59:59Z";
      const data = await this.pocsRelevosService.getPocsRelevos(
        this.pageIndex,
        this.pageSize,
        filterStartDate,
        filterEndDate,
        this.searchName
      );
      this.pocs = data.docs;
      this.totalDocs = data.totalDocs;
      this.isLoading = false;
      
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.isLoading = false;
    }
  }

  onSearch() {
    this.pageIndex = 1; // Reiniciar a la primera página al buscar
    this.dataLoading();
  }

  onChangedDate(event: { filterEndDate: Date; filterStartDate: Date; }){   
    this.filterDate.filterStartDate = event.filterStartDate;
    this.filterDate.filterEndDate = event.filterEndDate;
    this.dataLoading();
  }

  handlePageEvent(pageIndex: number) {
    this.pageIndex = pageIndex;
    this.dataLoading();
  }

  setFixedToNumber(colum: number) {
    return colum.toLocaleString('en-US', {});
  }
}
