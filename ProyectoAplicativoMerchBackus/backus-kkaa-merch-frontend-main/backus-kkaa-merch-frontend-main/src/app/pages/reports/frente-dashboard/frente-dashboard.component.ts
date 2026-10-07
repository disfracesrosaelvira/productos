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
import { NzLayoutModule } from 'ng-zorro-antd/layout';

import * as echarts from 'echarts';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { SharedService } from '@shared/services/shared.service';
import { DateService } from '@shared/services/date.service';
import { FrenteDashboardService } from './frente-dashboard.service';
import { FilterDashboardComponent } from '@shared/components/filter-dashboard/filter-dashboard.component';
import { FilterDashboardSharedService } from '@shared/services/dashboard/filter-dashboard-shared.service';
import Constantes from '@shared/constants/contants';

@Component({
  selector: 'app-frente-dashboard',
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
    NzLayoutModule,
    SpinnerLoadingComponent,
    FilterDashboardComponent
  ],
  templateUrl: './frente-dashboard.component.html',
  styleUrl: './frente-dashboard.component.scss'
})
export class FrenteDashboardComponent {
  private windowWidth: number;
  isScreenSmall: boolean = false;
  @ViewChild('frenteBrandsForStoreStackedLine') frenteBrandsForStoreStackedLine!: ElementRef;
  @ViewChild('frenteBrandStackedBar') frenteBrandStackedBar!: ElementRef;
  frenteBrand: any = {};
  filtersParams: any = {};
  filters: any = this.filterDashboardSharedService.getInitialFilters();
  tempFilters: any = JSON.parse(JSON.stringify(this.filters));
  selectComboBox: any = {
    marca: {
      selectAllChecked: false,
      titleSelect: 'Seleccione',
      list: []
    }
  };
  isLoadingGeneric: boolean = false;
  codigoValues: string = 'sku_linea_marca';
  listMarcasCompetencia: string [] = [];
  dataSkuLineaMarca: any = {};

  averageBrandsForStore: any = {};
  
