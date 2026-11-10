import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ReportService, FacultyReport } from '../../services/report.service';
import { ExcelService } from '../../services/excel.service';
import { TermSelectorComponent } from '../term-selector/term-selector.component';

@Component({
  selector: 'app-report-regional',
  standalone: true,
  imports: [CommonModule, TermSelectorComponent],
  templateUrl: './report-regional.component.html',
  styleUrl: './report-regional.component.scss'
})
export class ReportRegionalComponent implements OnInit, OnDestroy {
  private reportService = inject(ReportService);
  private excelService = inject(ExcelService);
  private reportSub: Subscription | null = null;
  private animFrameIds: number[] = [];

  selectedYear: string = '2569';
  selectedSemester: string = '2';
  reportList: FacultyReport[] = [];
  printDate: string = '';
  asOfDate: string = '';

  grandTotalApplicants = 0;
  grandTotalInternet = 0;
  grandTotalPaid = 0;
  grandTotalStudentId = 0;
  grandTotalWalkIn = 0;

  // Variables for dynamic count-up animation
  displayGrandTotal: number = 0;
  displayTotalPaid: number = 0;
  displayInternetPaid: number = 0;
  displayStudentId: number = 0;
  isRefreshing: boolean = false;

  ngOnInit() {
    this.updatePrintDate();
    this.loadReport();
  }

  onRefresh() {
    this.updatePrintDate();
    this.loadReport();
  }

  ngOnDestroy() {
    this.reportSub?.unsubscribe();
    this.cancelAllAnimations();
  }

  private cancelAllAnimations() {
    this.animFrameIds.forEach(id => cancelAnimationFrame(id));
    this.animFrameIds = [];
  }

  updatePrintDate() {
    const now = new Date();
    this.printDate = now.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    this.asOfDate = now.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  onTermChange(term: { year: string; semester: string }) {
    this.selectedYear = term.year;
    this.selectedSemester = term.semester;
    this.loadReport();
  }

  loadReport() {
    this.isRefreshing = true;
    this.reportSub?.unsubscribe();
    this.reportSub = this.reportService.getRegionalReport(this.selectedYear, this.selectedSemester).subscribe({
      next: (data) => {
        this.reportList = data || [];
        this.calculateTotals();
        setTimeout(() => {
          this.isRefreshing = false;
        }, 750);
      },
      error: (err) => {
        console.error('Failed to load regional report', err);
        this.reportList = [];
        this.calculateTotals();
        this.isRefreshing = false;
      }
    });
  }

  getFacultyStudentId(fac: FacultyReport): number {
    return fac.programs.reduce((sum, p) => sum + (p.internet_student_id || 0), 0);
  }

  getFacultyWalkin(fac: FacultyReport): number {
    return fac.programs.reduce((sum, p) => sum + (p.walkin_applicants || 0), 0);
  }

  calculateTotals() {
    this.grandTotalApplicants = 0;
    this.grandTotalInternet = 0;
    this.grandTotalPaid = 0;
    this.grandTotalStudentId = 0;
    this.grandTotalWalkIn = 0;

    this.reportList.forEach(fac => {
      fac.programs.forEach(p => {
        this.grandTotalInternet += (p.internet_applicants || 0);
        this.grandTotalPaid += (p.total_paid || 0);
        this.grandTotalStudentId += (p.internet_student_id || 0);
        this.grandTotalWalkIn += (p.walkin_applicants || 0);
        this.grandTotalApplicants += ((p.internet_applicants || 0) + (p.walkin_applicants || 0) + (p.mail_applicants || 0));
      });
    });

    // Run ease-out count-up animation
    this.cancelAllAnimations();
    this.animateCount(this.grandTotalApplicants, (val) => this.displayGrandTotal = val);
    this.animateCount(this.grandTotalPaid, (val) => this.displayTotalPaid = val);
    this.animateCount(this.grandTotalInternet, (val) => this.displayInternetPaid = val);
    this.animateCount(this.grandTotalStudentId, (val) => this.displayStudentId = val);
  }

  // Smooth ease-out counter (60fps requestAnimationFrame)
  private animateCount(target: number, updateFn: (val: number) => void, duration: number = 800) {
    updateFn(0);
    if (target === 0) {
      return;
    }
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * ease);
      updateFn(current);

      if (progress < 1) {
        const frameId = requestAnimationFrame(step);
        this.animFrameIds.push(frameId);
      } else {
        updateFn(target);
      }
    };

    const firstFrameId = requestAnimationFrame(step);
    this.animFrameIds.push(firstFrameId);
  }

  exportPdf() {
    this.updatePrintDate();
    window.print();
  }

  exportExcel() {
    this.excelService.exportAdmissionReport(
      this.reportList,
      'ส่วนภูมิภาค',
      this.selectedYear,
      this.selectedSemester,
      {
        grandTotalApplicants: this.grandTotalApplicants,
        grandTotalInternet: this.grandTotalInternet,
        grandTotalPaid: this.grandTotalPaid,
        grandTotalStudentId: this.grandTotalStudentId
      },
      this.asOfDate
    );
  }
}
