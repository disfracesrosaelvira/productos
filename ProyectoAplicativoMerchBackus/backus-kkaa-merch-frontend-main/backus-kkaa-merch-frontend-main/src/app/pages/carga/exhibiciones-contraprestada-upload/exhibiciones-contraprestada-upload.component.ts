import { PocService } from './../../../shared/services/poc.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { ActivatedRoute } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
// import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import * as XLSX from 'xlsx';
import { format, addDays } from "date-fns";
import { ExhibitionContraprestadaUploadService } from './exhibiciones-contraprestada-upload.service';
import { UtilService } from '@shared/services/util.service';
import { IPocStorage, IUserStorage } from '@pages/dto/dictionary.dto';
import { IPoc } from '@pages/dto/poc.dto';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { SharedService } from '@shared/services/shared.service';
import Constantes from '@shared/constants/contants';
interface ExcelHeaders {
  exhibicion: {
    contraprestada: string[];
  };
}
interface ColumnMap {
  [key: string]: number;
}

@Component({
  selector: 'app-exhibiciones-contraprestada-upload',
  standalone: true,
  imports: [CommonModule, SpinnerLoadingComponent, NzCardModule, NzButtonModule, NzAlertModule, NzNotificationModule, NzTableModule, NzIconModule, NzPaginationModule, NzCollapseModule],
  templateUrl: './exhibiciones-contraprestada-upload.component.html',
  styleUrl: './exhibiciones-contraprestada-upload.component.scss',
})
export class ExhibitionContraprestadaUploadComponent {
  showAlert = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage: any;
  validations:any=[];
  duplicates:any=[];
  existValidations:boolean=false;
  existDuplicates:boolean=false;
  isUploadButtonDisabled = true;
  selectedFileName = '';
  selectedFileSize = '';
  user: any = localStorage.getItem('user');
  user_id = this.user ? JSON.parse(this.user).userId : '0';
  userName = this.user ? JSON.parse(this.user).userName : '-';
  excelHeaders: ExcelHeaders = {
    exhibicion: {
      // contraprestada: ['empresa_id', 'poc_nombre', 'zona', 'tienda', 'campaña', 'fecha_inicio', 'fecha_fin', 'marca', 'skus', 'vigencia_fecha_inicio', 'vigencia_fecha_fin'],
      contraprestada: ['empresa_id', 'poc_nombre', 'zona', 'tipo_exhibicion_homologado', 'tipo_exhibicion', 'correlativo', 'tienda', 'campaña', 'fecha_inicio', 'fecha_fin', 'marca', 'skus', 'fecha_de_carga'],
    },    
  };
  codigoValues: string = 'tipo_exhibicion_homologado_contraprestada';
  dataTipoExhibicionHomologadoContraprestada: string [] = [];

  selectPoc: IPocStorage | null = null;
  loaderTable: boolean = false;
  data: any = [];
  pageIndex: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  selectUser: IUserStorage | null = null;