  constructor(
    private cdr: ChangeDetectorRef,
    private filterDashboardSharedService: FilterDashboardSharedService,
    private frenteDashboardService: FrenteDashboardService,
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

  async ngOnInit() {
    this.getFiltersDashboard();
    await this.getLineaMarcas();
  }

  async ngAfterViewInit() {
    this.loadingFiltersParams();
    this.initialLoadingData();
  }

  loadGraphicsFrenteBrandForStoreStackedLine() {
    const year = this.getYear(this.filters.anio.value);
    const existMonths = this.filters.meses.list.filter((item: any) => item.checked).length != 0;
    let namesEjeX = [];
    const data: any = {
      promedioPorcentajeMarca: {
        name: 'BK',
        valores: [],
      },
      promedioPorcentajeMarcaCompetencia: {
        name: 'HNK',
        valores: [],
      }
    }
    for (let clave in this.averageBrandsForStore) { // clave (mes o semana)
      if (existMonths) {
        namesEjeX.push(this.getMonthFromWeek(parseInt(clave), year) + ' ' + clave);
      } else {
        namesEjeX.push(year + ' ' + clave);
      }
      data.promedioPorcentajeMarca.valores.push(this.averageBrandsForStore[clave].promedioPorcentajeMarca);
      data.promedioPorcentajeMarcaCompetencia.valores.push(this.averageBrandsForStore[clave].promedioPorcentajeMarcaCompetencia);
    }
    const series = ['promedioPorcentajeMarca', 'promedioPorcentajeMarcaCompetencia'].map((key: string) => ({
      name: data[key].name,
      type: 'line',
      data: data[key].valores,
      emphasis: {
        focus: 'series'
      },
      label: {
        show: true, // Muestra las etiquetas en cada punto de la línea
        position: 'top', // Ubica la etiqueta sobre el punto
        formatter: '{c}%' // Formatea la etiqueta para que muestre el valor seguido de '%'
      }
    }))
    
    const option = {
      title: {
        show: false // Desactiva la visualización del título
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let tooltip = params[0].axisValueLabel + '<br/>';
          params.forEach((param: any) => {
              tooltip += `${param.marker}${param.seriesName}: ${param.value}%<br/>`;
          });
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
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: series,
      color: Constantes.COLORS
    };
    const chart = echarts.init(this.frenteBrandsForStoreStackedLine.nativeElement);
    chart.clear(); // Limpia el gráfico antes de actualizarlo
    chart.setOption(option);
  
    // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }

  loadGraphicsFrenteBrandStackedBar() {
    const year = this.getYear(this.filters.anio.value);
    const existMonths = this.filters.meses.list.filter((item: any) => item.checked).length != 0;

    let brands: any = {};
    let namesEjeX = [];
    let totalesPorPeriodo: { [key: string]: number } = {};
    
    // Primer paso: calcular los totales por período
    for (let clave in this.frenteBrand) {
      let totalPeriodo = 0;
      for (let key in this.frenteBrand[clave]) {
        totalPeriodo += this.frenteBrand[clave][key] || 0;
      }
      totalesPorPeriodo[clave] = totalPeriodo;
    }

    let brandsTotales: any = {};
    // Segundo paso: calcular porcentajes y organizar datos
    for (let mesNumber in this.frenteBrand) {
      if (existMonths) {
        namesEjeX.push(this.getMonthFromWeek(parseInt(mesNumber), year) + ' ' + mesNumber);
      } else {
        namesEjeX.push(year + ' ' + mesNumber);
      }

      this.selectComboBox.marca.list.forEach((element: any) => {
        brandsTotales[element.value] = (this.frenteBrand[mesNumber][element.value] || 0) / totalesPorPeriodo[mesNumber];
      });

      for (let key in brandsTotales) {
        const valor = brandsTotales[key] || 0;
        if (brands.hasOwnProperty(key)) {
          brands[key].push(valor);
        } else {
          brands[key] = [valor];
        }
      }
    }
    const marcas: string[] = [];
    const marcasCompetencia: string[] = [];
    this.selectComboBox.marca.list.filter((item: any) => item.checked).forEach((element: any) => {
      if (this.listMarcasCompetencia.includes(element.value)) {
        marcasCompetencia.push(element.value);
      } else {
        marcas.push(element.value);
      }
    });

    const series = [...marcas, ...marcasCompetencia].map((marca: string) => ({
      name: marca,
      type: 'bar',
      stack: 'total',
      barWidth: '60%',
      label: {
        show: true,
        formatter: (params: any) => {
          const percentage = params.value * 100;
          return percentage >= 3 ? `${percentage.toFixed(1)}%` : ''; // Mostrar solo si es >= 3%
        }
      },
      data: brands[marca]
    }))
    // const series = this.selectComboBox.marca.list.filter((item: any) => item.checked).map((item: any) => ({
    //   name: item.value,
    //   type: 'bar',
    //   stack: 'total',
    //   barWidth: '60%',
    //   label: {
    //     show: true,
    //     formatter: (params: any) => {
    //       const percentage = params.value * 100;
    //       return percentage >= 3 ? `${percentage.toFixed(1)}%` : ''; // Mostrar solo si es >= 3%
    //     }
    //   },
    //   data: brands[item.value]
    // }));

    const legendItems = this.selectComboBox.marca.list.filter((item: any) => item.checked).length;
    // let topMargin = legendItems > 10 ? 100 + (legendItems - 30) * 10 : 100; // Ajuste dinámico del margen superior
    let topMargin = 100;
    if (legendItems < 10) {
      topMargin = 100;
    } else if (legendItems < 20) {
      topMargin = 120;
    } else if (legendItems < 30) {
      topMargin = 140;
    } else {
      topMargin = 160;
    }
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          let tooltip = `${params[0].axisValueLabel}<br/>`;
          let totalPeriodo = totalesPorPeriodo[params[0].axisValue.split(' ')[1]];
          
          params.forEach((param: any) => {
            const realValue = param.value * totalPeriodo;
            const porcentaje = (param.value * 100).toFixed(1);
            tooltip += `${param.marker}${param.seriesName}: ${realValue.toFixed(0)} (${porcentaje}%)<br/>`;
          });
          tooltip += `<b>Total: ${totalPeriodo}</b>`;
          return tooltip;
        }
      },
      legend: {
        selectedMode: false,
        top: 30,
        left: 'center',
        formatter: function(name: string) {
          return `${name}`;
        }
      },
      grid: {
        left: 100,
        right: 100,
        // top: 150,
        top: topMargin,
        bottom: 50
      },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: namesEjeX,
        axisLabel: { interval: 0, rotate: 30 }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series,
      color: Constantes.COLORS
    };

    const chart = echarts.init(this.frenteBrandStackedBar.nativeElement);
    chart.clear();
    chart.setOption(option);

    window.addEventListener('resize', () => {
      chart.resize();
    });
  }

