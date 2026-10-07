import { ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { SharedService } from '@shared/services/shared.service';
import { ExhibitionACompetenciaDashboardService } from './exhibition-competencia-dashboard.service';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { DateService } from '@shared/services/date.service';
import { FilterDashboardComponent } from '@shared/components/filter-dashboard/filter-dashboard.component';
import { FilterDashboardSharedService } from '@shared/services/dashboard/filter-dashboard-shared.service';
import Constantes from '@shared/constants/contants';

// interface BackendDataExhibitionBrandDescription {
//   [month: string]: {
//     [brand: string]: {
//       [product: string]: number;
//     };
//   };
// }

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
  selector: 'app-exhibition-competencia-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  templateUrl: './exhibition-competencia-dashboard.component.html',
  styleUrl: './exhibition-competencia-dashboard.component.scss',
})
export class ExhibitionCompetenciaDashboardComponent {
  private windowWidth: number;
  isScreenSmall: boolean = false;
  @ViewChild('exhibitionTypeStackedLine') exhibitionTypeStackedLine!: ElementRef;
  @ViewChild('exhibitionTypePie') exhibitionTypePie!: ElementRef;
  @ViewChild('exhibitionBrandStackedLine') exhibitionBrandStackedLine!: ElementRef;
  @ViewChild('exhibitionBrandPie') exhibitionBrandPie!: ElementRef;
  // @ViewChild('exhibitionBrandDescriptionBar') exhibitionBrandDescriptionBar!: ElementRef;
  exhibitionCompetenciaType: any = {};
  exhibitionCompetenciaBrand: any = {};
  exhibitionCompetenciaBrandAndDescription: any = {};
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
    }
  };
  // selectedMarcasExbicionCompetenciaMarcaDescripcion: any = null;
  // marcasExhibicionCompetenciaMarcaDescripcion: any = [];
  isLoadingGeneric: boolean = false;

  weekNumbers: string[] = []; // Las semanas dinámicas
  listOfMapData: Brand[] = [];
  totalPerWeek: { [week: string]: number } = {};
  isPopoverVisibleExportFileMarcaDescripcion: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private filterDashboardSharedService: FilterDashboardSharedService,
    private exhibitionACompetenciaDashboardService: ExhibitionACompetenciaDashboardService,
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

  loadGraphicsExhibitionTypeStackedLine() {
    // let nameEjeX = this.filters.meses.list.filter((item: any) => item.checked).length === 0 
    // ? this.getYear(this.filters.anio.value) 
    // : 'semana';
    const year = this.getYear(this.filters.anio.value);
    const existMonths = this.filters.meses.list.filter((item: any) => item.checked).length != 0;
    let typosExhibicion: any = {};
    let namesEjeX = [];
    let totalesPorPeriodo: { [key: string]: number } = {};
    // Primer paso: calcular los totales por período
    for (let clave in this.exhibitionCompetenciaType) {
      let totalPeriodo = 0;
      this.selectExhibition.tipo.list.forEach((element: any) => {
        totalPeriodo += this.exhibitionCompetenciaType[clave][element.value] || 0;
      });
      totalesPorPeriodo[clave] = totalPeriodo;
    }
  
    // Segundo paso: calcular porcentajes y organizar datos
    for (let clave in this.exhibitionCompetenciaType) {
      if (existMonths) {
        namesEjeX.push(this.getMonthFromWeek(parseInt(clave), year) + ' ' + clave);
      } else {
        namesEjeX.push(year + ' ' + clave);
      }
      
      this.selectExhibition.tipo.list.forEach((element: any) => {
        const valor = this.exhibitionCompetenciaType[clave][element.value] || 0;
        // const porcentaje = (valor / totalPeriodo) * 100;
        if (typosExhibicion.hasOwnProperty(element.value)) {
          // typosExhibicion[element.value].push(porcentaje);
          typosExhibicion[element.value].push(valor);
        } else {
          // typosExhibicion[element.value] = [porcentaje];
          typosExhibicion[element.value] = [valor];
        }
      });
    }

    const series = this.selectExhibition.tipo.list.filter((item: any) => item.checked).map((item: any) => ({
      name: item.value,
      type: 'line',
      // stack: 'Total',
      data: typosExhibicion[item.value],
      // areaStyle: {},
      emphasis: {
        focus: 'series'
      }
    }));

    const option = {
      // title: {
      //   text: 'Evolutivo por Tipo de Elementos',
      //   left: 'center',
      //   top: 0,
      //   textStyle: {
      //     fontSize: 16
      //   }
      // },
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
          // tooltip += `<b>Total: ${total}</b><br/>`;
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
        top: 120 // separacion de leyenda con el grafico
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
    
    let brands: any = {};
    let namesEjeX = [];
    let totalesPorPeriodo: { [key: string]: number } = {};
    
    // Primer paso: calcular los totales por período
    for (let clave in this.exhibitionCompetenciaBrand) {
      let totalPeriodo = 0;
      for (let key in this.exhibitionCompetenciaBrand[clave]) {
        totalPeriodo += this.exhibitionCompetenciaBrand[clave][key] || 0;
      }
      totalesPorPeriodo[clave] = totalPeriodo;
    }
      
    let brandsTotales: any = {};
    // Segundo paso: calcular porcentajes y organizar datos
    for (let mesNumber in this.exhibitionCompetenciaBrand) {
      if (existMonths) {
        namesEjeX.push(this.getMonthFromWeek(parseInt(mesNumber), year) + ' ' + mesNumber);
      } else {
        namesEjeX.push(year + ' ' + mesNumber);
      }
      this.selectExhibition.marca.list.forEach((element: any) => {
        brandsTotales[element.value] = this.exhibitionCompetenciaBrand[mesNumber][element.value] || 0;
      });
      for (let key in this.exhibitionCompetenciaBrand[mesNumber]) {
        if (!this.selectExhibition.marca.list.map((item: any) => item.value).includes(key)) {
          brandsTotales['otros'] = (brandsTotales['otros'] || 0) + (this.exhibitionCompetenciaBrand[mesNumber][key] || 0);
        }
      }
      // Guardar los valores sin convertir a porcentajes
      for (let key in brandsTotales) {
        const valor = brandsTotales[key] || 0;
        if (brands.hasOwnProperty(key)) {
            brands[key].push(valor);
        } else {
            brands[key] = [valor];
        }
      }
      brandsTotales['otros'] = 0;
    }
    
    const series = this.selectExhibition.marca.list.filter((item: any) => item.checked).map((item: any) => ({
      name: item.value,
      type: 'line',
      // stack: 'Total',
      data: brands[item.value],
      // areaStyle: {},
      emphasis: {
        focus: 'series'
      }
    }));
    
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
          // tooltip += `<b>Total: ${total}</b><br/>`;
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
        top: 120 // Aumentar el espacio superior para el título y la leyenda
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
    
    for (let clave in this.exhibitionCompetenciaType) {
      // this.selectExhibition.tipo.list.forEach((element: any) => {
      //   typosExhibicion[element.value] = (typosExhibicion[element.value] || 0) + (this.exhibitionCompetenciaType[clave][element.value] || 0);
      //   total += (this.exhibitionCompetenciaType[clave][element.value] || 0);
      // });
      for (let type in this.exhibitionCompetenciaType[clave]) {
        typosExhibicion[type] = (typosExhibicion[type] || 0) + this.exhibitionCompetenciaType[clave][type];
        total += this.exhibitionCompetenciaType[clave][type];
      }
    }

    const SeriesData: any = [];
    this.selectExhibition.tipo.list.filter((item: any) => item.checked).forEach((element: any) => {
      const value = typosExhibicion[element.value];
      const percentage = ((value / total) * 100).toFixed(2);
      SeriesData.push({
        value: value,
        name: `${element.value}: ${percentage}%`,
        // name: clave,
        percentage: parseFloat(percentage)
      });
    });
  
    // Sort SeriesData by percentage in descending order
    // SeriesData.sort((a, b) => b.percentage - a.percentage);
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
          // name: 'Access From',
          type: 'pie',
          radius: '50%',
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
    // echarts.init(this.exhibitionTypePie.nativeElement).setOption(option);
    const chart = echarts.init(this.exhibitionTypePie.nativeElement);
    chart.clear(); // Limpia el gráfico antes de actualizarlo
    chart.setOption(option);
  
    // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }

  loadGraphicsExhibitionBrandPie() {
    let brands: any = {};
    let total = 0;
    for (let mes in this.exhibitionCompetenciaBrand) {
      // for (let key in this.exhibitionCompetenciaBrand[mes]) {
      //   if (!this.selectExhibition.marca.list.map((item: any) => item.value).includes(key)) {
      //     brands['otros'] = (brands['otros'] || 0) + (this.exhibitionCompetenciaBrand[mes][key] || 0);
      //     total += this.exhibitionCompetenciaBrand[mes][key] ? this.exhibitionCompetenciaBrand[mes][key] : 0;
      //   }
      // }
      this.selectExhibition.marca.list.forEach((element: any) => {
        brands[element.value] = (brands[element.value] || 0) + (this.exhibitionCompetenciaBrand[mes][element.value] || 0);
        total += (this.exhibitionCompetenciaBrand[mes][element.value] || 0);
      });
    }

    const SeriesData: any = [];
    this.selectExhibition.marca.list.filter((item: any) => item.checked).forEach((element: any) => {
      const value = brands[element.value];
      const percentage = ((value / total) * 100).toFixed(2);
      SeriesData.push({
        value: value,
        name: `${element.value}: ${percentage}%`,
        // name: clave,
        percentage: parseFloat(percentage)
      });
    });
    SeriesData.sort((a: any, b: any) => b.percentage - a.percentage);
    const option = {
      title: {
        show: false // Desactiva la visualización del título
      },
      tooltip: {
        trigger: 'item'
      },
      // legend: {
      //   top: '5%',
      //   left: 'center'
      // },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      series: [
        {
          // name: 'Access From',
          type: 'pie',
          radius: '50%',
          data: SeriesData.map((item: any, index: number) => ({
            ...item,
            itemStyle: {
              // color: Constantes.COLORS[index % Constantes.COLORS.length] // Aplicar colores gradientes
              color: Constantes.COLORS[index]
            }
          })), 
          // emphasis: {
          //   itemStyle: {
          //     shadowBlur: 10,
          //     shadowOffsetX: 0,
          //     shadowColor: 'rgba(0, 0, 0, 0.5)'
          //   }
          // }
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
    // echarts.init(this.exhibitionBrandPie.nativeElement).setOption(option);
    const chart = echarts.init(this.exhibitionBrandPie.nativeElement);
    chart.clear(); // Limpia el gráfico antes de actualizarlo
    chart.setOption(option);
  
    // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }

  // loadGraphicsExhibitionBrandDescriptionBar() {
  //   let nameEjeX = this.filters.meses.list.filter((item: any) => item.checked).length === 0 
  //   ? this.getYear(this.filters.anio.value) 
  //   : 'semana';
  //   let namesEjeX: any = [];
  //   const marca = this.selectedMarcasExbicionCompetenciaMarcaDescripcion;
  //   const dataForChart = this.transformDataForChartExhibitionBrandDescriptionBar(this.exhibitionCompetenciaBrandAndDescription, marca);
  //   dataForChart.months.forEach((item: any) => {
  //     namesEjeX.push(nameEjeX + ' ' + item);
  //   })
  //   const option = {
  //     title: {
  //       text: 'SKUS',
  //       left: 'center',
  //       top: 0,
  //       textStyle: {
  //         fontSize: 16
  //       }
  //     },
  //     tooltip: {
  //       trigger: 'axis',
  //       axisPointer: {
  //         type: 'shadow'
  //       },
  //       formatter: function (params: any) {
  //         let tooltipText = '';
  //         params.forEach((param: any, index: number) => {
  //           const value = param.value;
  //           const total = dataForChart.totals[param.dataIndex] || 0; // Obtener el total correcto por índice
  //           const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00'; // Asegurar que no haya división por cero
  //           tooltipText += `${param.marker} ${param.seriesName}: ${value} unidades (${percentage}%)<br/>`;
  //         });
  //         return tooltipText;
  //       }
  //     },
  //     toolbox: {
  //       feature: {
  //         // dataView: { show: true, readOnly: false },
  //         // magicType: { show: true, type: ['line', 'bar'] },
  //         // restore: { show: true },
  //         // saveAsImage: { show: true }
  //       }
  //     },
  //     xAxis: [
  //       {
  //         type: 'category',
  //         data: namesEjeX,
  //         axisPointer: {
  //           type: 'shadow'
  //         }
  //       }
  //     ],
  //     yAxis: [
  //       {
  //         type: 'value',
  //         name: 'Cantidad',
  //         min: 0,
  //         axisLabel: {
  //           formatter: '{value}'
  //         }
  //       }
  //     ],
  //     series: Object.entries(dataForChart.products).map(([product, quantities]) => ({
  //       name: product,
  //       type: 'bar',
  //       data: quantities,
  //       tooltip: {
  //         valueFormatter: function (value: any) {
  //           return value + ' unidades';
  //         }
  //       }
  //     }))
  //   };
  //   const chart = echarts.init(this.exhibitionBrandDescriptionBar.nativeElement);
  //   chart.clear(); // Limpia el gráfico antes de actualizarlo
  //   chart.setOption(option);
  
  //   // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
  //   window.addEventListener('resize', () => {
  //     chart.resize();
  //   });
  // }

  // private transformDataForChartExhibitionBrandDescriptionBar(backendData: BackendDataExhibitionBrandDescription, selectedBrand: string) {
  //   const transformedData = {
  //     months: [] as string[],
  //     products: {} as { [key: string]: number[] },
  //     totals: [] as number[] // Totales por mes
  //   };
  
  //   // Recorrer los meses (7, 8, 9, etc.)
  //   for (const [month, brands] of Object.entries(backendData)) {
  //     if (brands[selectedBrand]) {
  //       // Si la marca seleccionada está presente en este mes
  //       transformedData.months.push(month);

  //       let monthTotal = 0; // Inicializa el total del mes

  //       for (const [product, quantity] of Object.entries(brands[selectedBrand])) {
  //         if (!transformedData.products[product]) {
  //           transformedData.products[product] = new Array(transformedData.months.length - 1).fill(0); // Asegura que todas las entradas anteriores sean 0
  //         }
  //         transformedData.products[product].push(quantity);
  //         monthTotal += quantity; // Acumula el total del mes
  //       }

  //       // Asegura que todos los productos tengan la misma longitud de datos
  //       Object.keys(transformedData.products).forEach(product => {
  //         if (transformedData.products[product].length < transformedData.months.length) {
  //           transformedData.products[product].push(0);
  //         }
  //       });

  //       transformedData.totals.push(monthTotal); // Agregar el total del mes
  //     }
  //   }

  //   return transformedData;
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
    try {
      const getFilters = await this.sharedService.getFiltersDashboard(filters);
      const filtros: any = {};
      // points.sort(function(a, b){return a-b});
      filtros['supervisor'] = getFilters.documento_sv_and_nombre_sv.sort((a: any, b: any) => a.nombre_sv.localeCompare(b.nombre_sv));
      filtros['tienda'] = getFilters.tiendas.sort();
      filtros['region'] = getFilters.regiones.sort();
      filtros['cadena'] = getFilters.cadenas.sort();
      filtros['gerencia'] = getFilters.gerencias.sort();
      filtros['tipo'] = getFilters.tipos.sort();
      filtros['linea'] = getFilters.lineas.sort();
      this.maintainingCheckedFilters(filtros);
      this.tempFilters = JSON.parse(JSON.stringify(this.filters));
      this.isLoadingGeneric = false;
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

  initialLoadingData() {
    this.getExhibitionCompetenciaCountsByTypeMonthAndWeek();
    this.getExhibitionCompetenciaCountsByBrandMonthAndWeek();
    this.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek();
  }

  async loadingDataOptions() {
    await this.getFiltersDashboard();
    this.loadingFiltersParams();
    this.getExhibitionCompetenciaCountsByTypeMonthAndWeek();
    this.getExhibitionCompetenciaCountsByBrandMonthAndWeek();
    this.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek();
  }

  getExhibitionCompetenciaCountsByTypeMonthAndWeek() {
    this.exhibitionACompetenciaDashboardService.getExhibitionCompetenciaCountsByTypeMonthAndWeek(this.filtersParams).subscribe({
      next: (result) => {
        this.exhibitionCompetenciaType = result;
        const uniqueExhibiciones: string[] = Array.from(
          new Set(
            Object.values(this.exhibitionCompetenciaType as Record<string, Record<string, number>>).flatMap(exhibiciones =>
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
        this.loadGraphicsExhibitionTypeStackedLine();
        this.loadGraphicsExhibitionTypePie();
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    });
  }

  getExhibitionCompetenciaCountsByBrandMonthAndWeek() {
    const typesExhibitions = this.selectExhibition.tipo.list.filter((item: any) => item.checked).map((item: any) => item.value);
    this.exhibitionACompetenciaDashboardService.getExhibitionCompetenciaCountsByBrandMonthAndWeek(this.filtersParams, typesExhibitions).subscribe({
      next: (result) => {
        this.exhibitionCompetenciaBrand = result;
        const uniqueMarcas: string[] = Array.from(
          new Set(
            Object.values(this.exhibitionCompetenciaBrand as Record<string, Record<string, number>>).flatMap(marcas =>
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
        this.loadGraphicsExhibitionBrandStackedLine();
        this.loadGraphicsExhibitionBrandPie();
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    });
  }

  getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek() {
    const typesExhibitions = this.selectExhibition.tipo.list.filter((item: any) => item.checked).map((item: any) => item.value);
    const marcas = this.selectExhibition.marca.list.filter((item: any) => item.checked).map((item: any) => item.value);
    this.exhibitionACompetenciaDashboardService.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek(this.filtersParams, typesExhibitions, marcas).subscribe({
      next: (result) => {
        this.exhibitionCompetenciaBrandAndDescription = result;
        // // Extraer las marcas
        // const marcas = new Set();
        // // Recorrer los meses o semanas
        // for (const mesOrSemana in this.exhibitionCompetenciaBrandAndDescription) {
        //     // Recorrer las marcas dentro de cada mes
        //     for (const marca in this.exhibitionCompetenciaBrandAndDescription[mesOrSemana]) {
        //         marcas.add(marca); // Añadir cada marca al Set
        //     }
        // }
        // // Convertir el Set a un array para que las marcas sean únicas
        // const marcasUnicas = Array.from(marcas);
        // this.marcasExhibicionCompetenciaMarcaDescripcion = marcasUnicas.map((marca: any) => ({ label: marca, value: marca}));
        // this.selectedMarcasExbicionCompetenciaMarcaDescripcion = null;
        // this.loadGraphicsExhibitionBrandDescriptionBar(); // para resetear y dejarlo en limpio xd

        this.listOfMapData = this.transformData(this.exhibitionCompetenciaBrandAndDescription);
        this.sortedBrandAndDescriptionLastWeekOrMonth(this.listOfMapData);
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    });
  }

  // onChangeMarcasExhibicionCompetenciaBrandAndDescriptionByMonthAndWeek(value: string): void {
  //   this.selectedMarcasExbicionCompetenciaMarcaDescripcion = value;
  //   this.loadGraphicsExhibitionBrandDescriptionBar();
  // }

  private loadingFiltersParams() {
    let filters: any = {};
    for (const property in this.filters) {
      if (property === 'anio') {
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
  
  onSelectAllChangeGraphic(checked: boolean, nameSelect: string): void {
    this.selectExhibition[nameSelect].list.forEach((item: any) => item.checked = checked);
    this.selectExhibition[nameSelect].selectAllChecked = checked;
    this.getTitleSelectGraphic(nameSelect);
    if (nameSelect === 'tipo') {
      this.loadGraphicsExhibitionTypePie();
      this.loadGraphicsExhibitionTypeStackedLine();
      this.getExhibitionCompetenciaCountsByBrandMonthAndWeek();
      this.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek();
    } else { // marca
      this.loadGraphicsExhibitionBrandPie();
      this.loadGraphicsExhibitionBrandStackedLine();
      this.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek();
    }
  }

  onItemChangeGraphic(nameSelect: string): void {
    this.getTitleSelectGraphic(nameSelect);
    const allChecked = this.selectExhibition[nameSelect].list.every((item: any) => item.checked)
    this.selectExhibition[nameSelect].selectAllChecked = allChecked;
    if (nameSelect === 'tipo') {
      this.loadGraphicsExhibitionTypePie();
      this.loadGraphicsExhibitionTypeStackedLine();
      this.getExhibitionCompetenciaCountsByBrandMonthAndWeek();
      this.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek();
    } else { // marca
      this.loadGraphicsExhibitionBrandPie();
      this.loadGraphicsExhibitionBrandStackedLine();
      this.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek();
    }
  }

  removeFilterSelectedGraphic(nameSelect: string) {
    this.selectExhibition[nameSelect].list.forEach((element: any) => {
      element.checked = false;
    });
    this.selectExhibition[nameSelect].selectAllChecked = false;
    this.getTitleSelectGraphic(nameSelect);
    if (nameSelect === 'tipo') {
      this.loadGraphicsExhibitionTypePie();
      this.loadGraphicsExhibitionTypeStackedLine();
      this.getExhibitionCompetenciaCountsByBrandMonthAndWeek();
      this.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek();
    } else { // marca
      this.loadGraphicsExhibitionBrandPie();
      this.loadGraphicsExhibitionBrandStackedLine();
      this.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek();
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

  exportExcelExhibitionCompetenciaCountsByTypeMonthAndWeek(): void {
    this.isLoadingGeneric = true;
    this.exhibitionACompetenciaDashboardService.exportExcelExhibitionCompetenciaCountsByTypeMonthAndWeek(this.filtersParams).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport()+'-competencia-counts-by-type-month-and-week'+'.xlsx';
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

  exportExcelExhibitionCompetenciaCountsByBrandMonthAndWeek(): void {
    this.isLoadingGeneric = true;
    const typesExhibitions = this.selectExhibition.tipo.list.filter((item: any) => item.checked).map((item: any) => item.value);
    this.exhibitionACompetenciaDashboardService.exportExcelExhibitionCompetenciaCountsByBrandMonthAndWeek(this.filtersParams, typesExhibitions).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport()+'-competencia-counts-by-brand-month-and-week'+'.xlsx';
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

  exportExcelExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek(): void {
    this.isLoadingGeneric = true;
    const typesExhibitions = this.selectExhibition.tipo.list.filter((item: any) => item.checked).map((item: any) => item.value);
    const marcas = this.selectExhibition.marca.list.filter((item: any) => item.checked).map((item: any) => item.value);
    this.exhibitionACompetenciaDashboardService.exportExcelExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek(this.filtersParams, typesExhibitions, marcas).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport()+'-competencia-counts-by-type-brand-description-and-week'+'.xlsx';
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

  getYear(date: Date): number {
    return date.getFullYear();
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
    console.log('this.weekNumbers', this.weekNumbers)
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