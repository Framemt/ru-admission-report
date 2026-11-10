import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService, CourseItem, CourseEnrollmentReport } from '../../services/report.service'; 

@Component({
  selector: 'app-report-course-province',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-course-province.component.html',
  styleUrl: './report-course-province.component.scss'
})
export class ReportCourseProvinceComponent implements OnInit, OnDestroy {
  private reportService = inject(ReportService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // รายชื่อ 12 รายวิชาสำหรับใส่ใน Dropdown
  courses: CourseItem[] = [];
  selectedCourseId: number | '' = ''; // ค่าเริ่มต้นเป็นว่าง รอผู้ใช้เลือก (Empty State)

  // ข้อมูลสถิติและ KPI
  reportData: CourseEnrollmentReport | null = null;
  isLoading: boolean = false;
  isRefreshing: boolean = false;
  lastUpdatedTime: string = '';

  // Gimmick 1: Animated Roll Numbers for KPI Cards
  displayTotal: number = 0;
  displayMale: number = 0;
  displayFemale: number = 0;
  private animFrameIds: number[] = [];

  // แอนิเมชันหลอด Top 5 เลื่อนยืดออก (เหมือนหน้า Home)
  animateBars: boolean = false;

  // ตัวแปรสำหรับค้นหาและแบ่งหน้าตาราง 77 จังหวัด (Day 6)
  searchProvince: string = '';
  currentPage: number = 1;
  pageSize: number = 10;

  // ตัวแปรปีการศึกษา ดึงตรงจาก MySQL
  activeTermText: string = 'ภาค 2 ปีการศึกษา 2569';

  // ตัวแปรสำหรับ Modal เจาะลึกรายชื่อ นศ. (Day 7)
  showStudentModal: boolean = false;
  isClosingModal: boolean = false;
  selectedProvinceForModal: string = '';
  modalStudents: any[] = [];
  modalLoading: boolean = false;
  modalSearch: string = '';
  modalCurrentPage: number = 1;
  modalPageSize: number = 8;

  // Gimmick 2: Interactive Quick Filter Pills in Modal
  modalFilterType: 'all' | 'hasCode' | 'noCode' | 'male' | 'female' = 'all';
  
  ngOnInit(): void {
    this.isRefreshing = true;
    this.loadActiveTerm();
    this.loadCourses();
    this.listenToQueryParams();
    setTimeout(() => {
      this.isRefreshing = false;
    }, 750);
  }

  ngOnDestroy(): void {
    this.cancelAllAnimations();
  }

  // Gimmick 4: Keyboard Shortcut (ESC to close Modal)
  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.showStudentModal && !this.isClosingModal) {
      this.closeStudentModal();
    }
  }

  // ดึงปี/ภาคการศึกษาที่เปิดใช้งาน (is_active = 1) จากตาราง academic_terms ใน MySQL
  loadActiveTerm(): void {
    this.reportService.getTerms().subscribe({
      next: (terms) => {
        if (terms && terms.length > 0) {
          const active = terms.find(t => t.is_active) || terms[0];
          this.activeTermText = `ภาค ${active.semester} ปีการศึกษา ${active.year}`;
        }
      },
      error: (err) => console.error('Error fetching terms:', err)
    });
  }

  // 1. ดึงรายชื่อ 12 รายวิชาจาก MySQL
  loadCourses(): void {
    this.reportService.getCourses().subscribe({
      next: (res) => {
        this.courses = res || [];
      },
      error: (err) => console.error('Error fetching courses:', err)
    });
  }

  // ดักฟังการเปลี่ยน URL Query Params (เวลากด F5, Back/Forward หรือเปิดลิงก์ตรง)
  listenToQueryParams(): void {
    this.route.queryParamMap.subscribe(params => {
      const courseIdParam = params.get('courseId');
      if (courseIdParam) {
        const id = Number(courseIdParam);
        this.selectedCourseId = id;
        
        // ถ้าข้อมูลยังไม่ได้โหลด (เช่น ตอนกด F5 รีเฟรชหน้า หรือกด Back/Forward) ให้ดึงข้อมูลทันที
        if ((!this.reportData || this.reportData.course?.id !== id) && !this.isLoading) {
          this.loadReportData();
        }
      } else {
        // เมื่อไม่มี queryParam (เช่น ผู้ใช้เข้าเว็บใหม่ หรือคลิกมาจากเมนู Sidebar)
        // ให้กลับไปหน้า Empty State รอเลือกวิชาตามเดิม
        this.selectedCourseId = '';
        this.reportData = null;
      }
    });
  }

  // 2. ดึงสถิติ KPI ตามวิชาที่เลือก
  loadReportData(): void {
    if (!this.selectedCourseId) {
      this.reportData = null;
      this.isRefreshing = false;
      return;
    }

    this.isRefreshing = true;
    this.isLoading = true;
    const courseId = Number(this.selectedCourseId);
    
    this.reportService.getCourseEnrollmentByProvince(courseId).subscribe({
      next: (res) => {
        this.reportData = res;
        this.isLoading = false;
        setTimeout(() => {
          this.isRefreshing = false;
        }, 750);
        this.lastUpdatedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';

        // รันแอนิเมชันหลอด Top 5 ค่อยๆ ยืดออกจาก 0%
        this.animateBars = false;
        setTimeout(() => {
          this.animateBars = true;
        }, 50);

        // Gimmick 1: Animated Roll Numbers for KPI Cards
        this.cancelAllAnimations();
        if (res && res.kpis) {
          this.animateCount(res.kpis.totalStudents || 0, (val) => this.displayTotal = val);
          this.animateCount(res.kpis.totalMale || 0, (val) => this.displayMale = val);
          this.animateCount(res.kpis.totalFemale || 0, (val) => this.displayFemale = val);
        } else {
          this.displayTotal = 0;
          this.displayMale = 0;
          this.displayFemale = 0;
        }
      },
      error: (err) => {
        console.error('Error fetching report data:', err);
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  // ปุ่มรีเฟรชข้อมูล (เหมือนหน้า Home)
  onRefresh(): void {
    this.isRefreshing = true;
    this.animateBars = false;
    this.loadActiveTerm();

    if (this.selectedCourseId) {
      this.loadReportData();
    } else {
      this.loadCourses();
      setTimeout(() => {
        this.isRefreshing = false;
        this.lastUpdatedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
      }, 750);
    }
  }

  // ยกเลิก Animation Frame ทั้งหมดเมื่อเปลี่ยนวิชาหรือออกจากหน้า
  private cancelAllAnimations(): void {
    this.animFrameIds.forEach(id => cancelAnimationFrame(id));
    this.animFrameIds = [];
  }

  // Gimmick 1: ฟังก์ชันคำนวณตัวเลขนับขึ้นแบบ Smooth Ease-Out Cubic (60 FPS)
  private animateCount(target: number, updateFn: (val: number) => void, duration: number = 750): void {
    updateFn(0);
    if (!target || target === 0) {
      return;
    }
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
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

  // 3. ทำงานอัตโนมัติเมื่อผู้ใช้คลิกเลือกวิชาใหม่จาก Dropdown
  onCourseChange(): void {
    this.currentPage = 1;      // รีเซ็ตตารางกลับไปหน้า 1
    this.searchProvince = '';  // ล้างคำค้นหาเดิม

    // อัปเดต URL Query Parameter ให้สะท้อนวิชาที่เลือก (เพื่อเวลาผู้ใช้กด F5 หน้านี้จะยังคงจำวิชาเดิมไว้)
    if (this.selectedCourseId) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { courseId: this.selectedCourseId },
        queryParamsHandling: 'merge'
      });
      this.loadReportData();
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { courseId: null },
        queryParamsHandling: 'merge'
      });
      this.reportData = null;
    }
  }

  // ฟังก์ชันคำนวณเปอร์เซ็นต์สำหรับแถบสถิติ ชาย/หญิง
  getPercentage(value: number | undefined, total: number | undefined): string {
    if (!value || !total || total === 0) return '0.0';
    return ((value / total) * 100).toFixed(1);
  }

  // แยกรายวิชาตามหมวดสำหรับจัดกลุ่มใน Dropdown
  get generalCourses(): CourseItem[] {
    return this.courses.filter(c => c.category === 'วิชาศึกษาทั่วไป');
  }

  get majorCourses(): CourseItem[] {
    return this.courses.filter(c => c.category === 'วิชาเฉพาะคณะ');
  }

  // คำนวณความยาวแถบกราฟแนวนอนเทียบกับจังหวัดอันดับ 1 (เพื่อให้แท่งกราฟสเกลสวยงาม และมีแอนิเมชันยืดออก)
  getBarWidth(total: number): number {
    if (!this.animateBars) return 0;
    if (!this.reportData?.top5Provinces || this.reportData.top5Provinces.length === 0) return 0;
    const maxVal = this.reportData.top5Provinces[0].total;
    if (!maxVal || maxVal === 0) return 0;
    return Math.round((total / maxVal) * 100);
  }

  // รวมยอด นศ. ของ 5 อันดับแรก
  get top5Total(): number {
    if (!this.reportData?.top5Provinces) return 0;
    return this.reportData.top5Provinces.reduce((sum, p) => sum + p.total, 0);
  }

  // กรองจังหวัดตามคำค้นหา
  get filteredProvinces(): any[] {
    if (!this.reportData?.provinces) return [];
    if (!this.searchProvince.trim()) return this.reportData.provinces;
    return this.reportData.provinces.filter(p => 
      p.province.toLowerCase().includes(this.searchProvince.trim().toLowerCase())
    );
  }

  // ตัดข้อมูลแสดงเฉพาะหน้านั้นๆ (Pagination)
  get paginatedProvinces(): any[] {
    const list = this.filteredProvinces;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  // คำนวณจำนวนหน้าทั้งหมด
  get totalPages(): number {
    return Math.ceil(this.filteredProvinces.length / this.pageSize) || 1;
  }

  // เปลี่ยนหน้า
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // เมื่อคลิกปุ่มดูรายชื่อ นศ. ในตาราง (Day 7)
  onViewStudents(province: any): void {
    if (!this.selectedCourseId) return;

    this.selectedProvinceForModal = province.province;
    this.showStudentModal = true;
    this.isClosingModal = false;
    this.modalLoading = true;
    this.modalSearch = '';
    this.modalCurrentPage = 1;
    this.modalFilterType = 'all'; // รีเซ็ตตัวกรองด่วนกลับเป็นทั้งหมด
    this.modalStudents = [];

    // เรียก API ดึงรายชื่อ นศ. เจาะลึก
    this.reportService.getCourseStudents({
      courseId: Number(this.selectedCourseId),
      province: province.province
    }).subscribe({
      next: (res) => {
        this.modalStudents = res.students || [];
        this.modalLoading = false;
      },
      error: (err) => {
        console.error('Error fetching students:', err);
        this.modalLoading = false;
      }
    });
  }

  // ปิด Modal
  closeStudentModal(): void {
    if (this.isClosingModal) return;
    this.isClosingModal = true;
    setTimeout(() => {
      this.showStudentModal = false;
      this.isClosingModal = false;
    }, 200);
  }

  // Gimmick 2: ตัวเลือกตัวกรองด่วน (Filter Pills)
  setModalFilter(type: 'all' | 'hasCode' | 'noCode' | 'male' | 'female'): void {
    this.modalFilterType = type;
    this.modalCurrentPage = 1; // รีเซ็ตกลับไปหน้า 1
  }

  get modalCountHasCode(): number {
    return this.modalStudents.filter(s => !!s.student_code).length;
  }

  get modalCountNoCode(): number {
    return this.modalStudents.filter(s => !s.student_code).length;
  }

  get modalCountMale(): number {
    return this.modalStudents.filter(s => s.gender === 'ชาย').length;
  }

  get modalCountFemale(): number {
    return this.modalStudents.filter(s => s.gender === 'หญิง').length;
  }

  // กรองรายชื่อ นศ. ใน Modal (ผสมผสาน Filter Pill และ Search Query)
  get filteredModalStudents(): any[] {
    if (!this.modalStudents) return [];
    let list = this.modalStudents;

    // 1. กรองตามประเภทแท็บ (Filter Pills)
    if (this.modalFilterType === 'hasCode') {
      list = list.filter(s => !!s.student_code);
    } else if (this.modalFilterType === 'noCode') {
      list = list.filter(s => !s.student_code);
    } else if (this.modalFilterType === 'male') {
      list = list.filter(s => s.gender === 'ชาย');
    } else if (this.modalFilterType === 'female') {
      list = list.filter(s => s.gender === 'หญิง');
    }

    // 2. กรองตามคำค้นหา (Search Query)
    if (this.modalSearch.trim()) {
      const kw = this.modalSearch.trim().toLowerCase();
      list = list.filter(s => 
        (s.first_name && s.first_name.toLowerCase().includes(kw)) ||
        (s.last_name && s.last_name.toLowerCase().includes(kw)) ||
        (s.student_code && s.student_code.toLowerCase().includes(kw)) ||
        (s.faculty_name && s.faculty_name.toLowerCase().includes(kw)) ||
        (s.program_name && s.program_name.toLowerCase().includes(kw))
      );
    }

    return list;
  }

  // แบ่งหน้าใน Modal
  get paginatedModalStudents(): any[] {
    const list = this.filteredModalStudents;
    const start = (this.modalCurrentPage - 1) * this.modalPageSize;
    return list.slice(start, start + this.modalPageSize);
  }

  get modalTotalPages(): number {
    return Math.ceil(this.filteredModalStudents.length / this.modalPageSize) || 1;
  }

  changeModalPage(page: number): void {
    if (page >= 1 && page <= this.modalTotalPages) {
      this.modalCurrentPage = page;
    }
  }
}
