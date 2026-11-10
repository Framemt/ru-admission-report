const express = require("express");
const router = express.Router();
const { pool, isDbConnected } = require("../config/db");
const { authenticateToken } = require("../middleware/auth"); // 👈 1. นำเข้าด่านตรวจ

// 👈 2. สั่งล็อคทุก Service ในไฟล์นี้ ให้ต้องตรวจ Token ก่อนเสมอ
router.use(authenticateToken);

// 1. GET /api/summary (สรุปยอดรวมจากฐานข้อมูล MySQL)
router.get("/summary", async (req, res) => {
  if (isDbConnected() && pool) {
    try {
      // ดึงปี/ภาคปัจจุบันที่เปิดใช้งาน (is_active = 1) หรือเทอมล่าสุด
      const [termRows] = await pool.query(
        "SELECT id, academic_year, semester FROM academic_terms ORDER BY is_active DESC, academic_year DESC, semester DESC LIMIT 1",
      );
      const activeTerm = termRows.length > 0 ? termRows[0] : null;

      let termCondition = "";
      const params = [];
      if (activeTerm) {
        termCondition = "WHERE ar.term_id = ?";
        params.push(activeTerm.id);
      }

      const [rows] = await pool.query(
        `
        SELECT 
          COALESCE(SUM(internet_applicants + walkin_applicants + mail_applicants), 0) as total,
          COALESCE(SUM(CASE WHEN ar.campus_type = 'central' THEN internet_applicants + walkin_applicants + mail_applicants ELSE 0 END), 0) as central,
          COALESCE(SUM(CASE WHEN ar.campus_type = 'regional' THEN internet_applicants + walkin_applicants + mail_applicants ELSE 0 END), 0) as regional,
          COALESCE(SUM(total_paid), 0) as total_paid,
          COALESCE(SUM(CASE WHEN ar.campus_type = 'central' THEN total_paid ELSE 0 END), 0) as central_paid,
          COALESCE(SUM(CASE WHEN ar.campus_type = 'regional' THEN total_paid ELSE 0 END), 0) as regional_paid,
          COALESCE(SUM(internet_student_id), 0) as total_student_id
        FROM admission_reports ar
        ${termCondition}
      `,
        params,
      );

      return res.json({
        total: Number(rows[0]?.total || 0),
        central: Number(rows[0]?.central || 0),
        regional: Number(rows[0]?.regional || 0),
        totalPaid: Number(rows[0]?.total_paid || 0),
        centralPaid: Number(rows[0]?.central_paid || 0),
        regionalPaid: Number(rows[0]?.regional_paid || 0),
        totalStudentId: Number(rows[0]?.total_student_id || 0),
        paidPercent: Number(rows[0]?.total || 0) > 0 
          ? ((Number(rows[0]?.total_paid || 0) / Number(rows[0]?.total || 0)) * 100).toFixed(1)
          : "0.0",
        currentTerm: activeTerm
          ? { year: activeTerm.academic_year, semester: activeTerm.semester }
          : { year: "2569", semester: "2" },
      });
    } catch (error) {
      console.error("Error fetching summary from DB:", error);
      return res.status(500).json({
        error: "Failed to fetch summary from database",
        total: 0,
        central: 0,
        regional: 0,
      });
    }
  }

  // หากไม่ได้เชื่อมต่อฐานข้อมูล ให้ส่งค่า 0 กลับไปตรงๆ
  res.json({ total: 0, central: 0, regional: 0 });
});

// 2. GET /api/terms (ดึงรายการปี/ภาคการศึกษาทั้งหมดจากฐานข้อมูล)
router.get("/terms", async (req, res) => {
  if (isDbConnected() && pool) {
    try {
      const [rows] = await pool.query(
        "SELECT academic_year as year, semester, is_active FROM academic_terms ORDER BY academic_year DESC, semester DESC",
      );
      return res.json(rows);
    } catch (error) {
      console.error("Error fetching terms from DB:", error);
      return res.status(500).json([]);
    }
  }

  res.json([]);
});

