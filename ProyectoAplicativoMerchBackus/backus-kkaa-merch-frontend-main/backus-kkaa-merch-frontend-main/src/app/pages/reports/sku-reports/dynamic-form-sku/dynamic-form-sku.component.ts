import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ISku } from '@pages/dto/sku.dto';
import { PhotoUploadComponent } from '@shared/components/photo-upload/photo-upload.component';
import { UploadService } from '@shared/services/upload.service';
import { SharedService } from '@shared/services/shared.service';
import Constantes from '@shared/constants/contants';

@Component({
  selector: 'app-dynamic-form-sku',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ReactiveFormsModule, PhotoUploadComponent, NzModalModule, NzSwitchModule, NzInputModule, NzRadioModule, NzSelectModule, NzCollapseModule, NzIconModule],
  templateUrl: './dynamic-form-sku.component.html',
  styleUrl: './dynamic-form-sku.component.scss'
})
export class DynamicFormSkuComponent {
  @Input() isVisible: boolean = false;
  @Input() skuData: ISku | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<ISku>();
  @Input() isEditMode: boolean = false;

  skuForm: FormGroup;
  titleModal: string = '';

  table = 'sku';
  nameContainer = 'sku';
  existsPhoto = false;
  codigoValues: string = 'sku_linea_marca,sku_linea_categorias';
  skuLineaMarcas: any[] = [];
  skuLineaCategorias: any[] = [];

  filteredLineas: any[] = [];
  filteredMarcas: any[] = [];
  filteredCategorias: any[] = [];
  imagenNombre: string = '';
  imagenExtension: string = '';

  constructor(
    private fb: FormBuilder,
    private uploadService: UploadService,
    private sharedService: SharedService,
  ) {
    this.skuForm = this.fb.group({
      _id: [''],
      // sku: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
      sku: [null],
      descripcion: ['', Validators.required],
      categoria: ['', Validators.required],
      linea: ['', Validators.required],
      marca: ['', Validators.required],
      imagen: ['', Validators.required],
      empresa_id: ['', Validators.required],
      estado: ['', Validators.required],
      competencia: [null, [Validators.required]],
      usuario_id_creacion: { value: '', disabled: true },
      fecha_creacion: [''],
    });
    this.skuForm.updateValueAndValidity();
  }

  async ngOnInit() {
    await this.loadData();
    this.skuForm.get('empresa_id')?.valueChanges.subscribe(() => {
      this.filterLineas();
      this.filteredMarcas = [];
      this.filteredCategorias = [];
      this.skuForm.get('linea')?.setValue(null);
      this.skuForm.get('marca')?.setValue(null);
      this.skuForm.get('categoria')?.setValue(null);
    });
  
    this.skuForm.get('competencia')?.valueChanges.subscribe(() => {
      this.filterLineas();
      this.filteredMarcas = [];
      this.filteredCategorias = [];
      this.skuForm.get('linea')?.setValue(null);
      this.skuForm.get('marca')?.setValue(null);
      this.skuForm.get('categoria')?.setValue(null);
    });
  
    this.skuForm.get('linea')?.valueChanges.subscribe(() => {
      this.filterMarcas();
      this.filterCategorias();
      this.skuForm.get('marca')?.setValue(null);
      this.skuForm.get('categoria')?.setValue(null);
    });
  }

  async loadData(): Promise<void> {
    this.sharedService.configurationValues(this.codigoValues).then((response) => {
      if (response.success) {
        this.skuLineaMarcas = response?.result?.filter((item: any) => item.codigo == Constantes.CONFIG_VALUES.SKU_LINEA_MARCA).map((item: any) => item.valor)[0];
        this.skuLineaCategorias = response?.result?.filter((item: any) => item.codigo == Constantes.CONFIG_VALUES.SKU_LINEA_CATEGORIAS).map((item: any) => item.valor)[0];
      }
    }).catch((error) => {
      console.error('Error al cargar los datos:', error);
    });
  }

