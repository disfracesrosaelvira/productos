import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-update-supervidor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ReactiveFormsModule, NzModalModule, NzInputModule, NzButtonModule, NzIconModule, NzDatePickerModule, NzSelectModule],
  templateUrl: './update-supervidor.component.html',
  styleUrl: './update-supervidor.component.scss'
})
export class UpdateSupervidorComponent {
  @Input() isModalVisible: boolean = false;
  @Input() supervisors: any[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<any>();
  updateSupervisorForm: FormGroup;
  isLoadingGeneric: boolean = false;

  constructor(
    private fb: FormBuilder,
  ) {
    this.updateSupervisorForm = this.fb.group({
      // dni_supervisor: ['', Validators.required],
      dni_supervisor: [{ value: '', disabled: true }, Validators.required],
      nombre_supervisor: ['', Validators.required],
      documento_sv: ['', Validators.required],
      nombre_sv: ['', [Validators.required]],
      fecha_inicio: [null, [Validators.required]],
    });
    this.updateSupervisorForm.updateValueAndValidity();
  }

  handleCancelModal() {
    this.closeModal.emit();
    this.isModalVisible = false;
  }

// "fecha_creacion": { $gte: ISODate("2024-09-01T05:00:00.000Z") }
  handleSaveChanges() {
    if (this.updateSupervisorForm.valid) {
      this.saveChanges.emit(this.updateSupervisorForm.value);
      this.isModalVisible = false;
    }
  }

  onSupervisorChange(nombreSupervisor: string): void {
    const selectedSupervisor = this.supervisors.find(supervisor => supervisor.nombre_sv === nombreSupervisor);
    if (selectedSupervisor) {
      this.updateSupervisorForm.get('dni_supervisor')?.setValue(selectedSupervisor.documento_sv);
    } else {
      this.updateSupervisorForm.get('dni_supervisor')?.setValue(''); // Limpia el campo si no hay selección
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateSupervisorForm.reset();
  }

  // Función para deshabilitar fechas futuras
  disableFutureDates = (current: Date): boolean => {
    // Comparar la fecha actual con hoy
    const today = new Date();
    return current > today; // Habilitar solo hasta hoy
  };  
}
