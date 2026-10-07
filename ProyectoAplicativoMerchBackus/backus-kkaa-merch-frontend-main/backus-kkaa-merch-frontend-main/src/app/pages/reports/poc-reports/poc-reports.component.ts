import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';

import { format } from 'date-fns';
import { IPoc } from '../../dto/poc.dto';
import { PocReportsService } from './poc-reports.service';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { DateService } from '@shared/services/date.service';
import { DynamicFormPocComponent } from './dynamic-form-poc/dynamic-form-poc.component';
import { FilterTableCommercialEstructureReportsComponent } from '@shared/components/filter-table-commercial-estructure-reports/filter-table-commercial-estructure-reports.component';
import { UpdateSupervidorComponent } from './update-supervidor/update-supervidor.component';
import { MassiveLoadComponent } from './massive-load/massive-load.component';

@Component({
  selector: 'app-poc-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicFormPocComponent, UpdateSupervidorComponent, MassiveLoadComponent, FilterTableCommercialEstructureReportsComponent, SpinnerLoadingComponent, NzPaginationModule, NzTableModule, NzIconModule, NzButtonModule, NzNotificationModule],
  templateUrl: './poc-reports.component.html',
  styleUrl: './poc-reports.component.scss'
})
export class PocReportsComponent {
  pocs: IPoc[] = [];
  pageIndex: number = 1;
  pageSize: number = 10;
  totalDocs: number = 0;
  isLoading: boolean = false;
  isLoadingGeneric: boolean = false;

  isModalVisible: boolean = false;
  currentPocData: IPoc | null = null;
  isEditing: boolean = false;

  // update supervisor
  isModalVisibleUpdateSupervidor: boolean = false;
  supervisors: any[] = [];

  // massive load
  isModalVisibleMassiveLoad: boolean = false;

  columnFilters: any = {
    poc: [],
    nombre: [],
    poc_cadena: [],
    poc_backus: [],
    nombre_planning: [],
    tipo: [],
    documento_sv: [],
    nombre_sv: [],
    estado: [],
    usuario_id_creacion: [],
    usuario_id_actualizacion: [],
  }

  filtersPoc: any = {
    poc: { data: [], isRemoveFilter: true },
    nombre: { data: [], isRemoveFilter: true },
    poc_cadena: { data: [], isRemoveFilter: true },
    poc_backus: { data: [], isRemoveFilter: true },
    nombre_planning: { data: [], isRemoveFilter: true },
    tipo: { data: [], isRemoveFilter: true },
    documento_sv: { data: [], isRemoveFilter: true },
    nombre_sv: { data: [], isRemoveFilter: true },
    estado: { data: [], isRemoveFilter: true },
    usuario_id_creacion: { data: [], isRemoveFilter: true },
    usuario_id_actualizacion: { data: [], isRemoveFilter: true }
  }

  user: any = localStorage.getItem('user');
  user_id = this.user ? JSON.parse(this.user).userId : '0';
  
  constructor(
    private pocReportsService: PocReportsService,
    private dateService: DateService,
    private notification: NzNotificationService,
  ) {}
  
  ngOnInit() {
    this.dataLoading();
    this.loadFilters();
  }

  loadFilters() {
    this.isLoadingGeneric = true;
    this.pocReportsService.getFilters().subscribe({
      next: (filters) => {
        this.columnFilters.poc = filters.poc.map((item: string) => ({ text: ''+item, value: ''+item, selected: false }));
        this.columnFilters.nombre = filters.nombre.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.poc_cadena = filters.poc_cadena.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.poc_backus = filters.poc_backus.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.nombre_planning = filters.nombre_planning.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.tipo = filters.tipo.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.documento_sv = filters.documento_sv.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.nombre_sv = filters.nombre_sv.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.usuario_id_creacion = filters.usuario_id_creacion.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.usuario_id_actualizacion = filters.usuario_id_actualizacion.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.estado = [{ text: 'Activo', value: '1', selected: false }, { text: 'Inactivo', value: '0', selected: false }];        
        this.isLoadingGeneric = false;
      },
      error: (error) => {
        this.isLoadingGeneric = false;
        console.error('Error al cargar filtros:', error);
      }
    });
  }

