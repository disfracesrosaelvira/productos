import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzImageModule } from 'ng-zorro-antd/image';

import { SkuReportsService } from './sku-reports.service';
import { ISku } from '../../dto/sku.dto';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { DateService } from '@shared/services/date.service';
import { DynamicFormSkuComponent } from './dynamic-form-sku/dynamic-form-sku.component';
import { FilterTableCommercialEstructureReportsComponent } from '@shared/components/filter-table-commercial-estructure-reports/filter-table-commercial-estructure-reports.component';

@Component({
  selector: 'app-sku-reports',
  standalone: true,
  imports: [CommonModule, DynamicFormSkuComponent, FilterTableCommercialEstructureReportsComponent, SpinnerLoadingComponent, NzPaginationModule, NzTableModule, NzAvatarModule, NzIconModule, NzButtonModule, NzToolTipModule, NzNotificationModule, NzModalModule, NzImageModule],
  templateUrl: './sku-reports.component.html',
  styleUrl: './sku-reports.component.scss'
})
export class SkuReportsComponent {
  skus: ISku[] = [];
  pageIndex: number = 1;
  pageSize: number = 10;
  totalDocs: number = 0;
  isLoading: boolean = false;
  isLoadingGeneric: boolean = false;

  isModalVisible: boolean = false;
  currentSkuData: ISku | null = null;
  isEditing: boolean = false;

  columnFilters: any = {
    sku: [],
    descripcion: [],
    categoria: [],
    linea: [],
    marca: [],
    empresa_id: [],
    estado: [],
    competencia: [],
    usuario_id_creacion: [],
    usuario_id_actualizacion: [],
  }

  filtersSku: any = {
    sku: { data: [], isRemoveFilter: true },
    descripcion: { data: [], isRemoveFilter: true },
    categoria: { data: [], isRemoveFilter: true },
    linea: { data: [], isRemoveFilter: true },
    marca: { data: [], isRemoveFilter: true },
    empresa_id: { data: [], isRemoveFilter: true },
    estado: { data: [], isRemoveFilter: true },
    competencia: { data: [], isRemoveFilter: true },
    usuario_id_creacion: { data: [], isRemoveFilter: true },
    usuario_id_actualizacion: { data: [], isRemoveFilter: true },
  }

  imagenSeleccionado: string = '';
  isVisibleModalImagen = false;
  angle = 0;

  constructor(
    private skuReportsService: SkuReportsService,
    private dateService: DateService,
    private notification: NzNotificationService,
    private nzImageService: NzImageService,
  ) {}
  
  ngOnInit() {
    this.dataLoading();
    this.loadFilters();
  }

