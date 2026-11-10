import { Component, Input, Output, EventEmitter, ElementRef, HostListener, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-term-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './term-selector.component.html',
  styleUrl: './term-selector.component.scss'
})
export class TermSelectorComponent implements OnChanges {
  private elementRef = inject(ElementRef);

  @Input() selectedYear: string = '2569';
  @Input() selectedSemester: string = '2';

  // ใช้ตัวแปร internal แทนการ mutate @Input() โดยตรง
  internalYear: string = '2569';
  internalSemester: string = '2';

  @Output() termChange = new EventEmitter<{ year: string; semester: string }>();

  isYearOpen: boolean = false;
  isSemesterOpen: boolean = false;

  years: { val: string }[] = [
    { val: '2569' },
    { val: '2568' },
    { val: '2567' }
  ];

  semesters: { val: string; label: string }[] = [
    { val: '1', label: 'ภาค 1' },
    { val: '2', label: 'ภาค 2' },
    { val: '3', label: 'ภาคฤดูร้อน' }
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedYear']) {
      this.internalYear = this.selectedYear;
    }
    if (changes['selectedSemester']) {
      this.internalSemester = this.selectedSemester;
    }
  }

  // ปิด Dropdown อัตโนมัติเมื่อคลิกที่อื่นบนหน้าจอ
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeAll();
    }
  }

  toggleYear(event: Event) {
    event.stopPropagation();
    this.isYearOpen = !this.isYearOpen;
    this.isSemesterOpen = false;
  }

  toggleSemester(event: Event) {
    event.stopPropagation();
    this.isSemesterOpen = !this.isSemesterOpen;
    this.isYearOpen = false;
  }

  selectYear(year: string, event: Event) {
    event.stopPropagation();
    if (this.internalYear !== year) {
      this.internalYear = year;
      this.termChange.emit({ year: this.internalYear, semester: this.internalSemester });
    }
    this.isYearOpen = false;
  }

  selectSemester(semester: string, event: Event) {
    event.stopPropagation();
    if (this.internalSemester !== semester) {
      this.internalSemester = semester;
      this.termChange.emit({ year: this.internalYear, semester: this.internalSemester });
    }
    this.isSemesterOpen = false;
  }

  closeAll() {
    this.isYearOpen = false;
    this.isSemesterOpen = false;
  }

  get semesterLabel(): string {
    const found = this.semesters.find(s => s.val === this.internalSemester);
    return found ? found.label : `ภาค ${this.internalSemester}`;
  }
}
