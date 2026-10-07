import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputGroupComponent } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-filter-table-reports',
  standalone: true,
  imports: [NzDropdownMenuComponent, FormsModule, NzIconModule, NzButtonModule, NzCheckboxModule, NzTableModule, NzInputGroupComponent, CommonModule],
  templateUrl: './filter-table-reports.component.html',
  styleUrl: './filter-table-reports.component.scss'
})
export class FilterTableReportsComponent {
  private _filterItems: any;

  @Input()
  set filterItems(value: any) {
    if (value && typeof value[Symbol.iterator] === 'function') {
      
      // Verifica si value es iterable antes de asignarlo
      this._filterItems = value;
      this.originalFilterItems = [...value]; // Crea una copia de value
      this.initialFilterItems = [...value]; // Crea una copia de value
    } else {
      // Maneja el caso en el que value no es iterable
      console.error('Error: filterItems is not iterable');
    }
  }

  get filterItems(): any {
    return this._filterItems;
  }

  @Input()
  textPlaceholder = 'Buscar';

  @Output() filterItemsChange = new EventEmitter<any>();
  @Output() changeFilterItems = new EventEmitter<any>(); //usando

  inputFilter: string | null = null;
  hideFilter = false;
  originalFilterItems: any[] = [];
  initialFilterItems: any[] = [];
  copyInitialFilterItems: any[] = [];
  selectedfilterItems: any[] = [];
  isBtnResetDisabled = true;
  haveFilterAll = false;

  constructor(
    private message: NzMessageService,
  ) {
    
  }
  

  getIconClass() {
    return this.initialFilterItems.some((item: any) => item.selected) ? 'icon-color-blue' : 'icon-color-gray';
  }

  handleInputFilter() {
    if (this.inputFilter) {
      // Si inputFilterSku no es nulo ni vacío, filtra initialFilterItems
      const lowerCaseFilter = this.inputFilter.toLowerCase();
      this.initialFilterItems = this.originalFilterItems.filter((item: any) => item.text.toLowerCase().includes(lowerCaseFilter));
    } else {
      // Si inputFilterSku es nulo o vacío, restaura initialFilterItems a su estado original
      this.initialFilterItems = [...this.originalFilterItems];
    }
  }

  clearInput(){
    this.inputFilter = null;
    this.initialFilterItems = [...this.originalFilterItems];
  }

  async handleHideFilter(isOpenMenuFilter: any) {
    if (isOpenMenuFilter) this.hideFilter = true;
    else {
      // Compara el estado original de initialFilterItems con su estado actual
      const initialFilterItems = JSON.stringify(this.initialFilterItems);
      const originalFilterItems = JSON.stringify(this.originalFilterItems);

      if (initialFilterItems != originalFilterItems) {
        // Si los dos estados son diferentes, se han realizado cambios
        this.confirmFilter()
      }
    }
  }

  updateSingleFilterItemChecked() {
    // Comprueba si todos los elementos en initialFilterItems tienen su propiedad 'selected' establecida en false
    // Devuelve true si todos los elementos no están seleccionados, y false si al menos uno está seleccionado
    let resultadosFiltrados:any[] = this.initialFilterItems.filter((item: any) => item.value?.includes('seleccionar_todo'));
    this.selectedfilterItems = this.initialFilterItems.filter((item: any) => item.selected).map((item: any) => item.value);

    if (resultadosFiltrados[0]?.selected && !this.haveFilterAll) {
      this.allFilterSelected();
    }else if(!resultadosFiltrados[0]?.selected && this.haveFilterAll){
      this.clearFilterSelected();
    }
    this.originalFilterItems = [...this.initialFilterItems] // Guarda el estado inicial de initialFilterItems

  }

  // Método para actualizar el estado del botón de reinicio basado en la selección de los items
  clearFilterSelected() {
    this.haveFilterAll = false;
    this.initialFilterItems.forEach((item: any) => item.selected = false);
    // this.isBtnResetDisabled = true;
    // this.confirmFilter()
  }

  // Metodo para Eliminar los filtros seleccionados
  removeFilterSelected() {
    this.haveFilterAll = false;
    this.initialFilterItems.forEach((item: any) => item.selected = false);
    this.confirmFilter(true)
    // this.isBtnResetDisabled = true;
  }

  // Método para actualizar el estado del botón de reinicio basado en la selección de los items
  allFilterSelected() {
    this.haveFilterAll = true;
    this.initialFilterItems.forEach((item: any) => item.selected = true);
    // this.isBtnResetDisabled = true;
  }

  cancelFilter() {
    this.hideFilter = false;
  }

  async confirmFilter(isRemoveFilter: boolean = false) {

    this.selectedfilterItems = this.initialFilterItems.filter((item: any) => item.selected).map((item: any) => item.value);
    this.selectedfilterItems = this.selectedfilterItems.filter((item: any) => !item?.includes('seleccionar_todo'));
    this.selectedfilterItems = this.selectedfilterItems.map((item: any) => item?.includes('seleccionar_vacio') ? "" : item );
    if(this.selectedfilterItems.length <= 10){
      this.originalFilterItems = [...this.initialFilterItems] // Guarda el estado inicial de initialFilterItems
      this.hideFilter = false;
      this.changeFilterItems.emit({selectedFilterItems: this.selectedfilterItems, filterItems: this.initialFilterItems, isRemoveFilter: isRemoveFilter});
    }else{
      this.message.warning(
        'La cantidad de registros seleccionados supera el límite permitido. Por favor, seleccione menos registros.'
      );
    }
  }
}
