import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { DateService } from '@shared/services/date.service';
import { CommercialStructureReportsService } from './commercial-structure-reports.service';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { IEstructuraComercial } from '@pages/dto/estructuraComercial.dto';
import { DynamicFormCommercialStructureComponent } from './edit-commercial-structure-modal/dynamic-form-commercial-structure.component';
import { FilterTableCommercialEstructureReportsComponent } from '@shared/components/filter-table-commercial-estructure-reports/filter-table-commercial-estructure-reports.component';

@Component({
  selector: 'app-commercial-structure-reports',
  standalone: true,
  imports: [CommonModule, SpinnerLoadingComponent, DynamicFormCommercialStructureComponent, FilterTableCommercialEstructureReportsComponent, NzPaginationModule, NzTableModule, NzIconModule, NzModalModule, NzButtonModule],
  templateUrl: './commercial-structure-reports.component.html',
  styleUrl: './commercial-structure-reports.component.scss'
})

export class CommercialStructureReportsComponent {
  listEstructuraComercial: IEstructuraComercial[] = [];
  pageIndex: number = 1;
  pageSize: number = 10;
  totalDocs: number = 0;
  isLoading: boolean = false;
  isLoadingGeneric: boolean = false;

  isModalVisible: boolean = false;
  currentStructureData: IEstructuraComercial | null = null;
  isEditing: boolean = false;

  // filterUsuarioIdCreacion: { text: string, value: string, selected: boolean }[] = [];
  // filterEstado: { text: string, value: string, selected: boolean }[] = [];

  columnFilters: any = {
    nombre_sv: [],
    nombre_bdr: [],
    documento_sv: [],
    poc_tipo: [],
    estado: [],
    usuario_id_creacion: [],
  }

  filtersCommercialStructure: any = {
    nombre_sv: { data: [], isRemoveFilter: true },
    nombre_bdr: { data: [], isRemoveFilter: true },
    documento_sv: { data: [], isRemoveFilter: true },
    poc_tipo: { data: [], isRemoveFilter: true },
    estado: { data: [], isRemoveFilter: true },
    usuario_id_creacion: { data: [], isRemoveFilter: true },
  }

  constructor(
    private commercialStructureReportsService: CommercialStructureReportsService,
    private dateService: DateService,
  ) {}
  
  ngOnInit() {
    this.dataLoading();
    this.loadFilters();
  }

  loadFilters() {
    this.commercialStructureReportsService.getFilters().subscribe({
      next: (filters) => {
        this.columnFilters.nombre_sv = filters.nombre_sv.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.nombre_bdr = filters.nombre_bdr.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.documento_sv = filters.documento_sv.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.poc_tipo = filters.poc_tipo.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.estado = [{ text: 'Activo', value: '1', selected: false }, { text: 'Inactivo', value: '0', selected: false }];
        this.columnFilters.usuario_id_creacion = filters.usuario_id_creacion.map((item: string) => ({ text: item, value: item, selected: false }));        
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    });
  }

  // applyFilters() {
  //   this.pageIndex = 1; // Reinicia la paginación al aplicar filtros
  //   this.dataLoading();
  // }

  async dataLoading() {
    try {
      this.isLoading = true;
      let filters = [];
      for (const key in this.filtersCommercialStructure) {
        if (!this.filtersCommercialStructure[key].isRemoveFilter && this.filtersCommercialStructure[key].data.length != 0) {
          filters.push({ key, values: this.filtersCommercialStructure[key].data})
        }
      }
      const data = await this.commercialStructureReportsService.getListEstructuraComercial(this.pageIndex, this.pageSize, filters);
      this.listEstructuraComercial = data.docs;
      this.totalDocs = data.totalDocs;
      this.isLoading = false;
      
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.isLoading = false;
    }
  }
  

  async handleFilter({ selectedFilterItems, filterItems, isRemoveFilter }: any, column: string) {
    if(column === 'usuario-id-creacion') {
      this.filtersCommercialStructure.usuario_id_creacion.data = selectedFilterItems;
      this.filtersCommercialStructure.usuario_id_creacion.isRemoveFilter = isRemoveFilter;
    } else if (column === 'estado') {
      this.filtersCommercialStructure.estado.data = selectedFilterItems;
      this.filtersCommercialStructure.estado.isRemoveFilter = isRemoveFilter;
    } else if (column === 'nombre-sv') {
      this.filtersCommercialStructure.nombre_sv.data = selectedFilterItems;
      this.filtersCommercialStructure.nombre_sv.isRemoveFilter = isRemoveFilter;
    } else if (column === 'nombre-bdr') {
      this.filtersCommercialStructure.nombre_bdr.data = selectedFilterItems;
      this.filtersCommercialStructure.nombre_bdr.isRemoveFilter = isRemoveFilter;
    } else if (column === 'documento-sv') {
      this.filtersCommercialStructure.documento_sv.data = selectedFilterItems;
      this.filtersCommercialStructure.documento_sv.isRemoveFilter = isRemoveFilter;
    } else if (column === 'poc-tipo') {
      this.filtersCommercialStructure.poc_tipo.data = selectedFilterItems;
      this.filtersCommercialStructure.poc_tipo.isRemoveFilter = isRemoveFilter;
    }

    this.dataLoading();
  }


  exportExcel(): void {
    this.isLoadingGeneric = true;
    this.commercialStructureReportsService.exportExcel().subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport() + '-estructura-comercial' + '.xlsx';
        a.click();
        URL.revokeObjectURL(objectUrl);
        this.isLoadingGeneric = false;
      },
      error: (error) => {
        console.error('Error al Exportar:', error);
        this.isLoadingGeneric = false;
      }
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentStructureData = null;
    this.isModalVisible = true;
  }

  handleCloseModal() {
    this.isModalVisible = false;
  }

  getEstructuraComercialById(estructuraId: string) {
    this.isLoadingGeneric = true;
    this.commercialStructureReportsService.getEstructuraComercialById(estructuraId).subscribe({
      next: (data) => {
        this.isEditing = true;
        this.currentStructureData = data;
        this.isModalVisible = true;
        this.isLoadingGeneric = false;
      },
      error: (error) => {
        console.error('Error al obtener estructura comercial:', error);
        this.isLoadingGeneric = false;
      }
    });
  }

  handleSaveChanges(data: IEstructuraComercial) {
    const user = localStorage.getItem('user');
    data.estado = data.estado ? 1 : 0;
    if (this.isEditing) {
      if (user) data.usuario_id_actualizacion = JSON.parse(user).userId;
      this.commercialStructureReportsService.updateEstructuraComercial(data).subscribe({
        next: () => {
          this.dataLoading();
          this.isModalVisible = false;
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
        }
      });
    } else {
      if (user) data.usuario_id_creacion = JSON.parse(user).userId;
      this.commercialStructureReportsService.createEstructuraComercial(data).subscribe({
        next: () => {
          this.dataLoading();
          this.isModalVisible = false;
        },
        error: (error) => {
          console.error('Error al crear:', error);
        }
      });
    }
    this.isModalVisible = false;
  }

  handlePageEvent(pageIndex: number) {
    this.pageIndex = pageIndex;
    this.dataLoading();
  }
  
  setFixedToNumber(colum: number) {
    return colum.toLocaleString('en-US', {});
  }
}
