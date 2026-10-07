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
import { DateService } from '@shared/services/date.service';
import { StockDashboardService } from './stock-dashboard.service';
import { FilterDashboardComponent } from '@shared/components/filter-dashboard/filter-dashboard.component';
import { FilterDashboardSharedService } from '@shared/services/dashboard/filter-dashboard-shared.service';
import Constantes from '@shared/constants/contants';

interface Product {
  key: string;
  name: string;
  weeksData?: {
    [week: string]: {
      avgGondolaStock: number | null;
      avgExhibicionStock: number | null;
    };
  };
}

interface Brand {
  key: string;
  name: string;
  children: Product[];
  weeklyTotal?: {
    [week: string]: {
      avgGondolaStock: number | null;
      avgExhibicionStock: number | null;
    };
  };
  expand?: boolean; // Nueva propiedad para manejar la expansión
}

@Component({
  selector: 'app-stock-dashboard',
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
  templateUrl: './stock-dashboard.component.html',
  styleUrl: './stock-dashboard.component.scss'
})
export class StockDashboardComponent {
  private windowWidth: number;
  isScreenSmall: boolean = false;
  @ViewChild('stockDescriptionGondolaStackedLine') stockDescriptionGondolaStackedLine!: ElementRef;
  stockDescription: any = {};
  stockSeparateAverageByDescription: any = {};
  storesWithProductsPromotionalPrice: any = {};
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
    private stockDashboardService: StockDashboardService,
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