  async dataLoading() {
    try {
      this.isLoading = true;
      let filters = [];
      for (const key in this.filtersPoc) {
        if (!this.filtersPoc[key].isRemoveFilter && this.filtersPoc[key].data.length != 0) {
          filters.push({ key, values: this.filtersPoc[key].data})
        }
      }
      const data = await this.pocReportsService.getPocs(this.pageIndex, this.pageSize, this.user_id, filters);
      this.pocs = data.docs;
      this.totalDocs = data.totalDocs;
      this.isLoading = false;
      
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.isLoading = false;
    }
  }

  async handleFilter({ selectedFilterItems, filterItems, isRemoveFilter }: any, column: string) {
    // console.log('selectedFilterItems', selectedFilterItems)
    // console.log('filterItems', filterItems)
    if(column === 'poc') {
      this.filtersPoc.poc.data = selectedFilterItems;
      this.filtersPoc.poc.isRemoveFilter = isRemoveFilter;
    } else if (column === 'nombre') {      
      this.filtersPoc.nombre.data = selectedFilterItems;
      this.filtersPoc.nombre.isRemoveFilter = isRemoveFilter;
    } else if (column === 'poc-cadena') {
      this.filtersPoc.poc_cadena.data = selectedFilterItems;
      this.filtersPoc.poc_cadena.isRemoveFilter = isRemoveFilter;
    } else if (column === 'poc-backus') {
      this.filtersPoc.poc_backus.data = selectedFilterItems;
      this.filtersPoc.poc_backus.isRemoveFilter = isRemoveFilter;
    } else if (column === 'nombre-planning') {
      this.filtersPoc.nombre_planning.data = selectedFilterItems;
      this.filtersPoc.nombre_planning.isRemoveFilter = isRemoveFilter;
    } else if (column === 'tipo') {
      this.filtersPoc.tipo.data = selectedFilterItems;
      this.filtersPoc.tipo.isRemoveFilter = isRemoveFilter;
    } else if (column === 'documento-sv') {
      this.filtersPoc.documento_sv.data = selectedFilterItems;
      this.filtersPoc.documento_sv.isRemoveFilter = isRemoveFilter;
    } else if (column === 'nombre-sv') {
      this.filtersPoc.nombre_sv.data = selectedFilterItems;
      this.filtersPoc.nombre_sv.isRemoveFilter = isRemoveFilter;
    } else if (column === 'estado') {
      this.filtersPoc.estado.data = selectedFilterItems;
      this.filtersPoc.estado.isRemoveFilter = isRemoveFilter;
    } else if (column === 'usuario-id-creacion') {
      this.filtersPoc.usuario_id_creacion.data = selectedFilterItems;
      this.filtersPoc.usuario_id_creacion.isRemoveFilter = isRemoveFilter;
    } else if (column === 'usuario-id-actualizacion') {
      this.filtersPoc.usuario_id_actualizacion.data = selectedFilterItems;
      this.filtersPoc.usuario_id_actualizacion.isRemoveFilter = isRemoveFilter;
    }
    this.dataLoading();
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentPocData = null;
    this.isModalVisible = true;
  }

  openChangeSupervisor() {
    this.isModalVisibleUpdateSupervidor = true;
    this.getSupervisors();
  }

  openChangePocsMassiveLoad() {
    this.isModalVisibleMassiveLoad = true;
  }

  handleCloseModal() {
    this.isModalVisible = false;
  }

  handleCloseModalUpdateSupervidor() {
    this.isModalVisibleUpdateSupervidor = false;
  }

  handleCloseModalPocsMassiveLoad() {
    this.isModalVisibleMassiveLoad = false;
  }

  getSupervisors() {
    this.isLoadingGeneric = true;
    this.pocReportsService.getSupervisors().subscribe({
      next: (supervisors) => {
        this.supervisors = supervisors;
        this.isLoadingGeneric = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingGeneric = false;
      }
    })
  }

  getPocById(skuId: string) {
    this.isLoadingGeneric = true;
    this.pocReportsService.getSkuById(skuId).subscribe({
      next: (data) => {
        this.isEditing = true;
        this.currentPocData = data;
        this.isModalVisible = true;
        this.isLoadingGeneric = false;
      },
      error: (error) => {
        console.error('Error al obtener poc:', error);
        this.isLoadingGeneric = false;
      }
    });
  }