  filterLineas(): void {
    const empresa_id = this.skuForm.get('empresa_id')?.value;
    const competencia = this.skuForm.get('competencia')?.value;
    this.filteredLineas = this.skuLineaMarcas
      .filter(item => item.empresa_id === empresa_id && item.competencia === parseInt(competencia))
      .map(item => item.linea);
  }
  
  filterMarcas(): void {
    const linea = this.skuForm.get('linea')?.value;
    const empresa_id = this.skuForm.get('empresa_id')?.value;
    const competencia = this.skuForm.get('competencia')?.value;
    this.filteredMarcas = this.skuLineaMarcas
      .filter(item => item.linea === linea && item.empresa_id === empresa_id && item.competencia === parseInt(competencia))
      .map(item => item.marcas)
      .flat();
  }

  filterCategorias(): void {
    const empresa_id = this.skuForm.get('empresa_id')?.value;
    const competencia = this.skuForm.get('competencia')?.value;
    const linea = this.skuForm.get('linea')?.value;
    this.filteredCategorias = this.skuLineaCategorias
          .filter(item => item.empresa_id === empresa_id && item.competencia === parseInt(competencia) && item.linea === linea)
          .map(item => item.categorias)
          .flat();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isEditMode && changes['skuData'] && this.skuData) {
      this.skuForm.patchValue(this.skuData);
      this.skuForm.get('sku')?.disable();
      this.existsPhoto = this.isEditMode;
      const url = this.skuForm.get('imagen')?.value;
      const arr = url.split('?')[0].split('/');
      const imagen: any = arr.pop();
      this.imagenNombre = imagen.split('.')[0];
      this.imagenExtension = imagen.split('.')[1];
      // console.log('imagen_nombre', imagen_nombre)
      this.skuForm.get('linea')?.setValue(this.skuData.linea, { emitEvent: false });
      this.filterMarcas();
      this.skuForm.get('marca')?.setValue(this.skuData.marca, { emitEvent: false });
      this.filterCategorias();
      this.skuForm.get('categoria')?.setValue(this.skuData.categoria, { emitEvent: false });
    } else {
      this.existsPhoto = false;
      this.resetForm();
    }
    this.skuForm.updateValueAndValidity();
  }

  handleOk(): void {
    if (this.skuForm.valid) {
      this.saveChanges.emit(this.skuForm.value);
      this.isVisible = false;
    }
  }

  resetForm() {
    this.skuForm.reset({
      _id: '',
      sku: null,
      descripcion: '',
      categoria: '',
      linea: '',
      marca: '',
      imagen: '',
      empresa_id: '',
      estado: 1,
      competencia: null,
      usuario_id_creacion: { value: '', disabled: true },
      fecha_creacion: '',
      fecha_actualizacion: '',
      usuario_id_actualizacion: '',
    });

    if (this.isEditMode) {
      this.skuForm.get('sku')?.disable();
    } else {
      this.skuForm.get('sku')?.enable();
    }
  }

  onFilesChanged(files: any[]) {
    if (files.length == 1) {
      this.skuForm.patchValue({ imagen: files[0].imagen_url });
    } else {
      this.skuForm.patchValue({ imagen: '' });
    } 
  }

  deletePhoto(imagen: string) {
    const arr = imagen.split('?')[0].split('/');
    const imagen_nombre: any = arr.pop();
    this.uploadService.deletePhoto(imagen_nombre, this.nameContainer).then((response) => {
      console.log('response =>', response);
      this.skuForm.patchValue({ imagen: '' });
    }).catch((error) => {
      console.log('error | removeItemImg =>', error);
    });
    this.existsPhoto = false;
  }

  onEstadoChange(event: any): void {
    const value = event ? 1 : 0;
    if (this.skuForm.get('estado')?.value !== value) {
      this.skuForm.get('estado')?.setValue(value, { emitEvent: false });
    }
  }

  handleCancel(): void {
    this.closeModal.emit();
    this.isVisible = false;
  }
}
