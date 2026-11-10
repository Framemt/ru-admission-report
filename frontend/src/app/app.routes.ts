import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { HomeComponent } from './component/home/home.component';
import { ReportCentralComponent } from './component/report-central/report-central.component';
import { ReportRegionalComponent } from './component/report-regional/report-regional.component';
import { ReportCourseProvinceComponent } from './component/report-course-province/report-course-province.component';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'reports/central', component: ReportCentralComponent, canActivate: [authGuard] },
  { path: 'reports/regional', component: ReportRegionalComponent, canActivate: [authGuard] },
  // เส้นทางใหม่สำหรับ หน้ารายงานสถิติรายวิชาตามจังหวัด
  { path: 'reports/course-by-province', component: ReportCourseProvinceComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];