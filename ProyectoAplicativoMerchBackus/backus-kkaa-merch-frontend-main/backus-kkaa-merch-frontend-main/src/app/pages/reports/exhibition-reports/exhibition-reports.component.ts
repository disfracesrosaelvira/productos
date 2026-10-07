import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
// import { NzModalService } from 'ng-zorro-antd/modal';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzCarouselComponent, NzCarouselModule } from 'ng-zorro-antd/carousel';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { saveAs } from 'file-saver';
import { UploadService } from '../../../shared/services/upload.service';
import { IExhibicionAdicional, IValidacion } from '../../dto/exhibicionAdicional.dto';
import { IExhibicionCompetencia } from '../../dto/exhibicionCompetencia.dto';
import { IExhibicionContraprestada } from '../../dto/exhibicionContraprestada.dto';
import { CustomDatePipe } from '../../../shared/pipes/custom-date.pipe';
import { ExhibitionReportsService } from './exhibition-reports.service';
import { FrenteReportsService } from '../frente-reports/frente-reports.service';
import Constantes from '../../../shared/constants/contants';
import { SelectDatePickerComponent } from '../../../shared/components/select-date-picker/select-date-picker.component';
import { format } from 'date-fns';
import { DateService } from '@shared/services/date.service';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { FilterTableCommercialEstructureReportsComponent } from '@shared/components/filter-table-commercial-estructure-reports/filter-table-commercial-estructure-reports.component';

