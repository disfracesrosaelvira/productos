import { Injectable } from '@angular/core';
import Constantes from '@shared/constants/contants';

@Injectable({
  providedIn: 'root',  // Hace que el servicio esté disponible en toda la aplicación
})
export class FilterDashboardSharedService {
  defaultFilters: any = {
    anio: {
      value: this.getPeruDate(), // formato date
    },
    meses: {
      list: this.initializeMonths(),
      selectAllChecked: false,
      titleSelect: Constantes.MONTHS[this.currentMonth()].label,
      searchTerm: '',
      isDropdownVisible: false
    },
    cliente: {
      list: [
        {label: 'BK', value: 'BK', checked: false},
        {label: 'PE', value: 'PE', checked: false},
      ],
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      isDropdownVisible: false
    },
    supervisor: {
      list: [],
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      searchTerm: '',
      isDropdownVisible: false
    },
    tienda: {
      list: [],
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      searchTerm: '',
      isDropdownVisible: false
    },
    region: {
      list: [],
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      isDropdownVisible: false
    },
    cadena: {
      list: [],
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      searchTerm: '',
      isDropdownVisible: false
    },
    gerencia: {
      list: [],
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      searchTerm: '',
      isDropdownVisible: false
    },
    tipo: {
      list: [],
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      searchTerm: '',
      isDropdownVisible: false
    },
    linea: {
      list: [],
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      searchTerm: '',
      isDropdownVisible: false
    }
  };

  constructor() {}

  getInitialFilters() {
    // Retorna una copia de los filtros por defecto
    const clonedFilters = JSON.parse(JSON.stringify(this.defaultFilters));
    clonedFilters.anio.value = this.getPeruDate();
    clonedFilters.meses.list = this.initializeMonths();
    clonedFilters.meses.titleSelect = Constantes.MONTHS[this.currentMonth()].label;
    return clonedFilters;
  }

  initializeMonths(): any[] {
    const monthIndex = this.currentMonth();
    const months: any [] = [
      {label: 'Enero', value: '01', checked: false},
      {label: 'Febrero', value: '02', checked: false},
      {label: 'Marzo', value: '03', checked: false},
      {label: 'Abril', value: '04', checked: false},
      {label: 'Mayo', value: '05', checked: false},
      {label: 'Junio', value: '06', checked: false},
      {label: 'Julio', value: '07', checked: false},
      {label: 'Agosto', value: '08', checked: false},
      {label: 'Septiembre', value: '09', checked: false},
      {label: 'Octubre', value: '10', checked: false},
      {label: 'Noviembre', value: '11', checked: false},
      {label: 'Diciembre', value: '12', checked: false}
    ];
    let resultMonths = [];
    for (let i = 0; i <= monthIndex; i++) {
      if (i === monthIndex) {
        resultMonths.push({label: months[i].label, value: months[i].value, checked: true});
        break;
      } else {
        resultMonths.push(months[i]);
      }
    }
    return resultMonths;
  }

  private getPeruDate() {
    // Crear la fecha actual en UTC
    const currentDate = new Date();
    const peruTimeOffset = -5 * 60; // UTC-5 en minutos
    const peruDate = new Date(currentDate.getTime() + (peruTimeOffset * 60 * 1000));
    return peruDate;
  }

  currentYear(): number {
    return this.getPeruDate().getFullYear();
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  currentMonth(): number {
    return this.getPeruDate().getUTCMonth(); // Ejemplo Enero = 0, Febrero: 1
  }
}