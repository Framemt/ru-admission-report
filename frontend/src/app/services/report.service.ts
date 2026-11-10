import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface SummaryData {
  total: number;
  central: number;
  regional: number;
  totalPaid?: number;
  centralPaid?: number;
  regionalPaid?: number;
  totalStudentId?: number;
  paidPercent?: string;
  currentTerm?: { year: string; semester: string };
}

export interface AcademicTerm {
  year: string;
  semester: string;
  is_active: boolean;
}

export interface ProgramItem {
  faculty_dept?: string;
  name: string;
  internet_applicants: number;
  internet_paid: number;
  internet_student_id: number;
  walkin_applicants: number;
  mail_applicants: number;
  total_paid: number;
}

export interface FacultyReport {
  facultyName: string;
  totalApplicants: number;
  totalPaid: number;
  programs: ProgramItem[];
}

// Interface สำหรับข้อมูลรายวิชาและสถิติตามจังหวัด (Day 4)
export interface CourseItem {
  id: number;
  course_code: string;
  course_name: string;
  credits: number;
  category: string;
}

export interface ProvinceStat {
  rank: number;
  province: string;
  total: number;
  male: number;
  female: number;
  percentage: string;
}

export interface CourseKpis {
  totalStudents: number;
  totalMale: number;
  totalFemale: number;
  totalProvinces: number;
  topProvince: string;
}

export interface CourseEnrollmentReport {
  termId: number;
  course: CourseItem | null;
  kpis: CourseKpis;
  top5Provinces: ProvinceStat[];
  provinces: ProvinceStat[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // 1. ดึงสรุปยอดรวม (ดึงตรงจาก MySQL)
  getSummary(): Observable<SummaryData> {
    return this.http.get<SummaryData>(`${this.apiUrl}/summary`).pipe(
      catchError((error) => {
        console.error('Error loading summary from API:', error);
        return of({ total: 0, central: 0, regional: 0 });
      })
    );
  }

  // 2. ดึงรายการปี/ภาคการศึกษา (ดึงตรงจาก MySQL)
  getTerms(): Observable<AcademicTerm[]> {
    return this.http.get<AcademicTerm[]>(`${this.apiUrl}/terms`).pipe(
      catchError((error) => {
        console.error('Error loading terms from API:', error);
        return of([]);
      })
    );
  }

  // 3. ดึงรายงานข้อมูลส่วนกลาง (ดึงตรงจาก MySQL)
  getCentralReport(year: string = '2569', semester: string = '2'): Observable<FacultyReport[]> {
    return this.http.get<FacultyReport[]>(`${this.apiUrl}/reports/central?year=${year}&semester=${semester}`).pipe(
      catchError((error) => {
        console.error('Error loading central report from API:', error);
        return of([]);
      })
    );
  }

  // 4. ดึงรายงานข้อมูลส่วนภูมิภาค (ดึงตรงจาก MySQL)
  getRegionalReport(year: string = '2569', semester: string = '2'): Observable<FacultyReport[]> {
    return this.http.get<FacultyReport[]>(`${this.apiUrl}/reports/regional?year=${year}&semester=${semester}`).pipe(
      catchError((error) => {
        console.error('Error loading regional report from API:', error);
        return of([]);
      })
    );
  }

  // ==========================================
  // ฟังก์ชันสำหรับฟีเจอร์ "สถิติรายวิชาตามจังหวัด" (Day 4)
  // ==========================================

    // 1. ดึงรายชื่อวิชาทั้งหมดสำหรับ Dropdown
  getCourses(): Observable<CourseItem[]> {
    return this.http.get<CourseItem[]>(`${this.apiUrl}/courses`).pipe(
      catchError((error) => {
        console.error('Error loading courses:', error);
        return of([]);
      })
    );
  }

  // 2. ดึงสถิติตามจังหวัดของวิชาที่เลือก + สรุปตัวเลข KPIs
  getCourseEnrollmentByProvince(courseId?: number, termId?: number): Observable<CourseEnrollmentReport | null> {
    let url = `${this.apiUrl}/course-by-province`;
    const params: string[] = [];
    if (courseId) params.push(`courseId=${courseId}`);
    if (termId) params.push(`termId=${termId}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<CourseEnrollmentReport>(url).pipe(
      catchError((error) => {
        console.error('Error loading course stats by province:', error);
        return of(null);
      })
    );
  }

  // 3. ดึงรายชื่อ นศ. รายจังหวัดสำหรับหน้าต่าง Modal
  getCourseStudents(params: { courseId?: number; province?: string; hasCode?: boolean; search?: string }): Observable<any> {
    let url = `${this.apiUrl}/course-students`;
    const queryParts: string[] = [];
    if (params.courseId) queryParts.push(`courseId=${params.courseId}`);
    if (params.province) queryParts.push(`province=${encodeURIComponent(params.province)}`);
    if (params.hasCode) queryParts.push(`hasCode=true`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (queryParts.length > 0) url += `?${queryParts.join('&')}`;

    return this.http.get<any>(url).pipe(
      catchError((error) => {
        console.error('Error loading course students:', error);
        return of({ count: 0, students: [] });
      })
    );
  }
}
