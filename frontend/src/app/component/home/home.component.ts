import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService, SummaryData } from '../../services/report.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private reportService = inject(ReportService);
  private authService = inject(AuthService);

  currentUser: string = 'ผู้ดูแลระบบ';
  isRefreshing: boolean = false;
  lastUpdatedTime: string = '';

  summary: SummaryData = {
    total: 0,
    central: 0,
    regional: 0,
    totalPaid: 0,
    centralPaid: 0,
    regionalPaid: 0,
    totalStudentId: 0,
    paidPercent: '0.0',
    currentTerm: { year: '2569', semester: '2' }
  };

  // ตัวแปรสำหรับแอนิเมชันตัวเลขวิ่ง (Dynamic Counter)
  displayTotal: number = 0;
  displayTotalPaid: number = 0;
  displayCentral: number = 0;
  displayRegional: number = 0;
  private animFrameIds: number[] = [];

  ngOnInit() {
    const savedUser = this.authService.getCurrentUser();
    if (savedUser) {
      this.currentUser = savedUser;
    }
    this.loadData();
  }

  ngOnDestroy() {
    this.cancelAllAnimations();
  }

  private cancelAllAnimations() {
    this.animFrameIds.forEach(id => cancelAnimationFrame(id));
    this.animFrameIds = [];
  }

  loadData() {
    this.isRefreshing = true;
    this.reportService.getSummary().subscribe({
      next: (data) => {
        this.summary = data;
        this.lastUpdatedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // ยกเลิกแอนิเมชันเดิมก่อนเริ่มใหม่ เพื่อไม่ให้เกิดตัวเลขกระโดดทับกัน
        this.cancelAllAnimations();

        // รันแอนิเมชันตัวเลขค่อยๆ วิ่งขึ้น (Ease-out Counter)
        this.animateCount(data.total, (val) => this.displayTotal = val);
        this.animateCount(data.totalPaid || 0, (val) => this.displayTotalPaid = val);
        this.animateCount(data.central, (val) => this.displayCentral = val);
        this.animateCount(data.regional, (val) => this.displayRegional = val);

        setTimeout(() => {
          this.isRefreshing = false;
        }, 750);
      },
      error: (err) => {
        console.warn('Could not load summary API', err);
        this.isRefreshing = false;
      }
    });
  }

  // ฟังก์ชันคำนวณตัวเลขวิ่งแบบสมูท (60fps requestAnimationFrame)
  private animateCount(target: number, updateFn: (val: number) => void, duration: number = 900) {
    updateFn(0);
    if (target === 0) {
      return;
    }
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic formula
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

  get centralPercent(): number {
    if (!this.summary.total) return 0;
    return Math.round((this.summary.central / this.summary.total) * 100);
  }

  get regionalPercent(): number {
    if (!this.summary.total) return 0;
    return Math.round((this.summary.regional / this.summary.total) * 100);
  }

  get paidPercent(): string {
    if (!this.summary.total) return '0.0';
    const paid = this.summary.totalPaid ?? 0;
    return ((paid / this.summary.total) * 100).toFixed(1);
  }
}
