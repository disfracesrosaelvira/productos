import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzImageModule } from 'ng-zorro-antd/image';
import { format } from 'date-fns';
import { ExhibitionReportsService } from './incidence-reports.service';
import { IIncidenciaCompetencia } from '../../dto/incidenciaCompetencia.dto';
import { IIncidenciaMuebleAsignacion } from '../../dto/incidenciaMuebleAsignacion.dto';
import { IIncidenciaMuebleMantenimiento } from '../../dto/incidenciaMuebleMantenimiento.dto';
import { IIncidenciaMuebleRecojo } from '../../dto/incidenciaMuebleRecojo.dto';
import { DateService } from '@shared/services/date.service';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { SelectDatePickerComponent } from '@shared/components/select-date-picker/select-date-picker.component';
import { NzModalModule } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-incidence-reports',
  standalone: true,
  imports: [CommonModule, SpinnerLoadingComponent, SelectDatePickerComponent, NzPaginationModule, NzTableModule, NzAvatarModule, NzButtonModule, NzIconModule, NzCollapseModule, NzModalModule, NzImageModule],
  templateUrl: './incidence-reports.component.html',
  styleUrl: './incidence-reports.component.scss'
})
export class IncidenceReportsComponent {
  incidents = {
    incidenciaCompetencia: { data: [] as IIncidenciaCompetencia[], pageIndex: 1, pageSize: 10, totalDocs: 0, loading: false },
    incidenciaMuebleAsignacion: { data: [] as IIncidenciaMuebleAsignacion[], pageIndex: 1, pageSize: 10, totalDocs: 0, loading: false },
    incidenciaMuebleMantenimiento: { data: [] as IIncidenciaMuebleMantenimiento[], pageIndex: 1, pageSize: 10, totalDocs: 0, loading: false },
    incidenciaMuebleRecojo: { data: [] as IIncidenciaMuebleRecojo[], pageIndex: 1, pageSize: 10, totalDocs: 0, loading: false },
  }
  isLoadingExportExcel: boolean = false;
  filterDateIncidents:  { [key: string]: { filterEndDate: Date, filterStartDate: Date } } = {
    incidenciaCompetencia: { filterEndDate: new Date(), filterStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    incidenciaMuebleAsignacion: { filterEndDate: new Date(), filterStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    incidenciaMuebleMantenimiento: { filterEndDate: new Date(), filterStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    incidenciaMuebleRecojo: { filterEndDate: new Date(), filterStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
  }

  user: any = localStorage.getItem('user');
  user_id = this.user ? JSON.parse(this.user).userId : '0';
  imagenSeleccionado: string = '';
  isVisibleModalImagen = false;
  angle = 0;

  constructor(
    private exhibitionReportsService: ExhibitionReportsService,
    private dateService: DateService,
    private nzImageService: NzImageService,
  ) {}

  ngOnInit() {
    this.loadIncidenciaCompetencia();
    this.loadIncidenciaMuebleAsignacion();
    this.loadIncidenciaMuebleMantenimiento();
    this.loadIncidenciaMuebleRecojo();
  }

  async loadIncidenciaCompetencia() {
    try {
      this.incidents.incidenciaCompetencia.loading = true;
      // const filterStartDate =  format(new Date(this.filterDateIncidents['incidenciaCompetencia'].filterStartDate), "yyyy-MM-dd");
      // const filterEndDate = format(new Date(this.filterDateIncidents['incidenciaCompetencia'].filterEndDate), "yyyy-MM-dd");
      const filterStartDate =  format(new Date(this.filterDateIncidents['incidenciaCompetencia'].filterStartDate), "yyyy-MM-dd") + "T00:00:00Z";
      // const filterEndDate = format(new Date(this.filterDateIncidents['incidenciaCompetencia'].filterEndDate), "yyyy-MM-dd'T'HH:mm:ss'Z'"); // en el boton de buscar lo llega a estableces a 23:59:59 del dia
      const filterEndDate = format(new Date(this.filterDateIncidents['incidenciaCompetencia'].filterEndDate), "yyyy-MM-dd") + "T23:59:59Z";
      const incidenciaCompetencia = await this.exhibitionReportsService.getIncidenceCompetencie(
        this.user_id,
        this.incidents.incidenciaCompetencia.pageIndex,
        this.incidents.incidenciaCompetencia.pageSize,
        filterStartDate,
        filterEndDate
      );
      this.incidents.incidenciaCompetencia.data = incidenciaCompetencia.docs;
      this.incidents.incidenciaCompetencia.totalDocs = incidenciaCompetencia.totalDocs;
      this.incidents.incidenciaCompetencia.loading = false;
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.incidents.incidenciaCompetencia.loading = false;
    }
  }

  async loadIncidenciaMuebleAsignacion() {
    try {
      this.incidents.incidenciaMuebleAsignacion.loading = true;
      // const filterStartDate =  format(new Date(this.filterDateIncidents['incidenciaMuebleAsignacion'].filterStartDate), "yyyy-MM-dd");
      // const filterEndDate = format(new Date(this.filterDateIncidents['incidenciaMuebleAsignacion'].filterEndDate), "yyyy-MM-dd");
      const filterStartDate =  format(new Date(this.filterDateIncidents['incidenciaMuebleAsignacion'].filterStartDate), "yyyy-MM-dd") + "T00:00:00Z";
      const filterEndDate = format(new Date(this.filterDateIncidents['incidenciaMuebleAsignacion'].filterEndDate), "yyyy-MM-dd") + "T23:59:59Z";
      const incidenciaMuebleAsignacion = await this.exhibitionReportsService.getIncidenciaMuebleAsignacion(
        this.user_id,
        this.incidents.incidenciaMuebleAsignacion.pageIndex,
        this.incidents.incidenciaMuebleAsignacion.pageSize,
        filterStartDate,
        filterEndDate,
      );
      this.incidents.incidenciaMuebleAsignacion.data = incidenciaMuebleAsignacion.docs;
      this.incidents.incidenciaMuebleAsignacion.totalDocs = incidenciaMuebleAsignacion.totalDocs;
      this.incidents.incidenciaMuebleAsignacion.loading = false;
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.incidents.incidenciaMuebleAsignacion.loading = false;
    }
  }

  async loadIncidenciaMuebleMantenimiento() {
    try {
      // const filterStartDate =  format(new Date(this.filterDateIncidents['incidenciaMuebleMantenimiento'].filterStartDate), "yyyy-MM-dd");
      // const filterEndDate = format(new Date(this.filterDateIncidents['incidenciaMuebleMantenimiento'].filterEndDate), "yyyy-MM-dd");
      const filterStartDate =  format(new Date(this.filterDateIncidents['incidenciaMuebleMantenimiento'].filterStartDate), "yyyy-MM-dd") + "T00:00:00Z";
      const filterEndDate = format(new Date(this.filterDateIncidents['incidenciaMuebleMantenimiento'].filterEndDate), "yyyy-MM-dd") + "T23:59:59Z";
      const incidenciaMuebleMantenimiento = await this.exhibitionReportsService.getIncidenciaMuebleMantenimiento(
        this.user_id,
        this.incidents.incidenciaMuebleMantenimiento.pageIndex,
        this.incidents.incidenciaMuebleMantenimiento.pageSize,
        filterStartDate,
        filterEndDate,
      );
      this.incidents.incidenciaMuebleMantenimiento.data = incidenciaMuebleMantenimiento.docs;
      this.incidents.incidenciaMuebleMantenimiento.totalDocs = incidenciaMuebleMantenimiento.totalDocs;
      this.incidents.incidenciaMuebleMantenimiento.loading = false;
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.incidents.incidenciaMuebleMantenimiento.loading = false;
    }
  }

  async loadIncidenciaMuebleRecojo() {
    try {
      // const filterStartDate =  format(new Date(this.filterDateIncidents['incidenciaMuebleRecojo'].filterStartDate), "yyyy-MM-dd");
      // const filterEndDate = format(new Date(this.filterDateIncidents['incidenciaMuebleRecojo'].filterEndDate), "yyyy-MM-dd");
      const filterStartDate =  format(new Date(this.filterDateIncidents['incidenciaMuebleRecojo'].filterStartDate), "yyyy-MM-dd") + "T00:00:00Z";
      const filterEndDate = format(new Date(this.filterDateIncidents['incidenciaMuebleRecojo'].filterEndDate), "yyyy-MM-dd") + "T23:59:59Z";
      const incidenciaMuebleRecojo = await this.exhibitionReportsService.getIncidenciaMuebleRecojo(
        this.user_id,
        this.incidents.incidenciaMuebleRecojo.pageIndex,
        this.incidents.incidenciaMuebleRecojo.pageSize,
        filterStartDate,
        filterEndDate,
      );
      this.incidents.incidenciaMuebleRecojo.data = incidenciaMuebleRecojo.docs;
      this.incidents.incidenciaMuebleRecojo.totalDocs = incidenciaMuebleRecojo.totalDocs;
      this.incidents.incidenciaMuebleRecojo.loading = false;
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.incidents.incidenciaMuebleRecojo.loading = false;
    }
  }

  onChangedDateCompetence(event: { filterEndDate: Date; filterStartDate: Date; }){   
    this.filterDateIncidents['incidenciaCompetencia'].filterStartDate = event.filterStartDate;
    this.filterDateIncidents['incidenciaCompetencia'].filterEndDate = event.filterEndDate;
    this.loadIncidenciaCompetencia();
  }
  onChangedDateMuebleAssignment(event: { filterEndDate: Date; filterStartDate: Date; }){   
    this.filterDateIncidents['incidenciaMuebleAsignacion'].filterStartDate = event.filterStartDate;
    this.filterDateIncidents['incidenciaMuebleAsignacion'].filterEndDate = event.filterEndDate;
    this.loadIncidenciaMuebleAsignacion();
  }
  onChangedDateMuebleMaintenance(event: { filterEndDate: Date; filterStartDate: Date; }){   
    this.filterDateIncidents['incidenciaMuebleMantenimiento'].filterStartDate = event.filterStartDate;
    this.filterDateIncidents['incidenciaMuebleMantenimiento'].filterEndDate = event.filterEndDate;
    this.loadIncidenciaMuebleMantenimiento();
  }
  onChangedDateMuebleRecojo(event: { filterEndDate: Date; filterStartDate: Date; }){   
    this.filterDateIncidents['incidenciaMuebleRecojo'].filterStartDate = event.filterStartDate;
    this.filterDateIncidents['incidenciaMuebleRecojo'].filterEndDate = event.filterEndDate;
    this.loadIncidenciaMuebleRecojo();
  }

  exportExcel(type: string): void {
    // event.stopPropagation();
    this.isLoadingExportExcel = true;
    const types: { [key: string]: string } = {
      'competencia': 'incidenciaCompetencia',
      'mueble-asignacion': 'incidenciaMuebleAsignacion',
      'mueble-mantenimiento': 'incidenciaMuebleMantenimiento',
      'mueble-recojo': 'incidenciaMuebleRecojo',
    }
    // const filterStartDate =  format(new Date(this.filterDateIncidents[types[type]].filterStartDate), "yyyy-MM-dd");
    // const filterEndDate = format(new Date(this.filterDateIncidents[types[type]].filterEndDate), "yyyy-MM-dd");
    const filterStartDate =  format(new Date(this.filterDateIncidents[types[type]].filterStartDate), "yyyy-MM-dd") + "T00:00:00Z";
    const filterEndDate = format(new Date(this.filterDateIncidents[types[type]].filterEndDate), "yyyy-MM-dd") + "T23:59:59Z";
    
    this.exhibitionReportsService.exportExcel(type, this.user_id, filterStartDate, filterEndDate).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        const startDate = this.dateService.generateFormattedDate(this.filterDateIncidents[types[type]].filterStartDate);
        const endDate = this.dateService.generateFormattedDate(this.filterDateIncidents[types[type]].filterEndDate);
        a.download = this.dateService.generateFormattedDateForExport()+'-incidencia_'+type+'-'+startDate+'_'+endDate+'.xlsx';
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

  getGoogleMapsLink(latitud: any, longitud: any): string {
    return `https://www.google.com/maps?q=${latitud},${longitud}`;
  }

  handlePageEventIncidenciaCompetencia(pageIndex: number) {
    this.incidents.incidenciaCompetencia.pageIndex = pageIndex;
  }
  handlePageEventIncidenciaMuebleAsignacion(pageIndex: number) {
    this.incidents.incidenciaMuebleAsignacion.pageIndex = pageIndex;
  }
  handlePageEventIncidenciaMuebleMantenimiento(pageIndex: number) {
    this.incidents.incidenciaMuebleMantenimiento.pageIndex = pageIndex;
  }
  handlePageEventIncidenciaMuebleRecojo(pageIndex: number) {
    this.incidents.incidenciaMuebleRecojo.pageIndex = pageIndex;
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