// 3. GET /api/reports/central (รายงานส่วนกลาง)
router.get("/reports/central", async (req, res) => {
  const { year = "2569", semester = "2" } = req.query;

  if (isDbConnected() && pool) {
    try {
      const [rows] = await pool.query(
        `
        SELECT 
          f.id as faculty_id,
          f.faculty_name,
          p.program_name,
          COALESCE(ar.internet_applicants, 0) as internet_applicants,
          COALESCE(ar.internet_paid, 0) as internet_paid,
          COALESCE(ar.internet_student_id, 0) as internet_student_id,
          COALESCE(ar.walkin_applicants, 0) as walkin_applicants,
          COALESCE(ar.mail_applicants, 0) as mail_applicants,
          COALESCE(ar.total_paid, 0) as total_paid
        FROM faculties f
        JOIN programs p ON f.id = p.faculty_id
        LEFT JOIN academic_terms t ON t.academic_year = ? AND t.semester = ?
        LEFT JOIN admission_reports ar ON ar.program_id = p.id AND ar.term_id = t.id
        WHERE p.campus_type = 'central'
        ORDER BY f.sort_order, p.sort_order
      `,
        [year, semester],
      );

      if (rows.length > 0) {
        // Group by faculty
        const facultiesMap = {};
        rows.forEach((r) => {
          if (!facultiesMap[r.faculty_id]) {
            facultiesMap[r.faculty_id] = {
              facultyName: r.faculty_name,
              totalApplicants: 0,
              totalPaid: 0,
              programs: [],
            };
          }
          const applicants =
            r.internet_applicants + r.walkin_applicants + r.mail_applicants;
          facultiesMap[r.faculty_id].totalApplicants += applicants;
          facultiesMap[r.faculty_id].totalPaid += r.total_paid;
          facultiesMap[r.faculty_id].programs.push({
            name: r.program_name,
            internet_applicants: r.internet_applicants,
            internet_paid: r.internet_paid,
            internet_student_id: r.internet_student_id,
            walkin_applicants: r.walkin_applicants,
            mail_applicants: r.mail_applicants,
            total_paid: r.total_paid,
          });
        });
        return res.json(Object.values(facultiesMap));
      }

      return res.json([]);
    } catch (error) {
      console.error("Error fetching central report from DB:", error);
      return res.status(500).json([]);
    }
  }

  res.json([]);
});

// 4. GET /api/reports/regional (รายงานส่วนภูมิภาค)
router.get("/reports/regional", async (req, res) => {
  const { year = "2569", semester = "2" } = req.query;

  if (isDbConnected() && pool) {
    try {
      const [rows] = await pool.query(
        `
        SELECT 
          f.id as faculty_id,
          f.faculty_name,
          p.faculty_dept,
          p.program_name,
          COALESCE(ar.internet_applicants, 0) as internet_applicants,
          COALESCE(ar.internet_paid, 0) as internet_paid,
          COALESCE(ar.internet_student_id, 0) as internet_student_id,
          COALESCE(ar.walkin_applicants, 0) as walkin_applicants,
          COALESCE(ar.mail_applicants, 0) as mail_applicants,
          COALESCE(ar.total_paid, 0) as total_paid
        FROM faculties f
        JOIN programs p ON f.id = p.faculty_id
        LEFT JOIN academic_terms t ON t.academic_year = ? AND t.semester = ?
        LEFT JOIN admission_reports ar ON ar.program_id = p.id AND ar.term_id = t.id
        WHERE p.campus_type = 'regional'
        ORDER BY f.sort_order, p.sort_order
      `,
        [year, semester],
      );

      if (rows.length > 0) {
        const facultiesMap = {};
        rows.forEach((r) => {
          if (!facultiesMap[r.faculty_id]) {
            facultiesMap[r.faculty_id] = {
              facultyName: r.faculty_name,
              totalApplicants: 0,
              totalPaid: 0,
              programs: [],
            };
          }
          const applicants =
            r.internet_applicants + r.walkin_applicants + r.mail_applicants;
          facultiesMap[r.faculty_id].totalApplicants += applicants;
          facultiesMap[r.faculty_id].totalPaid += r.total_paid;
          facultiesMap[r.faculty_id].programs.push({
            faculty_dept: r.faculty_dept || "",
            name: r.program_name,
            internet_applicants: r.internet_applicants,
            internet_paid: r.internet_paid,
            internet_student_id: r.internet_student_id,
            walkin_applicants: r.walkin_applicants,
            mail_applicants: r.mail_applicants,
            total_paid: r.total_paid,
          });
        });
        return res.json(Object.values(facultiesMap));
      }

      return res.json([]);
    } catch (error) {
      console.error("Error fetching regional report from DB:", error);
      return res.status(500).json([]);
    }
  }

  res.json([]);
});