  loadGraphicsStockDescriptionGondolaStackedLine() {
    const year = this.getYear(this.filters.anio.value);
    const existMonths = this.filters.meses.list.filter((item: any) => item.checked).length != 0;
    
    let brands: any = {};
    let namesEjeX = [];
    let totalesPorPeriodo: { [key: string]: number } = {};

    for (let semana in this.stockDescription) {
      let totalPeriodo = 0;
      for(let marca in this.stockDescription[semana]) {
        for (let producto in this.stockDescription[semana][marca]) {
          totalPeriodo += this.stockDescription[semana][marca][producto] || 0;
        }
      }
      totalesPorPeriodo[semana] = totalPeriodo;
    }

    let brandsTotales: any = {};
    for (let semana in this.stockDescription) {
      if (existMonths) {
        namesEjeX.push(this.getMonthFromWeek(parseInt(semana), year) + ' ' + semana);
      } else {
        namesEjeX.push(year + ' ' + semana);
      }
      for (let marca in this.stockDescription[semana]) {
        for (let producto in this.brandsAndProducts[marca]) {
          brandsTotales[producto] = this.stockDescription[semana][marca][producto] || 0;
        }
      }
      for (let producto in brandsTotales) {
        const valor = brandsTotales[producto] || 0;
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

          // Calcular el porcentaje basado en el total por período
          // axisValue = "2024 7" example
          const totalPeriodo = totalesPorPeriodo[params[0].axisValue.split(' ')[1]];

          params.forEach((param: any) => {
              const porcentaje = (param.value / totalPeriodo) * 100;
              tooltip += `${param.marker}${param.seriesName}: ${param.value.toFixed(2)} (${porcentaje.toFixed(2)}%)<br/>`;
              total += param.value;
          });
          tooltip += `<b>Sub Total: ${total.toFixed(2)}</b><br/>`;
          tooltip += `<b>Total: ${totalPeriodo.toFixed(2)}</b>`;
          // tooltip += `<b>Total: ${total}</b><br/>`;
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
    const chart = echarts.init(this.stockDescriptionGondolaStackedLine.nativeElement);
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
      filtros['linea'] = getFilters.lineas.sort();
      this.maintainingCheckedFilters(filtros);
      this.tempFilters = JSON.parse(JSON.stringify(this.filters));
      this.isLoadingGeneric = false;
    } catch (error) {
      this.isLoadingGeneric = false;
      console.error('Error al cargar los datos:', error);
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
    this.getStockAverageByDescriptionMonthAndWeek();
    this.getStockSeparateAveragesByDescriptionMonthAndWeek();
    this.getStoreAveragesByDescriptionMonthAndWeek();
  }

  async loadingDataOptions() {
    await this.getFiltersDashboard();
    this.loadingFiltersParams();
    this.getStockAverageByDescriptionMonthAndWeek();
    this.getStockSeparateAveragesByDescriptionMonthAndWeek();
    this.getStoreAveragesByDescriptionMonthAndWeek();
  }

  getStockAverageByDescriptionMonthAndWeek() {
    this.stockDashboardService.getStockAverageByDescriptionMonthAndWeek(this.filtersParams).subscribe({
      next: (result) => {
        this.stockDescription = result;
        const uniqueMarcas: string[] = Array.from(
          new Set(
            Object.values(this.stockDescription as Record<string, Record<string, number>>).flatMap(marcas =>
              Object.keys(marcas)
            )
          )
        );
        this.brandsAndProducts = {};
        for (let mes in this.stockDescription) {
          for (let marca in this.stockDescription[mes]) {
            // Inicializar `brands[marca]` si aún no existe
            if (!this.brandsAndProducts[marca]) {
              this.brandsAndProducts[marca] = {};
            }
            for (let producto in this.stockDescription[mes][marca]) {
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

        this.loadGraphicsStockDescriptionGondolaStackedLine();
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    });
  }

  getStockSeparateAveragesByDescriptionMonthAndWeek() {
    this.stockDashboardService.getStockSeparateAveragesByDescriptionMonthAndWeek(this.filtersParams).subscribe({
      next: (result) => {
        // this.precioBrandAndDescriptionAverage = result;
        this.stockSeparateAverageByDescription = result;
        this.listOfMapData = this.transformData(this.stockSeparateAverageByDescription);
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      }
    })
  }

  getStoreAveragesByDescriptionMonthAndWeek() {
    this.stockDashboardService.getStoreAveragesByDescriptionMonthAndWeek(this.filtersParams).subscribe({
      next: (result) => {
        // this.precioBrandAndDescriptionAverage = result;
        // this.stockSeparateAverageByDescription = result;
        // this.listOfMapData = this.transformData(this.stockSeparateAverageByDescription);
        // console.log('this.listOfMapData', this.listOfMapData);
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

  getYear(date: Date): number {
    return date.getFullYear();
  }
  
  onSelectAllChangeGraphic(checked: boolean, nameSelect: string): void {
    this.selectComboBox[nameSelect].list.forEach((item: any) => item.checked = checked);
    this.selectComboBox[nameSelect].selectAllChecked = checked;
    this.getTitleSelectGraphic(nameSelect);
    this.loadGraphicsStockDescriptionGondolaStackedLine();
  }

  onItemChangeGraphic(nameSelect: string): void {
    this.getTitleSelectGraphic(nameSelect);
    const allChecked = this.selectComboBox[nameSelect].list.every((item: any) => item.checked)
    this.selectComboBox[nameSelect].selectAllChecked = allChecked;
    this.loadGraphicsStockDescriptionGondolaStackedLine();
  }

  removeFilterSelectedGraphic(nameSelect: string) {
    this.selectComboBox[nameSelect].list.forEach((element: any) => {
      element.checked = false;
    });
    this.selectComboBox[nameSelect].selectAllChecked = false;
    this.getTitleSelectGraphic(nameSelect);
    this.loadGraphicsStockDescriptionGondolaStackedLine();
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

  transformData(rawData: any): Brand[] {
    const weekNumbers = Object.keys(rawData);
    const brandMap: { [brandName: string]: Brand } = {};
  
    this.weekNumbers = weekNumbers;
    this.totalPerWeek = {};
    
    weekNumbers.forEach(week => {
      const weekData = rawData[week];

      let totalWeekGondolaStock = 0;
      let totalWeekExhibicionStock = 0;
      let validWeekGondolaStock = 0;
      let validWeekExhibicionStock = 0;
  
      Object.keys(weekData).forEach(brandName => {
        let brand = brandMap[brandName];
        if (!brand) {
          brand = { key: brandName, name: brandName, children: [], weeklyTotal: {} };
          brandMap[brandName] = brand;
        }
        
        let totalGondolaStock = 0;
        let totalExhibicionStock = 0;
        let validGondolaStock = 0;
        let validExhibicionStock = 0;
  
        Object.keys(weekData[brandName]).forEach(productName => {
          let product = brand.children.find(p => p.name === productName);
          if (!product) {
            product = { key: productName, name: productName, weeksData: {} };
            brand.children.push(product);
          }
  
          const avgGondolaStock = weekData[brandName][productName].avgGondolaStock;
          const avgExhibicionStock = weekData[brandName][productName].avgExhibicionStock;
  
          // if (avg_pvp_regular !== undefined && avg_pvp_regular !== null) {
            product.weeksData![week] = {
              avgGondolaStock,
              avgExhibicionStock,
            };
  
            // if (avgGondolaStock > 0) {
            if (!(avgGondolaStock === null || avgGondolaStock === undefined)) {
              totalGondolaStock += avgGondolaStock;
              validGondolaStock++;
            }
            // if (avgExhibicionStock > 0) {
            if (!(avgExhibicionStock === null || avgExhibicionStock === undefined)) {
              totalExhibicionStock += avgExhibicionStock;
              validExhibicionStock++;
            }

          // }
        });
  
        brand.weeklyTotal![week] = {
          avgGondolaStock: validGondolaStock ? totalGondolaStock / validGondolaStock : 0,
          avgExhibicionStock: validExhibicionStock ? totalExhibicionStock / validExhibicionStock : 0,
        };
  
        if (validGondolaStock) {
          totalWeekGondolaStock += totalGondolaStock / validGondolaStock;
          validWeekGondolaStock++;
        }
        if (validExhibicionStock) {
          totalWeekExhibicionStock += totalExhibicionStock / validExhibicionStock;
          validWeekExhibicionStock++;
        }
      });
  
      this.totalPerWeek[week] = {
        avgGondolaStock: validWeekGondolaStock ? totalWeekGondolaStock / validWeekGondolaStock : 0,
        avgExhibicionStock: validWeekExhibicionStock ? totalWeekExhibicionStock / validWeekExhibicionStock : 0,
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
  
      Object.keys(weekData).forEach(brandName => {
        let brand = brandMap[brandName];
        if (!brand) {
          brand = { key: brandName, name: brandName, children: [], weeklyTotal: {} };
          brandMap[brandName] = brand;
        }
  
        Object.keys(weekData[brandName]).forEach(productName => {
          let product = brand.children.find(p => p.name === productName);
          if (!product) {
            product = { key: productName, name: productName, weeksData: {} };
            brand.children.push(product);
          }
  
          // const avg_pvp_adicional = weekData[brandName][productName].avg_pvp_adicional;
          const avgGondolaStock = weekData[brandName][productName];
          // const avg_pvp_regular = weekData[brandName][productName].avg_pvp_regular;
  
          if (avgGondolaStock !== undefined && avgGondolaStock !== null) {
            product.weeksData![week] = {
              avgGondolaStock,
              avgExhibicionStock: null
            };
          }
        });
  
        brand.weeklyTotal![week] = {
          avgGondolaStock: null,
          avgExhibicionStock: null,
          // avg_pvp_regular: null,
        };
      });
    });
  
    return Object.values(brandMap);
  }

  getBrandTotalQtyForWeek(brand: Brand, week: string, type: string): number {
    if (type === 'avgGondolaStock') {
      return brand.weeklyTotal?.[week]?.avgGondolaStock || 0;
    } else {
      return brand.weeklyTotal?.[week]?.avgExhibicionStock || 0;
    }
    // } else {
    //   return brand.weeklyTotal?.[week]?.avgExhibicionStock || 0;
    // }
  }

  handlePopoverVisibleChangeAveragesMarcaDescription(visible: boolean): void {
    this.isPopoverVisibleExportFileAveragesMarcaDescripcion = visible;
  }

  clickMePopoverAveragesMarcaDescription(): void {
    this.isPopoverVisibleExportFileAveragesMarcaDescripcion = false;
  }

  togglePopoverAveragesMarcaDescription(event: Event): void {
    event.stopPropagation();
  }

  exportExcelStockAverageByDescriptionMonthAndWeek(): void {
    this.isLoadingGeneric = true;
    this.stockDashboardService.exportExcelStockAverageByDescriptionMonthAndWeek(this.filtersParams).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport()+'-stock-avegare-by-description-month-and-week'+'.xlsx';
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

  exportExcelStockSeparateAveragesByBrandAndDescriptionByMonthAndWeek(): void {
    this.isLoadingGeneric = true;
    this.stockDashboardService.exportExcelStockSeparateAveragesByBrandAndDescriptionByMonthAndWeek(this.filtersParams).subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.dateService.generateFormattedDateForExport()+'-stock-separate-averages-by-type-brand-description-and-week'+'.xlsx';
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
}

// db.exhibicion_adicional.countDocuments({
//   "skus.sku": null  // Buscar si algún objeto dentro del array skus tiene "linea" igual a "Licores"
// })

// db.exhibicion_adicional.find(
//   { "skus.sku": null },  // Condición para encontrar documentos con "linea" igual a null en algún elemento del array "skus"
//   { _id: 1, skus: 1 }               // Proyección para obtener solo el campo "_id"
// ).toArray();


// db.stock.aggregate([
//   {
//     $lookup: {
//       from: "sku",
//       localField: "skus.sku",
//       foreignField: "sku",
//       as: "skuData"
//     }
//   },
//   {
//     $addFields: {
//       skus: {
//         $map: {
//           input: "$skus",
//           as: "skuItem",
//           in: {
//             $mergeObjects: [
//               "$$skuItem",
//               {
//                 descripcion: {
//                   $let: {
//                     vars: {
//                       matchedSku: {
//                         $first: {
//                           $filter: {
//                             input: "$skuData",
//                             cond: { $eq: ["$$this.sku", "$$skuItem.sku"] }
//                           }
//                         }
//                       }
//                     },
//                     in: "$$matchedSku.descripcion"
//                   }
//                 },
//                 marca: {
//                   $let: {
//                     vars: {
//                       matchedSku: {
//                         $first: {
//                           $filter: {
//                             input: "$skuData",
//                             cond: { $eq: ["$$this.sku", "$$skuItem.sku"] }
//                           }
//                         }
//                       }
//                     },
//                     in: "$$matchedSku.marca"
//                   }
//                 }
//               }
//             ]
//           }
//         }
//       }
//     }
//   },
//   {
//     $merge: {
//       into: "stock",
//       whenMatched: "replace",
//       whenNotMatched: "discard"
//     }
//   }
// ])
// db.stock.updateMany(
//   { skuData: { $exists: true } },  // Condición: solo documentos que tengan la propiedad skuInfo
//   { $unset: { skuData: "" } }  // Eliminar la propiedad skuInfo
// )

// db.poc.updateMany(
//   { documento_sv: "70383010" },
//   { 
//     $set: { 
//       documento_sv: "71240235", 
//       nombre_sv: "CUPER DIANDERAS, VICTOR MAURICIO" 
//     }
//   }
// )

// db.exhibicion_contraprestada.updateMany(
//   { 
//     "poc.documento_sv": "70383010",
//     "fecha_creacion": { $gte: ISODate("2024-10-15T05:00:00.000Z") }
//   },
//   { 
//     $set: { 
//       "poc.documento_sv": "71240235",
//       "poc.nombre_sv": "CUPER DIANDERAS, VICTOR MAURICIO"
//     }
//   }
// )

// db.exhibicion_competencia.updateMany(
//   { 
//     "poc.documento_sv": "70383010",
//     "fecha_creacion": { $gte: ISODate("2024-10-15T05:00:00.000Z") }
//   },
//   { 
//     $set: { 
//       "poc.documento_sv": "71240235",
//       "poc.nombre_sv": "CUPER DIANDERAS, VICTOR MAURICIO"
//     }
//   }
// )

// db.stock.updateMany(
//   { 
//     "poc.documento_sv": "70383010",
//     "fecha_creacion": { $gte: ISODate("2024-10-15T05:00:00.000Z") }
//   },
//   { 
//     $set: { 
//       "poc.documento_sv": "71240235",
//       "poc.nombre_sv": "CUPER DIANDERAS, VICTOR MAURICIO"
//     }
//   }
// )



// https://backuskkaamerch.blob.core.windows.net/web/sku/6.jpg
// https://backuskkaamerch.blob.core.windows.net/web/sku/6.jpg
// https://backuskkaamerch.blob.core.windows.net/web/sku/photo-sku-6610a329-4b0d-4b58-ae8c-79ee0e253fdf.webp
// https://backuskkaamerch.blob.core.windows.net/web/sku/photo-sku-6610a329-4b0d-4b58-ae8c-79ee0e253fdf.webp


// // Obtener todos los documentos de la colección "61_exh_ad_tmp"
// const tmpDocuments = db["61_exh_ad_tmp"].find().toArray();

// tmpDocuments.forEach(doc => {
//   // Para cada documento en "61_exh_ad_tmp", actualiza el campo `skus` en exhibicion_adicional donde _id coincide
//   db.exhibicion_adicional.updateOne(
//     { _id: doc._id }, // Coincidencia por el mismo ObjectID
//     { $set: { skus: doc.skus } } // Reemplaza el campo `skus`
//   );
// });