import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { IEstructuraComercial } from '@pages/dto/estructuraComercial.dto';
import { AppBackusService } from '@pages/app-backus/app-backus.service';

interface IPocForSelect {
  poc: number;
  poc_nombre: string;
}

@Component({
  selector: 'app-dynamic-form-commercial-structure',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ReactiveFormsModule, NzModalModule, NzSwitchModule, NzInputModule, NzSelectModule],
  templateUrl: './dynamic-form-commercial-structure.component.html',
  styleUrl: './dynamic-form-commercial-structure.component.scss'
})
export class DynamicFormCommercialStructureComponent{
  @Input() isVisible: boolean = false;
  // @Input() structureData!: IEstructuraComercial;
  @Input() structureData: IEstructuraComercial | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<IEstructuraComercial>();
  @Input() isEditMode: boolean = false;
  appPageIndex: number = 1;
  appPageSize: number = 7;
  appTotal: number = 0;
  structureForm: FormGroup;
  isLoading: boolean = false;
  listPocForSelect: IPocForSelect [] = [];
  titleModal: string = '';

  user: any = localStorage.getItem('user');
  user_id = this.user ? JSON.parse(this.user).userId : '0';
  rol:any = localStorage.getItem('rol');

  constructor(
    private fb: FormBuilder,
    private appBackusService: AppBackusService,
  ) {
    this.structureForm = this.fb.group({
      _id: [''],
      poc: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
      poc_nombre: ['', Validators.required],
      poc_cadena: ['', Validators.required],
      poc_backus: ['', Validators.required],
      poc_nombre_planning: ['', Validators.required],
      poc_tipo: ['', Validators.required],
      documento_sv: ['', Validators.required],
      nombre_sv: ['', Validators.required],
      documento_bdr: ['', Validators.required],
      nombre_bdr: ['', Validators.required],
      estado: ['', Validators.required],
      usuario_id_creacion: { value: '', disabled: true },
      fecha_creacion: [''],
    });
    this.structureForm.updateValueAndValidity();

    // al seleccionar del select, tambien se actualiza el poc_nombre
    this.structureForm.get('poc')?.valueChanges.subscribe(value => {
      const selectedPoc = this.listPocForSelect.find(option => option.poc === value);
      this.structureForm.patchValue({
        poc_nombre: selectedPoc ? selectedPoc.poc_nombre : ''
      });
    });
  }

  ngOnInit() {
    this.loadData();
  }
  
  async loadData() {
    try {
      this.isLoading = true;
      await this.appBackusService.getStore4User(this.user_id,this.rol).then((response) => {
        this.listPocForSelect = response.listSucursales;
        this.isLoading = false;
      });

    } catch (error) {
      console.error('Error al cargar los datos:', error);
      this.isLoading = false;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isEditMode && changes['structureData'] && this.structureData) {
      this.structureForm.patchValue(this.structureData);
    } else {
      this.resetForm();
    }
    this.structureForm.updateValueAndValidity();
  }

  handleOk(): void {
    if (this.structureForm.valid) {
      this.saveChanges.emit(this.structureForm.value);
      this.isVisible = false;
    }
  }

  resetForm() {
    this.structureForm.reset({
      _id: '',
      poc: null,
      poc_nombre: '',
      poc_cadena: '',
      poc_backus: '',
      poc_nombre_planning: '',
      poc_tipo: '',
      documento_sv: '',
      nombre_sv: '',
      documento_bdr: '',
      nombre_bdr: '',
      estado: 1,
      usuario_id_creacion: { value: '', disabled: true },
      fecha_creacion: '',
      fecha_actualizacion: '',
      usuario_id_actualizacion: '',
    });
  }

  onEstadoChange(event: any): void {
    const value = event ? 1 : 0;
    if (this.structureForm.get('estado')?.value !== value) {
      this.structureForm.get('estado')?.setValue(value, { emitEvent: false });
    }
  }

  handleCancel(): void {
    this.closeModal.emit();
    this.isVisible = false;
  }
}