// ==========================================
// 1. ดึงรายชื่อวิชาทั้งหมดสำหรับ Dropdown (Day 2)
// ==========================================
router.get("/courses", async (req, res) => {
  try {
    const [courses] = await pool.query(`
      SELECT id, course_code, course_name, credits, category 
      FROM courses 
      ORDER BY course_code ASC
    `);
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// ==========================================
// 2. ดึงสถิติตามจังหวัดของวิชาที่เลือก (Day 2)
// ==========================================
router.get("/course-by-province", async (req, res) => {
  try {
    let courseId = req.query.courseId;
    let termId = req.query.termId;

    // ถ้าไม่ได้ระบุ termId ให้ดึงเทอมล่าสุดอัตโนมัติ
    if (!termId) {
      const [terms] = await pool.query(
        "SELECT id FROM academic_terms ORDER BY is_active DESC, academic_year DESC, semester DESC LIMIT 1",
      );
      termId = terms.length > 0 ? terms[0].id : 4;
    }

    // ถ้าไม่ได้ระบุ courseId ให้เลือกวิชาแรกในระบบอัตโนมัติ (RAM1000)
    if (!courseId) {
      const [courses] = await pool.query(
        "SELECT id FROM courses ORDER BY course_code ASC LIMIT 1",
      );
      courseId = courses.length > 0 ? courses[0].id : 1;
    }

    // 1. ดึงข้อมูลวิชาที่เลือก
    const [courseRows] = await pool.query(
      "SELECT id, course_code, course_name, credits, category FROM courses WHERE id = ?",
      [courseId],
    );
    const course = courseRows.length > 0 ? courseRows[0] : null;

    // 2. Query สรุปยอดแยกตามจังหวัด (ชาย / หญิง / รวม)
    const [provinceStats] = await pool.query(
      `
      SELECT 
        s.province,
        COUNT(se.student_id) AS total,
        SUM(CASE WHEN s.gender = 'ชาย' THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN s.gender = 'หญิง' THEN 1 ELSE 0 END) AS female
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      WHERE se.course_id = ? AND se.term_id = ?
      GROUP BY s.province
      ORDER BY total DESC, s.province ASC
    `,
      [courseId, termId],
    );

    // 3. คำนวณยอดรวม (KPIs) และสัดส่วนร้อยละ
    const totalStudents = provinceStats.reduce(
      (sum, p) => sum + Number(p.total),
      0,
    );
    const totalMale = provinceStats.reduce((sum, p) => sum + Number(p.male), 0);
    const totalFemale = provinceStats.reduce(
      (sum, p) => sum + Number(p.female),
      0,
    );
    const topProvince =
      provinceStats.length > 0 ? provinceStats[0].province : "-";

    const formattedProvinces = provinceStats.map((p, idx) => ({
      rank: idx + 1,
      province: p.province,
      total: Number(p.total),
      male: Number(p.male),
      female: Number(p.female),
      percentage:
        totalStudents > 0
          ? ((Number(p.total) / totalStudents) * 100).toFixed(2)
          : "0.00",
    }));

    return res.json({
      termId: Number(termId),
      course: course,
      kpis: {
        totalStudents,
        totalMale,
        totalFemale,
        totalProvinces: provinceStats.length,
        topProvince,
      },
      top5Provinces: formattedProvinces.slice(0, 5),
      provinces: formattedProvinces,
    });
  } catch (error) {
    console.error("Error fetching course stats by province:", error);
    res.status(500).json({ error: "Failed to fetch course statistics" });
  }
});

// ==========================================
// 3. ดึงรายชื่อนักศึกษาเจาะลึกรายวิชา/จังหวัด (Day 3)
// ==========================================
router.get("/course-students", async (req, res) => {
  try {
    const {
      courseId,
      termId = 4,
      province,
      status,
      hasCode,
      search,
    } = req.query;

    let sql = `
      SELECT DISTINCT
        s.id,
        s.student_code,
        s.citizen_id,
        s.first_name,
        s.last_name,
        s.gender,
        s.province,
        s.status,
        f.faculty_name,
        p.program_name
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      JOIN programs p ON s.program_id = p.id
      JOIN faculties f ON p.faculty_id = f.id
      WHERE se.term_id = ?
    `;
    const params = [termId];

    // กรองตามวิชา
    if (courseId) {
      sql += ` AND se.course_id = ?`;
      params.push(courseId);
    }

    // กรองตามจังหวัด
    if (province) {
      sql += ` AND s.province = ?`;
      params.push(province);
    }

    // กรองตามสถานะ (ออกรหัสแล้ว / ชำระเงินแล้ว)
    if (status) {
      sql += ` AND s.status = ?`;
      params.push(status);
    }

    // กรองเฉพาะคนที่มีรหัสนักศึกษาแล้ว
    if (hasCode === "true") {
      sql += ` AND s.student_code IS NOT NULL`;
    }

    // ค้นหาตามชื่อ นามสกุล หรือรหัสนักศึกษา
    if (search && search.trim()) {
      sql += ` AND (s.student_code LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    sql += ` ORDER BY (s.student_code IS NULL) ASC, s.student_code ASC, s.id ASC LIMIT 500`;

    const [students] = await pool.query(sql, params);

    res.json({
      count: students.length,
      students: students,
    });
  } catch (error) {
    console.error("Error fetching course students:", error);
    res.status(500).json({ error: "Failed to fetch student list" });
  }
});

module.exports = router;
