import { Injectable } from '@angular/core';
import { FacultyReport } from './report.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  /**
   * ส่งออกไฟล์เป็น .xlsx ด้วย ExcelJS ตามแบบฟอร์มในรูปตัวอย่าง 100%
   */
  async exportAdmissionReport(
    reportList: FacultyReport[],
    campusName: string, // 'ส่วนกลาง' หรือ 'ส่วนภูมิภาค'
    year: string,
    semester: string,
    totals: {
      grandTotalApplicants: number;
      grandTotalInternet: number;
      grandTotalPaid: number;
      grandTotalStudentId: number;
    },
    asOfDate: string = ''
  ): Promise<void> {
    const defaultAsOfDate = asOfDate || new Date().toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const ExcelJS = (await import('exceljs')).default || (await import('exceljs'));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`รายงาน_${campusName}`);

    const printDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const grayFill: any = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFBFBFBF' } // สีเทากลางพอดีตา (อ่อนลงมาจาก A6A6A6 นิดนึง)
    };

    const thinBorder: any = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    const doubleBottomBorder: any = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'double', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    const isRegional = campusName === 'ส่วนภูมิภาค';

    // 1. กล่องหัวเรื่องรายงาน (A1:G1 บรรทัดเดียวตรงตามรูปตัวอย่าง)
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = isRegional 
      ? `รายงานจำนวนผู้สมัครใหม่ระดับปริญญาตรี ส่วนภูมิภาค ประจำภาค ${semester} ปีการศึกษา ${year}`
      : `รายงานจำนวนผู้สมัครเรียนระดับปริญญาตรี ${campusName} ประจำภาค ${semester} ปีการศึกษา ${year}`;
    titleCell.font = { name: 'TH SarabunPSK', size: 17, bold: true, color: { argb: 'FF000000' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 28;

    for (let c = 1; c <= 7; c++) {
      const cell = worksheet.getCell(1, c);
      cell.fill = grayFill;
      cell.border = thinBorder;
    }

    // 2. หัวตารางชั้นบน (Row 2) & ชั้นล่าง (Row 3)
    if (isRegional) {
      // โครงสร้างส่วนภูมิภาค (แยก 2 คอลัมน์: คณะ และ สาขาวิชา)
      worksheet.mergeCells('A2:B3');
      const th_fac = worksheet.getCell('A2');
      th_fac.value = 'สาขาวิทยบริการฯ/ คณะ/ สาขาวิชา';
      th_fac.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('C2:E2');
      const th_net = worksheet.getCell('C2');
      th_net.value = 'สมัครทาง Internet';
      th_net.alignment = { horizontal: 'center', vertical: 'middle' };

      const th_walk = worksheet.getCell('F2');
      th_walk.value = 'สมัครด้วยตนเอง';
      th_walk.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('G2:G3');
      const th_tot = worksheet.getCell('G2');
      th_tot.value = 'ยอดรวม \n นักศึกษาชำระเงิน';
      th_tot.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Row 3 (หัวย่อย)
      const sub_c3 = worksheet.getCell('C3');
      sub_c3.value = 'ยอดสมัคร';
      sub_c3.alignment = { horizontal: 'center', vertical: 'middle' };

      const sub_d3 = worksheet.getCell('D3');
      sub_d3.value = 'ยอดชำระเงิน';
      sub_d3.alignment = { horizontal: 'center', vertical: 'middle' };

      const sub_e3 = worksheet.getCell('E3');
      sub_e3.value = 'ยอดออกรหัสแล้ว';
      sub_e3.alignment = { horizontal: 'center', vertical: 'middle' };

      const sub_f3 = worksheet.getCell('F3');
      sub_f3.value = 'ยอดสมัคร';
      sub_f3.alignment = { horizontal: 'center', vertical: 'middle' };
    } else {
      // โครงสร้างส่วนกลาง (เดิม)
      worksheet.mergeCells('A2:A3');
      const th_fac = worksheet.getCell('A2');
      th_fac.value = 'คณะ';
      th_fac.alignment = { horizontal: 'left', vertical: 'middle' };

      worksheet.mergeCells('B2:D2');
      const th_net = worksheet.getCell('B2');
      th_net.value = 'สมัครทาง Internet';
      th_net.alignment = { horizontal: 'center', vertical: 'middle' };

      const th_walk = worksheet.getCell('E2');
      th_walk.value = 'สมัครด้วยตนเอง';
      th_walk.alignment = { horizontal: 'center', vertical: 'middle' };

      const th_mail = worksheet.getCell('F2');
      th_mail.value = 'สมัครทางไปรษณีย์';
      th_mail.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('G2:G3');
      const th_tot = worksheet.getCell('G2');
      th_tot.value = 'ยอดรวม \n นักศึกษาชำระเงิน';
      th_tot.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      const sub_b3 = worksheet.getCell('B3');
      sub_b3.value = 'ยอดสมัคร';
      sub_b3.alignment = { horizontal: 'center', vertical: 'middle' };

      const sub_c3 = worksheet.getCell('C3');
      sub_c3.value = 'ยอดชำระเงิน';
      sub_c3.alignment = { horizontal: 'center', vertical: 'middle' };

      const sub_d3 = worksheet.getCell('D3');
      sub_d3.value = 'ยอดออกรหัสแล้ว';
      sub_d3.alignment = { horizontal: 'center', vertical: 'middle' };

      const sub_e3 = worksheet.getCell('E3');
      sub_e3.value = 'ยอดสมัคร';
      sub_e3.alignment = { horizontal: 'center', vertical: 'middle' };

      const sub_f3 = worksheet.getCell('F3');
      sub_f3.value = 'ยอดสมัคร';
      sub_f3.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    worksheet.getRow(2).height = 24;
    worksheet.getRow(3).height = 24;

    for (let r = 2; r <= 3; r++) {
      for (let c = 1; c <= 7; c++) {
        const cell = worksheet.getCell(r, c);
        cell.fill = grayFill;
        cell.border = thinBorder;
        cell.font = { name: 'TH SarabunPSK', size: 16, bold: true, color: { argb: 'FF000000' } };
      }
    }

    // 3. ข้อมูลคณะและสาขาวิชา (เริ่ม Row 4 ตรงตามรูปตัวอย่าง)
    let currentRowIdx = 4;
    const facultyRows: { rowIdx: number; fac: FacultyReport; progStartRow: number; progEndRow: number }[] = [];

    reportList.forEach(fac => {
      const facRowIdx = currentRowIdx;
      currentRowIdx++;

      const progStartRow = currentRowIdx;
      // เติมแถวสาขาวิชาย่อย
      fac.programs.forEach(prog => {
        const progRow = worksheet.getRow(currentRowIdx);
        progRow.height = 20;

        const rowNum = currentRowIdx;
        const totalPaidFormula = isRegional
          ? `SUM(D${rowNum},F${rowNum})`
          : `SUM(C${rowNum},E${rowNum},F${rowNum})`;
        const progTotalPaid = (prog.internet_paid || 0) + (prog.walkin_applicants || 0) + (!isRegional ? (prog.mail_applicants || 0) : 0);

        if (isRegional) {
          progRow.getCell(1).value = prog.faculty_dept || fac.facultyName;
          progRow.getCell(2).value = prog.name;
          progRow.getCell(3).value = prog.internet_applicants || 0;
          progRow.getCell(4).value = prog.internet_paid || 0;
          progRow.getCell(5).value = prog.internet_student_id || 0;
          progRow.getCell(6).value = prog.walkin_applicants || 0;
          progRow.getCell(7).value = { formula: totalPaidFormula, result: progTotalPaid };
        } else {
          progRow.getCell(1).value = prog.name;
          progRow.getCell(2).value = prog.internet_applicants || 0;
          progRow.getCell(3).value = prog.internet_paid || 0;
          progRow.getCell(4).value = prog.internet_student_id || 0;
          progRow.getCell(5).value = prog.walkin_applicants || 0;
          progRow.getCell(6).value = prog.mail_applicants || 0;
          progRow.getCell(7).value = { formula: totalPaidFormula, result: progTotalPaid };
        }

        for (let c = 1; c <= 7; c++) {
          const cell = progRow.getCell(c);
          cell.border = thinBorder;
          const isTextCol = isRegional ? (c <= 2) : (c === 1);
          cell.font = {
            name: 'TH SarabunPSK',
            size: 16,
            bold: isTextCol,
            color: { argb: 'FF000000' }
          };

          cell.alignment = {
            vertical: 'middle',
            horizontal: isTextCol ? 'left' : 'right'
          };

          if (!isTextCol) {
            cell.numFmt = '#,##0;(#,##0);"-"';
          }

          if (c === 7) {
            cell.fill = grayFill;
          }
        }
        currentRowIdx++;
      });

      const progEndRow = currentRowIdx - 1;
      facultyRows.push({ rowIdx: facRowIdx, fac, progStartRow, progEndRow });

      // แถวของสาขาวิทยบริการฯ / คณะ (ใส่สูตร SUM ยอดรวมของคณะ/สาขาวิทยบริการฯ)
      const facRow = worksheet.getRow(facRowIdx);
      facRow.height = 26;

      const facStudentId = fac.programs.reduce((s, p) => s + (p.internet_student_id || 0), 0);
      const facWalkin = fac.programs.reduce((s, p) => s + (p.walkin_applicants || 0), 0);
      const facMail = fac.programs.reduce((s, p) => s + (p.mail_applicants || 0), 0);
      const hasPrograms = fac.programs.length > 0;

      if (isRegional) {
        worksheet.mergeCells(facRowIdx, 1, facRowIdx, 2);
        facRow.getCell(1).value = fac.facultyName;
        facRow.getCell(3).value = hasPrograms
          ? { formula: `SUM(C${progStartRow}:C${progEndRow})`, result: fac.totalApplicants }
          : 0;
        facRow.getCell(4).value = hasPrograms
          ? { formula: `SUM(D${progStartRow}:D${progEndRow})`, result: fac.totalPaid }
          : 0;
        facRow.getCell(5).value = hasPrograms
          ? { formula: `SUM(E${progStartRow}:E${progEndRow})`, result: facStudentId }
          : 0;
        facRow.getCell(6).value = hasPrograms
          ? { formula: `SUM(F${progStartRow}:F${progEndRow})`, result: facWalkin }
          : 0;
        facRow.getCell(7).value = { formula: `SUM(D${facRowIdx},F${facRowIdx})`, result: fac.totalPaid };
      } else {
        facRow.getCell(1).value = fac.facultyName;
        facRow.getCell(2).value = hasPrograms
          ? { formula: `SUM(B${progStartRow}:B${progEndRow})`, result: fac.totalApplicants }
          : 0;
        facRow.getCell(3).value = hasPrograms
          ? { formula: `SUM(C${progStartRow}:C${progEndRow})`, result: fac.totalPaid }
          : 0;
        facRow.getCell(4).value = hasPrograms
          ? { formula: `SUM(D${progStartRow}:D${progEndRow})`, result: facStudentId }
          : 0;
        facRow.getCell(5).value = hasPrograms
          ? { formula: `SUM(E${progStartRow}:E${progEndRow})`, result: facWalkin }
          : 0;
        facRow.getCell(6).value = hasPrograms
          ? { formula: `SUM(F${progStartRow}:F${progEndRow})`, result: facMail }
          : 0;
        facRow.getCell(7).value = { formula: `SUM(C${facRowIdx},E${facRowIdx},F${facRowIdx})`, result: fac.totalPaid };
      }

      for (let c = 1; c <= 7; c++) {
        const cell = facRow.getCell(c);
        cell.fill = grayFill;
        cell.border = thinBorder;
        const isNum = isRegional ? (c >= 3) : (c > 1);
        cell.font = { 
          name: 'TH SarabunPSK', 
          size: 16, 
          bold: true,
          underline: isNum ? 'double' : undefined,
          color: { argb: 'FF000000' } 
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: isRegional ? (c <= 2 ? 'center' : 'right') : (c === 1 ? 'left' : 'right')
        };
        if (isNum) {
          cell.numFmt = '#,##0;(#,##0);"-"';
        }
      }
    });

    // 4. แถวสรุปรวมทั้งสิ้น (Row สุดท้ายของตาราง - ใส่สูตร SUM รวมทุกคณะ/สาขาวิทยบริการฯ)
    const totalRow = worksheet.getRow(currentRowIdx);
    totalRow.height = 26;

    const grandWalkin = reportList.reduce((acc, fac) => acc + fac.programs.reduce((s, p) => s + (p.walkin_applicants || 0), 0), 0);
    const grandMail = reportList.reduce((acc, fac) => acc + fac.programs.reduce((s, p) => s + (p.mail_applicants || 0), 0), 0);
    const facRowIndices = facultyRows.map(f => f.rowIdx);

    if (isRegional) {
      worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, 2);
      totalRow.getCell(1).value = 'รวมทั้งสิ้น';
      totalRow.getCell(3).value = { formula: `SUM(${facRowIndices.map(r => 'C' + r).join(',')})`, result: totals.grandTotalInternet };
      totalRow.getCell(4).value = { formula: `SUM(${facRowIndices.map(r => 'D' + r).join(',')})`, result: totals.grandTotalPaid };
      totalRow.getCell(5).value = { formula: `SUM(${facRowIndices.map(r => 'E' + r).join(',')})`, result: totals.grandTotalStudentId };
      totalRow.getCell(6).value = { formula: `SUM(${facRowIndices.map(r => 'F' + r).join(',')})`, result: grandWalkin };
      totalRow.getCell(7).value = { formula: `SUM(${facRowIndices.map(r => 'G' + r).join(',')})`, result: totals.grandTotalPaid };
    } else {
      totalRow.getCell(1).value = 'รวมทั้งสิ้น';
      totalRow.getCell(2).value = { formula: `SUM(${facRowIndices.map(r => 'B' + r).join(',')})`, result: totals.grandTotalInternet };
      totalRow.getCell(3).value = { formula: `SUM(${facRowIndices.map(r => 'C' + r).join(',')})`, result: totals.grandTotalPaid };
      totalRow.getCell(4).value = { formula: `SUM(${facRowIndices.map(r => 'D' + r).join(',')})`, result: totals.grandTotalStudentId };
      totalRow.getCell(5).value = { formula: `SUM(${facRowIndices.map(r => 'E' + r).join(',')})`, result: grandWalkin };
      totalRow.getCell(6).value = { formula: `SUM(${facRowIndices.map(r => 'F' + r).join(',')})`, result: grandMail };
      totalRow.getCell(7).value = { formula: `SUM(${facRowIndices.map(r => 'G' + r).join(',')})`, result: totals.grandTotalPaid };
    }

    for (let c = 1; c <= 7; c++) {
      const cell = totalRow.getCell(c);
      cell.fill = grayFill;
      cell.border = thinBorder;
      const isNum = isRegional ? (c >= 3) : (c > 1);
      cell.font = { 
        name: 'TH SarabunPSK', 
        size: 16, 
        bold: true, 
        underline: isNum ? 'double' : undefined,
        color: { argb: 'FF000000' } 
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: isRegional ? (c <= 2 ? 'left' : 'right') : (c === 1 ? 'left' : 'right')
      };
      if (isNum) {
        cell.numFmt = '#,##0;(#,##0);"-"';
      }
    }
    currentRowIdx++;

    // 5. วันที่ด้านล่างตาราง
    worksheet.getRow(currentRowIdx).height = 10;
    currentRowIdx++;

    const dateRow = worksheet.getRow(currentRowIdx);
    dateRow.height = 22;
    dateRow.getCell(1).value = `ข้อมูล ณ วันที่ ${defaultAsOfDate}`;
    dateRow.getCell(1).font = { name: 'TH SarabunPSK', size: 16, italic: true };
    dateRow.getCell(7).value = `พิมพ์วันที่: ${printDate}`;
    dateRow.getCell(7).font = { name: 'TH SarabunPSK', size: 16, italic: true };
    dateRow.getCell(7).alignment = { horizontal: 'right' };

    // 6. กำหนดความกว้างคอลัมน์ให้พอดีสวยงามแบบในรูป
    if (isRegional) {
      worksheet.getColumn(1).width = 24;
      worksheet.getColumn(2).width = 30;
      worksheet.getColumn(3).width = 12;
      worksheet.getColumn(4).width = 14;
      worksheet.getColumn(5).width = 16;
      worksheet.getColumn(6).width = 16;
      worksheet.getColumn(7).width = 18;
    } else {
      worksheet.getColumn(1).width = 40;
      worksheet.getColumn(2).width = 12;
      worksheet.getColumn(3).width = 12;
      worksheet.getColumn(4).width = 15;
      worksheet.getColumn(5).width = 15;
      worksheet.getColumn(6).width = 17;
      worksheet.getColumn(7).width = 17;
    }

    // 7. ดาวน์โหลดไฟล์
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `รายงานจำนวนผู้สมัครใหม่ระดับปริญญาตรี_${campusName}_${semester}_${year}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  }

  /**
   * ส่งออกรายชื่อนักศึกษาที่ลงทะเบียนรายวิชาตามจังหวัดเป็นไฟล์ Excel (.xlsx)
   */
  async exportCourseProvinceStudents(
    course: { course_code: string; course_name: string; credits?: number },
    province: string,
    students: any[],
    activeTermText: string = ''
  ): Promise<void> {
    const ExcelJS = (await import('exceljs')).default || (await import('exceljs'));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`นศ_${province}`);

    const navyHeaderFill: any = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D2A4A' }
    };

    const lightGrayFill: any = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' }
    };

    const totalFill: any = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF3C7' }
    };

    const thinBorder: any = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    const doubleBottomBorder: any = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'double', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    // 1. หัวเรื่องรายงาน
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'มหาวิทยาลัยรามคำแหง : รายงานนักศึกษาลงทะเบียนรายวิชาตามจังหวัด';
    titleCell.font = { name: 'TH SarabunPSK', size: 16, bold: true, color: { argb: 'FF071728' } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getRow(1).height = 24;

    worksheet.mergeCells('A2:F2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `วิชา: ${course.course_code} ${course.course_name} (${course.credits || 3} หน่วยกิต)  |  จังหวัด: ${province}  |  ${activeTermText}`;
    subCell.font = { name: 'TH SarabunPSK', size: 13, bold: true, color: { argb: 'FF1E293B' } };
    subCell.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getRow(2).height = 20;

    worksheet.mergeCells('A3:F3');
    const dateCell = worksheet.getCell('A3');
    const printDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    dateCell.value = `ข้อมูล ณ วันที่: ${printDate} น. (พบนักศึกษาทั้งหมด ${students.length} คน)`;
    dateCell.font = { name: 'TH SarabunPSK', size: 11, italic: true, color: { argb: 'FF64748B' } };
    dateCell.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getRow(3).height = 18;

    worksheet.getRow(4).height = 8; // Spacing row

    // 2. Table Headers (Row 5)
    const headers = ['ลำดับ', 'รหัสนักศึกษา', 'ชื่อ - นามสกุล', 'เพศ', 'คณะ', 'สาขาวิชา'];
    const headerRow = worksheet.getRow(5);
    headerRow.height = 24;
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.fill = navyHeaderFill;
      cell.font = { name: 'TH SarabunPSK', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = {
        horizontal: idx === 0 || idx === 1 || idx === 3 ? 'center' : 'left',
        vertical: 'middle'
      };
      cell.border = thinBorder;
    });

    // 3. Data Rows
    let currentRowIdx = 6;
    students.forEach((s, idx) => {
      const row = worksheet.getRow(currentRowIdx);
      row.height = 20;
      const isEven = idx % 2 === 1;

      // ลำดับ
      const c1 = row.getCell(1);
      c1.value = idx + 1;
      c1.alignment = { horizontal: 'center', vertical: 'middle' };

      // รหัส นศ.
      const c2 = row.getCell(2);
      c2.value = s.student_code || 'รอออกรหัส';
      c2.alignment = { horizontal: 'center', vertical: 'middle' };
      if (!s.student_code) {
        c2.font = { name: 'TH SarabunPSK', size: 12, italic: true, color: { argb: 'FFB45309' } };
      }

      // ชื่อ - นามสกุล
      const c3 = row.getCell(3);
      c3.value = `${s.first_name || ''} ${s.last_name || ''}`.trim();
      c3.alignment = { horizontal: 'left', vertical: 'middle' };

      // เพศ
      const c4 = row.getCell(4);
      c4.value = s.gender || '-';
      c4.alignment = { horizontal: 'center', vertical: 'middle' };

      // คณะ
      const c5 = row.getCell(5);
      c5.value = s.faculty_name || '-';
      c5.alignment = { horizontal: 'left', vertical: 'middle' };

      // สาขาวิชา
      const c6 = row.getCell(6);
      c6.value = s.program_name || '-';
      c6.alignment = { horizontal: 'left', vertical: 'middle' };

      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        if (!cell.font) {
          cell.font = { name: 'TH SarabunPSK', size: 12 };
        }
        if (isEven) {
          cell.fill = lightGrayFill;
        }
        cell.border = thinBorder;
      }

      currentRowIdx++;
    });

    // 4. Summary Total Row
    const totalRow = worksheet.getRow(currentRowIdx);
    totalRow.height = 24;
    worksheet.mergeCells(`A${currentRowIdx}:B${currentRowIdx}`);
    const totTitle = totalRow.getCell(1);
    totTitle.value = `รวมทั้งสิ้น ${students.length} คน`;
    totTitle.font = { name: 'TH SarabunPSK', size: 13, bold: true, color: { argb: 'FF071728' } };
    totTitle.alignment = { horizontal: 'center', vertical: 'middle' };

    const maleCount = students.filter(s => s.gender === 'ชาย').length;
    const femaleCount = students.filter(s => s.gender === 'หญิง').length;
    const hasCodeCount = students.filter(s => !!s.student_code).length;

    worksheet.mergeCells(`C${currentRowIdx}:F${currentRowIdx}`);
    const totDetail = totalRow.getCell(3);
    totDetail.value = `ชาย ${maleCount} คน  |  หญิง ${femaleCount} คน  |  ออกรหัสแล้ว ${hasCodeCount} คน  |  รอออกรหัส ${students.length - hasCodeCount} คน`;
    totDetail.font = { name: 'TH SarabunPSK', size: 12, bold: true, color: { argb: 'FF071728' } };
    totDetail.alignment = { horizontal: 'left', vertical: 'middle' };

    for (let c = 1; c <= 6; c++) {
      const cell = totalRow.getCell(c);
      cell.fill = totalFill;
      cell.border = doubleBottomBorder;
    }

    // 5. Column Widths
    worksheet.getColumn(1).width = 8;   // ลำดับ
    worksheet.getColumn(2).width = 16;  // รหัสนักศึกษา
    worksheet.getColumn(3).width = 28;  // ชื่อ - นามสกุล
    worksheet.getColumn(4).width = 10;  // เพศ
    worksheet.getColumn(5).width = 26;  // คณะ
    worksheet.getColumn(6).width = 34;  // สาขาวิชา

    // 6. ดาวน์โหลดไฟล์
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `รายชื่อนักศึกษา_${course.course_code}_จังหวัด${province}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  }
}
