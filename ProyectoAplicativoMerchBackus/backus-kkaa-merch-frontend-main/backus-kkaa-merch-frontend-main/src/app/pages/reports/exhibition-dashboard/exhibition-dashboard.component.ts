import { ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

import * as echarts from 'echarts';
import { ExhibitionDashboardService } from './exhibition-dashboard.service';
import { SharedService } from '@shared/services/shared.service';
import { DateService } from '@shared/services/date.service';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import Constantes from '@shared/constants/contants';
import { FilterDashboardComponent } from '@shared/components/filter-dashboard/filter-dashboard.component';
import { FilterDashboardSharedService } from '@shared/services/dashboard/filter-dashboard-shared.service';

interface Product {
  key: string;
  name: string;
  weeksData?: {
    [week: string]: {
      qty: number | null;
      mix: number | null;
    };
  };
}

interface Brand {
  key: string;
  name: string;
  children: Product[];
  weeklyTotal?: {
    [week: string]: {
      qty: number;
      mix: number;
    };
  };
  expand?: boolean; // Nueva propiedad para manejar la expansión
}

@Component({
  selector: 'app-exhibition-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzDatePickerModule,
    NzDropDownModule,
    NzButtonModule,
    NzIconModule,
    NzCollapseModule,
    NzCheckboxModule,
    NzSelectModule,
    NzTableModule,
    NzPopoverModule,
    NzLayoutModule,
    SpinnerLoadingComponent,
    FilterDashboardComponent
  ],
  templateUrl: './exhibition-dashboard.component.html',
  styleUrl: './exhibition-dashboard.component.scss'
})
export class ExhibitionDashboardComponent {
  private windowWidth: number;
  isScreenSmall: boolean = false;
  @ViewChild('horizontalBar') horizontalBar!: ElementRef;
  @ViewChild('exhibitionTypeStackedLine') exhibitionTypeStackedLine!: ElementRef;
  @ViewChild('exhibitionTypePie') exhibitionTypePie!: ElementRef;
  @ViewChild('exhibitionBrandStackedLine') exhibitionBrandStackedLine!: ElementRef;
  @ViewChild('exhibitionBrandPie') exhibitionBrandPie!: ElementRef;
  // @ViewChild('exhibitionAdicionalBrandDescriptionPie') exhibitionAdicionalBrandDescriptionPie!: ElementRef;
  // @ViewChild('exhibitionContraprestadaBrandDescriptionPie') exhibitionContraprestadaBrandDescriptionPie!: ElementRef;
  exhibitionAdicionalType: any = {};
  exhibitionAdicionalBrand: any = {};
  exhibitionAdicionalBrandAndDescription: any = {};
  exhibitionContraprestadaType: any = {};
  exhibitionContraprestadaBrand: any = {};
  exhibitionContraprestadaVigente: any = [];
  supervisorsVigente: any = [];
  exhibitionContraprestadaBrandAndDescription: any = {};
  filtersParams: any = {};
  filters: any = this.filterDashboardSharedService.getInitialFilters();
  tempFilters: any = JSON.parse(JSON.stringify(this.filters));
  selectExhibition: any = {
    tipo: {
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      list: []
    },
    marca: {
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      list: []
    },
    tipoContraprestada: {
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      list: []
    },
    marcaContraprestada: {
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      list: []
    },
    mesesNumerosVigenteContraprestada: {
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      list: []
    },
    tipoAdicionalAndContraprestada: {
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      list: []
    },
    marcaAdicionalAndContraprestada: {
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      list: []
    }
  };
  // brandsYouWantToSeeAdicional = ['Corona', 'Cristal', 'Cusqueña', 'Pilsen Callao', 'Pilsen Trujillo', 'Stella', 'Budweiser', 'Amstel', 'otros'];
  // brandsYouWantToSeeContraprestada = ['Budweiser', 'Corona', 'Cristal', 'Pilsen Callao', 'otros'];
  selectExhibicionAdicionalOrContraprestada: string = 'adicional';
  // // adicional marca y descripcion start
  // selectedMesesExbicionAdicionalMarcaDescripcion: any = null;
  // mesesExhibicionAdicionalMarcaDescripcion: any = [];
  // selectedMarcasExbicionAdicionalMarcaDescripcion: any = null;
  // marcasExhibicionAdicionalMarcaDescripcion: any = [];
  // // adicional marca y descripcion end
  // contraprestada
  isLoadingGeneric: boolean = false;

  //  // contraprestada marca y descripcion start
  // selectedMesesExbicionContraprestadaMarcaDescripcion: any = null;
  // mesesExhibicionContraprestadaMarcaDescripcion: any = [];
  // selectedMarcasExbicionContraprestadaMarcaDescripcion: any = null;
  // marcasExhibicionContraprestadaMarcaDescripcion: any = [];
  // // contraprestada marca y descripcion end
  lineasContraprestada: string [] = ['Cervezas', 'Licores', 'NABs', 'Por_homologar_linea', 'RTD'];
  lineasAdicional: string [] = [];

  weekNumbers: string[] = []; // Las semanas dinámicas
  listOfMapData: Brand[] = [];
  totalPerWeek: { [week: string]: number } = {};
  isPopoverVisibleExportFileMarcaDescripcion: boolean = false;

  monthNumbersVigente: string[] = []; // Los meses dinámicas

  constructor(
    private cdr: ChangeDetectorRef,
    private filterDashboardSharedService: FilterDashboardSharedService,
    private exhibitionDashboardService: ExhibitionDashboardService,
    private sharedService: SharedService,
    private dateService: DateService
  ) { 
    this.windowWidth = window.innerWidth;
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isScreenSmall = window.innerWidth < 768;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.windowWidth = window.innerWidth;
    this.cdr.detectChanges();
    this.checkScreenSize();
  }

  shouldAddBreakpoint(): boolean {
    return this.windowWidth <= 991;
  }


  ngOnInit() {
    this.getFiltersDashboard();
  }

  async ngAfterViewInit() {
    this.loadingFiltersParams();
    this.initialLoadingData();
  }

