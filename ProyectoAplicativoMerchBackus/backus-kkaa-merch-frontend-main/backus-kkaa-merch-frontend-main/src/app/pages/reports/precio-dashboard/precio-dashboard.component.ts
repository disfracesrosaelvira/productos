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
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopoverModule } from 'ng-zorro-antd/popover';

import * as echarts from 'echarts';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { SharedService } from '@shared/services/shared.service';
import { PrecioDashboardService } from './precio-dashboard.service';
import { DateService } from '@shared/services/date.service';
import { FilterDashboardComponent } from '@shared/components/filter-dashboard/filter-dashboard.component';
import { FilterDashboardSharedService } from '@shared/services/dashboard/filter-dashboard-shared.service';
import Constantes from '@shared/constants/contants';

interface Product {
  key: string;
  name: string;
  weeksData?: {
    [week: string]: {
      avg_pvp_adicional: number | null;
      avg_pvp_promocional: number | null;
      avg_pvp_regular: number | null;
    };
  };
}

interface Brand {
  key: string;
  name: string;
  children: Product[];
  weeklyTotal?: {
    [week: string]: {
      avg_pvp_adicional: number | null;
      avg_pvp_promocional: number | null;
      avg_pvp_regular: number | null;
    };
  };
  expand?: boolean; // Nueva propiedad para manejar la expansión
}

@Component({
  selector: 'app-precio-dashboard',
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
    NzTableModule,
    NzPopoverModule,
    SpinnerLoadingComponent,
    FilterDashboardComponent
  ],
  templateUrl: './precio-dashboard.component.html',
  styleUrl: './precio-dashboard.component.scss'
})
export class PrecioDashboardComponent {
  private windowWidth: number;
  isScreenSmall: boolean = false;
  @ViewChild('precioBrandDescriptionStackedLine') precioBrandDescriptionStackedLine!: ElementRef;
  precioBrandAndDescription: any = {};
  precioBrandAndDescriptionAverage: any = {};
  storesWithProductsPromotionalPrice: any = {};
  filtersParams: any = {};
  // filters: any = JSON.parse(JSON.stringify(this.filterDashboardSharedService.filters));
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
  brandsAndProducts: any = {};

  weekNumbers: string[] = []; // Las semanas dinámicas
  weekNumbersStoreProductPromotional: string[] = [];
  listOfMapData: Brand[] = [];
  listOfMapDataStoresWithProductsPromotionalPrice: Brand[] = [];
  totalPerWeek: any = {};
  isPopoverVisibleExportFileAveragesMarcaDescripcion: boolean = false;
  isPopoverVisibleExportFileStoresProductPromotional: boolean = false;
  
  constructor(
    private cdr: ChangeDetectorRef,
    private filterDashboardSharedService: FilterDashboardSharedService,
    private precioDashboardService: PrecioDashboardService,
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
  }

  async ngAfterViewInit() {
    this.loadingFiltersParams();
    this.initialLoadingData();
  }

