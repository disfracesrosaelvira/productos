import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, switchMap, tap } from 'rxjs/operators';

import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { IPoc } from '@pages/dto/poc.dto';
import { PocReportsService } from '../poc-reports.service';

@Component({
  selector: 'app-dynamic-form-poc',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ReactiveFormsModule, NzModalModule, NzSwitchModule, NzInputModule, NzSelectModule],
  templateUrl: './dynamic-form-poc.component.html',
  styleUrl: './dynamic-form-poc.component.scss'
})
export class DynamicFormPocComponent {
  @Input() isVisible: boolean = false;
  @Input() pocData: IPoc | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<IPoc>();
  @Input() isEditMode: boolean = false;

  pocForm: FormGroup;
  isDuplicateName: boolean = false;
  isDuplicatePocCadena: boolean = false;
  isDuplicatePocBackus: boolean = false;
  isDuplicateNamePlanning: boolean = false;

  constructor(
    private fb: FormBuilder,
    private pocReportsService: PocReportsService,
  ) {
    this.pocForm = this.fb.group({
      _id: [''],
      // poc: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
      poc: [null],
      nombre: ['', Validators.required],
      poc_cadena: [''],
      poc_backus: [''],
      nombre_planning: [''],
      tipo: [''],
      documento_sv: ['', Validators.required],
      nombre_sv: ['', Validators.required],
      estado: ['', Validators.required],
      usuario_id_creacion: { value: '', disabled: true },
      fecha_creacion: [''],
      fecha_actualizacion: [''],
      usuario_id_actualizacion: [''],
      poc_livetrade: [''],
      cadena: [''],
      gerencia: [''],
      region: [''],
    });
    this.pocForm.updateValueAndValidity();

    // Subscribe to changes in the 'nombre' field
    this.pocForm.get('nombre')?.valueChanges.pipe(
      debounceTime(300), // Wait 300ms after the user stops typing
      // switchMap(value => this.checkDuplicateName(value));
      switchMap(value => this.pocReportsService.checkDuplicateName(value, this.pocForm.get('_id')?.value))
    ).subscribe(response => {
      this.isDuplicateName = response.exists;
    });

    // this.pocForm.get('nombre')?.valueChanges.pipe(
    //   debounceTime(300), // Wait 300ms after the user stops typing
    //   tap(() => {
    //     if (!this.isEditMode) {
    //       this.isDuplicateName = false; // Reset the duplicate flag
    //     }
    //   }),
    //   switchMap(value => {
    //     if (!this.isEditMode) {
    //       return this.pocReportsService.checkDuplicateName(value);
    //     } else {
    //       return [null];
    //     }
    //   })
    // ).subscribe(response => {
    //   if (response && response.exists !== undefined) {
    //     this.isDuplicateName = response.exists;
    //   }
    // });

    this.pocForm.get('poc_cadena')?.valueChanges.pipe(
      debounceTime(300), // Wait 300ms after the user stops typing
      // switchMap(value => this.checkDuplicateName(value));
      switchMap(value => this.pocReportsService.checkDuplicatePocCadena(value, this.pocForm.get('_id')?.value))
    ).subscribe(response => {
      this.isDuplicatePocCadena = response.exists;
    });

    // this.pocForm.get('poc_backus')?.valueChanges.pipe(
    //   debounceTime(300), // Wait 300ms after the user stops typing
    //   // switchMap(value => this.checkDuplicateName(value));
    //   switchMap(value => this.pocReportsService.checkDuplicatePocBackus(value, this.pocForm.get('_id')?.value))
    // ).subscribe(response => {
    //   this.isDuplicatePocBackus = response.exists;
    // });
    this.pocForm.get('cadena')?.valueChanges.subscribe(() => {
      // Forzar revalidación de poc_backus cuando cambie cadena
      this.pocForm.get('poc_backus')?.updateValueAndValidity();
    });
    this.pocForm.get('poc_backus')?.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => {
        const cadena = this.pocForm.get('cadena')?.value;
        if (cadena === 'COESTI' || cadena === 'MASS') {
          return [null];
        }
        return this.pocReportsService.checkDuplicatePocBackus(value, this.pocForm.get('_id')?.value);
      })
    ).subscribe(response => {
      this.isDuplicatePocBackus = response?.exists || false;
    });
    

    this.pocForm.get('nombre_planning')?.valueChanges.pipe(
      debounceTime(300), // Wait 300ms after the user stops typing
      // switchMap(value => this.checkDuplicateName(value));
      switchMap(value => this.pocReportsService.checkDuplicateNamePlanning(value, this.pocForm.get('_id')?.value))
    ).subscribe(response => {
      this.isDuplicateNamePlanning = response.exists;
    });
    // this.pocForm.get('nombre_planning')?.valueChanges.pipe(
    //   debounceTime(300),
    //   tap(() => {
    //     this.isDuplicateNamePlanning = false; // Reset the duplicate flag
    //   }),
    //   switchMap(value => {
    //     const id = this.pocForm.get('_id')?.value;
    //     return this.pocReportsService.checkDuplicateNamePlanning(value, id);
    //   })
    // ).subscribe(response => {
    //   if (response && response.exists !== undefined) {
    //     this.isDuplicateNamePlanning = response.exists;
    //   }
    // });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isEditMode && changes['pocData'] && this.pocData) {
      this.pocForm.patchValue(this.pocData);
      this.pocForm.get('poc')?.disable();
      // this.pocForm.get('nombre')?.disable();
      // this.pocForm.get('poc_cadena')?.disable();
      // this.pocForm.get('poc_livetrade')?.disable();
      // this.pocForm.get('poc_backus')?.disable();
      // this.pocForm.get('nombre_planning')?.disable();
    } else {
      this.resetForm();
    }
    this.pocForm.updateValueAndValidity();
  }

  // checkDuplicateName(nombre: string) {
  //   return this.http.get<{ exists: boolean }>(`${environment.backendUrl}/api/v1/pocs/check-name`, { params: { nombre } });
  // }

  handleOk(): void {
    if (this.pocForm.valid) {
      this.saveChanges.emit(this.pocForm.value);
      this.isVisible = false;
    }
  }

  resetForm() {
    this.pocForm.reset({
      _id: '',
      poc: null,
      nombre: '',
      nombre_planning: '',
      tipo: '',
      documento_sv: '',
      nombre_sv: '',
      poc_cadena: '',
      poc_backus: '',
      estado: 1,
      usuario_id_creacion: { value: '', disabled: true },
      fecha_creacion: '',
      fecha_actualizacion: '',
      poc_livetrade: '',
      cadena: '',
      gerencia: '',
      region: '',
      // usuario_id_actualizacion: '',
    });
    if (this.isEditMode) {
      this.pocForm.get('poc')?.disable();
      // this.pocForm.get('nombre')?.disable();
      // this.pocForm.get('poc_cadena')?.disable();
      // this.pocForm.get('poc_livetrade')?.disable();
      // this.pocForm.get('poc_backus')?.disable();
      // this.pocForm.get('nombre_planning')?.disable();
    } else {
      this.pocForm.get('poc')?.disable();
      // this.pocForm.get('nombre')?.enable();
      // this.pocForm.get('poc_cadena')?.enable();
      // this.pocForm.get('poc_livetrade')?.enable();
      // this.pocForm.get('poc_backus')?.enable();
      // this.pocForm.get('nombre_planning')?.enable();
    }
  }

  onEstadoChange(event: any): void {
    const value = event ? 1 : 0;
    if (this.pocForm.get('estado')?.value !== value) {
      this.pocForm.get('estado')?.setValue(value, { emitEvent: false });
    }
  }

  handleCancel(): void {
    this.closeModal.emit();
    this.isVisible = false;
  }
}


// const bulkOperations = [];
// db.exhibicion_competencia.find({}).forEach(function(exhibicionDoc) {
//     const updatedSkus = exhibicionDoc.skus.map(skuDoc => {
//         const skuInfo = db.sku.findOne({ sku: skuDoc.sku });

//         // Agregar la propiedad "marca" si el SKU existe en la colección "sku"
//         if (skuInfo) {
//             skuDoc.marca = skuInfo.marca;
//         }

//         return skuDoc;
//     });

//     bulkOperations.push({
//         updateOne: {
//             filter: { _id: exhibicionDoc._id },
//             update: { $set: { skus: updatedSkus } }
//         }
//     });
// });

// if (bulkOperations.length > 0) {
//     db.exhibicion_competencia.bulkWrite(bulkOperations);
// }