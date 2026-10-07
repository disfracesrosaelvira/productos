import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzDatePickerComponent, NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { startOfMonth, differenceInCalendarDays, format } from 'date-fns';
import { DatabaseCopyCollectionsService } from './database-copy-collections.service';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { DateService } from '@shared/services/date.service';
import { SelectDatePickerComponent } from '@shared/components/select-date-picker/select-date-picker.component';

@Component({
  selector: 'app-database-copy-collections',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NzDatePickerModule, NzListModule, NzCollapseModule, NzInputModule, NzButtonModule, NzModalModule, NzSelectModule, SpinnerLoadingComponent, SelectDatePickerComponent],
  templateUrl: './database-copy-collections.component.html',
  styleUrl: './database-copy-collections.component.scss'
})
export class DatabaseCopyCollectionsComponent {
  collections: string[] = [
    'config_value',
    'exhibicion_adicional',
    'exhibicion_competencia',
    'exhibicion_contraprestada',
    'frente',
    'incidencia_competencia',
    'incidencia_mueble_asignacion',
    'incidencia_mueble_mantenimiento',
    'incidencia_mueble_recojo',
    'poc',
    'precio',
    // 'rol',
    'sku',
    'stock'
    // Añade más colecciones según sea necesario
  ];
  selectedCollection: string = '';
  isLoading: boolean = false;

  @ViewChild('filterEndDatePicker') filterEndDatePicker!: NzDatePickerComponent;
  @ViewChild('filterStartDatePicker') filterStartDatePicker!: NzDatePickerComponent;
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  today = new Date();

  constructor(
    private databaseCopyCollectionsService: DatabaseCopyCollectionsService,
    private notification: NzNotificationService,
    private dateService: DateService
  ) {}

  // Función para validar la fecha de inicio
  disabledFilterStartDate = (startValue: Date): boolean => {
    if (!startValue) {
      return false;
    }
    // Verifica que no sea posterior a hoy
    return differenceInCalendarDays(startValue, this.today) > 0;
  };

  // Función para validar la fecha de fin
  disabledFilterEndDate = (endValue: Date): boolean => {
    if (!endValue) {
      return false;
    }
    
    // Verifica que no sea posterior a hoy
    const isAfterToday = differenceInCalendarDays(endValue, this.today) > 0;
    
    // Verifica que no sea anterior a la fecha de inicio (si hay una)
    const isBeforeStartDate = this.filterStartDate ? 
      differenceInCalendarDays(endValue, this.filterStartDate) < 0 : false;
    
    return isAfterToday || isBeforeStartDate;
  };

  // Modificamos la función para mantener la lógica de abrir el segundo datepicker
  handleFilterStartDateOpenChange(open: boolean): void {
    if (!open) {
      this.filterEndDatePicker.open();
    }
  }

  
  downloadBackup(): void {
    if (!this.selectedCollection) {
      alert('Por favor seleccione una colección');
      return;
    }
    let filterStartDate = null;
    let filterEndDate =  null;
    if (this.filterStartDate && this.filterEndDate) {
      const startDate = new Date(this.filterStartDate);
      startDate.setHours(0, 0, 0, 0); // Inicio del día

      const endDate = new Date(this.filterEndDate);
      // endDate.setHours(23, 59, 59, 999); // Fin del día
      // this.dateChanged.emit({ filterStartDate: startDate, filterEndDate: endDate });
      filterStartDate =  format(new Date(startDate), "yyyy-MM-dd") + "T00:00:00Z";
      filterEndDate = format(new Date(endDate), "yyyy-MM-dd") + "T23:59:59Z";
    }
    this.isLoading = true;
    
    this.databaseCopyCollectionsService.generateBackup(this.selectedCollection, filterStartDate, filterEndDate)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Obtener el nombre del archivo del header
          const contentDisposition = response.headers.get('Content-Disposition') || '';
          let filename = this.dateService.generateFormattedDateForExport()+'_backus-kkaa-merch.'+`${this.selectedCollection}.json`;
            //         let filename = this.dateService.generateFormattedDateForExport()+'-'+this.selectedCollection + '_backup.json';
          
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
          
          // Crear un blob y un objeto URL
          const blob = new Blob([response.body], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          
          // Crear un elemento anchor para la descarga
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          
          // Limpiar
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          this.notification.create('success', 'Descargado', 'Se descargó correctamente');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al generar el backup:', error);
          this.notification.create('error', 'Error', 'Error al generar el backup. Por favor intente nuevamente.');
        }
      });
  }
}
