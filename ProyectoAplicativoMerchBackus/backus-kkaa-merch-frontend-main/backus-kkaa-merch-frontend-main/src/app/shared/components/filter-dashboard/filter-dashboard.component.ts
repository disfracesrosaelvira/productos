import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { Router } from '@angular/router';

@Component({
  selector: 'app-filter-dashboard',
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
    NzSelectModule
  ],
  templateUrl: './filter-dashboard.component.html',
  styleUrl: './filter-dashboard.component.scss'
})
export class FilterDashboardComponent {
  @Output() filtersChanged = new EventEmitter<any>();
  @Input() filters: any = {};
  @Input() tempFilters: any = {};
  selectExhibicionAdicionalOrContraprestada: string = 'adicional';
  @Output() selectExhibicionAdicionalOrContraprestadaChanged = new EventEmitter<string>();
  filtersParams: any = {};
  permissions: { [key: string]: string [] } = {
    '/exhibiciones-competencia-dashboard': ['linea'],
    '/exhibiciones-dashboard': ['linea', 'select-exhibicion'],
    '/stock-dashboard': ['linea'],
    '/precio-dashboard': [],
    '/frente-dashboard': ['linea'],
  };

  constructor(private router: Router) { }

  getVisibleFilter(filter: string): boolean {
    const url = this.router.url;
    return this.permissions[url].some((item: string) => item === filter);
  }

  onYearChange(result: Date): void {
    // console.log('result', result)
    if(this.currentYear() === this.getYear(this.filters.anio.value)) {
      this.maintainingCheckedMonths(this.initializeMonths());
    } else {
      this.maintainingCheckedMonths(this.monthsNotCurrentYear());
    }
    this.getTitleSelect('meses');
    // this.loadingDataOptions();
    this.loadingFiltersParams();
  }

  onSelectAllChange(checked: boolean, nameSelect: string): void {
    // this.filters[nameSelect].list.forEach((item: any) => item.checked = checked);
    // this.filters[nameSelect].selectAllChecked = checked;
    this.tempFilters[nameSelect].list.forEach((item: any) => item.checked = checked);
    this.tempFilters[nameSelect].selectAllChecked = checked;
    this.getTitleSelect(nameSelect);
    this.filters[nameSelect] = JSON.parse(JSON.stringify(this.tempFilters[nameSelect]));
    // this.loadingDataOptions();
    this.loadingFiltersParams();
  }

  onItemChange(nameSelect: string): void {
    this.getTitleSelect(nameSelect);
    // const allChecked = this.filters[nameSelect].list.every((item: any) => item.checked)
    // this.filters[nameSelect].selectAllChecked = allChecked;

    const allChecked = this.tempFilters[nameSelect].list.every((item: any) => item.checked);
    this.tempFilters[nameSelect].selectAllChecked = allChecked;
    // this.loadingDataOptions();
  }

  removeFilterSelected(nameSelect: string) {
    this.tempFilters[nameSelect].list.forEach((element: any) => element.checked = false);
    this.tempFilters[nameSelect].selectAllChecked = false;
    this.getTitleSelect(nameSelect);
    this.filters[nameSelect] = JSON.parse(JSON.stringify(this.tempFilters[nameSelect]));
    // this.loadingDataOptions();
    this.loadingFiltersParams();
  }

  onAcceptApplyFilters(nameSelect: string) {
    // this.filters[nameSelect].isDropdownVisible = false;
    this.getTitleSelect(nameSelect);
    // Aplica los cambios temporales a los filtros originales
    this.filters[nameSelect] = JSON.parse(JSON.stringify(this.tempFilters[nameSelect]));
    // this.loadingDataOptions(); // Ejecuta la función cuando se hace clic en "Aceptar"
    this.loadingFiltersParams();
  }

  onCancelApplyFilters(nameSelect: string): void {
    // this.filters[nameSelect].isDropdownVisible = false;
    this.tempFilters[nameSelect] = JSON.parse(JSON.stringify(this.filters[nameSelect]));
  }