  loadFilters() {
    this.skuReportsService.getFilters().subscribe({
      next: (filters) => {
        this.columnFilters.sku = filters.sku.map((item: string) => ({ text: ''+item, value: ''+item, selected: false }));
        this.columnFilters.descripcion = filters.descripcion.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.categoria = filters.categoria.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.linea = filters.linea.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.marca = filters.marca.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.empresa_id = filters.empresa_id.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.competencia = [{ text: '1', value: '1', selected: false }, { text: '0', value: '0', selected: false }];
        this.columnFilters.usuario_id_creacion = filters.usuario_id_creacion.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.usuario_id_actualizacion = filters.usuario_id_actualizacion.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.estado = [{ text: 'Activo', value: '1', selected: false }, { text: 'Inactivo', value: '0', selected: false }];        
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    });
  }

  async dataLoading() {
    try {
      this.isLoading = true;
      let filters = [];
      for (const key in this.filtersSku) {
        if (!this.filtersSku[key].isRemoveFilter && this.filtersSku[key].data.length != 0) {
          filters.push({ key, values: this.filtersSku[key].data})
        }
      }
      const data = await this.skuReportsService.getSkus(this.pageIndex, this.pageSize, filters);
      this.skus = data.docs;
      this.totalDocs = data.totalDocs;
      this.isLoading = false;
      
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.isLoading = false;
    }
  }

  async handleFilter({ selectedFilterItems, filterItems, isRemoveFilter }: any, column: string) {
    if(column === 'sku') {
      this.filtersSku.sku.data = selectedFilterItems;
      this.filtersSku.sku.isRemoveFilter = isRemoveFilter;
    } else if (column === 'descripcion') {
      this.filtersSku.descripcion.data = selectedFilterItems;
      this.filtersSku.descripcion.isRemoveFilter = isRemoveFilter;
    } else if (column === 'categoria') {
      this.filtersSku.categoria.data = selectedFilterItems;
      this.filtersSku.categoria.isRemoveFilter = isRemoveFilter;
    } else if (column === 'linea') {
      this.filtersSku.linea.data = selectedFilterItems;
      this.filtersSku.linea.isRemoveFilter = isRemoveFilter;
    } else if (column === 'marca') {
      this.filtersSku.marca.data = selectedFilterItems;
      this.filtersSku.marca.isRemoveFilter = isRemoveFilter;
    } else if (column === 'empresa-id') {
      this.filtersSku.empresa_id.data = selectedFilterItems;
      this.filtersSku.empresa_id.isRemoveFilter = isRemoveFilter;
    } else if (column === 'estado') {
      this.filtersSku.estado.data = selectedFilterItems;
      this.filtersSku.estado.isRemoveFilter = isRemoveFilter;
    } else if (column === 'competencia') {
      this.filtersSku.competencia.data = selectedFilterItems;
      this.filtersSku.competencia.isRemoveFilter = isRemoveFilter;
    } else if (column === 'usuario-id-creacion') {
      this.filtersSku.usuario_id_creacion.data = selectedFilterItems;
      this.filtersSku.usuario_id_creacion.isRemoveFilter = isRemoveFilter;
    } else if (column === 'usuario-id-actualizacion') {
      this.filtersSku.usuario_id_actualizacion.data = selectedFilterItems;
      this.filtersSku.usuario_id_actualizacion.isRemoveFilter = isRemoveFilter;
    }
    this.dataLoading();
  }

  exportExcel(): void {
    this.isLoadingGeneric = true;
    this.skuReportsService.exportExcel().subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport() + '-sku' + '.xlsx';
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
    this.currentSkuData = null;
    this.isModalVisible = true;
  }

  handleCloseModal() {
    this.isModalVisible = false;
  }

  getSkuById(skuId: string) {
    this.isLoadingGeneric = true;
    this.skuReportsService.getSkuById(skuId).subscribe({
      next: (data) => {
        this.isEditing = true;
        this.currentSkuData = { ...data, competencia: data.competencia == 1 ? '1' : '0'};
        this.isModalVisible = true;
        this.isLoadingGeneric = false;
      },
      error: (error) => {
        console.error('Error al obtener sku:', error);
        this.isLoadingGeneric = false;
      }
    });
  }

  handleSaveChanges(data: ISku) {
    const user = localStorage.getItem('user');
    data.estado = data.estado ? 1 : 0;
    if (this.isEditing) {
      if (user) data.usuario_id_actualizacion = JSON.parse(user).userId;
      this.skuReportsService.updateSku({
        ...data,
        imagen: data.imagen.split('?')[0],
        competencia: data.competencia == 1 ? 1 : 0, // validacion porque al seleccionar envia string
      }).subscribe({
        next: () => {
          this.dataLoading();
          this.isModalVisible = false;
          this.notification.create('success', 'Editado', 'Se edito correctamente');
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          this.notification.create('error', 'Error', 'No se pudo guardar');
        }
      });
    } else {
      if (user) data.usuario_id_creacion = JSON.parse(user).userId;
      this.skuReportsService.createSku({
        ...data,
        competencia: data.competencia == 1 ? 1 : 0, // validacion porque al seleccionar envia string
      }).subscribe({
        next: () => {
          this.dataLoading();
          this.isModalVisible = false;
          this.notification.create('success', 'Creado', 'Se Creo correctamente');
        },
        error: (error) => {
          console.error('Error al crear:', error);
          this.notification.create('error', 'Error', 'Sku ya existe en la base de datos');
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
}