  loadGraphicsHorizontalBar() {
    const year = this.getYear(this.filters.anio.value);
    let confirmadosDatos: any = [];
    let pendientesDatos: any = [];
    let listNameEjeX: any = [];
    // if (this.selectedMesesExhibicionContraprestadaVigente) {
    //   const found = this.exhibitionContraprestadaVigente.find((item: any) => item.month === this.selectedMesesExhibicionContraprestadaVigente);
    //   if (found) {
    //     const month = found.month;
    //     found.supervisors.forEach((supervisor: any) => {
    //       listNameEjeX.push(year+' '+month+' '+supervisor.supervisor);
    //       confirmadosDatos.push(supervisor.counts.true);
    //       pendientesDatos.push(supervisor.counts.false);
    //     });
    //   }
    // }
    this.supervisorsVigente.forEach((supervisor: any) => {
      // listNameEjeX.push(year+' '+month+' '+supervisor.supervisor);
      listNameEjeX.push(year+' '+supervisor.supervisor);
      confirmadosDatos.push(supervisor.counts.true);
      pendientesDatos.push(supervisor.counts.false);
    });

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
        },
        formatter: (params: any) => {
          let tooltipContent = `${params[0].name}<br/>`;
          // Calcular el total para esa fila específica (sumar Confirmado y Pendiente)
          const total = confirmadosDatos[params[0].dataIndex] + pendientesDatos[params[0].dataIndex];
          params.forEach((item: any) => {
            const percentage = ((item.value / total) * 100).toFixed(2); // Calcular el porcentaje para esa fila
            tooltipContent += `${item.marker} ${item.seriesName}: ${item.value} (${percentage}%)<br/>`;
          });
          return tooltipContent;
        }
      },
      legend: {},
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        min: 0,
        axisLabel: { interval: 0, rotate: 30 }
      },
      yAxis: {
        type: 'category',
        data: listNameEjeX.reverse()
      },
      series: [
        {
          name: 'Confirmado',
          type: 'bar',
          stack: 'total',
          label: {
            show: true
          },
          emphasis: {
            focus: 'series'
          },
          itemStyle: {
            color: '#E9D069'  // Color para "Confirmado"
          },
          data: confirmadosDatos.reverse()
        },
        {
          name: 'Pendiente',
          type: 'bar',
          stack: 'total',
          label: {
            show: true
          },
          emphasis: {
            focus: 'series'
          },
          itemStyle: {
            color: '#F1E099'  // Color para "Pendiente"
          },
          data: pendientesDatos.reverse()
        },
      ]
    };
    const chart = echarts.init(this.horizontalBar.nativeElement);
    chart.clear(); // Limpia el gráfico antes de actualizarlo
    chart.setOption(option);
  
    // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }

  loadGraphicsExhibitionTypeStackedLine() {
    const year = this.getYear(this.filters.anio.value);
    const existMonths = this.filters.meses.list.filter((item: any) => item.checked).length != 0;

    let typosExhibicion: any = {};
    let namesEjeX = [];
    let totalesPorPeriodo: { [key: string]: number } = {};
    let series: any = [];
    if (this.selectExhibicionAdicionalOrContraprestada === 'adicional') {
      // Primer paso: calcular los totales por período
      for (let clave in this.exhibitionAdicionalType) {
        let totalPeriodo = 0;
        this.selectExhibition['tipo'].list.forEach((element: any) => {
          totalPeriodo += this.exhibitionAdicionalType[clave][element.value] || 0;
        });
        totalesPorPeriodo[clave] = totalPeriodo;
      }
    
      // Segundo paso: calcular porcentajes y organizar datos
      for (let clave in this.exhibitionAdicionalType) {
        if (existMonths) {
          namesEjeX.push(this.getMonthFromWeek(parseInt(clave), year) + ' ' + clave);
        } else {
          namesEjeX.push(year + ' ' + clave);
        }  
        this.selectExhibition['tipo'].list.forEach((element: any) => {
          const valor = this.exhibitionAdicionalType[clave][element.value] || 0;
          if (typosExhibicion.hasOwnProperty(element.value)) {
            typosExhibicion[element.value].push(valor);
          } else {
            typosExhibicion[element.value] = [valor];
          }
        });
      }

      series = this.selectExhibition['tipo'].list.filter((item: any) => item.checked).map((item: any) => ({
        name: item.value,
        type: 'line',
        data: typosExhibicion[item.value],
        emphasis: {
          focus: 'series'
        }
      }));
    } else if (this.selectExhibicionAdicionalOrContraprestada === 'contraprestada') {
      // Primer paso: calcular los totales por período
      for (let clave in this.exhibitionContraprestadaType) {
        let totalPeriodo = 0;
        this.selectExhibition['tipoContraprestada'].list.forEach((element: any) => {
          totalPeriodo += this.exhibitionContraprestadaType[clave][element.value] || 0;
        });
        totalesPorPeriodo[clave] = totalPeriodo;
      }
    
      // Segundo paso: calcular porcentajes y organizar datos
      for (let clave in this.exhibitionContraprestadaType) {
        if (existMonths) {
          namesEjeX.push(this.getMonthFromWeek(parseInt(clave), year) + ' ' + clave);
        } else {
          namesEjeX.push(year + ' ' + clave);
        }  
        this.selectExhibition['tipoContraprestada'].list.forEach((element: any) => {
          const valor = this.exhibitionContraprestadaType[clave][element.value] || 0;
          if (typosExhibicion.hasOwnProperty(element.value)) {
            typosExhibicion[element.value].push(valor);
          } else {
            typosExhibicion[element.value] = [valor];
          }
        });
      }

      series = this.selectExhibition['tipoContraprestada'].list.filter((item: any) => item.checked).map((item: any) => ({
        name: item.value,
        type: 'line',
        // stack: 'Total',
        data: typosExhibicion[item.value],
        emphasis: {
          focus: 'series'
        }
      }));
    } else {
      const resultNewObject = this.combinarObjetos(this.exhibitionAdicionalType, this.exhibitionContraprestadaType);
      // Primer paso: calcular los totales por período
      for (let clave in resultNewObject) {
        let totalPeriodo = 0;
        this.selectExhibition['tipoAdicionalAndContraprestada'].list.forEach((element: any) => {
          totalPeriodo += resultNewObject[clave][element.value] || 0;
        });
        totalesPorPeriodo[clave] = totalPeriodo;
      }
    
      // Segundo paso: calcular porcentajes y organizar datos
      for (let clave in resultNewObject) {
        if (existMonths) {
          namesEjeX.push(this.getMonthFromWeek(parseInt(clave), year) + ' ' + clave);
        } else {
          namesEjeX.push(year + ' ' + clave);
        }
        this.selectExhibition['tipoAdicionalAndContraprestada'].list.forEach((element: any) => {
          const valor = resultNewObject[clave][element.value] || 0;
          if (typosExhibicion.hasOwnProperty(element.value)) {
            typosExhibicion[element.value].push(valor);
          } else {
            typosExhibicion[element.value] = [valor];
          }
        });
      }
      
      series = this.selectExhibition['tipoAdicionalAndContraprestada'].list.filter((item: any) => item.checked).map((item: any) => ({
        name: item.value,
        type: 'line',
        // stack: 'Total',
        data: typosExhibicion[item.value],
        emphasis: {
          focus: 'series'
        }
      }));
    }

    const option = {
      title: {
        show: false // Desactiva la visualización del título
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let tooltip = params[0].axisValueLabel + '<br/>';
          let total = 0;
          // Calcular el porcentaje basado en el total por período
          // axisValue = "2024 7" example
          const totalPeriodo = totalesPorPeriodo[params[0].axisValue.split(' ')[1]];

          params.forEach((param: any) => {
              const porcentaje = (param.value / totalPeriodo) * 100;
              tooltip += `${param.marker}${param.seriesName}: ${param.value} (${porcentaje.toFixed(2)}%)<br/>`;
              total += param.value;
          });
          tooltip += `<b>Sub Total: ${total}</b><br/>`;
          tooltip += `<b>Total: ${totalPeriodo}</b>`;
          return tooltip;
        }
      },
      // legend: {
      //   // type: 'scroll',
      //   top: 30,
      //   left: 'center',
      //   formatter: function(name: string) {
      //     return `${name}`;
      //   }
      // },
      legend: {
        top: 30,
        left: 'center',
        // type: 'scroll',  // Makes the legend scrollable if it's too long
        // orient: 'horizontal',  // Ensures horizontal orientation for better spacing
        itemGap: 10, // Adjust spacing between items in the legend
        padding: [10, 5, 10, 5], // Add padding to avoid overlap with chart
        formatter: (name: string) => `${name}`
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
        top: 150 // separacion de leyenda con el grafico
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        },
        right: 20,
        top: 0
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: namesEjeX,
        axisLabel: { interval: 0, rotate: 30 }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: series,
      color: Constantes.COLORS
    };
  
    // echarts.init(this.exhibitionTypeStackedLine.nativeElement).setOption(option);
    const chart = echarts.init(this.exhibitionTypeStackedLine.nativeElement);
    chart.clear(); // Limpia el gráfico antes de actualizarlo
    chart.setOption(option);
  
    // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }
  
  loadGraphicsExhibitionBrandStackedLine() {
    const year = this.getYear(this.filters.anio.value);
    const existMonths = this.filters.meses.list.filter((item: any) => item.checked).length != 0;

    let typosExhibicion: any = {};
    let namesEjeX = [];
    let totalesPorPeriodo: { [key: string]: number } = {};
    let typosExhibicionTotales: any = {};
    let series;
    if (this.selectExhibicionAdicionalOrContraprestada === 'adicional') {
      // Primer paso: calcular los totales por período
      for (let clave in this.exhibitionAdicionalBrand) {
        let totalPeriodo = 0;
        for (let key in this.exhibitionAdicionalBrand[clave]) {
          totalPeriodo += this.exhibitionAdicionalBrand[clave][key] || 0;
        }
        totalesPorPeriodo[clave] = totalPeriodo;
      }
        
      // Segundo paso: calcular porcentajes y organizar datos
      for (let mesNumber in this.exhibitionAdicionalBrand) {
        if (existMonths) {
          namesEjeX.push(this.getMonthFromWeek(parseInt(mesNumber), year) + ' ' + mesNumber);
        } else {
          namesEjeX.push(year + ' ' + mesNumber);
        }
        this.selectExhibition.marca.list.forEach((element: any) => {
          typosExhibicionTotales[element.value] = this.exhibitionAdicionalBrand[mesNumber][element.value] || 0;
        });
        for (let key in this.exhibitionAdicionalBrand[mesNumber]) {
          if (!this.selectExhibition.marca.list.map((item: any) => item.value).includes(key)) {
            typosExhibicionTotales['otros'] = (typosExhibicionTotales['otros'] || 0) + (this.exhibitionAdicionalBrand[mesNumber][key] || 0);
          }
        }
        // Guardar los valores sin convertir a porcentajes
        for (let key in typosExhibicionTotales) {
          const valor = typosExhibicionTotales[key] || 0;
          if (typosExhibicion.hasOwnProperty(key)) {
              typosExhibicion[key].push(valor);
          } else {
              typosExhibicion[key] = [valor];
          }
        }
        typosExhibicionTotales['otros'] = 0;
      }

      series = this.selectExhibition.marca.list.filter((item: any) => item.checked).map((item: any) => ({
        name: item.value,
        type: 'line',
        data: typosExhibicion[item.value],
        // areaStyle: {},
        emphasis: {
          focus: 'series'
        }
      }));
    } else if (this.selectExhibicionAdicionalOrContraprestada === 'contraprestada') {
      // Primer paso: calcular los totales por período
      for (let clave in this.exhibitionContraprestadaBrand) {
        let totalPeriodo = 0;
        for (let key in this.exhibitionContraprestadaBrand[clave]) {
          totalPeriodo += this.exhibitionContraprestadaBrand[clave][key] || 0;
        }
        totalesPorPeriodo[clave] = totalPeriodo;
      }
        
      // Segundo paso: calcular porcentajes y organizar datos
      for (let mesNumber in this.exhibitionContraprestadaBrand) {
        if (existMonths) {
          namesEjeX.push(this.getMonthFromWeek(parseInt(mesNumber), year) + ' ' + mesNumber);
        } else {
          namesEjeX.push(year + ' ' + mesNumber);
        }
        this.selectExhibition.marcaContraprestada.list.forEach((element: any) => {
          typosExhibicionTotales[element.value] = this.exhibitionContraprestadaBrand[mesNumber][element.value] || 0;
        });
        for (let key in this.exhibitionContraprestadaBrand[mesNumber]) {
          if (!this.selectExhibition.marcaContraprestada.list.map((item: any) => item.value).includes(key)) {
            typosExhibicionTotales['otros'] = (typosExhibicionTotales['otros'] || 0) + (this.exhibitionContraprestadaBrand[mesNumber][key] || 0);
          }
        }
        // Guardar los valores sin convertir a porcentajes
        for (let key in typosExhibicionTotales) {
          const valor = typosExhibicionTotales[key] || 0;
          if (typosExhibicion.hasOwnProperty(key)) {
              typosExhibicion[key].push(valor);
          } else {
              typosExhibicion[key] = [valor];
          }
        }
        typosExhibicionTotales['otros'] = 0;
      }

      series = this.selectExhibition.marcaContraprestada.list.filter((item: any) => item.checked).map((item: any) => ({
        name: item.value,
        type: 'line',
        stack: 'Total',
        data: typosExhibicion[item.value],
        // areaStyle: {},
        emphasis: {
          focus: 'series'
        }
      }));
    } else {      
      const resultNewObject = this.combinarObjetos(this.exhibitionAdicionalBrand, this.exhibitionContraprestadaBrand);
      // Primer paso: calcular los totales por período
      for (let clave in resultNewObject) {
        let totalPeriodo = 0;
        for (let key in resultNewObject[clave]) {
          totalPeriodo += resultNewObject[clave][key] || 0;
        }
        totalesPorPeriodo[clave] = totalPeriodo;
      }
        
      // Segundo paso: calcular porcentajes y organizar datos
      for (let mesNumber in resultNewObject) {
        if (existMonths) {
          namesEjeX.push(this.getMonthFromWeek(parseInt(mesNumber), year) + ' ' + mesNumber);
        } else {
          namesEjeX.push(year + ' ' + mesNumber);
        }
        this.selectExhibition.marcaAdicionalAndContraprestada.list.forEach((element: any) => {
          typosExhibicionTotales[element.value] = resultNewObject[mesNumber][element.value] || 0;
        });
        for (let key in resultNewObject[mesNumber]) {
          if (!this.selectExhibition.marcaAdicionalAndContraprestada.list.map((item: any) => item.value).includes(key)) {
            typosExhibicionTotales['otros'] = (typosExhibicionTotales['otros'] || 0) + (resultNewObject[mesNumber][key] || 0);
          }
        }
        // Guardar los valores sin convertir a porcentajes
        for (let key in typosExhibicionTotales) {
          const valor = typosExhibicionTotales[key] || 0;
          if (typosExhibicion.hasOwnProperty(key)) {
              typosExhibicion[key].push(valor);
          } else {
              typosExhibicion[key] = [valor];
          }
        }
        typosExhibicionTotales['otros'] = 0;
      }

      series = this.selectExhibition.marcaAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => ({
        name: item.value,
        type: 'line',
        stack: 'Total',
        data: typosExhibicion[item.value],
        // areaStyle: {},
        emphasis: {
          focus: 'series'
        }
      }));
    }

    const option = {
      title: {
        show: false // Desactiva la visualización del título
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let tooltip = params[0].axisValueLabel + '<br/>';
          let total = 0;
          // Calcular el porcentaje basado en el total por período
          // axisValue = "2024 7" example
          const totalPeriodo = totalesPorPeriodo[params[0].axisValue.split(' ')[1]];
          params.forEach((param: any) => {
              const porcentaje = (param.value / totalPeriodo) * 100;
              tooltip += `${param.marker}${param.seriesName}: ${param.value} (${porcentaje.toFixed(2)}%)<br/>`;
              total += param.value;
          });
          tooltip += `<b>Sub Total: ${total}</b><br/>`;
          tooltip += `<b>Total: ${totalPeriodo}</b>`;
          return tooltip;
        }
      },
      legend: {
        // type: 'scroll',
        top: 30,
        left: 'center',
        formatter: function(name: string) {
          return `${name}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
        top: 150 // Aumentar el espacio superior para el título y la leyenda
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        },
        right: 20,
        top: 0
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: namesEjeX,
        axisLabel: { interval: 0, rotate: 30 }
      },
      yAxis: {
        type: 'value',
        // axisLabel: {
        //   formatter: '{value}%'
        // }
      },
      series: series,
      color: Constantes.COLORS
    };   
    // echarts.init(this.exhibitionTypeStackedBrand.nativeElement).setOption(option);
    const chart = echarts.init(this.exhibitionBrandStackedLine.nativeElement);
    chart.clear(); // Limpia el gráfico antes de actualizarlo
    chart.setOption(option);
  
    // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }

  loadGraphicsExhibitionTypePie() {
    let typosExhibicion: any = {};
    let total = 0;
    const SeriesData: any = [];
    if (this.selectExhibicionAdicionalOrContraprestada === 'adicional') {
      for (let clave in this.exhibitionAdicionalType) {
        this.selectExhibition.tipo.list.forEach((element: any) => {
          typosExhibicion[element.value] = (typosExhibicion[element.value] || 0) + (this.exhibitionAdicionalType[clave][element.value] || 0);
          total += (this.exhibitionAdicionalType[clave][element.value] || 0);
        });
      }

      this.selectExhibition.tipo.list.filter((item: any) => item.checked).forEach((element: any) => {
        const value = typosExhibicion[element.value];
        const percentage = ((value / total) * 100).toFixed(2);
        SeriesData.push({
          value: value,
          name: `${element.value}: ${percentage}%`,
          percentage: parseFloat(percentage)
        });
      });

    } else if (this.selectExhibicionAdicionalOrContraprestada === 'contraprestada') {
      for (let clave in this.exhibitionContraprestadaType) {
        this.selectExhibition.tipoContraprestada.list.forEach((element: any) => {
          typosExhibicion[element.value] = (typosExhibicion[element.value] || 0) + (this.exhibitionContraprestadaType[clave][element.value] || 0);
          total += (this.exhibitionContraprestadaType[clave][element.value] || 0);
        });
      }

      this.selectExhibition.tipoContraprestada.list.filter((item: any) => item.checked).forEach((element: any) => {
        const value = typosExhibicion[element.value];
        const percentage = ((value / total) * 100).toFixed(2);
        SeriesData.push({
          value: value,
          name: `${element.value}: ${percentage}%`,
          percentage: parseFloat(percentage)
        });
      });
    } else {
      for (let clave in this.exhibitionAdicionalType) {
        this.selectExhibition.tipo.list.forEach((element: any) => {
          typosExhibicion[element.value] = (typosExhibicion[element.value] || 0) + (this.exhibitionAdicionalType[clave][element.value] || 0);
          total += (this.exhibitionAdicionalType[clave][element.value] || 0);
        });
      }

      for (let clave in this.exhibitionContraprestadaType) {
        this.selectExhibition.tipoContraprestada.list.forEach((element: any) => {
          typosExhibicion[element.value] = (typosExhibicion[element.value] || 0) + (this.exhibitionContraprestadaType[clave][element.value] || 0);
          total += (this.exhibitionContraprestadaType[clave][element.value] || 0);
        });
      }

      this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).forEach((element: any) => {
        const value = typosExhibicion[element.value];
        const percentage = ((value / total) * 100).toFixed(2);
        SeriesData.push({
          value: value,
          name: `${element.value}: ${percentage}%`,
          percentage: parseFloat(percentage)
        });
      });
    }
  
    // Sort SeriesData by percentage in descending order
    SeriesData.sort((a: any, b: any) => b.percentage - a.percentage);
    const option = {
      title: {
        show: false // Desactiva la visualización del título
      },
      tooltip: {
        trigger: 'item'
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          // data: SeriesData,
          data: SeriesData.map((item: any, index: number) => ({
            ...item,
            itemStyle: {
              // color: Constantes.COLORS[index % Constantes.COLORS.length] // Aplicar colores gradientes
              color: Constantes.COLORS[index]
            }
          })),  
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}', // Muestra solo el nombre
            position: 'outside',
            alignTo: 'none',
            bleedMargin: 5,
            distanceToLabelLine: 5,
            overflow: 'break', // Permite que el texto se divida en múltiples líneas
            lineHeight: 14
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            smooth: true
          }
        }
      ]
    };
    const chart = echarts.init(this.exhibitionTypePie.nativeElement);
    chart.clear(); // Limpia el gráfico antes de actualizarlo
    chart.setOption(option);
  
    // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }

  loadGraphicsExhibitionBrandPie() {
    let typosExhibicion: any = {};
    let total = 0;
    const SeriesData: any = [];
    if (this.selectExhibicionAdicionalOrContraprestada === 'adicional') {
      for (let mes in this.exhibitionAdicionalBrand) {
        for (let key in this.exhibitionAdicionalBrand[mes]) {
          if (!this.selectExhibition.marca.list.map((item: any) => item.value).includes(key)) {
            typosExhibicion['otros'] = (typosExhibicion['otros'] || 0) + (this.exhibitionAdicionalBrand[mes][key] || 0);
            total += this.exhibitionAdicionalBrand[mes][key] ? this.exhibitionAdicionalBrand[mes][key] : 0;
          }
        }
        this.selectExhibition.marca.list.forEach((element: any) => {
          typosExhibicion[element.value] = (typosExhibicion[element.value] || 0) + (this.exhibitionAdicionalBrand[mes][element.value] || 0);
          total += (this.exhibitionAdicionalBrand[mes][element.value] || 0);
        });
      }
  
      this.selectExhibition.marca.list.filter((item: any) => item.checked).forEach((element: any) => {
        const value = typosExhibicion[element.value];
        const percentage = ((value / total) * 100).toFixed(2);
        SeriesData.push({
          value: value,
          name: `${element.value}: ${percentage}%`,
          percentage: parseFloat(percentage)
        });
      });
    } else if (this.selectExhibicionAdicionalOrContraprestada === 'contraprestada') {
      for (let mes in this.exhibitionContraprestadaBrand) {
        for (let key in this.exhibitionContraprestadaBrand[mes]) {
          if (!this.selectExhibition.marcaContraprestada.list.map((item: any) => item.value).includes(key)) {
            typosExhibicion['otros'] = (typosExhibicion['otros'] || 0) + (this.exhibitionContraprestadaBrand[mes][key] || 0);
            total += this.exhibitionContraprestadaBrand[mes][key] ? this.exhibitionContraprestadaBrand[mes][key] : 0;
          }
        }
        this.selectExhibition.marcaContraprestada.list.forEach((element: any) => {
          typosExhibicion[element.value] = (typosExhibicion[element.value] || 0) + (this.exhibitionContraprestadaBrand[mes][element.value] || 0);
          total += (this.exhibitionContraprestadaBrand[mes][element.value] || 0);
        });
      }
  
      this.selectExhibition.marcaContraprestada.list.filter((item: any) => item.checked).forEach((element: any) => {
        const value = typosExhibicion[element.value];
        const percentage = ((value / total) * 100).toFixed(2);
        SeriesData.push({
          value: value,
          name: `${element.value}: ${percentage}%`,
          percentage: parseFloat(percentage)
        });
      });
    } else {
      const resultNewObject = this.combinarObjetos(this.exhibitionAdicionalBrand, this.exhibitionContraprestadaBrand);
      for (let mes in resultNewObject) {
        for (let key in resultNewObject[mes]) {
          if (!this.selectExhibition.marcaAdicionalAndContraprestada.list.map((item: any) => item.value).includes(key)) {
            typosExhibicion['otros'] = (typosExhibicion['otros'] || 0) + (resultNewObject[mes][key] || 0);
            total += resultNewObject[mes][key] ? resultNewObject[mes][key] : 0;
          }
        }
        this.selectExhibition.marcaAdicionalAndContraprestada.list.forEach((element: any) => {
          typosExhibicion[element.value] = (typosExhibicion[element.value] || 0) + (resultNewObject[mes][element.value] || 0);
          total += (resultNewObject[mes][element.value] || 0);
        });
      }
  
      this.selectExhibition.marcaAdicionalAndContraprestada.list.filter((item: any) => item.checked).forEach((element: any) => {
        const value = typosExhibicion[element.value];
        const percentage = ((value / total) * 100).toFixed(2);
        SeriesData.push({
          value: value,
          name: `${element.value}: ${percentage}%`,
          percentage: parseFloat(percentage)
        });
      });
    }

    SeriesData.sort((a: any, b: any) => b.percentage - a.percentage);
    const option = {
      title: {
        show: false // Desactiva la visualización del título
      },
      tooltip: {
        trigger: 'item'
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          // data: SeriesData,
          data: SeriesData.map((item: any, index: number) => ({
            ...item,
            itemStyle: {
              // color: Constantes.COLORS[index % Constantes.COLORS.length] // Aplicar colores gradientes
              color: Constantes.COLORS[index]
            }
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}', // Muestra solo el nombre
            position: 'outside',
            alignTo: 'none',
            bleedMargin: 5,
            distanceToLabelLine: 5,
            overflow: 'break', // Permite que el texto se divida en múltiples líneas
            lineHeight: 14
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            smooth: true
          }
        }
      ]
    };
    const chart = echarts.init(this.exhibitionBrandPie.nativeElement);
    chart.clear(); // Limpia el gráfico antes de actualizarlo
    chart.setOption(option);
  
    // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }

  private combinarObjetos(obj1: any, obj2: any) {
    const resultado: any = {};

    // Obtener todas las claves (meses/semanas) de ambos objetos, sin duplicados
    const todasLasClaves = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    todasLasClaves.forEach(mes => {
        // Crear un nuevo objeto para cada mes
        resultado[mes] = {};

        // Obtener todas las claves de los subobjetos de cada mes
        const clavesSubobjetos = new Set([
            ...Object.keys(obj1[mes] || {}),
            ...Object.keys(obj2[mes] || {})
        ]);

        clavesSubobjetos.forEach(key => {
            // Sumar los valores de las claves que coincidan o tomar el valor existente si solo está en uno
            const valor1 = obj1[mes]?.[key] || 0;
            const valor2 = obj2[mes]?.[key] || 0;
            resultado[mes][key] = valor1 + valor2;
        });
    });

    return resultado;
  }

  // loadGraphicsExhibitionAdicionalBrandDescriptionPie() {
  //   let typosExhibicion: any = {};
  //   let total = 0;
  
  //   const MonthOrWeek = this.selectedMesesExbicionAdicionalMarcaDescripcion;
  //   const marca = this.selectedMarcasExbicionAdicionalMarcaDescripcion;
  //   const SeriesData: any = [];
  //   if (MonthOrWeek && marca) {
  //     for (let description in this.exhibitionAdicionalBrandAndDescription[MonthOrWeek][marca]) {
  //       typosExhibicion[description] = (typosExhibicion[description] || 0) + (this.exhibitionAdicionalBrandAndDescription[MonthOrWeek][marca][description] || 0);
  //       total += (this.exhibitionAdicionalBrandAndDescription[MonthOrWeek][marca][description] || 0);
  //     }
  //   }
  //   for (let description in typosExhibicion) {
  //     const value = typosExhibicion[description];
  //     const percentage = ((value / total) * 100).toFixed(2);
  //     SeriesData.push({
  //       value: value,
  //       name: `${description}: ${percentage}%`,
  //       // name: clave,
  //       percentage: parseFloat(percentage)
  //     });
  //   }
  //   SeriesData.sort((a: any, b: any) => b.percentage - a.percentage);
  //   const option = {
  //     title: {
  //       text: 'Skus Descripción Adicional',
  //       // subtext: 'Fake Data',
  //       left: 'center'
  //     },
  //     tooltip: {
  //       trigger: 'item'
  //     },
  //     toolbox: {
  //       feature: {
  //         saveAsImage: {}
  //       }
  //     },
  //     series: [
  //       {
  //         // name: 'Access From',
  //         type: 'pie',
  //         radius: '50%',
  //         data: SeriesData,
  //         emphasis: {
  //           itemStyle: {
  //             shadowBlur: 10,
  //             shadowOffsetX: 0,
  //             shadowColor: 'rgba(0, 0, 0, 0.5)'
  //           }
  //         },
  //         label: {
  //           show: true,
  //           formatter: '{b}', // Muestra solo el nombre
  //           position: 'outside',
  //           alignTo: 'none',
  //           bleedMargin: 5,
  //           distanceToLabelLine: 5,
  //           overflow: 'break', // Permite que el texto se divida en múltiples líneas
  //           lineHeight: 14
  //         },
  //         labelLine: {
  //           show: true,
  //           length: 15,
  //           length2: 10,
  //           smooth: true
  //         }
  //       }
  //     ]
  //   };
  //   const chart = echarts.init(this.exhibitionAdicionalBrandDescriptionPie.nativeElement);
  //   chart.clear(); // Limpia el gráfico antes de actualizarlo
  //   chart.setOption(option);
  
  //   // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
  //   window.addEventListener('resize', () => {
  //     chart.resize();
  //   });
  // }

  // loadGraphicsExhibitionContraprestadaBrandDescriptionPie() {
  //   let typosExhibicion: any = {};
  //   let total = 0;
  
  //   const MonthOrWeek = this.selectedMesesExbicionContraprestadaMarcaDescripcion;
  //   const marca = this.selectedMarcasExbicionContraprestadaMarcaDescripcion;
  //   const SeriesData: any = [];
  //   if (MonthOrWeek && marca) {
  //     for (let description in this.exhibitionContraprestadaBrandAndDescription[MonthOrWeek][marca]) {
  //       typosExhibicion[description] = (typosExhibicion[description] || 0) + (this.exhibitionContraprestadaBrandAndDescription[MonthOrWeek][marca][description] || 0);
  //       total += (this.exhibitionContraprestadaBrandAndDescription[MonthOrWeek][marca][description] || 0);
  //     }
  //   }
  //   for (let description in typosExhibicion) {
  //     const value = typosExhibicion[description];
  //     const percentage = ((value / total) * 100).toFixed(2);
  //     SeriesData.push({
  //       value: value,
  //       name: `${description}: ${percentage}%`,
  //       // name: clave,
  //       percentage: parseFloat(percentage)
  //     });
  //   }

  //   SeriesData.sort((a: any, b: any) => b.percentage - a.percentage);
  //   const option = {
  //     title: {
  //       text: 'Skus Descripción Contraprestada',
  //       // subtext: 'Fake Data',
  //       left: 'center'
  //     },
  //     tooltip: {
  //       trigger: 'item'
  //     },
  //     toolbox: {
  //       feature: {
  //         saveAsImage: {}
  //       }
  //     },
  //     series: [
  //       {
  //         // name: 'Access From',
  //         type: 'pie',
  //         radius: '50%',
  //         data: SeriesData,
  //         emphasis: {
  //           itemStyle: {
  //             shadowBlur: 10,
  //             shadowOffsetX: 0,
  //             shadowColor: 'rgba(0, 0, 0, 0.5)'
  //           }
  //         },
  //         label: {
  //           show: true,
  //           formatter: '{b}', // Muestra solo el nombre
  //           position: 'outside',
  //           alignTo: 'none',
  //           bleedMargin: 5,
  //           distanceToLabelLine: 5,
  //           overflow: 'break', // Permite que el texto se divida en múltiples líneas
  //           lineHeight: 14
  //         },
  //         labelLine: {
  //           show: true,
  //           length: 15,
  //           length2: 10,
  //           smooth: true
  //         }
  //       }
  //     ]
  //   };
  //   const chart = echarts.init(this.exhibitionContraprestadaBrandDescriptionPie.nativeElement);
  //   chart.clear(); // Limpia el gráfico antes de actualizarlo
  //   chart.setOption(option);
  
  //   // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
  //   window.addEventListener('resize', () => {
  //     chart.resize();
  //   });
  // }
  
  async getFiltersDashboard() {
    this.isLoadingGeneric = true;
    const filters: any = {};
    filters['documento_sv'] = this.filters.supervisor.list.filter((item: any) => item.checked).map((item: any) => item.value);
    filters['nombre'] = this.filters.tienda.list.filter((item: any) => item.checked).map((item: any) => item.value);
    filters['region'] = this.filters.region.list.filter((item: any) => item.checked).map((item: any) => item.value);
    filters['cadena'] = this.filters.cadena.list.filter((item: any) => item.checked).map((item: any) => item.value);
    filters['gerencia'] = this.filters.gerencia.list.filter((item: any) => item.checked).map((item: any) => item.value);
    filters['tipo'] = this.filters.tipo.list.filter((item: any) => item.checked).map((item: any) => item.value);
    filters['cliente'] = this.filters.cliente.list.filter((item: any) => item.checked).map((item: any) => item.value);
    try {
      const getFilters = await this.sharedService.getFiltersDashboard(filters);
      const filtros: any = {};
      filtros['supervisor'] = getFilters.documento_sv_and_nombre_sv.sort((a: any, b: any) => a.nombre_sv.localeCompare(b.nombre_sv));
      filtros['tienda'] = getFilters.tiendas.sort();
      filtros['region'] = getFilters.regiones.sort();
      filtros['cadena'] = getFilters.cadenas.sort();
      filtros['gerencia'] = getFilters.gerencias.sort();
      filtros['tipo'] = getFilters.tipos.sort();
      // filtros['linea'] = getFilters.lineas;
      if (this.selectExhibicionAdicionalOrContraprestada === 'adicional') {
        filtros['linea'] = getFilters.lineas.sort();
      } else if (this.selectExhibicionAdicionalOrContraprestada === 'contraprestada') {
        filtros['linea'] = this.lineasContraprestada.sort();
      } else {
        filtros['linea'] = [...new Set([...getFilters.lineas, ...this.lineasContraprestada])];
      }
      this.maintainingCheckedFilters(filtros);
      this.tempFilters = JSON.parse(JSON.stringify(this.filters));
      this.isLoadingGeneric = false;
      this.lineasAdicional = getFilters.lineas;
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.isLoadingGeneric = false;
    }
  }

  private maintainingCheckedFilters(filtros: any) {
    for (const property in filtros) {
      if (this.filters[property].list.length == 0) {
        if (property === 'supervisor') {
          this.filters[property].list = filtros.supervisor.map((item: any) => ({label: item.nombre_sv, value: item.documento_sv, checked: false}));
        } else {
          this.filters[property].list = filtros[property]?.map((item: any) => ({ label: item, value: item, checked: false }));
        }
        continue;
      }
      this.filters[property].list = filtros[property].map((item: any) => {
        let found;
        if (property === 'supervisor') {
          found = this.filters[property].list.find((element: any) => element.value == item.documento_sv);
        } else { 
          found = this.filters[property].list.find((element: any) => element.value == item);
        }
        if (found) {
          return found;
        }
        if (property === 'supervisor') {
          return {label: item.nombre_sv, value: item.documento_sv, checked: false};
        } else {
          return { label: item, value: item, checked: false };
        }
      });
    }
  }

  async initialLoadingData() {
    try {
      await Promise.all([
        this.getExhibitionAdditionalCountsByTypeMonthAndWeek(),
        this.getExhibitionAdditionalCountsByBrandMonthAndWeek(),
        this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek()
      ]);
      this.listOfMapData = this.transformData(this.exhibitionAdicionalBrandAndDescription);
      this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  async loadingDataOptions() {
    try {
      await this.getFiltersDashboard();
      this.loadingFiltersParams();
      if (this.selectExhibicionAdicionalOrContraprestada === 'adicional') {
        await Promise.all([
          this.getExhibitionAdditionalCountsByTypeMonthAndWeek(),
          this.getExhibitionAdditionalCountsByBrandMonthAndWeek(),
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        this.listOfMapData = this.transformData(this.exhibitionAdicionalBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else if (this.selectExhibicionAdicionalOrContraprestada === 'contraprestada') {
        this.getExhibitionContraMonthlySupervisorVigenteCounts();
        await Promise.all([
          this.getExhibitionContraprestadaCountsByTypeMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        this.listOfMapData = this.transformData(this.exhibitionContraprestadaBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else {
        this.getExhibitionContraMonthlySupervisorVigenteCounts();
        await Promise.all([
          this.getExhibitionAdditionalCountsByTypeMonthAndWeek(),
          this.getExhibitionAdditionalCountsByBrandMonthAndWeek(),
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByTypeMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        const resultMerge = this.mergeBackendResults(this.exhibitionAdicionalBrandAndDescription, this.exhibitionContraprestadaBrandAndDescription);
        this.listOfMapData = this.transformData(resultMerge);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);

        const tiposAdicional = this.selectExhibition.tipo.list.map((item: any) => item.value);
        const tiposContraprestada = this.selectExhibition.tipoContraprestada.list.map((item: any) => item.value);
        this.selectExhibition.tipoAdicionalAndContraprestada.list = [...new Set([...tiposAdicional, ...tiposContraprestada])].map((type: string) => {
          const found = this.selectExhibition.tipoAdicionalAndContraprestada.list.find((element: any) => element.value == type);
          if (found) {
            return found;
          }
          return { label: type, value: type, checked: false };
        });
        this.selectExhibition.tipoAdicionalAndContraprestada.list.sort((a: any, b: any) => a.value.localeCompare(b.value));
        this.selectExhibition.tipoAdicionalAndContraprestada.selectAllChecked = this.selectExhibition.tipoAdicionalAndContraprestada.list.every((item: any) => item.checked);
        this.getTitleSelectGraphic('tipoAdicionalAndContraprestada');

        const marcasAdicional = this.selectExhibition.marca.list.map((item: any) => item.value);
        const marcasContraprestada = this.selectExhibition.marcaContraprestada.list.map((item: any) => item.value);
        this.selectExhibition.marcaAdicionalAndContraprestada.list = [...new Set([...marcasAdicional, ...marcasContraprestada])].map((marca: string) => {
          const found = this.selectExhibition.marcaAdicionalAndContraprestada.list.find((element: any) => element.value == marca);
          if (found) {
            return found;
          }
          return { label: marca, value: marca, checked: false };
        });
        this.selectExhibition.marcaAdicionalAndContraprestada.list.sort((a: any, b: any) => a.value.localeCompare(b.value));
        this.selectExhibition.marcaAdicionalAndContraprestada.selectAllChecked = this.selectExhibition.marcaAdicionalAndContraprestada.list.every((item: any) => item.checked);
        this.getTitleSelectGraphic('marcaAdicionalAndContraprestada');
      }
      this.loadGraphicsExhibitionTypeStackedLine();
      this.loadGraphicsExhibitionTypePie();
      this.loadGraphicsExhibitionBrandStackedLine();
      this.loadGraphicsExhibitionBrandPie();
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  async getExhibitionAdditionalCountsByTypeMonthAndWeek() {
    try {
      this.exhibitionAdicionalType = await this.exhibitionDashboardService.getExhibitionAdditionalCountsByTypeMonthAndWeek(this.filtersParams);
      const uniqueExhibiciones: string[] = Array.from(
        new Set(
          Object.values(this.exhibitionAdicionalType as Record<string, Record<string, number>>).flatMap(exhibiciones =>
            Object.keys(exhibiciones)
          )
        )
      );
      this.selectExhibition.tipo.list = uniqueExhibiciones.map((type: string) => {
        const found = this.selectExhibition.tipo.list.find((element: any) => element.value == type);
        if (found) {
          return found;
        }
        return { label: type, value: type, checked: false };
      });
      this.selectExhibition.tipo.list.sort((a: any, b: any) => a.value.localeCompare(b.value));
      this.selectExhibition.tipo.selectAllChecked = this.selectExhibition.tipo.list.every((item: any) => item.checked);
      this.getTitleSelectGraphic('tipo');
      // this.loadGraphicsExhibitionTypeStackedLine();
      // this.loadGraphicsExhibitionTypePie();
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  async getExhibitionAdditionalCountsByBrandMonthAndWeek() {
    let typesExhibitions: string [] = [];
    if (this.selectExhibicionAdicionalOrContraprestada === 'adicional') {
      typesExhibitions = this.selectExhibition.tipo.list.filter((item: any) => item.checked).map((item: any) => item.value);
    } else if (this.selectExhibicionAdicionalOrContraprestada === 'ambos') {
      // const selectedBrands = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
      // typesExhibitions = this.selectExhibition.tipo.list.map((item: any) => item.value).filter((valor: string) => selectedBrands.includes(valor));
      typesExhibitions = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
    }
    try {
      this.exhibitionAdicionalBrand = await this.exhibitionDashboardService.getExhibitionAdditionalCountsByBrandMonthAndWeek(this.filtersParams, typesExhibitions);
      const uniqueMarcas: string[] = Array.from(
        new Set(
          Object.values(this.exhibitionAdicionalBrand as Record<string, Record<string, number>>).flatMap(marcas =>
            Object.keys(marcas)
          )
        )
      );
      this.selectExhibition.marca.list = uniqueMarcas.map((marca: string) => {
        const found = this.selectExhibition.marca.list.find((element: any) => element.value == marca);
        if (found) {
          return found;
        }
        return { label: marca, value: marca, checked: false };
      });
      this.selectExhibition.marca.list.sort((a: any, b: any) => a.value.localeCompare(b.value));
      this.selectExhibition.marca.selectAllChecked = this.selectExhibition.marca.list.every((item: any) => item.checked);
      this.getTitleSelectGraphic('marca');
      // this.loadGraphicsExhibitionBrandStackedLine();
      // this.loadGraphicsExhibitionBrandPie();
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }
  /// a usar
  async getExhibitionContraprestadaCountsByTypeMonthAndWeek() {
    try {
      this.exhibitionContraprestadaType = await this.exhibitionDashboardService.getExhibitionContraprestadaCountsByTypeMonthAndWeek(this.filtersParams);
      const uniqueExhibiciones: string[] = Array.from(
        new Set(
          Object.values(this.exhibitionContraprestadaType as Record<string, Record<string, number>>).flatMap(exhibiciones =>
            Object.keys(exhibiciones)
          )
        )
      );
      this.selectExhibition.tipoContraprestada.list = uniqueExhibiciones.map((type: string) => {
        const found = this.selectExhibition.tipoContraprestada.list.find((element: any) => element.value == type);
        if (found) {
          return found;
        }
        return { label: type, value: type, checked: false };
      });
      this.selectExhibition.tipoContraprestada.list.sort((a: any, b: any) => a.value.localeCompare(b.value));
      this.selectExhibition.tipoContraprestada.selectAllChecked = this.selectExhibition.tipoContraprestada.list.every((item: any) => item.checked);
      this.getTitleSelectGraphic('tipoContraprestada');
      // this.loadGraphicsExhibitionTypePie();
      // this.loadGraphicsExhibitionTypeStackedLine();
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  async getExhibitionContraprestadaCountsByBrandMonthAndWeek() {
    let typesExhibitions: string [] = [];
    if (this.selectExhibicionAdicionalOrContraprestada === 'contraprestada') {
      typesExhibitions = this.selectExhibition.tipoContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
    } else if (this.selectExhibicionAdicionalOrContraprestada === 'ambos') {
      // const selectedBrands = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
      // typesExhibitions = this.selectExhibition.tipoContraprestada.list.map((item: any) => item.value).filter((valor: string) => selectedBrands.includes(valor));
      typesExhibitions = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
    }
    try {
      this.exhibitionContraprestadaBrand = await this.exhibitionDashboardService.getExhibitionContraprestadaCountsByBrandMonthAndWeek(this.filtersParams, typesExhibitions);
      const uniqueMarcas: string[] = Array.from(
        new Set(
          Object.values(this.exhibitionContraprestadaBrand as Record<string, Record<string, number>>).flatMap(marcas =>
            Object.keys(marcas)
          )
        )
      );
      this.selectExhibition.marcaContraprestada.list = uniqueMarcas.map((marca: string) => {
        const found = this.selectExhibition.marcaContraprestada.list.find((element: any) => element.value == marca);
        if (found) {
          return found;
        }
        return { label: marca, value: marca, checked: false };
      });
      this.selectExhibition.marcaContraprestada.list.sort((a: any, b: any) => a.value.localeCompare(b.value));
      this.selectExhibition.marcaContraprestada.selectAllChecked = this.selectExhibition.marcaContraprestada.list.every((item: any) => item.checked);
      this.getTitleSelectGraphic('marcaContraprestada');
      // this.loadGraphicsExhibitionBrandStackedLine();
      // this.loadGraphicsExhibitionBrandPie(); 
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  getExhibitionContraMonthlySupervisorVigenteCounts() {
    this.exhibitionDashboardService.getExhibitionContraMonthlySupervisorVigenteCounts(this.filtersParams).subscribe({
      next: (result) => {
        this.exhibitionContraprestadaVigente = result;
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        this.monthNumbersVigente = [];
        this.selectExhibition.mesesNumerosVigenteContraprestada.list = result.map((element: any) => {
          this.monthNumbersVigente.push(element.month);
          const found = this.selectExhibition.mesesNumerosVigenteContraprestada.list.find((item: any) => item.value == element.month);
          if (found) {
            return found;
          } else {
            return { label: meses[element.month - 1], value: element.month, checked: false };
          }
        });
        this.selectExhibition.mesesNumerosVigenteContraprestada.selectAllChecked = this.selectExhibition.mesesNumerosVigenteContraprestada.list.every((item: any) => item.checked);
        this.getTitleSelectGraphic('mesesNumerosVigenteContraprestada');
        // this.selectedMesesExhibicionContraprestadaVigente = null;
        this.supervisorsVigente = this.getSupervisorsByMonths();
        this.loadGraphicsHorizontalBar();
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    });
  }

  // onChangeMesesExhibicionContraprestadaVigente(value: string): void {
  //   this.selectedMesesExhibicionContraprestadaVigente = value;
  //   this.loadGraphicsHorizontalBar();
  // }

  async getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek() {
    try {
      let typesExhibitions: string [] = [];
      let marcas: string [] = [];
      if (this.selectExhibicionAdicionalOrContraprestada === 'adicional') {
        typesExhibitions = this.selectExhibition.tipo.list.filter((item: any) => item.checked).map((item: any) => item.value);
        marcas = this.selectExhibition.marca.list.filter((item: any) => item.checked).map((item: any) => item.value);
      } else if (this.selectExhibicionAdicionalOrContraprestada === 'ambos') {
        // const selectedBrands = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
        // typesExhibitions = this.selectExhibition.tipo.list.map((item: any) => item.value).filter((valor: string) => selectedBrands.includes(valor));
        typesExhibitions = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
        marcas = this.selectExhibition.marcaAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
      }
      
      this.exhibitionAdicionalBrandAndDescription = await this.exhibitionDashboardService.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek(this.filtersParams, typesExhibitions, marcas);
      // const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      // const dateWithData: any = [];
      
      // if (this.filters.meses.list.filter((item: any) => item.checked).length != 0) {
      //   for (let clave in this.exhibitionAdicionalBrandAndDescription) {
      //     dateWithData.push({ label: `semana ${clave}`, value: clave});
      //   }
      // } else {
      //   for (let clave in this.exhibitionAdicionalBrandAndDescription) {
      //     dateWithData.push({ label: meses[parseInt(clave) - 1], value: clave});
      //   }
      // }
      // this.mesesExhibicionAdicionalMarcaDescripcion = dateWithData;
      // this.selectedMesesExbicionAdicionalMarcaDescripcion = null;
      // this.marcasExhibicionAdicionalMarcaDescripcion = [];
      // this.selectedMarcasExbicionAdicionalMarcaDescripcion = null;
      // this.loadGraphicsExhibitionAdicionalBrandDescriptionPie(); // para resetear y dejarlo en limpio xd

      // this.listOfMapData = this.transformData(this.exhibitionAdicionalBrandAndDescription);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  // onChangeMesesExhibicionAdicionalBrandAndDescriptionByMonthAndWeek(value: string): void {
  //   this.selectedMesesExbicionAdicionalMarcaDescripcion = value;
  //   const marcas = [];
  //   for (let marca in this.exhibitionAdicionalBrandAndDescription[value]) {
  //     marcas.push({ label: marca, value: marca});
  //   }
  //   this.marcasExhibicionAdicionalMarcaDescripcion = marcas;
  //   this.selectedMarcasExbicionAdicionalMarcaDescripcion = null;
  //   this.loadGraphicsExhibitionAdicionalBrandDescriptionPie(); // para resetear y dejarlo en limpio xd
  // }

  // onChangeMarcasExhibicionAdicionalBrandAndDescriptionByMonthAndWeek(value: string): void {
  //   this.selectedMarcasExbicionAdicionalMarcaDescripcion = value;
  //   this.loadGraphicsExhibitionAdicionalBrandDescriptionPie();
  // }

  async getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek() {
    let typesExhibitions: string [] = [];
    let marcas: string [] = [];
    if (this.selectExhibicionAdicionalOrContraprestada === 'contraprestada') {
      typesExhibitions = this.selectExhibition.tipoContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
      marcas = this.selectExhibition.marcaContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
    } else if (this.selectExhibicionAdicionalOrContraprestada === 'ambos') {
      // const selectedBrands = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
      // typesExhibitions = this.selectExhibition.tipoContraprestada.list.map((item: any) => item.value).filter((valor: string) => selectedBrands.includes(valor));
      typesExhibitions = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
      marcas = this.selectExhibition.marcaAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
    }
    try {
      this.exhibitionContraprestadaBrandAndDescription = await this.exhibitionDashboardService.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek(this.filtersParams, typesExhibitions, marcas);
      // const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      // const dateWithData: any = [];
      
      // if (this.filters.meses.list.filter((item: any) => item.checked).length != 0) {
      //   for (let clave in this.exhibitionContraprestadaBrandAndDescription) {
      //     dateWithData.push({ label: `semana ${clave}`, value: clave});
      //   }
      // } else {
      //   for (let clave in this.exhibitionContraprestadaBrandAndDescription) {
      //     dateWithData.push({ label: meses[parseInt(clave) - 1], value: clave});
      //   }
      // }
      // this.mesesExhibicionContraprestadaMarcaDescripcion = dateWithData;
      // this.selectedMesesExbicionContraprestadaMarcaDescripcion = null;
      // this.marcasExhibicionContraprestadaMarcaDescripcion = [];
      // this.selectedMarcasExbicionContraprestadaMarcaDescripcion = null;
      // this.loadGraphicsExhibitionContraprestadaBrandDescriptionPie(); // para resetear y dejarlo en limpio xd
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  // onChangeMesesExhibicionContraprestadaBrandAndDescriptionByMonthAndWeek(value: string): void {
  //   this.selectedMesesExbicionContraprestadaMarcaDescripcion = value;
  //   const marcas = [];
  //   for (let marca in this.exhibitionContraprestadaBrandAndDescription[value]) {
  //     marcas.push({ label: marca, value: marca});
  //   }
  //   this.marcasExhibicionContraprestadaMarcaDescripcion = marcas;
  //   this.selectedMarcasExbicionContraprestadaMarcaDescripcion = null;
  //   this.loadGraphicsExhibitionContraprestadaBrandDescriptionPie(); // para resetear y dejarlo en limpio xd
  // }

  // onChangeMarcasExhibicionContraprestadaBrandAndDescriptionByMonthAndWeek(value: string): void {
  //   this.selectedMarcasExbicionContraprestadaMarcaDescripcion = value;
  //   this.loadGraphicsExhibitionContraprestadaBrandDescriptionPie();
  // }

  private loadingFiltersParams() {
    let filters: any = {};
    for (const property in this.filters) {
      if (property === 'meses') {
        // const listChecked = this.filters[property].list.filter((item: any) => item.checked);
        // if (listChecked.length === 0) {
        //   filters[property] = this.filters[property].list.map((item: any) => item.value);
        // } else {
        //   filters[property] = listChecked.map((item: any) => item.value);
        // }
        filters[property] = this.filters[property].list.filter((item: any) => item.checked).map((item: any) => item.value);
      } else if (property === 'anio') {
        filters[property] = [this.getYear(this.filters[property].value)];
      } else {
        filters[property] = this.filters[property].list.filter((item: any) => item.checked).map((item: any) => item.value);
      }
    }
    this.filtersParams = JSON.parse(JSON.stringify(filters));
  }

  handleFilterChange(filtros: any) {
    this.filtersParams = JSON.parse(JSON.stringify(filtros));
    this.loadingDataOptions();
  }

  handleSelectExhibicionAdicionalOrContraprestadaChanged(value: string) {
    this.selectExhibicionAdicionalOrContraprestada = value;
    this.loadingDataOptions();
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  async onSelectAllChangeGraphic(checked: boolean, nameSelect: string) {
    this.selectExhibition[nameSelect].list.forEach((item: any) => item.checked = checked);
    this.selectExhibition[nameSelect].selectAllChecked = checked;
    this.getTitleSelectGraphic(nameSelect);
    if (nameSelect === 'tipo' || nameSelect === 'tipoContraprestada' || nameSelect === 'tipoAdicionalAndContraprestada') {
      this.loadGraphicsExhibitionTypePie();
      this.loadGraphicsExhibitionTypeStackedLine();
      if (nameSelect === 'tipo') {
        await Promise.all([
          this.getExhibitionAdditionalCountsByBrandMonthAndWeek(),
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        this.listOfMapData = this.transformData(this.exhibitionAdicionalBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else if (nameSelect === 'tipoContraprestada') {
        await Promise.all([
          this.getExhibitionContraprestadaCountsByBrandMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        this.listOfMapData = this.transformData(this.exhibitionContraprestadaBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else {
        await Promise.all([
          this.getExhibitionAdditionalCountsByBrandMonthAndWeek(),
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        const marcasAdicional = this.selectExhibition.marca.list.map((item: any) => item.value);
        const marcasContraprestada = this.selectExhibition.marcaContraprestada.list.map((item: any) => item.value);
        this.selectExhibition.marcaAdicionalAndContraprestada.list = [...new Set([...marcasAdicional, ...marcasContraprestada])].map((item: any) => ({label: item, value: item, checked: false}));
        this.selectExhibition.marcaAdicionalAndContraprestada.selectAllChecked = false;
        this.selectExhibition.marcaAdicionalAndContraprestada.titleSelect = 'Seleccione';

        const resultMerge = this.mergeBackendResults(this.exhibitionAdicionalBrandAndDescription, this.exhibitionContraprestadaBrandAndDescription);
        this.listOfMapData = this.transformData(resultMerge);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      }
      this.loadGraphicsExhibitionBrandStackedLine();
      this.loadGraphicsExhibitionBrandPie(); 
    } else if (nameSelect === 'mesesNumerosVigenteContraprestada') {
      this.supervisorsVigente = this.getSupervisorsByMonths();
      this.loadGraphicsHorizontalBar();
    } else {
      this.loadGraphicsExhibitionBrandPie();
      this.loadGraphicsExhibitionBrandStackedLine();
      if (nameSelect === 'marca') {
        await this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek();
        this.listOfMapData = this.transformData(this.exhibitionAdicionalBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else if (nameSelect === 'marcaContraprestada') {
        await this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek();
        this.listOfMapData = this.transformData(this.exhibitionContraprestadaBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else {
        await Promise.all([
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        const resultMerge = this.mergeBackendResults(this.exhibitionAdicionalBrandAndDescription, this.exhibitionContraprestadaBrandAndDescription);
        this.listOfMapData = this.transformData(resultMerge);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      }
    }
  }

  async onItemChangeGraphic(nameSelect: string) {
    this.getTitleSelectGraphic(nameSelect);
    const allChecked = this.selectExhibition[nameSelect].list.every((item: any) => item.checked)
    this.selectExhibition[nameSelect].selectAllChecked = allChecked;
    if (nameSelect === 'tipo' || nameSelect === 'tipoContraprestada' || nameSelect === 'tipoAdicionalAndContraprestada') {
      this.loadGraphicsExhibitionTypePie();
      this.loadGraphicsExhibitionTypeStackedLine();
      if (nameSelect === 'tipo') {
        await Promise.all([
          this.getExhibitionAdditionalCountsByBrandMonthAndWeek(),
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        this.listOfMapData = this.transformData(this.exhibitionAdicionalBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else if (nameSelect === 'tipoContraprestada') {
        await Promise.all([
          this.getExhibitionContraprestadaCountsByBrandMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        this.listOfMapData = this.transformData(this.exhibitionContraprestadaBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else {
        await Promise.all([
          this.getExhibitionAdditionalCountsByBrandMonthAndWeek(),
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        const marcasAdicional = this.selectExhibition.marca.list.map((item: any) => item.value);
        const marcasContraprestada = this.selectExhibition.marcaContraprestada.list.map((item: any) => item.value);
        this.selectExhibition.marcaAdicionalAndContraprestada.list = [...new Set([...marcasAdicional, ...marcasContraprestada])].map((item: any) => ({label: item, value: item, checked: false}));
        this.selectExhibition.marcaAdicionalAndContraprestada.selectAllChecked = false;
        this.selectExhibition.marcaAdicionalAndContraprestada.titleSelect = 'Seleccione';

        const resultMerge = this.mergeBackendResults(this.exhibitionAdicionalBrandAndDescription, this.exhibitionContraprestadaBrandAndDescription);
        this.listOfMapData = this.transformData(resultMerge);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      }
      this.loadGraphicsExhibitionBrandStackedLine();
      this.loadGraphicsExhibitionBrandPie(); 
    } else if (nameSelect === 'mesesNumerosVigenteContraprestada') {
      this.supervisorsVigente = this.getSupervisorsByMonths();
      this.loadGraphicsHorizontalBar();
    } else {
      this.loadGraphicsExhibitionBrandPie();
      this.loadGraphicsExhibitionBrandStackedLine();
      if (nameSelect === 'marca') {
        await this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek();
        this.listOfMapData = this.transformData(this.exhibitionAdicionalBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else if (nameSelect === 'marcaContraprestada') {
        await this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek();
        this.listOfMapData = this.transformData(this.exhibitionContraprestadaBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else {
        await Promise.all([
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        const resultMerge = this.mergeBackendResults(this.exhibitionAdicionalBrandAndDescription, this.exhibitionContraprestadaBrandAndDescription);
        this.listOfMapData = this.transformData(resultMerge);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      }
    }
  }

  async removeFilterSelectedGraphic(nameSelect: string) {
    this.selectExhibition[nameSelect].list.forEach((element: any) => {
      element.checked = false;
    });
    this.selectExhibition[nameSelect].selectAllChecked = false;
    this.getTitleSelectGraphic(nameSelect);
    if (nameSelect === 'tipo' || nameSelect === 'tipoContraprestada' || nameSelect === 'tipoAdicionalAndContraprestada') {
      this.loadGraphicsExhibitionTypePie();
      this.loadGraphicsExhibitionTypeStackedLine();
      if (nameSelect === 'tipo') {
        await Promise.all([
          this.getExhibitionAdditionalCountsByBrandMonthAndWeek(),
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        this.listOfMapData = this.transformData(this.exhibitionAdicionalBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else if (nameSelect === 'tipoContraprestada') {
        await Promise.all([
          this.getExhibitionContraprestadaCountsByBrandMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        this.listOfMapData = this.transformData(this.exhibitionContraprestadaBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else {
        await Promise.all([
          this.getExhibitionAdditionalCountsByBrandMonthAndWeek(),
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);
        const marcasAdicional = this.selectExhibition.marca.list.map((item: any) => item.value);
        const marcasContraprestada = this.selectExhibition.marcaContraprestada.list.map((item: any) => item.value);
        this.selectExhibition.marcaAdicionalAndContraprestada.list = [...new Set([...marcasAdicional, ...marcasContraprestada])].map((item: any) => ({label: item, value: item, checked: false}));
        this.selectExhibition.marcaAdicionalAndContraprestada.selectAllChecked = false;
        this.selectExhibition.marcaAdicionalAndContraprestada.titleSelect = 'Seleccione';

        const resultMerge = this.mergeBackendResults(this.exhibitionAdicionalBrandAndDescription, this.exhibitionContraprestadaBrandAndDescription);
        this.listOfMapData = this.transformData(resultMerge);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      }
      this.loadGraphicsExhibitionBrandStackedLine();
      this.loadGraphicsExhibitionBrandPie();
    } else if (nameSelect === 'mesesNumerosVigenteContraprestada') {
      this.supervisorsVigente = this.getSupervisorsByMonths();
      this.loadGraphicsHorizontalBar();
    } else { // marcas
      this.loadGraphicsExhibitionBrandPie();
      this.loadGraphicsExhibitionBrandStackedLine();
      if (nameSelect === 'marca') {
        await this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek();
        this.listOfMapData = this.transformData(this.exhibitionAdicionalBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else if (nameSelect === 'marcaContraprestada') {
        await this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek();
        this.listOfMapData = this.transformData(this.exhibitionContraprestadaBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      } else {
        await Promise.all([
          this.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek(),
          this.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek()
        ]);

        const resultMerge = this.mergeBackendResults(this.exhibitionAdicionalBrandAndDescription, this.exhibitionContraprestadaBrandAndDescription);
        this.listOfMapData = this.transformData(resultMerge);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      }
    }
  }

  private getTitleSelectGraphic(nameSelect: string) {
    const length = this.selectExhibition[nameSelect].list.length;
    const listChecked = this.selectExhibition[nameSelect].list.filter((element: any) => element.checked);
    const lenghtListChecked = listChecked.length;
    if (lenghtListChecked === 0) {
      this.selectExhibition[nameSelect].titleSelect = 'Seleccione';
    } else if (lenghtListChecked === 1) {
      this.selectExhibition[nameSelect].titleSelect = listChecked[0].label;
    } else if (lenghtListChecked === length) {
      this.selectExhibition[nameSelect].titleSelect = 'Todos';
    } else {
      this.selectExhibition[nameSelect].titleSelect = 'Multiple Selección';
    }
  }

  exportExcelExhibitionCountsByTypeMonthAndWeek(exhibition: string): void {
    this.isLoadingGeneric = true;
    if (exhibition === 'adicional') {
      this.exhibitionDashboardService.exportExcelExhibitionAdicionalCountsByTypeMonthAndWeek(this.filtersParams).subscribe({
        next: (blob: Blob) => {
          const a = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          a.href = objectUrl;
          a.download = this.dateService.generateFormattedDateForExport()+'-adicional-counts-by-type-month-and-week'+'.xlsx';
          a.click();
          URL.revokeObjectURL(objectUrl);
          this.isLoadingGeneric = false;
        },
        error: (error) => {
          console.error('Error al Exportar:', error);
          this.isLoadingGeneric = false;
        }
      });
    } else {
      this.exhibitionDashboardService.exportExcelExhibitionContraprestadaCountsByTypeMonthAndWeek(this.filtersParams).subscribe({
        next: (blob: Blob) => {
          const a = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          a.href = objectUrl;
          a.download = this.dateService.generateFormattedDateForExport()+'-contraprestada-counts-by-type-month-and-week'+'.xlsx';
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
  }

  exportExcelExhibitionCountsByBrandMonthAndWeek(exhibition: string): void {
    this.isLoadingGeneric = true;
    if (exhibition === 'adicional') {
      const typesExhibitions = this.selectExhibition.tipo.list.filter((item: any) => item.checked).map((item: any) => item.value);
      this.exhibitionDashboardService.exportExcelExhibitionAdicionalCountsByBrandMonthAndWeek(this.filtersParams, typesExhibitions).subscribe({
        next: (blob: Blob) => {
          const a = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          a.href = objectUrl;
          a.download = this.dateService.generateFormattedDateForExport()+'-adicional-counts-by-brand-month-and-week'+'.xlsx';
          a.click();
          URL.revokeObjectURL(objectUrl);
          this.isLoadingGeneric = false;
        },
        error: (error) => {
          console.error('Error al Exportar:', error);
          this.isLoadingGeneric = false;
        }
      });
    } else {
      const typesExhibitions = this.selectExhibition.tipoContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
      this.exhibitionDashboardService.exportExcelExhibitionContraprestadaCountsByBrandMonthAndWeek(this.filtersParams, typesExhibitions).subscribe({
        next: (blob: Blob) => {
          const a = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          a.href = objectUrl;
          a.download = this.dateService.generateFormattedDateForExport()+'-contraprestada-counts-by-brand-month-and-week'+'.xlsx';
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
  }

  exportExcelExhibitionCountsByBrandAndDescriptionByMonthAndWeek(exhibition: string): void {
    this.isLoadingGeneric = true;
    if (exhibition === 'adicional') {
      let typesExhibitions: string [] = [];
      let marcas: string [] = [];
      if (this.selectExhibicionAdicionalOrContraprestada === 'adicional') {
        typesExhibitions = this.selectExhibition.tipo.list.filter((item: any) => item.checked).map((item: any) => item.value);
        marcas = this.selectExhibition.marca.list.filter((item: any) => item.checked).map((item: any) => item.value);
      } else if (this.selectExhibicionAdicionalOrContraprestada === 'ambos') {
        // const selectedBrands = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
        // typesExhibitions = this.selectExhibition.tipo.list.map((item: any) => item.value).filter((valor: string) => selectedBrands.includes(valor));
        typesExhibitions = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
        marcas = this.selectExhibition.marcaAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
      }
      this.exhibitionDashboardService.exportExcelExhibitionAdicionalCountsByBrandAndDescriptionByMonthAndWeek(this.filtersParams, typesExhibitions, marcas).subscribe({
        next: (blob: Blob) => {
          const a = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          a.href = objectUrl;
          a.download = this.dateService.generateFormattedDateForExport()+'-adicional-counts-by-type-brand-description-and-week'+'.xlsx';
          a.click();
          URL.revokeObjectURL(objectUrl);
          this.isLoadingGeneric = false;
        },
        error: (error) => {
          console.error('Error al Exportar:', error);
          this.isLoadingGeneric = false;
        }
      });
    } else {
      let typesExhibitions: string [] = [];
      let marcas: string [] = [];
      if (this.selectExhibicionAdicionalOrContraprestada === 'contraprestada') {
        typesExhibitions = this.selectExhibition.tipoContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
        marcas = this.selectExhibition.marcaContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
      } else if (this.selectExhibicionAdicionalOrContraprestada === 'ambos') {
        // const selectedBrands = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
        // typesExhibitions = this.selectExhibition.tipoContraprestada.list.map((item: any) => item.value).filter((valor: string) => selectedBrands.includes(valor));
        typesExhibitions = this.selectExhibition.tipoAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
        marcas = this.selectExhibition.marcaAdicionalAndContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
      }
      this.exhibitionDashboardService.exportExcelExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek(this.filtersParams, typesExhibitions, marcas).subscribe({
        next: (blob: Blob) => {
          const a = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          a.href = objectUrl;
          a.download = this.dateService.generateFormattedDateForExport()+'-constraprestada-counts-by-type-brand-description-and-week'+'.xlsx';
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
  }

  exportExcelExhibitionContraprestadaMonthlySupervisorVigenteCounts(): void {
    this.isLoadingGeneric = true;
    this.exhibitionDashboardService.exportExcelExhibitionContraprestadaMonthlySupervisorVigenteCounts(this.filtersParams).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport()+'-monthly-supervisor-vigente-counts'+'.xlsx';
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

  private getMonthFromWeek(week: number, year: number): string {
    // Crea una nueva fecha a partir del primer día del año
    const firstDayOfYear = new Date(year, 0, 1);

    // Calcula la fecha correspondiente al primer lunes del año
    const firstMonday = new Date(
        firstDayOfYear.setDate(
            firstDayOfYear.getDate() + ((1 - firstDayOfYear.getDay() + 7) % 7)
        )
    );

    // Calcula la fecha correspondiente al inicio de la semana especificada
    const weekDate = new Date(
        firstMonday.setDate(firstMonday.getDate() + (week - 1) * 7)
    );

    // Obtén el mes correspondiente a la fecha calculada
    const month = weekDate.toLocaleString('es-ES', { month: 'short' });
    return month;
  }

  // Función que transforma los datos del backend en la estructura que necesitamos
  transformData(rawData: any): Brand[] {
    const weekNumbers = Object.keys(rawData);
    const brandMap: { [brandName: string]: Brand } = {};

    this.weekNumbers = weekNumbers;
    this.totalPerWeek = {};
    
    // Procesar datos por semana
    weekNumbers.forEach(week => {
      const weekData = rawData[week];
      let totalWeekQty = 0; // Total de todas las marcas por semana

      Object.keys(weekData).forEach(brandName => {
        let brand = brandMap[brandName];
        if (!brand) {
          brand = { key: brandName, name: brandName, children: [], weeklyTotal: {} };
          brandMap[brandName] = brand;
        }

        let totalBrandQtyForWeek = 0;

        // Procesar productos por marca
        Object.keys(weekData[brandName]).forEach(productName => {
          let product = brand.children.find(p => p.name === productName);
          if (!product) {
            product = { key: productName, name: productName, weeksData: {} };
            brand.children.push(product);
          }

          // Obtener la cantidad del producto para la semana actual
          const qty = weekData[brandName][productName];

          // Asegurarse de que qty no sea undefined antes de procesarlo
          if (qty !== undefined && qty !== null) {
            // Asignar datos de la semana actual al producto
            product.weeksData![week] = {
              qty: qty,
              mix: 0 // Se calculará después
            };

            // Sumar la cantidad del producto para el total de la marca en esta semana
            totalBrandQtyForWeek += qty;
          }
        });

        // Asignar el total de la marca para esta semana solo si hay productos con cantidades válidas
        brand.weeklyTotal![week] = {
          qty: totalBrandQtyForWeek,
          mix: 0 // Se calculará el mix de la marca después
        };

        // Sumar el total de la marca al total de la semana
        totalWeekQty += totalBrandQtyForWeek;
      });

      // Guardar el total global de la semana
      this.totalPerWeek[week] = totalWeekQty;
    });

    // Calcular el mix para cada producto y la marca
    Object.values(brandMap).forEach(brand => {
      weekNumbers.forEach(week => {
        const brandTotalForWeek = brand.weeklyTotal![week]?.qty || 0;
        const totalGlobalForWeek = this.totalPerWeek[week] || 0;

        // Calcular el mix para los productos de cada marca
        brand.children.forEach(product => {
          const weekData = product.weeksData?.[week];
          if (weekData && brandTotalForWeek > 0) {
            weekData.mix = (weekData.qty! / brandTotalForWeek) * 100;
          }
        });

        // Calcular el mix de la marca en base a la cantidad total de esa semana
        if (brandTotalForWeek > 0) {
          // brand.weeklyTotal![week].mix = 100; // En este caso, es el 100% porque es el total de la marca
          brand.weeklyTotal![week].mix = (brandTotalForWeek / totalGlobalForWeek) * 100;
        }
      });
    });

    return Object.values(brandMap);
  }
  
  // Obtener el total de cantidad por semana para la marca
  getBrandTotalQtyForWeek(brand: Brand, week: string): number {
    return brand.weeklyTotal?.[week]?.qty || 0;
  }

  // Obtener el mix de la marca por semana
  getBrandMixForWeek(brand: Brand, week: string): number {
    return brand.weeklyTotal?.[week]?.mix || 0;
  }

  mergeBackendResults(result1: any, result2: any) {
    const mergedResult: any = {};
  
    // Función para agregar o sumar cantidades al objeto mergedResult
    const addOrUpdateProduct = (month: string, brand: string, product: string, quantity: number) => {
      if (!mergedResult[month]) {
        mergedResult[month] = {};
      }
  
      if (!mergedResult[month][brand]) {
        mergedResult[month][brand] = {};
      }
  
      if (!mergedResult[month][brand][product]) {
        mergedResult[month][brand][product] = 0;
      }
  
      mergedResult[month][brand][product] += quantity;
    };
  
    // Función para recorrer un resultado y agregar sus valores al mergedResult
    const processResult = (result: any) => {
      for (const month in result) {
        for (const brand in result[month]) {
          for (const product in result[month][brand]) {
            const quantity = result[month][brand][product];
            addOrUpdateProduct(month, brand, product, quantity);
          }
        }
      }
    };
  
    // Procesar ambos resultados
    processResult(result1);
    processResult(result2);
  
    return mergedResult;
  };

  sortedBrandAndDescriptionLastWeekOrMonth(listObject: any[]) {
    // Obtener la ante penultima semana
    let lastWeek: string;
    if (this.weekNumbers.length > 1) {
      lastWeek = this.weekNumbers[this.weekNumbers.length - 2];
    } else {
      lastWeek = this.weekNumbers[0];
    }
    // const lastWeek = this.weekNumbers[this.weekNumbers.length - 1];
  
    // Función para obtener el valor de qty de la última semana, si no existe retorna -1
    const getQtyForLastWeek = (item: any, lastWeek: string): number => {
      const weekData = item.weeksData?.[lastWeek];
      return weekData ? weekData.qty : -1; // Si no hay datos para esa semana, se considera -1 para mover al final
    };
  
    // Ordenar los hijos
    const sortChildren = (children: any[], lastWeek: string) => {
      return children.sort((a, b) => {
        const qtyA = getQtyForLastWeek(a, lastWeek);
        const qtyB = getQtyForLastWeek(b, lastWeek);
        return qtyB - qtyA; // Orden descendente por qty
      });
    };
  
    // Ordenar los padres y dentro de cada padre ordenar sus hijos
    const sortedList = listObject.sort((a, b) => {
      a.children = sortChildren(a.children, lastWeek);
      b.children = sortChildren(b.children, lastWeek);

      // Ordenar padres
      const parentQtyA = a.weeklyTotal?.[lastWeek]?.qty || 0;
      const parentQtyB = b.weeklyTotal?.[lastWeek]?.qty || 0;

      return parentQtyB - parentQtyA;
    });
  
    return sortedList;
  }

  getSupervisorsByMonths() {
    // Convertir weekNumbers a números
    const exhibitionContraprestadaVigente = JSON.parse(JSON.stringify(this.exhibitionContraprestadaVigente));
    const months = this.selectExhibition.mesesNumerosVigenteContraprestada.list.filter((item: any) => item.checked).map((item: any) => item.value);
  
    // Diccionario para acumular los supervisores por su nombre
    const supervisorMap: { [key: string]: any } = {};
  
    // Recorrer el array de data buscando los meses que coinciden
    exhibitionContraprestadaVigente.forEach((monthData: any) => {
      if (months.includes(monthData.month)) {
        monthData.supervisors.forEach((supervisor: any) => {
          const { supervisor: name, counts } = supervisor;
          
          // Si ya existe el supervisor en el mapa, sumamos los valores
          if (supervisorMap[name]) {
            supervisorMap[name].counts.true += counts.true;
            supervisorMap[name].counts.false += counts.false;
          } else {
            // Si no existe, lo agregamos al mapa
            supervisorMap[name] = { ...supervisor };
          }
        });
      }
    });
  
    // Retornar el array con los supervisores acumulados
    return Object.values(supervisorMap);
  };

  handlePopoverVisibleChange(visible: boolean): void {
    this.isPopoverVisibleExportFileMarcaDescripcion = visible;
  }

  togglePopover(event: Event): void {
    event.stopPropagation();
  }

  clickMePopover(): void {
    this.isPopoverVisibleExportFileMarcaDescripcion = false;
  }
}
