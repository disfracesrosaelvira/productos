import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-spinner-loading',
  standalone: true,
  imports: [CommonModule, NzSpinModule],
  templateUrl: './spinner-loading.component.html',
  styleUrl: './spinner-loading.component.scss'
})
export class SpinnerLoadingComponent {
  @Input() loading: boolean = false;
}
