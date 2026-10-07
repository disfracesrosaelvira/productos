import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {

  private selectedSucursalSource = new BehaviorSubject<string>('');
  currentSelectedSucursal = this.selectedSucursalSource.asObservable();

  private selectedMarcaSource = new BehaviorSubject<string>('');
  currentSelectedMarca = this.selectedMarcaSource.asObservable();

  private selectedDetallPriceOk = new BehaviorSubject<boolean>(false);
  currentSelectedDetallPriceOk = this.selectedDetallPriceOk.asObservable();

  private selectedIncidenciaCompetenciaOk = new BehaviorSubject<boolean>(false);
  currentselectedIncidenciaCompetenciaOk= this.selectedIncidenciaCompetenciaOk.asObservable();

  private selectedIncidenciaMueblesOk = new BehaviorSubject<boolean>(false);
  currentselectedIncidenciaMueblesOk= this.selectedIncidenciaMueblesOk.asObservable();

  // Agrega un nuevo BehaviorSubject para los componentes
  private componentsSource = new BehaviorSubject<any>(null);
  currentComponents = this.componentsSource.asObservable();

  constructor() { }

  changeSelectedSucursal(sucursal: string) {
    this.selectedSucursalSource.next(sucursal);
  }
  clearSelectedMarca() {
    this.selectedMarcaSource.next('');
  }
  changeSelectedMarca(marca: string) {
    this.selectedMarcaSource.next(marca);
  }

  // Agrega un nuevo método para cambiar los componentes
  changeComponentState(components: any) {
    this.componentsSource.next(components);
  }

  changeSelectedDetallPriceOk(isOk: boolean) {
    this.selectedDetallPriceOk.next(isOk);
  }

  changeselectedIncidenciaCompetenciaOk(isOk: boolean) {
    this.selectedDetallPriceOk.next(isOk);
  }
}