  onSearch(filterName: string): void {
    // This method will be called every time the search term changes
    // It doesn't need to do anything explicitly, as getFilteredItems will handle the filtering
  }

  getFilteredItems(filterName: string): any[] {
    // console.log('filterName', filterName);
    const filter = this.tempFilters[filterName];
    if (!filter || !filter.searchTerm) {
      return filter?.list || [];
    }
    return (filter.list || []).filter((item: any) => {
      if (!item || typeof item.label !== 'string') {
        return false;
      }
      return item.label.toLowerCase().includes(filter.searchTerm.toLowerCase());
    });
  }

  private getTitleSelect(nameSelect: string) {
    const length = this.tempFilters[nameSelect].list.length;
    const listChecked = this.tempFilters[nameSelect].list.filter((element: any) => element.checked);
    const lenghtListChecked = listChecked.length;
    if (lenghtListChecked === 0) {
      this.tempFilters[nameSelect].titleSelect = 'Seleccione';
    } else if (lenghtListChecked === 1) {
      this.tempFilters[nameSelect].titleSelect = listChecked[0].label;
    } else if (lenghtListChecked === length) {
      this.tempFilters[nameSelect].titleSelect = 'Todos';
    } else {
      this.tempFilters[nameSelect].titleSelect = 'Multiple Selección';
    }
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
    this.filtersChanged.emit(filters);
  }

  private maintainingCheckedMonths(filtros: any) {
    this.filters.meses.list = filtros.map((item: any) => {
      const found = this.filters.meses.list.find((element: any) => element.value == item.value);
      if (found) {
        return found;
      }
      return { label: item.label, value: item.value, checked: false };
    });
    this.filters.meses.selectAllChecked = this.filters.meses.list.every((item: any) => item.checked);
  }

  disabledDate = (current: Date): boolean => {
    // Ejemplo: deshabilitar años futuros
    return current && current.getTime() > Date.now();
  };


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

  monthsNotCurrentYear(): any[] {
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
    return months;
  }

  currentMonth(): number {
    return this.getPeruDate().getUTCMonth(); // Ejemplo Enero = 0, Febrero: 1
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

  onChangeExhibicionAdicionalOrContraprestada(value: string): void {
    // this.loadingDataOptions();
    this.selectExhibicionAdicionalOrContraprestadaChanged.emit(value);
  }
}

///////////////////////////////////////////////////
// db.exhibicion_adicional.aggregate([
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
//                 linea: {
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
//                     in: "$$matchedSku.linea"
//                   }
//                 },
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
//       into: "exhibicion_adicional",
//       whenMatched: "replace",
//       whenNotMatched: "discard"
//     }
//   }
// ])
// db.exhibicion_adicional.updateMany(
//   { skuData: { $exists: true } },  // Condición: solo documentos que tengan la propiedad skuInfo
//   { $unset: { skuData: "" } }  // Eliminar la propiedad skuInfo
// )

// /////////////// exhibicion_competencia
// db.exhibicion_competencia.aggregate([
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
//                 linea: {
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
//                     in: "$$matchedSku.linea"
//                   }
//                 },
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
//       into: "exhibicion_competencia",
//       whenMatched: "replace",
//       whenNotMatched: "discard"
//     }
//   }
// ])
// db.exhibicion_competencia.updateMany(
//   { skuData: { $exists: true } },  // Condición: solo documentos que tengan la propiedad skuInfo
//   { $unset: { skuData: "" } }  // Eliminar la propiedad skuInfo
// )


// /////////////////////////////// precio
// db.precio.aggregate([
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
//       into: "precio",
//       whenMatched: "replace",
//       whenNotMatched: "discard"
//     }
//   }
// ])
// db.precio.updateMany(
//   { skuData: { $exists: true } },  // Condición: solo documentos que tengan la propiedad skuInfo
//   { $unset: { skuData: "" } }  // Eliminar la propiedad skuInfo
// )



// /////////////////////stock
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