  isLoadingGeneric: boolean = false;
  pocs: IPoc[] = [];
  isSelectExcel: boolean = false;
  isValidHeaders: boolean = false;
  isValidSheetCount: boolean = false;
  isValidRowCount: boolean = false;
  existsColumnVigenciaFechaInicioAndVigenciaFechaFin: boolean = false;
  validationsExcel: any = {
    duplicates: {
      message: 'No puede existir registros duplicados',
      status: false
    },
    validateRecordsDatabase: {
      message: 'No deben existir ningun registro guardado en la base de datos',
      status: false,
      verifyCorrectlyDatabase: true,
      validDates: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    emptyRows: {
      message: 'No deben de existir ningun dato Nulo',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    startDate: {
      message: 'Fecha de Inicio debe ser valido',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    endDate: {
      message: 'Fecha de Fin debe ser valido',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    startDateMayorOrEqualTodayDate: {
      message: 'Fecha Inicio debe ser mayor o igual al día actual',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    startDateMaxThirtyDaysMayor: {
      message: 'Fecha Inicio debe ser como máximo 30 días mayor que el día actual',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    endDateMayorOrEqualTodayDate: {
      message: 'Fecha Fin debe ser mayor o igual al día actual',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    endDateMaxSixtyDaysMayor: {
      // message: 'Fecha Fin debe ser como máximo 60 días mayor que el día actual',
      message: 'Fecha Fin debe ser como máximo 90 días mayor que el día actual',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    endDateMayorOrEqualStartDate: {
      message: 'Fecha Inicio debe ser menor o igual a la Fecha Fin',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    existsSupervisors: {
      message: 'Que cada tienda tenga supervisores',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    existsPocNombre: {
      message: 'poc_nombre debe existir en la base de datos',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    vigenciaFechaInicio: {
      message: 'Vigencia Fecha Inicio debe ser valido',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    vigenciaFechaFin: {
      message: 'Vigencia Fecha Fin debe ser valido',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    vigenciaFechaFinMayorOrEqualVigenciaFechaInicio: {
      message: 'Vigencia Fecha Inicio debe ser menor o igual a la Vigencia Fecha Fin',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    empresaID: {
      message: 'EmpresaID puede ser BK o PE',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    tipoExhibicionHomologadoContraprestada: {
      message: 'TipoExhibicionHomologado no es valido',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    },
    fechaDeCarga: {
      message: 'Fecha de Carga debe ser valido',
      status: false,
      data: {
        dataArray: [],
        pageSize: 10,
        currentPage: 1,
        totalItems: 0
      }
    }
  };

  constructor(
    // private route: ActivatedRoute,
    private notification: NzNotificationService,
    // private message: NzMessageService,
    public exhibitionContraprestadaUploadService: ExhibitionContraprestadaUploadService,
    private utilService: UtilService,
    private pocService: PocService,
    private sharedService: SharedService
  ) {
    // this.selectPoc = this.utilService.getPocFromLocalStorage();
    this.selectUser = this.utilService.getUserFromLocalStorage();
  }

  async ngOnInit() {
    this.dataLoading();
    this.getTipoExhibicionHomologado();
  }

  async dataLoading() {
    this.isLoadingGeneric = true;
    this.pocService.getPocs().subscribe({
      next: (data) => {
        this.pocs = data;
        this.isLoadingGeneric = false;
      },
      error: (error) => {
        console.error('Error al obtener poc:', error);
        this.isLoadingGeneric = false;
      }
    });
  }

  async getTipoExhibicionHomologado() {
    try {
      const response = await this.sharedService.configurationValues(this.codigoValues);
      if (response.success) {
        this.dataTipoExhibicionHomologadoContraprestada = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.TIPO_EXHIBICION_HOMOLOGADO_CONTRAPRESTADA).valor.map((item: any) => item.value);
      }
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  selectors = {
    adicional: '#select-file-exhibicion-contraprestada',
  };
  setFixedToNumber(colum: any) {
    return parseFloat(colum).toLocaleString('en-US', {});
  }

  async onExcelFileSelected() {    
    const inputNode = document.querySelector('#select-file-exhibicion-contraprestada') as HTMLInputElement;
    const file = inputNode.files?.[0];
  
    if (!file) return;
  
    this.isLoadingGeneric = true;
    this.isUploadButtonDisabled = true;
    this.showAlert = false;
    this.isValidRowCount = true;
    this.isValidSheetCount = true;
    this.isValidHeaders = true;

    await this.isValid(file);
    this.isLoadingGeneric = false;
    this.showAlert = true;

    // this.isValidSheetCount

    if (this.isValidHeaders && this.isValidSheetCount && this.isValidRowCount) {
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
    } else if (!this.isValidRowCount) {
      this.alertType = 'error';
      this.alertMessage = 'El archivo excel tiene mas de 50000 registros';
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

  async onUploadFile() {
    const inputNode = document.querySelector('#select-file-exhibicion-contraprestada') as HTMLInputElement;
    console.log(inputNode);
    
    const file = inputNode.files?.[0];
    const fileName = file?.name;
    const fileExtension = fileName?.split('.').pop()
    // console.log(fileExtension);
    
    // if(fileExtension=='csv'){
    //   this.showAlert = false;
    //   this.isUploadButtonDisabled = true;
    //   this.selectedFileName = '';
    //   this.selectedFileSize = '';
    //   inputNode.value = '';
    //   this.createNotification('error', 'Archivo Adjunto', 'El archivo que está adjuntado no es valido archivos permitidos: .xlsx');
    //   return;
    // }
    if (this.isUploadButtonDisabled) return;
    // this.isLoadingGeneric = true;
    // this.exhibitionContraprestadaUploadService.insertManyExhibicionContraprestada(this.uploadRecords).subscribe({
    //   next: () => {
    //     this.showAlert = false;
    //     this.isUploadButtonDisabled = true;
    //     this.selectedFileName = '';
    //     this.selectedFileSize = '';
    //     inputNode.value = '';
    //     this.isSelectExcel = false;
    //     this.isLoadingGeneric = false;
    //     this.createNotification('success', 'Archivo subido', 'El archivo excel se subió correctamente');
    //   },
    //   error: (error) => {
    //     this.isLoadingGeneric = false;
    //     console.error('Error al crear:', error);
    //     this.createNotification('error', error?.error?.message, 'Ocurrió un error al subir el archivo excel');
    //   }
    // });
      
    if (!file) {
      this.createNotification('error', 'Archivo no seleccionado', 'Por favor, seleccione un archivo antes de intentar subirlo.');
      return;
    }

    this.isLoadingGeneric = true;
    try {
      const formData = new FormData();
      // const uuid = uuidv4();
      formData.append('file', file);
      // formData.append('uuid', uuidv4());
      formData.append('typeEntity','contraprestada');
      formData.append('entity','exhibicion');
      formData.append('usuario',JSON.stringify(this.selectUser));
      // formData.append('documento_sv',this.selectPoc?.documento_sv || '');
      // formData.append('documento_sv', String(this.selectPoc?.documento_sv) || '');
      // formData.append('nombre_sv',this.selectPoc?.nombre_sv || '');
      await this.exhibitionContraprestadaUploadService.uploadFileExcel(formData).then((res:any) => {
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
        // if (error?.status === 400) {
        //   if (error.error.validacion){
        //     this.existValidations=true;
        //     this.validations = error.error.validacion;
        //     console.log('validacion')
        //   } else if(error.error.duplicados){
        //     this.existDuplicates=true;
        //     this.duplicates = error.error.duplicados;            
        //   }
                              
        // } else{
          console.log('error-uploadExcelOrCsv', error.error);
          this.createNotification('error', error?.error?.message, 'Ocurrió un error al subir el archivo excel');
        // } 
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
    const inputNode = document.querySelector('#select-file-exhibicion-contraprestada') as HTMLInputElement;
    inputNode.value = '';
    this.isSelectExcel = false;
  }

  async isValid(file: File) {
    // this.validateRecordsInTheDatabase()
    // const data = await file.arrayBuffer();
    // const workbook = XLSX.read(data, { sheetRows: 1 });
    // let result = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 })[0] as string[];
    // const headers = result.map(header => header.trim());
    // const isValidHeaders = this.excelHeaders['exhibicion']['contraprestada'].every((header) => headers.includes(header));
    // if (!isValidHeaders) {
    //   return false;
    // }
    // // const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // // const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // const dataRows = rows.slice(1);  // Excluir la primera fila
  
    // // Mostrar todas las filas
    // console.log('rows',dataRows);
    const data = await file.arrayBuffer();
    // const workbook = XLSX.read(data);
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
    this.isValidHeaders = this.excelHeaders['exhibicion']['contraprestada'].every((header) => headers.includes(header));
    
    if (!this.isValidHeaders) {
      return;
    }
    const positionPocNombre = headers.indexOf('poc_nombre');
    const positionFechaInicio = headers.indexOf('fecha_inicio');
    const positionFechaFin = headers.indexOf('fecha_fin');
    const positionVigenciaFechaInicio = headers.indexOf('vigencia_fecha_inicio');
    const positionVigenciaFechaFin = headers.indexOf('vigencia_fecha_fin');
    this.existsColumnVigenciaFechaInicioAndVigenciaFechaFin = false;
    if (positionVigenciaFechaInicio != -1 && positionVigenciaFechaFin != -1) {
      this.existsColumnVigenciaFechaInicioAndVigenciaFechaFin = true;
    }
    const positionempresaID = headers.indexOf('empresa_id');
    const positionTipoExhibicionHomologado = headers.indexOf('tipo_exhibicion_homologado');
    const positionFechaDeCarga = headers.indexOf('fecha_de_carga');
    // const positionEmpresaId = headers.indexOf('empresa_id');
    // const positionZona = headers.indexOf('zona');
    // const positionTienda = headers.indexOf('tienda');
    // const positionCampania = headers.indexOf('campaña');
    // const positionMarca = headers.indexOf('marca');
    // const positionSkus = headers.indexOf('skus');
    // const positionVigente = headers.indexOf('vigente');
    // Obtener todas las filas de la primera hoja excluyendo la primera fila
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rows.slice(1);  // Excluir la primera fila
    const numeroRegistros = dataRows.length;
    if (numeroRegistros > 50000) {
      this.isValidRowCount = false;
      return; // No continuar si hay más de 50,000 filas
    }
    this.isValidRowCount = true;
  
    // Mostrar las filas
    // console.log(dataRows);
    // 13/06/24
    let fechaInicio;
    let fechaFin;
    let duplicates: string [] = [];

    let validateStatuError = {
      startDate: false,
      endDate: false,
      startDateMayorOrEqualTodayDate: false,
      startDateMaxThirtyDaysMayor: false,
      endDateMayorOrEqualTodayDate: false,
      endDateMaxSixtyDaysMayor: false,
      endDateMayorOrEqualStartDate: false,
      existsSupervisors: false,
      existsPocNombre: false
    }

    this.resetValidationsExcel();
    const columnMap = this.createColumnMap(headers);

    dataRows.forEach((row: any, index) => {
      let concatenateElements: string = '';
      row.forEach((element: any) => {
        concatenateElements += '-'+element;
      });
      duplicates.push(concatenateElements);

      if (this.hasEmptyFields(row, columnMap, this.excelHeaders['exhibicion']['contraprestada'])) {
        this.validationsExcel.emptyRows.status = true;
        this.validationsExcel.emptyRows.data.dataArray.push(`fila: ${index + 2} - existe un campo vacío`);
      }

      if (this.existsColumnVigenciaFechaInicioAndVigenciaFechaFin) {
        if (!(row[positionVigenciaFechaInicio] instanceof Date)) {
          this.validationsExcel.vigenciaFechaInicio.data.dataArray.push(`fila: ${index + 2} - ${row[positionVigenciaFechaInicio]}`);
          this.validationsExcel.vigenciaFechaInicio.status = true;
        }
        if (!(row[positionVigenciaFechaFin] instanceof Date)) {
          this.validationsExcel.vigenciaFechaFin.data.dataArray.push(`fila: ${index + 2} - ${row[positionVigenciaFechaFin]}`);
          this.validationsExcel.vigenciaFechaFin.status = true;
        }
        // if ((row[positionVigenciaFechaInicio] instanceof Date) && (row[positionVigenciaFechaFin] instanceof Date)) {
          if (!(row[positionVigenciaFechaInicio] <= row[positionVigenciaFechaFin])) {
            // console.log('mayor o igual a fechaInicio');
            this.validationsExcel.vigenciaFechaFinMayorOrEqualVigenciaFechaInicio.data.dataArray.push(`fila: ${index + 2} - fecha Inicio: ${(row[positionVigenciaFechaInicio] instanceof Date) ? format(row[positionVigenciaFechaInicio], 'dd/MM/yyyy') : row[positionVigenciaFechaInicio]}`);
            this.validationsExcel.vigenciaFechaFinMayorOrEqualVigenciaFechaInicio.status = true;
          }
        // }
      }

      if(!(row[positionFechaDeCarga] instanceof Date)) {
        this.validationsExcel.fechaDeCarga.data.dataArray.push(`fila: ${index + 2} - ${row[positionFechaDeCarga]}`);
          this.validationsExcel.fechaDeCarga.status = true;
      }

      if (!(row[positionempresaID] === 'BK' || row[positionempresaID] === 'PE')) {
        this.validationsExcel.empresaID.data.dataArray.push(`fila: ${index + 2} - ${row[positionempresaID]}`);
        this.validationsExcel.empresaID.status = true;
      }
      
      if (!this.dataTipoExhibicionHomologadoContraprestada.includes(row[positionTipoExhibicionHomologado])) {
        this.validationsExcel.tipoExhibicionHomologadoContraprestada.data.dataArray.push(`fila: ${index + 2} - ${row[positionTipoExhibicionHomologado]}`);
        this.validationsExcel.tipoExhibicionHomologadoContraprestada.status = true;
      }

      fechaInicio = row[positionFechaInicio];
      // console.log('fechaInicio', fechaInicio)
      if (fechaInicio) {
        // let parsedDate;
        if (fechaInicio instanceof Date) {
          fechaInicio.setHours(0, 0, 0, 0);
        } else {
          // parsedDate = parse(fechaInicio.trim(), 'dd/MM/yyyy', new Date());
          // if (isValid(parsedDate)) {
          //   fechaInicio = parsedDate;
          // } else {
            validateStatuError.startDate = true;
            this.validationsExcel.startDate.data.dataArray.push(`fila: ${index + 2} - ${row[positionFechaInicio]}`);
          // }
        }
      }

      fechaFin = row[positionFechaFin];
      if (fechaFin) {
        // let parsedDate;
        // console.log('fechaFin', fechaFin)
        if (fechaFin instanceof Date) {
          fechaFin.setHours(0, 0, 0, 0);
        } else {
          // parsedDate = parse(fechaFin.trim(), 'dd/MM/yyyy', new Date());
          // if (isValid(parsedDate)) {
          //   fechaFin = parsedDate;
          // } else {
            validateStatuError.endDate = true;
            this.validationsExcel.endDate.data.dataArray.push(`fila: ${index + 2} - ${row[positionFechaFin]}`);
          // }
        }
      }

      // Formatear la fecha actual como "yyyy-MM-dd"
      const formattedTodayDate = format(new Date(), "yyyy-MM-dd");
      // Crear una nueva fecha con el formato "yyyy-MM-ddT00:00:00"
      const localTodayDate = new Date(`${formattedTodayDate}T00:00:00`);

      if (!(fechaInicio >= localTodayDate)) { 
        // console.log('fechaFin Maryor Igual', fechaFin)
        validateStatuError.startDateMayorOrEqualTodayDate = true;
        this.validationsExcel.startDateMayorOrEqualTodayDate.data.dataArray.push(`fila: ${index + 2} - ${ (row[positionFechaInicio] instanceof Date) ? format(row[positionFechaInicio], 'dd/MM/yyyy') : row[positionFechaInicio] }`);
      }

      // Calcular la fecha máxima permitida (30 días después de la fecha actual)
      const maxDateFechaInicio = addDays(localTodayDate, 30);
      // Comparar fechaInicio con la fecha máxima permitida
      if (!(fechaInicio <= maxDateFechaInicio)) {
        // console.log('fechaInicio es válida y está dentro de los 30 días');
        validateStatuError.startDateMaxThirtyDaysMayor = true;
        this.validationsExcel.startDateMaxThirtyDaysMayor.data.dataArray.push(`fila: ${index + 2} - ${(row[positionFechaInicio] instanceof Date) ? format(row[positionFechaInicio], 'dd/MM/yyyy') : row[positionFechaInicio]}`);
      }

      if (!(fechaFin >= localTodayDate)) { 
        // console.log('fechaFin Maryor Igual', fechaFin)
        validateStatuError.endDateMayorOrEqualTodayDate = true;
        this.validationsExcel.endDateMayorOrEqualTodayDate.data.dataArray.push(`fila: ${index + 2} - ${(row[positionFechaFin] instanceof Date) ? format(row[positionFechaFin], 'dd/MM/yyyy') : row[positionFechaFin]}`);
      }

      // const maxDateFechaFin = addDays(localTodayDate, 60);
      const maxDateFechaFin = addDays(localTodayDate, 90);
      // Comparar fechaInicio con la fecha máxima permitida
      if (!(fechaFin <= maxDateFechaFin)) {
        // console.log('fechaFin es válida y está dentro de los 60 días');
        validateStatuError.endDateMaxSixtyDaysMayor = true;
        this.validationsExcel.endDateMaxSixtyDaysMayor.data.dataArray.push(`fila: ${index + 2} - ${(row[positionFechaFin] instanceof Date) ? format(row[positionFechaFin], 'dd/MM/yyyy') : row[positionFechaFin]}`);
      }

      if (!(fechaInicio <= fechaFin)) {
        // console.log('mayor o igual a fechaInicio');
        validateStatuError.endDateMayorOrEqualStartDate = true;
        this.validationsExcel.endDateMayorOrEqualStartDate.data.dataArray.push(`fila: ${index + 2} - fecha Inicio: ${(row[positionFechaInicio] instanceof Date) ? format(row[positionFechaInicio], 'dd/MM/yyyy') : row[positionFechaInicio]}`);
      }

      const poc = this.pocs.find((poc) => poc.nombre === row[positionPocNombre]);
      if (poc) {
        if (!(poc.documento_sv || poc.nombre_sv)) {
          this.validationsExcel.existsSupervisors.status = true;
          this.validationsExcel.existsSupervisors.data.dataArray.push(`${[row[positionPocNombre]]}`);
        }
      } else {
        this.validationsExcel.existsPocNombre.status = true;
        this.validationsExcel.existsPocNombre.data.dataArray.push(`${[row[positionPocNombre]]}`);
      }
    });

    if (this.hasDuplicates(duplicates)) this.validationsExcel.duplicates.status = true;

    this.validationsExcel.emptyRows.data.totalItems = this.validationsExcel.emptyRows.data.dataArray.length;
    this.validationsExcel.vigenciaFechaInicio.data.totalItems = this.validationsExcel.vigenciaFechaInicio.data.dataArray.length;
    this.validationsExcel.vigenciaFechaFin.data.totalItems = this.validationsExcel.vigenciaFechaFin.data.dataArray.length;
    this.validationsExcel.vigenciaFechaFinMayorOrEqualVigenciaFechaInicio.data.totalItems = this.validationsExcel.vigenciaFechaFinMayorOrEqualVigenciaFechaInicio.data.dataArray.length;
    this.validationsExcel.empresaID.data.totalItems = this.validationsExcel.empresaID.data.dataArray.length;
    this.validationsExcel.tipoExhibicionHomologadoContraprestada.data.totalItems = this.validationsExcel.tipoExhibicionHomologadoContraprestada.data.dataArray.length;
    this.validationsExcel.fechaDeCarga.data.totalItems = this.validationsExcel.fechaDeCarga.data.dataArray.length;

    if (validateStatuError.startDate) this.validationsExcel.startDate.status = true;
    this.validationsExcel.startDate.data.totalItems = this.validationsExcel.startDate.data.dataArray.length;
    
    if (validateStatuError.endDate) this.validationsExcel.endDate.status = true;
    this.validationsExcel.endDate.data.totalItems = this.validationsExcel.endDate.data.dataArray.length;
    
    if (validateStatuError.startDateMayorOrEqualTodayDate) this.validationsExcel.startDateMayorOrEqualTodayDate.status = true;
    this.validationsExcel.startDateMayorOrEqualTodayDate.data.totalItems = this.validationsExcel.startDateMayorOrEqualTodayDate.data.dataArray.length;
    
    if (validateStatuError.startDateMaxThirtyDaysMayor) this.validationsExcel.startDateMaxThirtyDaysMayor.status = true;
    this.validationsExcel.startDateMaxThirtyDaysMayor.data.totalItems = this.validationsExcel.startDateMaxThirtyDaysMayor.data.dataArray.length;

    if (validateStatuError.endDateMayorOrEqualTodayDate) this.validationsExcel.endDateMayorOrEqualTodayDate.status = true;
    this.validationsExcel.endDateMayorOrEqualTodayDate.data.totalItems = this.validationsExcel.endDateMayorOrEqualTodayDate.data.dataArray.length;
    
    if (validateStatuError.endDateMaxSixtyDaysMayor) this.validationsExcel.endDateMaxSixtyDaysMayor.status = true;
    this.validationsExcel.endDateMaxSixtyDaysMayor.data.totalItems = this.validationsExcel.endDateMaxSixtyDaysMayor.data.dataArray.length;
    
    if (validateStatuError.endDateMayorOrEqualStartDate) this.validationsExcel.endDateMayorOrEqualStartDate.status = true;
    this.validationsExcel.endDateMayorOrEqualStartDate.data.totalItems = this.validationsExcel.endDateMayorOrEqualStartDate.data.dataArray.length;
    
    this.validationsExcel.existsPocNombre.data.dataArray = this.removeDuplicates(this.validationsExcel.existsPocNombre.data.dataArray);
    this.validationsExcel.existsPocNombre.data.dataArray = this.validationsExcel.existsPocNombre.data.dataArray.sort();
    this.validationsExcel.existsPocNombre.data.totalItems = this.validationsExcel.existsPocNombre.data.dataArray.length;

    this.validationsExcel.existsSupervisors.data.dataArray = this.removeDuplicates(this.validationsExcel.existsSupervisors.data.dataArray);
    this.validationsExcel.existsSupervisors.data.dataArray = this.validationsExcel.existsSupervisors.data.dataArray.sort();
    this.validationsExcel.existsSupervisors.data.totalItems = this.validationsExcel.existsSupervisors.data.dataArray.length;

    if (!this.validationsExcel.startDate.status && !this.validationsExcel.endDate.status) {
      this.validationsExcel.validateRecordsDatabase.validDates = true;
      const formData = new FormData();
      formData.append('file', file);
      await this.exhibitionContraprestadaUploadService.validateRecordsInTheDatabase(formData).then((res:any) => {
        this.validationsExcel.validateRecordsDatabase.verifyCorrectlyDatabase = true;
        this.validationsExcel.validateRecordsDatabase.data.dataArray = res.data.map((item: any) => (
          `empresa_id:${item.empresa_id} poc_nombre:${item.poc_nombre} campaña:${item.campaña} fecha_inicio:${item.fecha_inicio} fecha_fin:${item.fecha_fin} marca:${item.marca} skus:${item.skus} tienda:${item.tienda} tipo_exhibicion:${item.tipo_exhibicion}, tipo_exhibicion_homologado:${item.tipo_exhibicion_homologado}, correlativo:${item.correlativo}, zona:${item.zona}`
        ));
        this.validationsExcel.validateRecordsDatabase.data.totalItems = this.validationsExcel.validateRecordsDatabase.data.dataArray.length;
        if (res.data.length == 0) {
          this.validationsExcel.validateRecordsDatabase.status = false;
        } else {
          this.validationsExcel.validateRecordsDatabase.status = true;
        }
      })
      .catch((error) => {      
          console.log('error al verificar duplicados', error.error);
          this.validationsExcel.validateRecordsDatabase.status = true;
          this.validationsExcel.validateRecordsDatabase.verifyCorrectlyDatabase = false;
          // this.createNotification('error', error?.error?.message, 'Ocurrió un error al subir el archivo excel');
      });
    } else {
      this.validationsExcel.validateRecordsDatabase.validDates = false;
    }

    this.isUploadButtonDisabled = this.isAnyValidationTrue(this.validationsExcel);
  }

  hasDuplicates(array: string []) {
    return new Set(array).size !== array.length;
  }

  createNotification(type: string, title: string, description: string): void {
    this.notification.create(type, title, description);
  }

  onPageIndexChange(page: number, typeValidation: string): void {
    if (typeValidation === 'emptyRows') {
      this.validationsExcel.emptyRows.data.currentPage = page;
    } else if (typeValidation === 'vigenciaFechaInicio') {
      this.validationsExcel.vigenciaFechaInicio.data.currentPage = page;
    } else if (typeValidation === 'vigenciaFechaFin') {
      this.validationsExcel.vigenciaFechaFin.data.currentPage = page;
    } else if (typeValidation ==='vigenciaFechaFinMayorOrEqualVigenciaFechaInicio') {
      this.validationsExcel.vigenciaFechaFinMayorOrEqualVigenciaFechaInicio.data.currentPage = page;
    } else if(typeValidation === 'fechaDeCarga') {
      this.validationsExcel.fechaDeCarga.data.currentPage = page;
    } else if (typeValidation === 'empresaID') {
      this.validationsExcel.empresaID.data.currentPage = page;
    } else if (typeValidation === 'tipoExhibicionHomologadoContraprestada') {
      this.validationsExcel.tipoExhibicionHomologadoContraprestada.data.currentPage = page;
    } else if (typeValidation === 'startDate') {
      this.validationsExcel.startDate.data.currentPage = page;
    } else if (typeValidation === 'endDate') {
      this.validationsExcel.endDate.data.currentPage = page;
    } else if (typeValidation === 'startDateMayorOrEqualTodayDate') {
      this.validationsExcel.startDateMayorOrEqualTodayDate.data.currentPage = page;
    } else if (typeValidation === 'startDateMaxThirtyDaysMayor') {
      this.validationsExcel.startDateMaxThirtyDaysMayor.data.currentPage = page;
    } else if (typeValidation === 'endDateMayorOrEqualTodayDate') {
      this.validationsExcel.endDateMayorOrEqualTodayDate.data.currentPage = page;
    } else if (typeValidation === 'endDateMaxSixtyDaysMayor') {
      this.validationsExcel.endDateMaxSixtyDaysMayor.data.currentPage = page;
    } else if (typeValidation === 'endDateMayorOrEqualStartDate') {
      this.validationsExcel.endDateMayorOrEqualStartDate.data.currentPage = page;
    } else if (typeValidation === 'existsPocNombre') {
      this.validationsExcel.existsPocNombre.data.currentPage = page;
    } else if (typeValidation === 'existsSupervisors') {
      this.validationsExcel.existsSupervisors.data.currentPage = page;
    } else if (typeValidation === 'validateRecordsDatabase') {
      this.validationsExcel.validateRecordsDatabase.data.currentPage = page;
    }
  }

  onPageSizeChange(pageSize: number, typeValidation: string): void {
    if (typeValidation === 'emptyRows') {
      this.validationsExcel.emptyRows.data.pageSize = pageSize;
    } else if (typeValidation === 'vigenciaFechaInicio') {
      this.validationsExcel.vigenciaFechaInicio.data.pageSize = pageSize;
    } else if (typeValidation === 'vigenciaFechaFin') {
      this.validationsExcel.vigenciaFechaFin.data.pageSize = pageSize;
    } else if (typeValidation === 'vigenciaFechaFinMayorOrEqualVigenciaFechaInicio') {
      this.validationsExcel.vigenciaFechaFinMayorOrEqualVigenciaFechaInicio.data.pageSize = pageSize;
    } else if (typeValidation === 'fechaDeCarga') {
      this.validationsExcel.fechaDeCarga.data.pageSize = pageSize;
    } else if (typeValidation === 'empresaID') {
      this.validationsExcel.empresaID.data.pageSize = pageSize;
    } else if (typeValidation === 'tipoExhibicionHomologadoContraprestada') {
      this.validationsExcel.tipoExhibicionHomologadoContraprestada.data.pageSize = pageSize;
    } else if (typeValidation === 'startDate') {
      this.validationsExcel.startDate.data.pageSize = pageSize;
    } else if (typeValidation === 'endDate') {
      this.validationsExcel.endDate.data.pageSize = pageSize;
    } else if (typeValidation === 'startDateMayorOrEqualTodayDate') {
      this.validationsExcel.startDateMayorOrEqualTodayDate.data.pageSize = pageSize;
    } else if (typeValidation === 'startDateMaxThirtyDaysMayor') {
      this.validationsExcel.startDateMaxThirtyDaysMayor.data.pageSize = pageSize;
    } else if (typeValidation === 'endDateMayorOrEqualTodayDate') {
      this.validationsExcel.endDateMayorOrEqualTodayDate.data.pageSize = pageSize;
    } else if (typeValidation === 'endDateMaxSixtyDaysMayor') {
      this.validationsExcel.endDateMaxSixtyDaysMayor.data.pageSize = pageSize;
    } else if (typeValidation === 'endDateMayorOrEqualStartDate') {
      this.validationsExcel.endDateMayorOrEqualStartDate.data.pageSize = pageSize;
    } else if (typeValidation === 'existsPocNombre') {
      this.validationsExcel.existsPocNombre.data.pageSize = pageSize;
    } else if (typeValidation === 'existsSupervisors') {
      this.validationsExcel.existsSupervisors.data.pageSize = pageSize;
    } else if (typeValidation === 'validateRecordsDatabase') {
      this.validationsExcel.validateRecordsDatabase.data.pageSize = pageSize;
    }
  }
  isAnyValidationTrue(validations: any): boolean {
    for (const key in validations) {
      if (validations[key].status) {
        return true;
      }
    }
    return false;
  }
  // Función para crear el mapa de columnas
  createColumnMap(headers: string[]): ColumnMap {
    const map: ColumnMap = {};
    headers.forEach((header, index) => {
      map[header.trim().toLowerCase()] = index;
    });
    return map;
  }
  // Función para verificar si una fila tiene campos vacíos
  hasEmptyFields(row: any[], columnMap: ColumnMap, requiredFields: string[]): boolean {
    return requiredFields.some(field => {
      const index = columnMap[field.toLowerCase()];
      return index === undefined || row[index] === undefined || row[index] === null || row[index] === '';
    });
  }
  removeDuplicates(array: any) {
    return Array.from(new Set(array));
  }
  resetValidationsExcel() {
    this.validationsExcel.duplicates.status = false;
    this.validationsExcel.validateRecordsDatabase.status = false;
    this.validationsExcel.validateRecordsDatabase.verifyCorrectlyDatabase = true;
    this.validationsExcel.validateRecordsDatabase.validDates = true;
    this.validationsExcel.validateRecordsDatabase.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.emptyRows.status = false;
    this.validationsExcel.emptyRows.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.vigenciaFechaInicio.status = false;
    this.validationsExcel.vigenciaFechaInicio.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.vigenciaFechaFin.status = false;
    this.validationsExcel.vigenciaFechaFin.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.vigenciaFechaFinMayorOrEqualVigenciaFechaInicio.status = false;
    this.validationsExcel.vigenciaFechaFinMayorOrEqualVigenciaFechaInicio.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.fechaDeCarga.status = false;
    this.validationsExcel.fechaDeCarga.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.empresaID.status = false;
    this.validationsExcel.empresaID.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.tipoExhibicionHomologadoContraprestada.status = false;
    this.validationsExcel.tipoExhibicionHomologadoContraprestada.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.startDate.status = false;
    this.validationsExcel.startDate.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.endDate.status = false;
    this.validationsExcel.endDate.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.startDateMayorOrEqualTodayDate.status = false;
    this.validationsExcel.startDateMayorOrEqualTodayDate.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.startDateMaxThirtyDaysMayor.status = false;
    this.validationsExcel.startDateMaxThirtyDaysMayor.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.endDateMayorOrEqualTodayDate.status = false;
    this.validationsExcel.endDateMayorOrEqualTodayDate.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.endDateMaxSixtyDaysMayor.status = false;
    this.validationsExcel.endDateMaxSixtyDaysMayor.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.endDateMayorOrEqualStartDate.status = false;
    this.validationsExcel.endDateMayorOrEqualStartDate.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.existsSupervisors.status = false;
    this.validationsExcel.existsSupervisors.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
    this.validationsExcel.existsPocNombre.status = false;
    this.validationsExcel.existsPocNombre.data = {
      dataArray: [],
      pageSize: 10,
      currentPage: 1,
      totalItems: 0
    };
  }
}