@Component({
  selector: 'app-exhibition-reports',
  standalone: true,
  imports: [CommonModule, SpinnerLoadingComponent, FilterTableCommercialEstructureReportsComponent, CustomDatePipe,SelectDatePickerComponent, NzModalModule, NzTableModule, NzButtonModule, NzPaginationModule, NzAvatarModule, NzLayoutModule, NzIconModule,NzTypographyModule, NzImageModule, NzCollapseModule, NzPopoverModule, NzCarouselModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './exhibition-reports.component.html',
  styleUrl: './exhibition-reports.component.scss'
})
export class ExhibitionReportsComponent {
  user: any = localStorage.getItem('user');
  user_id = this.user ? JSON.parse(this.user).userId : '0';
  aditionalExhibitionData: IExhibicionAdicional[] = [];
  competenceExhibitionData: IExhibicionCompetencia[] = [];
  contraExhibitionData: IExhibicionContraprestada[] = [];
  loadingAditionalExhibition: boolean = false;
  loadingCompetenceExhibition: boolean = false;
  loadingContraExhibition: boolean = false;
  aditionalExhibitionPageIndex: number = 1;
  aditionalExhibitionPageSize: number = 7;
  aditionalExhibitionTotal: number = 0;
  competenceExhibitionPageIndex: number = 1;
  competenceExhibitionPageSize: number = 7;
  competenceExhibitionTotal: number = 0;
  contraExhibitionPageIndex: number = 1;
  contraExhibitionPageSize: number = 7;
  contraExhibitionTotal: number = 0;

  isPopoverVisibleAdicional = false;
  isPopoverVisibleCompetencia = false;
  isPopoverVisibleContraprestada = false;
  filterDateAdicionales:any={startOfMonth:new Date(new Date().getFullYear(), new Date().getMonth(), 1), endOfMonth: new Date()};
  filterDateCompetencia:any={startOfMonth:new Date(new Date().getFullYear(), new Date().getMonth(), 1), endOfMonth: new Date()};
  filterDateContraprestada:any={startOfMonth:new Date(new Date().getFullYear(), new Date().getMonth(), 1), endOfMonth: new Date()};
  
  isLoadingExportExcel: boolean = false;
  isVisibleModalValidaciones = false;
  imagenSeleccionado: string = '';
  validacionExhibicionModal: any = {};

  columnFilters: any = {
    adicional: { poc: [], nombre: [], cadena: [] },
    competencia: { poc: [], nombre: [], cadena: [] },
    contraprestada: { poc: [], nombre: [], cadena: [] },
  }

  filtersExhibiciones: any = {
    adicional: { "poc.poc": { data: [], isRemoveFilter: true }, "poc.nombre": { data: [], isRemoveFilter: true }, "poc.cadena": { data: [], isRemoveFilter: true } },
    competencia: { "poc.poc": { data: [], isRemoveFilter: true }, "poc.nombre": { data: [], isRemoveFilter: true }, "poc.cadena": { data: [], isRemoveFilter: true } },
    contraprestada: { "poc.poc": { data: [], isRemoveFilter: true }, "poc.nombre": { data: [], isRemoveFilter: true }, "poc.cadena": { data: [], isRemoveFilter: true } }
  }
  panelAdicionalAbierto: boolean = false;
  panelCompetenciaAbierto: boolean = false;
  panelContraprestadaAbierto: boolean = false;  

  angle = 0;
  imagePositionSelected: number = 1; // Para guardar el índice seleccionado
  @ViewChild(NzCarouselComponent) carousel!: NzCarouselComponent;
  
  constructor(
    private router: Router,
    private exhibitionReportsService: ExhibitionReportsService,private frenteReportsService:FrenteReportsService,
    private uploadService: UploadService,
    // private modal: NzModalService,
    private dateService: DateService,
    private nzImageService: NzImageService,
  ) { }

  async ngOnInit() {}

  loadFiltersAdicional() {
    this.isLoadingExportExcel = true;
    const startOfMonth =  format(new Date(this.filterDateAdicionales.startOfMonth), "yyyy-MM-dd") + "T00:00:00Z";
    const endOfMonth = format(new Date(this.filterDateAdicionales.endOfMonth), "yyyy-MM-dd") + "T23:59:59Z";
    this.exhibitionReportsService.getFiltersAdicional(startOfMonth, endOfMonth).subscribe({
      next: (filters) => {
        this.columnFilters.adicional.poc = filters.poc.map((item: string) => ({ text: ''+item, value: ''+item, selected: false }));
        this.columnFilters.adicional.nombre = filters.nombre.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.adicional.cadena = filters.cadena.map((item: string) => ({ text: item, value: item, selected: false }));     
        this.isLoadingExportExcel = false;
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
        this.isLoadingExportExcel = false;
      }
    });
  }

  loadFiltersCompetencia() {
    this.isLoadingExportExcel = true;
    const startOfMonth =  format(new Date(this.filterDateCompetencia.startOfMonth), "yyyy-MM-dd") + "T00:00:00Z";
    const endOfMonth = format(new Date(this.filterDateCompetencia.endOfMonth), "yyyy-MM-dd") + "T23:59:59Z";
    this.exhibitionReportsService.getFiltersCompetencia(startOfMonth, endOfMonth).subscribe({
      next: (filters) => {
        this.columnFilters.competencia.poc = filters.poc.map((item: string) => ({ text: ''+item, value: ''+item, selected: false }));
        this.columnFilters.competencia.nombre = filters.nombre.map((item: string) => ({ text: item, value: item, selected: false })); 
        this.columnFilters.competencia.cadena = filters.cadena.map((item: string) => ({ text: item, value: item, selected: false }));
        this.isLoadingExportExcel = false;
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
        this.isLoadingExportExcel = false;
      }
    });
  }

  loadFiltersContraprestada() {
    this.isLoadingExportExcel = true;
    const startOfMonth =  format(new Date(this.filterDateContraprestada.startOfMonth), "yyyy-MM-dd") + "T00:00:00Z";
    const endOfMonth = format(new Date(this.filterDateContraprestada.endOfMonth), "yyyy-MM-dd") + "T23:59:59Z";
    this.exhibitionReportsService.getFiltersContraprestada(startOfMonth, endOfMonth).subscribe({
      next: (filters) => {
        this.columnFilters.contraprestada.poc = filters.poc.map((item: string) => ({ text: ''+item, value: ''+item, selected: false }));
        this.columnFilters.contraprestada.nombre = filters.nombre.map((item: string) => ({ text: item, value: item, selected: false }));
        this.columnFilters.contraprestada.cadena = filters.cadena.map((item: string) => ({ text: item, value: item, selected: false }));  
        this.isLoadingExportExcel = false;
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
        this.isLoadingExportExcel = false;
      }
    });
  }

  async handleFilterAdicional({ selectedFilterItems, filterItems, isRemoveFilter }: any, column: string) {
    if(column === 'poc') {
      this.filtersExhibiciones.adicional["poc.poc"].data = selectedFilterItems;
      this.filtersExhibiciones.adicional["poc.poc"].isRemoveFilter = isRemoveFilter;
    } else if (column === 'nombre') {      
      this.filtersExhibiciones.adicional["poc.nombre"].data = selectedFilterItems;
      this.filtersExhibiciones.adicional["poc.nombre"].isRemoveFilter = isRemoveFilter;
    } else if (column === 'cadena') {
      this.filtersExhibiciones.adicional["poc.cadena"].data = selectedFilterItems;
      this.filtersExhibiciones.adicional["poc.cadena"].isRemoveFilter = isRemoveFilter;
    }
    this.loadAditionalExhibition();
  }

  async handleFilterCompetencia({ selectedFilterItems, filterItems, isRemoveFilter }: any, column: string) {
    if(column === 'poc') {
      this.filtersExhibiciones.competencia["poc.poc"].data = selectedFilterItems;
      this.filtersExhibiciones.competencia["poc.poc"].isRemoveFilter = isRemoveFilter;
    } else if (column === 'nombre') {      
      this.filtersExhibiciones.competencia["poc.nombre"].data = selectedFilterItems;
      this.filtersExhibiciones.competencia["poc.nombre"].isRemoveFilter = isRemoveFilter;
    } else if (column === 'cadena') {
      this.filtersExhibiciones.competencia["poc.cadena"].data = selectedFilterItems;
      this.filtersExhibiciones.competencia["poc.cadena"].isRemoveFilter = isRemoveFilter;
    }
    this.loadCompetenceExhibition();
  }

  async handleFilterContraprestada({ selectedFilterItems, filterItems, isRemoveFilter }: any, column: string) {
    if(column === 'poc') {
      this.filtersExhibiciones.contraprestada["poc.poc"].data = selectedFilterItems;
      this.filtersExhibiciones.contraprestada["poc.poc"].isRemoveFilter = isRemoveFilter;
    } else if (column === 'nombre') {      
      this.filtersExhibiciones.contraprestada["poc.nombre"].data = selectedFilterItems;
      this.filtersExhibiciones.contraprestada["poc.nombre"].isRemoveFilter = isRemoveFilter;
    } else if (column === 'cadena') {
      this.filtersExhibiciones.contraprestada["poc.cadena"].data = selectedFilterItems;
      this.filtersExhibiciones.contraprestada["poc.cadena"].isRemoveFilter = isRemoveFilter;
    }
    this.loadContraExhibition();
  }
  
  columns(max: number): any[] {
    return new Array(max);
  }

  async loadAditionalExhibition() {
    try {
      this.loadingAditionalExhibition = true;
      const empresa_id = '';
      const startOfMonth =  format(new Date(this.filterDateAdicionales.startOfMonth), "yyyy-MM-dd") + "T00:00:00Z";
      const endOfMonth = format(new Date(this.filterDateAdicionales.endOfMonth), "yyyy-MM-dd") + "T23:59:59Z";
      let filters = [];
      for (const key in this.filtersExhibiciones.adicional) {
        if (!this.filtersExhibiciones.adicional[key].isRemoveFilter && this.filtersExhibiciones.adicional[key].data.length != 0) {
          if (key == "poc.poc") {
            filters.push({ key, values: this.filtersExhibiciones.adicional[key].data.map((item:number) => +item)});
          } else {
            filters.push({ key, values: this.filtersExhibiciones.adicional[key].data});
          }
        }
      }
      const aditionalExhibitionList = await this.exhibitionReportsService.getAditionalExhibition(empresa_id, 
        this.aditionalExhibitionPageIndex,this.aditionalExhibitionPageSize,startOfMonth,endOfMonth,this.user_id, filters
        );
      this.aditionalExhibitionData = aditionalExhibitionList.docs;
      this.aditionalExhibitionTotal = aditionalExhibitionList.totalDocs;
      this.loadingAditionalExhibition = false;
    } catch (error) {
      this.loadingAditionalExhibition = false;
      console.error('Error al cargar los datos:', error);
    }
  }
  async loadCompetenceExhibition() {
    try {
      this.loadingCompetenceExhibition = true;
      const empresa_id = '';
      // const endOfMonth= format(new Date(this.filterDateCompetencia.endOfMonth),"yyyy-MM-dd");
      // const startOfMonth= format(new Date(this.filterDateCompetencia.startOfMonth), "yyyy-MM-dd");
      const startOfMonth =  format(new Date(this.filterDateCompetencia.startOfMonth), "yyyy-MM-dd") + "T00:00:00Z";
      const endOfMonth = format(new Date(this.filterDateCompetencia.endOfMonth), "yyyy-MM-dd") + "T23:59:59Z";
      let filters = [];
      for (const key in this.filtersExhibiciones.competencia) {
        if (!this.filtersExhibiciones.competencia[key].isRemoveFilter && this.filtersExhibiciones.competencia[key].data.length != 0) {
          if (key == "poc.poc") {
            filters.push({ key, values: this.filtersExhibiciones.competencia[key].data.map((item:number) => +item)});
          } else {
            filters.push({ key, values: this.filtersExhibiciones.competencia[key].data});
          }
        }
      }
      const competenceExhibitionList = await this.exhibitionReportsService.getCompetenceExhibition(empresa_id, this.competenceExhibitionPageIndex, this.competenceExhibitionPageSize,startOfMonth,endOfMonth,this.user_id, filters);
      this.competenceExhibitionData = competenceExhibitionList.docs;
      this.competenceExhibitionTotal = competenceExhibitionList.totalDocs;
      this.loadingCompetenceExhibition = false;
    } catch (error) {
      this.loadingCompetenceExhibition = false;
      console.error('Error al cargar los datos:', error);
    }
  }
  async loadContraExhibition() {
    try {
      this.loadingContraExhibition = true;
      const empresa_id = '';
      // const endOfMonth= format(new Date(this.filterDateContraprestada.endOfMonth), "yyyy-MM-dd");
      // const startOfMonth= format(new Date(this.filterDateContraprestada.startOfMonth),"yyyy-MM-dd");
      const startOfMonth =  format(new Date(this.filterDateContraprestada.startOfMonth), "yyyy-MM-dd") + "T00:00:00Z";
      const endOfMonth = format(new Date(this.filterDateContraprestada.endOfMonth), "yyyy-MM-dd") + "T23:59:59Z";
      let filters = [];
      for (const key in this.filtersExhibiciones.contraprestada) {
        if (!this.filtersExhibiciones.contraprestada[key].isRemoveFilter && this.filtersExhibiciones.contraprestada[key].data.length != 0) {
          if (key == "poc.poc") {
            filters.push({ key, values: this.filtersExhibiciones.contraprestada[key].data.map((item:number) => +item)});
          } else {
            filters.push({ key, values: this.filtersExhibiciones.contraprestada[key].data});
          }
        }
      }
      const contraExhibitionList = await this.exhibitionReportsService.getContraExhibition(empresa_id, this.contraExhibitionPageIndex, this.contraExhibitionPageSize,startOfMonth,endOfMonth, this.user_id, filters);
      this.contraExhibitionData = contraExhibitionList.docs;
      this.contraExhibitionTotal = contraExhibitionList.totalDocs;
      this.loadingContraExhibition = false;
    } catch (error) {
      this.loadingContraExhibition = false;
      console.error('Error al cargar los datos:', error);
    }
  }

  handleAditionalExhibition(pageIndex: number) {
    this.aditionalExhibitionPageIndex = pageIndex;
    this.loadAditionalExhibition();
  }

  handleCompetenceExhibition(pageIndex: number) {
    this.competenceExhibitionPageIndex = pageIndex;
    this.loadCompetenceExhibition();
  }

  handleContraExhibition(pageIndex: number) {
    this.contraExhibitionPageIndex = pageIndex;
    this.loadContraExhibition();
  }

  exportExcelAdicionales(): void {
    this.isLoadingExportExcel = true;
    const startOfMonth =  format(new Date(this.filterDateAdicionales.startOfMonth), "yyyy-MM-dd") + "T00:00:00Z";
    const endOfMonth = format(new Date(this.filterDateAdicionales.endOfMonth), "yyyy-MM-dd") + "T23:59:59Z";
    let filters = [];
    for (const key in this.filtersExhibiciones.adicional) {
      if (!this.filtersExhibiciones.adicional[key].isRemoveFilter && this.filtersExhibiciones.adicional[key].data.length != 0) {
        if (key == "poc.poc") {
          filters.push({ key, values: this.filtersExhibiciones.adicional[key].data.map((item:number) => +item)});
        } else {
          filters.push({ key, values: this.filtersExhibiciones.adicional[key].data});
        }
      }
    }
    this.exhibitionReportsService.exportExcelAdicionales(startOfMonth, endOfMonth, this.user_id, filters).subscribe((blob: Blob) => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      const startDate = this.dateService.generateFormattedDate(this.filterDateAdicionales.startOfMonth);
      const endDate = this.dateService.generateFormattedDate(this.filterDateAdicionales.endOfMonth);
      a.download = this.dateService.generateFormattedDateForExport()+'-exhibiciones_adicionales'+'-'+startDate+'_'+endDate+'.xlsx';
      a.click();
      URL.revokeObjectURL(objectUrl);
      this.isLoadingExportExcel = false;
    }, error => {
      console.error('Error al Exportar:', error);
      this.isLoadingExportExcel = false;
    });
  }
  exportExcelCompetencia(): void {
    this.isLoadingExportExcel = true;
    const startOfMonth =  format(new Date(this.filterDateCompetencia.startOfMonth), "yyyy-MM-dd") + "T00:00:00Z";
    const endOfMonth = format(new Date(this.filterDateCompetencia.endOfMonth), "yyyy-MM-dd") + "T23:59:59Z";
    let filters = [];
    for (const key in this.filtersExhibiciones.competencia) {
      if (!this.filtersExhibiciones.competencia[key].isRemoveFilter && this.filtersExhibiciones.competencia[key].data.length != 0) {
        if (key == "poc.poc") {
          filters.push({ key, values: this.filtersExhibiciones.competencia[key].data.map((item:number) => +item)});
        } else {
          filters.push({ key, values: this.filtersExhibiciones.competencia[key].data});
        }
      }
    }
    this.exhibitionReportsService.exportExcelCompetencia(startOfMonth,endOfMonth, this.user_id, filters).subscribe((blob: Blob) => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      const startDate = this.dateService.generateFormattedDate(this.filterDateCompetencia.startOfMonth);
      const endDate = this.dateService.generateFormattedDate(this.filterDateCompetencia.endOfMonth);
      a.download = this.dateService.generateFormattedDateForExport()+'-exhibiciones_competencias'+'-'+startDate+'_'+endDate+'.xlsx';
      a.click();
      URL.revokeObjectURL(objectUrl);
      this.isLoadingExportExcel = false;
    }, error => {
      console.error('Error al Exportar:', error);
      this.isLoadingExportExcel = false;
    });
  }
  exportExcelContraprestada(): void {
    this.isLoadingExportExcel = true;
    const startOfMonth =  format(new Date(this.filterDateContraprestada.startOfMonth), "yyyy-MM-dd") + "T00:00:00Z";
    const endOfMonth = format(new Date(this.filterDateContraprestada.endOfMonth), "yyyy-MM-dd") + "T23:59:59Z";
    let filters = [];
    for (const key in this.filtersExhibiciones.contraprestada) {
      if (!this.filtersExhibiciones.contraprestada[key].isRemoveFilter && this.filtersExhibiciones.contraprestada[key].data.length != 0) {
        if (key == "poc.poc") {
          filters.push({ key, values: this.filtersExhibiciones.contraprestada[key].data.map((item:number) => +item)});
        } else {
          filters.push({ key, values: this.filtersExhibiciones.contraprestada[key].data});
        }
      }
    }
    this.exhibitionReportsService.exportExcelContraprestada(startOfMonth, endOfMonth, this.user_id, filters).subscribe((blob: Blob) => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      const startDate = this.dateService.generateFormattedDate(this.filterDateContraprestada.startOfMonth);
      const endDate = this.dateService.generateFormattedDate(this.filterDateContraprestada.endOfMonth);
      a.download = this.dateService.generateFormattedDateForExport()+'-exhibiciones-contraprestadas'+'-'+startDate+'_'+endDate+'.xlsx';
      a.click();
      URL.revokeObjectURL(objectUrl);
      this.isLoadingExportExcel = false;
    }, error => {
      console.error('Error al Exportar:', error);
      this.isLoadingExportExcel = false;
    });
  }

  uploadExcel(){
    this.router.navigate([`/${Constantes.ROUTES.UPLOAD._CONTRAPRESTADA}`]);
  }

  downloadExcelPlantilla(entity: string): void {
    this.uploadService.downloadExcelPlantilla(entity).then((response: any) => {
      console.log('response', response);
      if (response.success) {
        saveAs(response.file_url, `${entity}.xlsx`);
        return;
      }
      // Asumiendo que el servicio devuelve un Blob directamente
    }, error => {
      console.error('Error al descargar la plantilla:', error);
    });
  }

  togglePopover(event: Event): void {
    event.stopPropagation();
  }

  clickMePopover(popoverType: string): void {
    if (popoverType === 'adicional') {
      this.isPopoverVisibleAdicional = false;
    } else if (popoverType === 'competencia') {
      this.isPopoverVisibleCompetencia = false;
    } else {
      this.isPopoverVisibleContraprestada = false;
    }
  }

  getGoogleMapsLink(latitude: any, longitude: any): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  handlePopoverVisibleChange(visible: boolean, popoverType: string): void {
    if (popoverType === 'adicional') {
      this.isPopoverVisibleAdicional = visible;
    } else if (popoverType === 'competencia') {
      this.isPopoverVisibleCompetencia = visible;
    } else {
      this.isPopoverVisibleContraprestada = visible;
    }
  }

  onPanelAdicionalChange(isActive: boolean): void {
    if (isActive && !this.panelAdicionalAbierto) {
      this.panelAdicionalAbierto = true;
      this.onChangedDateAdicional({
        filterStartDate: this.filterDateAdicionales.startOfMonth,
        filterEndDate: this.filterDateAdicionales.endOfMonth
      });
    }
  }
  
  onPanelCompetenciaChange(isActive: boolean): void {
    if (isActive && !this.panelCompetenciaAbierto) {
      this.panelCompetenciaAbierto = true;
      this.onChangedDateCompetencia({
        filterStartDate: this.filterDateCompetencia.startOfMonth,
        filterEndDate: this.filterDateCompetencia.endOfMonth
      });
    }
  }
  
  onPanelContraprestadaChange(isActive: boolean): void {
    if (isActive && !this.panelContraprestadaAbierto) {
      this.panelContraprestadaAbierto = true;
      this.onChangedDateContraprestada({
        filterStartDate: this.filterDateContraprestada.startOfMonth,
        filterEndDate: this.filterDateContraprestada.endOfMonth
      });
    }
  }

  onChangedDateAdicional(event: { filterEndDate: Date; filterStartDate: Date; }){    
    this.filterDateAdicionales.startOfMonth = event.filterStartDate;
    this.filterDateAdicionales.endOfMonth = event.filterEndDate;
    this.loadAditionalExhibition();
    this.loadFiltersAdicional();
  }
  onChangedDateCompetencia(event: { filterEndDate: Date; filterStartDate: Date; }){    
    this.filterDateCompetencia.startOfMonth=event.filterStartDate;
    this.filterDateCompetencia.endOfMonth=event.filterEndDate;
    this.loadCompetenceExhibition();
    this.loadFiltersCompetencia();
  }
  onChangedDateContraprestada(event: { filterEndDate: Date; filterStartDate: Date; }){    
    this.filterDateContraprestada.startOfMonth=event.filterStartDate;
    this.filterDateContraprestada.endOfMonth=event.filterEndDate;
    this.loadContraExhibition();
    this.loadFiltersContraprestada();
  }

  setFixedToNumber(colum: number) {
    return colum.toLocaleString('en-US', {});
  }

  showModalValidacionesImagen(url: string, validacion: IValidacion): void {
    this.isVisibleModalValidaciones = true;
    this.imagenSeleccionado = url;
    this.validacionExhibicionModal = validacion;
    
    // Encontrar el índice de la imagen seleccionada
    const imageIndex = this.validacionExhibicionModal.imagenes.findIndex(
      (img: any) => (img.imagen_url === url || img.url === url)
    );
    
    this.imagePositionSelected = imageIndex >= 0 ? imageIndex : 0;
    
    // Dar tiempo para que el modal se abra y el carrusel se inicialice
    setTimeout(() => {
      if (this.carousel) {
        this.carousel.goTo(this.imagePositionSelected);
      }
    }, 100);
  }
  
  handleCancelModalValidacionImagen() {
    this.isVisibleModalValidaciones = false;
  }

  // viewImagenValidacionesContraprestada(url: string,comentario:string,comentarios_adicionales:string): void {
  //   const modalRef:NzModalRef  = this.modal.create({
  //     nzContent: '<img  width="100%"   src="' + url + '" /> <br> <strong>Comentarios:</strong> '+comentario + '<br> <strong>Comentarios  Adicionales:</strong> ' + `${comentarios_adicionales ? comentarios_adicionales : '-'}`,
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

  // rotateLeft() {
  //   this.angle -= 90;
  // }

  // rotateRight() {
  //   this.angle += 90;
  // }

  // resetImage() {
  //   this.angle = 0;
  // }
  showFullImage(imagenUrl: string) {
    const images = [{
      src: imagenUrl,
      width: '250px',
      height: 'auto',
      alt: 'Imagen'
    }];
    this.nzImageService.preview(images, { nzZoom: 1.5, nzRotate: this.angle });
  }
}
