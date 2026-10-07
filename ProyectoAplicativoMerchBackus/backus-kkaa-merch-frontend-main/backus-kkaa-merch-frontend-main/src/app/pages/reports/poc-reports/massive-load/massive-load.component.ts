import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import * as XLSX from 'xlsx';
import { UtilService } from '@shared/services/util.service';
import { IUserStorage } from '@pages/dto/dictionary.dto';
import { PocReportsService } from '../poc-reports.service';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';

@Component({
  selector: 'app-massive-load',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzButtonModule,
    NzCardModule,
    NzAlertModule,
    NzNotificationModule,
    NzIconModule,
    NzTableModule,
    NzPaginationModule,
    NzCollapseModule,
    SpinnerLoadingComponent
  ],
  templateUrl: './massive-load.component.html',
  styleUrl: './massive-load.component.scss',
})
export class MassiveLoadComponent {
  @Input() isModalVisible: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  excelHeaders: string[] = [
    'nombre',
    'poc_cadena',
    'poc_backus',
    'nombre_planning',
    'tipo',
    'documento_sv',
    'nombre_sv',
    'estado',
    'poc_livetrade',
    'cadena',
    'gerencia',
    'region',
  ];
  selectUser: IUserStorage | null = null;
  showAlert = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage: any;
  isUploadButtonDisabled: boolean = true;
  isSelectExcel: boolean = false;
  isValidHeaders: boolean = false;
  isLoadingGeneric: boolean = false;
  isValidSheetCount: boolean = false;
  selectedFileName = '';
  selectedFileSize = '';
  validationsExcel: any = {};
  validationsValueListExcel: any = {
    nombre: {
      message: 'Poc Nombre no debe de existir en la base de datos',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    nombre_planning: {
      message: 'Nombre Planning no debe de existir en la base de datos',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    poc_backus: {
      message: 'Poc Backus no debe de existir en la base de datos',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    poc_cadena: {
      message: 'Poc Cadena no debe de existir en la base de datos',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    tipo: {
      message: 'Tipo no debe de existir en la base de datos',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    nombre_excel: {
      message: 'Poc Nombre no debe de haber duplicados en el excel',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    poc_cadena_excel: {
      message: 'Poc Cadena no debe de haber duplicados en el excel',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    poc_backus_excel: {
      message: 'Poc Backus no debe de haber duplicados en el excel, excepto para las cadenas de COESTI y MASS',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    nombre_planning_excel: {
      message: 'Nombre Planning no debe de haber duplicados en el excel',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
  }

  constructor(
    // private route: ActivatedRoute,
    private notification: NzNotificationService,
    private pocReportsService: PocReportsService,
    private utilService: UtilService,
  ) {
    // this.selectPoc = this.utilService.getPocFromLocalStorage();
    this.selectUser = this.utilService.getUserFromLocalStorage();
  }

  async onExcelFileSelected() {    
    const inputNode = document.querySelector('#select-file-pocs-massive-load') as HTMLInputElement;
    const file = inputNode.files?.[0];
  
    if (!file) return;

    console.log('file', file);
  
    this.isUploadButtonDisabled = true;
    this.showAlert = false;
    this.isValidSheetCount = true;
    this.isValidHeaders = true;

    await this.isValid(file);
    this.isLoadingGeneric = false;
    this.showAlert = true;

    // // this.isValidSheetCount

    if (this.isValidHeaders && this.isValidSheetCount) {
      this.alertType = 'success';
      this.alertMessage = 'Todos las columnas requeridas están presentes en el archivo seleccionado';
      // this.isUploadButtonDisabled = false;
      this.selectedFileName = file.name;
      this.selectedFileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      this.isSelectExcel = true;
    } else if (!this.isValidSheetCount) {
      this.alertType = 'error';
      this.alertMessage = 'El archivo excel tiene mas de una hoja';
      this.selectedFileName = '';
      this.selectedFileSize = '';
      inputNode.value = '';
      this.isSelectExcel = false;
    } else {
      this.alertType = 'error';
      this.alertMessage = 'No todas las columnas requeridas están presentes en el archivo seleccionado';
      this.selectedFileName = '';
      this.selectedFileSize = '';
      inputNode.value = '';
      this.isSelectExcel = false;
    }
  }

  async isValid(file: File) {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "buffer", cellDates: true });
      // Verificar el número de hojas
      if (workbook.SheetNames.length > 1) {
        this.isValidSheetCount = false;
        return; // No continuar si hay más de una hoja
      }
      this.isValidSheetCount = true;

      // Obtener los headers
      let headersRow = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 })[0] as string[];
      const headers = headersRow.map(header => header.trim());
      // Validar los headers
      this.isValidHeaders = this.excelHeaders.every((header) => headers.includes(header));
      if (!this.isValidHeaders) {
        return;
      }
      this.isLoadingGeneric = true;
      const formData = new FormData();
      formData.append('file', file);
      this.validationsExcel = await this.pocReportsService.varifyExcelPocsMassiveLoad(formData);
      console.log('res', this.validationsExcel);
      let isNotOk = false;
      for (const clave in this.validationsExcel) {
        if (clave === 'campos_is_not_cadenas') {
          isNotOk = this.validationsExcel.campos_is_not_cadenas.nombre || this.validationsExcel.campos_is_not_cadenas.documento_sv || this.validationsExcel.campos_is_not_cadenas.nombre_sv || this.validationsExcel.campos_is_not_cadenas.poc_backus || this.validationsExcel.campos_is_not_cadenas.poc_cadena || this.validationsExcel.campos_is_not_cadenas.poc_livetrade
        }
        if (clave === 'campos_vacios') {
          isNotOk = this.validationsExcel.campos_vacios.documento_sv || this.validationsExcel.campos_vacios.nombre || this.validationsExcel.campos_vacios.nombre_sv
        }
        if (clave === 'duplicados') {
          isNotOk = this.validationsExcel.duplicados;
        }
        if (clave === 'estado') {
          isNotOk = this.validationsExcel.estado;
        }
        if (clave === 'duplicados_bd') {
          isNotOk = this.validationsExcel.duplicados_bd.nombre.length > 0 || 
                      this.validationsExcel.duplicados_bd.nombre_planning.length > 0 ||
                      this.validationsExcel.duplicados_bd.poc_backus.length > 0 ||
                      this.validationsExcel.duplicados_bd.poc_cadena.length > 0;
        }
        if (clave === 'tipo') {
          isNotOk == this.validationsExcel.tipo.length > 0;
        }
        if (clave === 'duplicados_excel') {
          isNotOk = this.validationsExcel.duplicados_excel.nombre_excel.length > 0 || 
                      this.validationsExcel.duplicados_excel.nombre_planning_excel.length > 0 ||
                      this.validationsExcel.duplicados_excel.poc_backus_excel.length > 0 ||
                      this.validationsExcel.duplicados_excel.poc_cadena_excel.length > 0;
        }

        if (isNotOk) {
          break;
        }
      }
      this.isUploadButtonDisabled = isNotOk;
      this.isLoadingGeneric = false;

      this.validationsValueListExcel.nombre.status = this.validationsExcel.duplicados_bd.nombre.length != 0;
      this.validationsValueListExcel.nombre.data.dataArray = this.validationsExcel.duplicados_bd.nombre;
      this.validationsValueListExcel.nombre.data.totalItems = this.validationsExcel.duplicados_bd.nombre.length;

      this.validationsValueListExcel.nombre_planning.status = this.validationsExcel.duplicados_bd.nombre_planning.length != 0;
      this.validationsValueListExcel.nombre_planning.data.dataArray = this.validationsExcel.duplicados_bd.nombre_planning;
      this.validationsValueListExcel.nombre_planning.data.totalItems = this.validationsExcel.duplicados_bd.nombre_planning.length;

      this.validationsValueListExcel.poc_backus.status = this.validationsExcel.duplicados_bd.poc_backus.length != 0;
      this.validationsValueListExcel.poc_backus.data.dataArray = this.validationsExcel.duplicados_bd.poc_backus;
      this.validationsValueListExcel.poc_backus.data.totalItems = this.validationsExcel.duplicados_bd.poc_backus.length;

      this.validationsValueListExcel.poc_cadena.status = this.validationsExcel.duplicados_bd.poc_cadena.length != 0;
      this.validationsValueListExcel.poc_cadena.data.dataArray = this.validationsExcel.duplicados_bd.poc_cadena;
      this.validationsValueListExcel.poc_cadena.data.totalItems = this.validationsExcel.duplicados_bd.poc_cadena.length;

      this.validationsValueListExcel.tipo.status = this.validationsExcel.tipo.length != 0;
      this.validationsValueListExcel.tipo.data.dataArray = this.validationsExcel.tipo;
      this.validationsValueListExcel.tipo.data.totalItems = this.validationsExcel.tipo.length;

      this.validationsValueListExcel.nombre_excel.status = this.validationsExcel.duplicados_excel.nombre_excel.length != 0;
      this.validationsValueListExcel.nombre_excel.data.dataArray = this.validationsExcel.duplicados_excel.nombre_excel;
      this.validationsValueListExcel.nombre_excel.data.totalItems = this.validationsExcel.duplicados_excel.nombre_excel.length;

      this.validationsValueListExcel.poc_cadena_excel.status = this.validationsExcel.duplicados_excel.poc_cadena_excel.length != 0;
      this.validationsValueListExcel.poc_cadena_excel.data.dataArray = this.validationsExcel.duplicados_excel.poc_cadena_excel;
      this.validationsValueListExcel.poc_cadena_excel.data.totalItems = this.validationsExcel.duplicados_excel.poc_cadena_excel.length;

      this.validationsValueListExcel.poc_backus_excel.status = this.validationsExcel.duplicados_excel.poc_backus_excel.length != 0;
      this.validationsValueListExcel.poc_backus_excel.data.dataArray = this.validationsExcel.duplicados_excel.poc_backus_excel;
      this.validationsValueListExcel.poc_backus_excel.data.totalItems = this.validationsExcel.duplicados_excel.poc_backus_excel.length;

      this.validationsValueListExcel.nombre_planning_excel.status = this.validationsExcel.duplicados_excel.nombre_planning_excel.length != 0;
      this.validationsValueListExcel.nombre_planning_excel.data.dataArray = this.validationsExcel.duplicados_excel.nombre_planning_excel;
      this.validationsValueListExcel.nombre_planning_excel.data.totalItems = this.validationsExcel.duplicados_excel.nombre_planning_excel.length;  
    } catch (error: any) {
      console.error('Error al procesar el archivo:', error);
      this.isLoadingGeneric = false;
    }
  }

  async onUploadFile() {
    const inputNode = document.querySelector('#select-file-pocs-massive-load') as HTMLInputElement;
    const file = inputNode.files?.[0];
    // const fileName = file?.name;
    // const fileExtension = fileName?.split('.').pop()

    if (this.isUploadButtonDisabled) return;
      
    if (!file) {
      this.createNotification('error', 'Archivo no seleccionado', 'Por favor, seleccione un archivo antes de intentar subirlo.');
      return;
    }

    this.isLoadingGeneric = true;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('usuario',JSON.stringify(this.selectUser));
      await this.pocReportsService.uploadExcelPocsMassiveLoad(formData).then((res:any) => {
        console.log('res-uploadFile', res);
        this.showAlert = false;
        this.isUploadButtonDisabled = true;
        this.selectedFileName = '';
        this.selectedFileSize = '';
        inputNode.value = '';
        this.isSelectExcel = false;
        this.isLoadingGeneric = false;
        this.createNotification('success', 'Archivo subido', 'El archivo excel se subió correctamente');
      })
      .catch((error) => {      
        console.log('error-uploadExcelOrCsv', error.error);
        this.createNotification('error', error?.error?.message, 'Ocurrió un error al subir el archivo excel');
      });
      
    } catch (error: any) {
      const messageError = error?.error || 'Error al subir el archivo excel';
      this.createNotification('error', messageError, 'Ocurrió un error al subir el archivo excel');
    }
    this.isLoadingGeneric = false;
  }

  deleteFile() {
    this.selectedFileName = '';
    this.selectedFileSize = '';
    this.showAlert = false;
    this.isUploadButtonDisabled = true;
    // eliminamos la referencia del archivo
    const inputNode = document.querySelector('#select-file-pocs-massive-load') as HTMLInputElement;
    inputNode.value = '';
    this.isSelectExcel = false;
  }

  createNotification(type: string, title: string, description: string): void {
    this.notification.create(type, title, description);
  }

  onPageIndexChange(page: number, typeValidation: string): void {
    if (typeValidation === 'nombre') {
      this.validationsValueListExcel.nombre.data.currentPage = page;
    } else if (typeValidation === 'nombre_planning') {
      this.validationsValueListExcel.nombre_planning.data.currentPage = page;
    } else if (typeValidation === 'poc_backus') {
      this.validationsValueListExcel.poc_backus.data.currentPage = page;
    } else if (typeValidation ==='poc_cadena') {
      this.validationsValueListExcel.poc_cadena.data.currentPage = page;
    } else if(typeValidation === 'tipo') {
      this.validationsValueListExcel.tipo.data.currentPage = page;
    } else if(typeValidation === 'nombre_excel') {
      this.validationsValueListExcel.nombre_excel.data.currentPage = page;
    } else if(typeValidation === 'poc_cadena_excel') {
      this.validationsValueListExcel.poc_cadena_excel.data.currentPage = page;
    } else if(typeValidation === 'poc_backus_excel') {
      this.validationsValueListExcel.poc_backus_excel.data.currentPage = page;
    } else if(typeValidation === 'nombre_planning_excel') {
      this.validationsValueListExcel.nombre_planning_excel.data.currentPage = page;
    }
  }

  onPageSizeChange(pageSize: number, typeValidation: string): void {
    if (typeValidation === 'nombre') {
      this.validationsValueListExcel.nombre.data.pageSize = pageSize;
    } else if (typeValidation === 'nombre_planning') {
      this.validationsValueListExcel.nombre_planning.data.pageSize = pageSize;
    } else if (typeValidation === 'poc_backus') {
      this.validationsValueListExcel.poc_backus.data.pageSize = pageSize;
    } else if (typeValidation === 'poc_cadena') {
      this.validationsValueListExcel.poc_cadena.data.pageSize = pageSize;
    } else if (typeValidation === 'tipo') {
      this.validationsValueListExcel.tipo.data.pageSize = pageSize;
    } else if (typeValidation === 'nombre_excel') {
      this.validationsValueListExcel.nombre_excel.data.pageSize = pageSize;
    } else if (typeValidation === 'poc_cadena_excel') {
      this.validationsValueListExcel.poc_cadena_excel.data.pageSize = pageSize;
    } else if (typeValidation === 'poc_backus_excel') {
      this.validationsValueListExcel.poc_backus_excel.data.pageSize = pageSize;
    } else if (typeValidation === 'nombre_planning_excel') {
      this.validationsValueListExcel.nombre_planning_excel.data.pageSize = pageSize;
    }
  }

  setFixedToNumber(colum: any) {
    return parseFloat(colum).toLocaleString('en-US', {});
  }

  handleCancelModal() {
    this.deleteFile();
    this.isModalVisible = false;
    this.closeModal.emit();
  }
}
