import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerComponent } from 'ng-zorro-antd/date-picker';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { startOfMonth, differenceInCalendarDays } from 'date-fns';

@Component({
  selector: 'app-select-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule,NzDatePickerModule, NzTypographyModule, NzInputModule, NzIconModule, NzButtonModule],
  templateUrl: './select-date-picker.component.html',
  styleUrl: './select-date-picker.component.scss'
})

export class SelectDatePickerComponent {
  @ViewChild('filterEndDatePicker') filterEndDatePicker!: NzDatePickerComponent;
  @Output() dateChanged = new EventEmitter<{ filterEndDate: Date; filterStartDate: Date; }>();
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  today = new Date();

  ngOnInit(): void {
    this.filterEndDate = this.today;
    this.filterStartDate = startOfMonth(this.filterEndDate);
  }
  
  applyDates() {
    if (this.filterStartDate && this.filterEndDate) {
      const startDate = new Date(this.filterStartDate);
      startDate.setHours(0, 0, 0, 0); // Inicio del día

      const endDate = new Date(this.filterEndDate);
      // endDate.setHours(23, 59, 59, 999); // Fin del día
      this.dateChanged.emit({ filterStartDate: startDate, filterEndDate: endDate });
    }
  }

  disabledFilterStartDate = (startValue: Date): boolean => {
    if (!startValue || !this.filterEndDate) {
      return false;
    }
    return startValue.getTime() > this.filterEndDate.getTime() || differenceInCalendarDays(startValue, this.today) > 0;
  };

  disabledFilterEndDate = (endValue: Date): boolean => {
    const today = new Date();
    if (!this.filterStartDate) {
      return false; // or return a default value depending on your logic
    }
    return endValue.getTime() < this.filterStartDate.getTime() || endValue.getTime() > today.getTime();
  };

  handleFilterStartDateOpenChange(open: boolean): void {
    if (!open) {
      this.filterEndDatePicker.open();
    }
  }
}