  async getLineaMarcas() {
    try {
      const response = await this.sharedService.configurationValues(this.codigoValues);
      if (response.success) {
        const listLineaMarcas = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.SKU_LINEA_MARCA).valor;
        this.listMarcasCompetencia = [];
        listLineaMarcas.forEach((element: any) => {
          if (element.competencia === 1) {
            this.listMarcasCompetencia.push(...element.marcas);
          }
        });
        // console.log('this.listMarcasCompetencia', this.listMarcasCompetencia);
      }
    } catch (error) {
      console.log(error);
    }
  }

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
    this.getFrenteCountsByBrandMonthAndWeek();
    this.getFrenteCountsByPocAndBrandMonthAndWeek();
  }

  async loadingDataOptions() {
    await this.getFiltersDashboard();
    this.loadingFiltersParams();
    this.getFrenteCountsByBrandMonthAndWeek();
    this.getFrenteCountsByPocAndBrandMonthAndWeek();
  }

  getFrenteCountsByBrandMonthAndWeek() {
    this.frenteDashboardService.getFrenteCountsByBrandMonthAndWeek(this.filtersParams).subscribe({
      next: (result) => {
        this.frenteBrand = result;
        const uniqueMarcas: string[] = Array.from(
          new Set(
            Object.values(this.frenteBrand as Record<string, Record<string, number>>).flatMap(marcas =>
              Object.keys(marcas)
            )
          )
        );
        this.selectComboBox.marca.list = uniqueMarcas.map((marca: string) => {
          const found = this.selectComboBox.marca.list.find((element: any) => element.value == marca);
          if (found) {
            return found;
          }
          return { label: marca, value: marca, checked: false };
        });
        this.selectComboBox.marca.selectAllChecked = this.selectComboBox.marca.list.every((item: any) => item.checked);
        this.getTitleSelectGraphic('marca');

        // Orden deseado
        const ordenDeseado = ["Heineken", "Tres Cruces", "Amstel", "Pum Pum"];

        this.selectComboBox.marca.list.sort((a: any, b: any) => {
          const indexA = ordenDeseado.indexOf(a.value);
          const indexB = ordenDeseado.indexOf(b.value);

          // Si ambos están en el orden deseado, se comparan por sus posiciones
          if (indexA !== -1 && indexB !== -1) {
              return indexA - indexB;
          }
          // Si solo `a` está en el orden deseado, debe ir antes
          if (indexA !== -1) {
              return -1;
          }
          // Si solo `b` está en el orden deseado, debe ir antes
          if (indexB !== -1) {
              return 1;
          }
          // Si ninguno está en el orden deseado, mantienen su orden original
          return 0;
        });
        this.loadGraphicsFrenteBrandStackedBar();
        // this.loadGraphicsFrenteBrandPie();
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
      }
    });
  }

  getFrenteCountsByPocAndBrandMonthAndWeek() {
    this.frenteDashboardService.getFrenteCountsByPocAndBrandMonthAndWeek(this.filtersParams).subscribe({
      next: (result) => {
        this.averageBrandsForStore = result;
        this.loadGraphicsFrenteBrandForStoreStackedLine();
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
      }
    })
  }

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
    this.selectComboBox[nameSelect].list.forEach((item: any) => item.checked = checked);
    this.selectComboBox[nameSelect].selectAllChecked = checked;
    this.getTitleSelectGraphic(nameSelect);
    // this.loadGraphicsFrenteBrandPie();
    this.loadGraphicsFrenteBrandStackedBar();
  }

  onItemChangeGraphic(nameSelect: string): void {
    this.getTitleSelectGraphic(nameSelect);
    const allChecked = this.selectComboBox[nameSelect].list.every((item: any) => item.checked)
    this.selectComboBox[nameSelect].selectAllChecked = allChecked;
    // this.loadGraphicsFrenteBrandPie();
    this.loadGraphicsFrenteBrandStackedBar();
  }

  removeFilterSelectedGraphic(nameSelect: string) {
    this.selectComboBox[nameSelect].list.forEach((element: any) => {
      element.checked = false;
    });
    this.selectComboBox[nameSelect].selectAllChecked = false;
    this.getTitleSelectGraphic(nameSelect);
    // this.loadGraphicsFrenteBrandPie();
    this.loadGraphicsFrenteBrandStackedBar();
  }

  private getTitleSelectGraphic(nameSelect: string) {
    const length = this.selectComboBox[nameSelect].list.length;
    const listChecked = this.selectComboBox[nameSelect].list.filter((element: any) => element.checked);
    const lenghtListChecked = listChecked.length;
    if (lenghtListChecked === 0) {
      this.selectComboBox[nameSelect].titleSelect = 'Seleccione';
    } else if (lenghtListChecked === 1) {
      this.selectComboBox[nameSelect].titleSelect = listChecked[0].label;
    } else if (lenghtListChecked === length) {
      this.selectComboBox[nameSelect].titleSelect = 'Todos';
    } else {
      this.selectComboBox[nameSelect].titleSelect = 'Multiple Selección';
    }
  }

  exportExcelFrenteCountsByBrandMonthAndWeek(): void {
    this.isLoadingGeneric = true;
    this.frenteDashboardService.exportExcelFrenteCountsByBrandMonthAndWeek(this.filtersParams).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport()+'-frente-counts-by-brand-month-and-week'+'.xlsx';
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
}