  handleSaveChanges(data: IPoc) {
    this.isLoadingGeneric = true;
    const user = localStorage.getItem('user');
    data.estado = data.estado ? 1 : 0;
    if (this.isEditing) {
      if (user) data.usuario_id_actualizacion = JSON.parse(user).userId;
      this.pocReportsService.updateSku(data).subscribe({
        next: () => {
          this.dataLoading();
          this.isModalVisible = false;
          this.isLoadingGeneric = false;
          this.notification.create('success', 'Editado', 'Se edito correctamente');
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          this.isLoadingGeneric = false;
          this.notification.create('error', 'Error', 'No se pudo guardar');
        }
      });
    } else {
      if (user) data.usuario_id_creacion = JSON.parse(user).userId;
      this.pocReportsService.createSku(data).subscribe({
        next: () => {
          this.dataLoading();
          this.isModalVisible = false;
          this.isLoadingGeneric = false;
          this.notification.create('success', 'Creado', 'Se Creo correctamente');
        },
        error: (error) => {
          console.error('Error al crear:', error);
          this.isLoadingGeneric = false;
          this.notification.create('error', 'Error', 'POC, POC Nombre o Nombre Planning ya existe en la base de datos');
        }
      });
    }
    this.isModalVisible = false;
  }

  handleSaveChangesUpdateSupervidor(data: any) {
    this.isLoadingGeneric = true;
    const updateSupersor = {
      documento_sv: data.documento_sv,
      nombre_sv: data.nombre_sv,
      fecha_inicio: format(new Date(data.fecha_inicio), "yyyy-MM-dd")+'T00:00:00Z',
    }
    this.pocReportsService.updateSupervisor(updateSupersor, data.nombre_supervisor).subscribe({
      next: () => {
        this.isLoadingGeneric = false;
        this.isModalVisibleUpdateSupervidor = false;
        this.notification.create('success', 'Editado', 'Se edito correctamente');
        this.dataLoading();
      },
      error: () => {
        this.notification.create('error', 'Error', 'No se pudo actualizar');
        this.isLoadingGeneric = false;
      }
    });
  }

  exportExcel(): void {
    this.isLoadingGeneric = true;
    this.pocReportsService.exportExcel(this.user_id).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport() + '-poc' + '.xlsx';
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

// # Actualiza la propiedad de poc en la coleccion de exhibiciones adicionales
// db.stock.aggregate([
//   {
//     // Hacer un lookup para combinar con la colección poc
//     $lookup: {
//       from: "poc",  // La colección desde la que hacemos la unión
//       localField: "poc.poc",  // Campo en stock
//       foreignField: "poc",  // Campo en poc
//       as: "poc_data"  // El resultado de la unión
//     }
//   },
//   {
//     // Desestructuramos el array poc_data para que sea un objeto único
//     $unwind: "$poc_data"
//   },
//   {
//     // Modificar el documento original con los nuevos valores de poc
//     $set: {
//       "poc.nombre": "$poc_data.nombre",
//       "poc.nombre_planning": { $ifNull: ["$poc_data.nombre_planning", null] },
//       "poc.tipo": { $ifNull: ["$poc_data.tipo", null] },  // Asigna null si no hay valor
//       "poc.poc_backus": { $ifNull: ["$poc_data.poc_backus", null] },
//       "poc.poc_cadena": { $ifNull: ["$poc_data.poc_cadena", null] },
//       "poc.documento_sv": { $ifNull: ["$poc_data.documento_sv", null] },
//       "poc.nombre_sv": { $ifNull: ["$poc_data.nombre_sv", null] },
//       "poc.poc_livetrade": { $ifNull: ["$poc_data.poc_livetrade", null] },
//       "poc.cadena": { $ifNull: ["$poc_data.cadena", null] },
//       "poc.gerencia": { $ifNull: ["$poc_data.gerencia", null] },
//       "poc.region": { $ifNull: ["$poc_data.region", null] }
//     }
//   },
//   {
//     // Eliminar la propiedad poc_data que se agregó con el lookup
//     $unset: "poc_data"
//   },
//   {
//     // Merge de los resultados en la misma colección stock
//     $merge: {
//       into: "stock",  // Reinsertamos los documentos en la colección
//       whenMatched: "merge",  // Actualizar cuando hay coincidencias
//       whenNotMatched: "fail"  // No insertar nuevos documentos
//     }
//   }
// ])