  loadGraphicsStockBrandDescriptiontackedLine() {
    const year = this.getYear(this.filters.anio.value);
    const existMonths = this.filters.meses.list.filter((item: any) => item.checked).length != 0;
    
    let brands: any = {};
    let namesEjeX = [];
    let totalesPorPeriodo: { [key: string]: number } = {};

    for (let semana in this.precioBrandAndDescription) {
      let totalPeriodo = 0;
      for(let marca in this.precioBrandAndDescription[semana]) {
        for (let producto in this.precioBrandAndDescription[semana][marca]) {
          totalPeriodo += this.precioBrandAndDescription[semana][marca][producto] || 0;
        }
      }
      // totalesPorPeriodo[semana] = totalPeriodo;
      totalesPorPeriodo[semana] = parseFloat(totalPeriodo.toFixed(2)); // Redondea a dos decimales
    }

    let brandsTotales: any = {};
    for (let semana in this.precioBrandAndDescription) {
      if (existMonths) {
        namesEjeX.push(this.getMonthFromWeek(parseInt(semana), year) + ' ' + semana);
      } else {
        namesEjeX.push(year + ' ' + semana);
      }
      for (let marca in this.precioBrandAndDescription[semana]) {
        for (let producto in this.brandsAndProducts[marca]) {
          brandsTotales[producto] = this.precioBrandAndDescription[semana][marca][producto] || 0;
        }
      }
      for (let producto in brandsTotales) {
        // const valor = brandsTotales[producto] || 0;
        const valor = parseFloat((brandsTotales[producto] || 0).toFixed(2)); // Redondea a dos decimales
        if (brands.hasOwnProperty(producto)) {
          brands[producto].push(valor);
        } else {
            brands[producto] = [valor];
        }
      }
    }

    let series: any [] = [];
    this.selectComboBox.marca.list.filter((item: any) => item.checked).forEach((item: any) => {
      for (let producto in this.brandsAndProducts[item.value]) {
        series.push({
          name: producto,
          type: 'line',
          data: brands[producto],
          emphasis: {
            focus: 'series'
          }
        });
      }
    });
    const option = {
      title: {
        show: false // Desactiva la visualización del título
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let tooltip = params[0].axisValueLabel + '<br/>';
          let total = 0;

          const totalPeriodo = totalesPorPeriodo[params[0].axisValue.split(' ')[1]];

          params.forEach((param: any) => {
            const porcentaje = ((param.value / totalPeriodo) * 100).toFixed(2); // Redondea porcentaje
            const valorRedondeado = parseFloat(param.value.toFixed(2)); // Redondea valor
            tooltip += `${param.marker}${param.seriesName}: ${valorRedondeado} (${porcentaje}%)<br/>`;
            total += valorRedondeado;
          });
          tooltip += `<b>Sub Total: ${total.toFixed(2)}</b><br/>`; // Redondea subtotal
          tooltip += `<b>Total: ${totalPeriodo}</b>`;
          return tooltip;
        }
      },
      legend: {
        type: 'scroll',
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
    // const option = {
    //   title: {
    //     show: false
    //   },
    //   tooltip: {
    //     trigger: 'axis',
    //     // Personalizamos el tooltip para resaltar la serie activa
    //     formatter: (params: any) => {
    //       let tooltip = params[0].axisValueLabel + '<br/>';
    //       let total = 0;
    //       const totalPeriodo = totalesPorPeriodo[params[0].axisValue.split(' ')[1]];
    
    //       params.forEach((param: any) => {
    //         const porcentaje = ((param.value / totalPeriodo) * 100).toFixed(2);
    //         const valorRedondeado = parseFloat(param.value.toFixed(2));
    //         tooltip += `
    //           <span style="color:${param.color}; font-weight:bold;">${param.seriesName}</span>: 
    //           ${valorRedondeado} (${porcentaje}%)<br/>
    //         `;
    //         total += valorRedondeado;
    //       });
    //       tooltip += `<b>Sub Total: ${total.toFixed(2)}</b><br/>`;
    //       tooltip += `<b>Total: ${totalPeriodo}</b>`;
    //       return tooltip;
    //     }
    //   },
    //   legend: {
    //     type: 'scroll',
    //     top: 30,
    //     left: 'center',
    //     textStyle: {
    //       fontSize: 12
    //     }
    //   },
    //   grid: {
    //     left: '3%',
    //     right: '4%',
    //     bottom: '3%',
    //     containLabel: true,
    //     top: 120
    //   },
    //   toolbox: {
    //     feature: {
    //       saveAsImage: {}
    //     },
    //     right: 20,
    //     top: 0
    //   },
    //   xAxis: {
    //     type: 'category',
    //     boundaryGap: false,
    //     data: namesEjeX,
    //     axisLabel: { interval: 0, rotate: 30 }
    //   },
    //   yAxis: {
    //     type: 'value'
    //   },
    //   series: series.map((serie) => ({
    //     ...serie,
    //     emphasis: {
    //       focus: 'series'
    //     }
    //   })),
    //   color: Constantes.COLORS
    // };
    const chart = echarts.init(this.precioBrandDescriptionStackedLine.nativeElement);
    chart.clear(); // Limpia el gráfico antes de actualizarlo
    chart.setOption(option);
  
    // Asegúrate de que el gráfico se redimensione cuando cambie el tamaño de la ventana
    window.addEventListener('resize', () => {
      chart.resize();
    });
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
    this.getPrecioCountsByBrandAndDescriptionByMonthAndWeek();
    this.getPrecioAveragesByBrandAndDescriptionByMonthAndWeek();
    this.getStoresWithProductsPromotionalPrice();
  }

  async loadingDataOptions() {
    await this.getFiltersDashboard();
    this.loadingFiltersParams();
    this.getPrecioCountsByBrandAndDescriptionByMonthAndWeek();
    this.getPrecioAveragesByBrandAndDescriptionByMonthAndWeek();
    this.getStoresWithProductsPromotionalPrice();
  }

  getPrecioCountsByBrandAndDescriptionByMonthAndWeek() {
    let marcas: string[] = [];
    this.precioDashboardService.getPrecioCountsByBrandAndDescriptionByMonthAndWeek(this.filtersParams, marcas).subscribe({
      next: (result) => {
        this.precioBrandAndDescription = result;
        const uniqueMarcas: string[] = Array.from(
          new Set(
            Object.values(this.precioBrandAndDescription as Record<string, Record<string, number>>).flatMap(marcas =>
              Object.keys(marcas)
            )
          )
        );
        this.brandsAndProducts = {};
        for (let mes in this.precioBrandAndDescription) {
          for (let marca in this.precioBrandAndDescription[mes]) {
            // Inicializar `brands[marca]` si aún no existe
            if (!this.brandsAndProducts[marca]) {
              this.brandsAndProducts[marca] = {};
            }
            for (let producto in this.precioBrandAndDescription[mes][marca]) {
              this.brandsAndProducts[marca][producto] = ''
            }
          }
        }
        this.selectComboBox.marca.list = uniqueMarcas.map((type: string) => {
          const found = this.selectComboBox.marca.list.find((element: any) => element.value == type);
          if (found) {
            return found;
          }
          return {label: type, value: type, checked: false};
        });
        this.selectComboBox.marca.selectAllChecked = this.selectComboBox.marca.list.every((item: any) => item.checked);;
        this.selectComboBox.marca.titleSelect = 'Seleccione';
        this.getTitleSelectGraphic('marca');
        this.loadGraphicsStockBrandDescriptiontackedLine(); // para resetear y dejarlo en limpio xd
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    });
  }

  getPrecioAveragesByBrandAndDescriptionByMonthAndWeek() {
    this.precioDashboardService.getPrecioAveragesByBrandAndDescriptionByMonthAndWeek(this.filtersParams).subscribe({
      next: (result) => {
        this.precioBrandAndDescriptionAverage = result;
        this.listOfMapData = this.transformData(this.precioBrandAndDescriptionAverage);
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    })
  }

  getStoresWithProductsPromotionalPrice() {
    this.precioDashboardService.getStoresWithProductsPromotionalPrice(this.filtersParams).subscribe({
      next: (result) => {
        this.storesWithProductsPromotionalPrice = result;
        this.listOfMapDataStoresWithProductsPromotionalPrice = this.transformDataStoresWithProductsPromotionalPrice(this.storesWithProductsPromotionalPrice);
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
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
    this.loadGraphicsStockBrandDescriptiontackedLine();
    // this.getPrecioCountsByBrandAndDescriptionByMonthAndWeek();
  }

  onItemChangeGraphic(nameSelect: string): void {
    this.getTitleSelectGraphic(nameSelect);
    const allChecked = this.selectComboBox[nameSelect].list.every((item: any) => item.checked)
    this.selectComboBox[nameSelect].selectAllChecked = allChecked;
    this.loadGraphicsStockBrandDescriptiontackedLine();
    // this.getPrecioCountsByBrandAndDescriptionByMonthAndWeek();
  }

  removeFilterSelectedGraphic(nameSelect: string) {
    this.selectComboBox[nameSelect].list.forEach((element: any) => {
      element.checked = false;
    });
    this.selectComboBox[nameSelect].selectAllChecked = false;
    this.getTitleSelectGraphic(nameSelect);
    this.loadGraphicsStockBrandDescriptiontackedLine();
    // this.getPrecioCountsByBrandAndDescriptionByMonthAndWeek();
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

  exportExcelPrecioCountsByBrandAndDescriptionByMonthAndWeek(): void {
    this.isLoadingGeneric = true;
    let marcas: string[] = [];
    this.precioDashboardService.exportExcelPrecioCountsByBrandAndDescriptionByMonthAndWeek(this.filtersParams, marcas).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport()+'-precio-counts-by-type-brand-description-and-week'+'.xlsx';
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

  exportExcelPrecioAveragesByBrandAndDescriptionByMonthAndWeek(): void {
    this.isLoadingGeneric = true;
    this.precioDashboardService.exportExcelPrecioAveragesByBrandAndDescriptionByMonthAndWeek(this.filtersParams).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport()+'-precio-averages-by-type-brand-description-and-week'+'.xlsx';
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

  exportExcelPrecioStoresWithProductsPromotionalPrice(): void {
    this.isLoadingGeneric = true;
    this.precioDashboardService.exportExcelPrecioStoresWithProductsPromotionalPrice(this.filtersParams).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport()+'-precio-stores-with-products-promotional-price'+'.xlsx';
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

  // transformData(rawData: any): Brand[] {
  //   const weekNumbers = Object.keys(rawData);
  //   const brandMap: { [brandName: string]: Brand } = {};

  //   this.weekNumbers = weekNumbers;
  //   this.totalPerWeek = {};
  //   // Procesar datos por semana
  //   weekNumbers.forEach(week => {
  //     const weekData = rawData[week];
  //     let totalWeekQtyPromocional = 0; // Total de todas las marcas por semana
  //     let totalWeekQtyAdicional = 0;
  //     let totalWeekQtyRegular = 0;

  //     Object.keys(weekData).forEach(brandName => {
  //       let brand = brandMap[brandName];
  //       if (!brand) {
  //         brand = { key: brandName, name: brandName, children: [], weeklyTotal: {} };
  //         brandMap[brandName] = brand;
  //       }

  //       let totalBrandQtyForWeekPromocional = 0;
  //       let totalBrandQtyForWeekAdicional = 0;
  //       let totalBrandQtyForWeekRegular = 0;

  //       // Procesar productos por marca
  //       Object.keys(weekData[brandName]).forEach(productName => {
  //         let product = brand.children.find(p => p.name === productName);
  //         if (!product) {
  //           product = { key: productName, name: productName, weeksData: {} };
  //           brand.children.push(product);
  //         }

  //         // Obtener la cantidad del producto para la semana actual
  //         const avg_pvp_adicional = weekData[brandName][productName].avg_pvp_adicional;
  //         const avg_pvp_promocional = weekData[brandName][productName].avg_pvp_promocional;
  //         const avg_pvp_regular = weekData[brandName][productName].avg_pvp_regular;

  //         // Asegurarse de que qty no sea undefined antes de procesarlo
  //         if (avg_pvp_regular !== undefined && avg_pvp_regular !== null) {
  //           // Asignar datos de la semana actual al producto
  //           product.weeksData![week] = {
  //             avg_pvp_adicional: avg_pvp_adicional,
  //             avg_pvp_promocional: avg_pvp_promocional,
  //             avg_pvp_regular: avg_pvp_regular,
  //           };

  //           // Sumar la cantidad del producto para el total de la marca en esta semana
  //           totalBrandQtyForWeekPromocional += avg_pvp_promocional;
  //           totalBrandQtyForWeekAdicional += avg_pvp_adicional;
  //           totalBrandQtyForWeekRegular += avg_pvp_regular;
  //         }
  //       });

  //       // Asignar el total de la marca para esta semana solo si hay productos con cantidades válidas
  //       brand.weeklyTotal![week] = {
  //         avg_pvp_adicional: totalBrandQtyForWeekAdicional,
  //         avg_pvp_promocional: totalBrandQtyForWeekPromocional,
  //         avg_pvp_regular: totalBrandQtyForWeekRegular,
  //       };

  //       // Sumar el total de la marca al total de la semana
  //       totalWeekQtyPromocional += totalBrandQtyForWeekPromocional;
  //       totalWeekQtyAdicional += totalBrandQtyForWeekAdicional;
  //       totalWeekQtyRegular += totalBrandQtyForWeekRegular;
  //     });

  //     // Guardar el total global de la semana
  //     this.totalPerWeek[week] = {
  //       avg_pvp_promocional: totalWeekQtyPromocional,
  //       avg_pvp_adicional: totalWeekQtyAdicional,
  //       avg_pvp_regular: totalWeekQtyRegular
  //     };
  //   });
  //   return Object.values(brandMap);
  // }

  transformData(rawData: any): Brand[] {
    const weekNumbers = Object.keys(rawData);
    const brandMap: { [brandName: string]: Brand } = {};
  
    this.weekNumbers = weekNumbers;
    this.totalPerWeek = {};
    
    weekNumbers.forEach(week => {
      const weekData = rawData[week];
      let totalWeekAdicional = 0;
      let totalWeekPromocional = 0;
      let totalWeekRegular = 0;
      let validWeekAdicional = 0;
      let validWeekPromocional = 0;
      let validWeekRegular = 0;
  
      Object.keys(weekData).forEach(brandName => {
        let brand = brandMap[brandName];
        if (!brand) {
          brand = { key: brandName, name: brandName, children: [], weeklyTotal: {} };
          brandMap[brandName] = brand;
        }
  
        let brandAdicional = 0;
        let brandPromocional = 0;
        let brandRegular = 0;
        let validBrandAdicional = 0;
        let validBrandPromocional = 0;
        let validBrandRegular = 0;
  
        Object.keys(weekData[brandName]).forEach(productName => {
          let product = brand.children.find(p => p.name === productName);
          if (!product) {
            product = { key: productName, name: productName, weeksData: {} };
            brand.children.push(product);
          }
  
          const avg_pvp_adicional = weekData[brandName][productName].avg_pvp_adicional;
          const avg_pvp_promocional = weekData[brandName][productName].avg_pvp_promocional;
          const avg_pvp_regular = weekData[brandName][productName].avg_pvp_regular;
  
          if (avg_pvp_regular !== undefined && avg_pvp_regular !== null) {
            product.weeksData![week] = {
              avg_pvp_adicional,
              avg_pvp_promocional,
              avg_pvp_regular,
            };
  
            if (avg_pvp_adicional > 0) {
              brandAdicional += avg_pvp_adicional;
              validBrandAdicional++;
            }
            if (avg_pvp_promocional > 0) {
              brandPromocional += avg_pvp_promocional;
              validBrandPromocional++;
            }
            if (avg_pvp_regular > 0) {
              brandRegular += avg_pvp_regular;
              validBrandRegular++;
            }
          }
        });
  
        brand.weeklyTotal![week] = {
          avg_pvp_adicional: validBrandAdicional ? brandAdicional / validBrandAdicional : 0,
          avg_pvp_promocional: validBrandPromocional ? brandPromocional / validBrandPromocional : 0,
          avg_pvp_regular: validBrandRegular ? brandRegular / validBrandRegular : 0,
        };
  
        if (validBrandAdicional) {
          totalWeekAdicional += brandAdicional / validBrandAdicional;
          validWeekAdicional++;
        }
        if (validBrandPromocional) {
          totalWeekPromocional += brandPromocional / validBrandPromocional;
          validWeekPromocional++;
        }
        if (validBrandRegular) {
          totalWeekRegular += brandRegular / validBrandRegular;
          validWeekRegular++;
        }
      });
  
      this.totalPerWeek[week] = {
        avg_pvp_adicional: validWeekAdicional ? totalWeekAdicional / validWeekAdicional : 0,
        avg_pvp_promocional: validWeekPromocional ? totalWeekPromocional / validWeekPromocional : 0,
        avg_pvp_regular: validWeekRegular ? totalWeekRegular / validWeekRegular : 0,
      };
    });
  
    return Object.values(brandMap);
  }

  transformDataStoresWithProductsPromotionalPrice(rawData: any): Brand[] {
    const weekNumbers = Object.keys(rawData);
    const brandMap: { [brandName: string]: Brand } = {};
  
    this.weekNumbersStoreProductPromotional = weekNumbers;
  
    weekNumbers.forEach(week => {
      const weekData = rawData[week];
      // let totalWeekAdicional = 0;
      // let totalWeekPromocional = 0;
      // let totalWeekRegular = 0;
      // let validWeekAdicional = 0;
      // let validWeekPromocional = 0;
      // let validWeekRegular = 0;
  
      Object.keys(weekData).forEach(brandName => {
        let brand = brandMap[brandName];
        if (!brand) {
          brand = { key: brandName, name: brandName, children: [], weeklyTotal: {} };
          brandMap[brandName] = brand;
        }
  
        // let brandAdicional = 0;
        // let brandPromocional = 0;
        // let brandRegular = 0;
        // let validBrandAdicional = 0;
        // let validBrandPromocional = 0;
        // let validBrandRegular = 0;
  
        Object.keys(weekData[brandName]).forEach(productName => {
          let product = brand.children.find(p => p.name === productName);
          if (!product) {
            product = { key: productName, name: productName, weeksData: {} };
            brand.children.push(product);
          }
  
          // const avg_pvp_adicional = weekData[brandName][productName].avg_pvp_adicional;
          const avg_pvp_promocional = weekData[brandName][productName];
          // const avg_pvp_regular = weekData[brandName][productName].avg_pvp_regular;
  
          if (avg_pvp_promocional !== undefined && avg_pvp_promocional !== null) {
            product.weeksData![week] = {
              avg_pvp_adicional: null,
              avg_pvp_promocional,
              avg_pvp_regular: null,
            };
  
            // if (avg_pvp_adicional > 0) {
            //   brandAdicional += avg_pvp_adicional;
            //   validBrandAdicional++;
            // }
            // if (avg_pvp_promocional > 0) {
            //   brandPromocional += avg_pvp_promocional;
            //   validBrandPromocional++;
            // }
            // if (avg_pvp_regular > 0) {
            //   brandRegular += avg_pvp_regular;
            //   validBrandRegular++;
            // }
          }
        });
  
        brand.weeklyTotal![week] = {
          avg_pvp_adicional: null,
          avg_pvp_promocional: null,
          avg_pvp_regular: null,
        };
  
        // if (validBrandAdicional) {
        //   totalWeekAdicional += brandAdicional / validBrandAdicional;
        //   validWeekAdicional++;
        // }
        // if (validBrandPromocional) {
        //   totalWeekPromocional += brandPromocional / validBrandPromocional;
        //   validWeekPromocional++;
        // }
        // if (validBrandRegular) {
        //   totalWeekRegular += brandRegular / validBrandRegular;
        //   validWeekRegular++;
        // }
      });
  
      // this.totalPerWeek[week] = {
      //   avg_pvp_adicional: validWeekAdicional ? totalWeekAdicional / validWeekAdicional : 0,
      //   avg_pvp_promocional: validWeekPromocional ? totalWeekPromocional / validWeekPromocional : 0,
      //   avg_pvp_regular: validWeekRegular ? totalWeekRegular / validWeekRegular : 0,
      // };
    });
  
    return Object.values(brandMap);
  }

  // Obtener el total de cantidad por semana para la marca
  getBrandTotalQtyForWeek(brand: Brand, week: string, type: string): number {
    if (type === 'avg_pvp_adicional') {
      return brand.weeklyTotal?.[week]?.avg_pvp_adicional || 0;
    } else if (type === 'avg_pvp_promocional') {
      return brand.weeklyTotal?.[week]?.avg_pvp_promocional || 0;
    } else {
      return brand.weeklyTotal?.[week]?.avg_pvp_regular || 0;
    }
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

  handlePopoverVisibleChangeAveragesMarcaDescription(visible: boolean): void {
    this.isPopoverVisibleExportFileAveragesMarcaDescripcion = visible;
  }

  handlePopoverVisibleChangeStoreProductPromocional(visible: boolean): void {
    this.isPopoverVisibleExportFileStoresProductPromotional = visible;
  }

  togglePopoverAveragesMarcaDescription(event: Event): void {
    event.stopPropagation();
  }

  togglePopoverStoreProductPromocional(event: Event): void {
    event.stopPropagation();
  }

  clickMePopoverAveragesMarcaDescription(): void {
    this.isPopoverVisibleExportFileAveragesMarcaDescripcion = false;
  }

  clickMePopoverStoreProductPromocional(): void {
    this.isPopoverVisibleExportFileStoresProductPromotional = false;
  }
}
