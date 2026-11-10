-- ============================================================
-- ฐานข้อมูลระบบรายงานการรับสมัครนักศึกษาใหม่ (ระดับปริญญาตรี)
-- มหาวิทยาลัยรามคำแหง (Ramkhamhaeng University)
-- อัปเดตล่าสุด: ภาค 2 ปีการศึกษา 2569 (โครงสร้างสมบูรณ์ 8 ตาราง)
-- ============================================================

CREATE DATABASE IF NOT EXISTS test_sql CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE test_sql;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS student_enrollments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS admission_reports;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS faculties;
DROP TABLE IF EXISTS academic_terms;
DROP TABLE IF EXISTS login;

-- ============================================================
-- 1. ตารางปีการศึกษาและภาคการศึกษา (Academic Terms)
-- ============================================================
CREATE TABLE academic_terms (
  id INT NOT NULL AUTO_INCREMENT,
  academic_year VARCHAR(10) NOT NULL,
  semester VARCHAR(10) NOT NULL,
  is_active TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. ตารางคณะและสาขาวิทยบริการฯ (Faculties & Regional Branches)
-- ============================================================
CREATE TABLE faculties (
  id INT NOT NULL AUTO_INCREMENT,
  faculty_code VARCHAR(10) NOT NULL,
  faculty_name VARCHAR(255) NOT NULL,
  campus_type ENUM('central','regional') NOT NULL DEFAULT 'central',
  sort_order INT DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY faculty_code (faculty_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. ตารางสาขาวิชา (Programs: ส่วนกลางและส่วนภูมิภาค 168 สาขา)
-- ============================================================
CREATE TABLE programs (
  id INT NOT NULL AUTO_INCREMENT,
  faculty_id INT NOT NULL,
  program_code VARCHAR(20) NOT NULL,
  faculty_dept VARCHAR(100) DEFAULT NULL,
  program_name VARCHAR(255) NOT NULL,
  campus_type ENUM('central','regional') DEFAULT 'central',
  sort_order INT DEFAULT 0,
  PRIMARY KEY (id),
  KEY faculty_id (faculty_id),
  CONSTRAINT programs_ibfk_1 FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. ตารางยอดสถิติการรับสมัคร (Admission Report Data)
-- ============================================================
CREATE TABLE admission_reports (
  id INT NOT NULL AUTO_INCREMENT,
  term_id INT NOT NULL,
  program_id INT NOT NULL,
  campus_type ENUM('central','regional') NOT NULL,
  internet_applicants INT DEFAULT 0,
  internet_paid INT DEFAULT 0,
  internet_student_id INT DEFAULT 0,
  walkin_applicants INT DEFAULT 0,
  mail_applicants INT DEFAULT 0,
  total_paid INT DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY term_id (term_id),
  KEY program_id (program_id),
  CONSTRAINT admission_reports_ibfk_1 FOREIGN KEY (term_id) REFERENCES academic_terms (id) ON DELETE CASCADE,
  CONSTRAINT admission_reports_ibfk_2 FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. ตารางรายวิชาหลัก (Courses: 12 รายวิชา)
-- ============================================================
CREATE TABLE courses (
  id INT NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(20) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  credits INT DEFAULT 3,
  category VARCHAR(50) NOT NULL,
  faculty_id INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY course_code (course_code),
  KEY faculty_id (faculty_id),
  CONSTRAINT courses_ibfk_1 FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. ตารางนักศึกษาใหม่ (Students)
-- ============================================================
CREATE TABLE students (
  id INT NOT NULL AUTO_INCREMENT,
  student_code VARCHAR(20) DEFAULT NULL,
  citizen_id VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender ENUM('ชาย','หญิง') NOT NULL,
  province VARCHAR(100) NOT NULL,
  faculty_id INT NOT NULL,
  program_id INT NOT NULL,
  campus_type ENUM('central','regional') NOT NULL,
  status ENUM('ออกรหัสแล้ว','ชำระเงินแล้ว') NOT NULL DEFAULT 'ชำระเงินแล้ว',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY citizen_id (citizen_id),
  UNIQUE KEY student_code (student_code),
  KEY faculty_id (faculty_id),
  KEY program_id (program_id),
  CONSTRAINT students_ibfk_1 FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE CASCADE,
  CONSTRAINT students_ibfk_2 FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. ตารางการลงทะเบียนรายวิชา (Student Course Enrollments)
-- ============================================================
CREATE TABLE student_enrollments (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  term_id INT NOT NULL,
  enrolled_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_student_course_term (student_id, course_id, term_id),
  KEY course_id (course_id),
  KEY term_id (term_id),
  CONSTRAINT student_enrollments_ibfk_1 FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT student_enrollments_ibfk_2 FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT student_enrollments_ibfk_3 FOREIGN KEY (term_id) REFERENCES academic_terms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. ตารางผู้ใช้งานและสิทธิ์เข้าสู่ระบบ (Users Login)
-- ============================================================
CREATE TABLE login (
  lg_id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(200) NOT NULL,
  password VARCHAR(200) NOT NULL,
  auth_provider VARCHAR(50) DEFAULT 'local',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (lg_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- MASTER & SEED DATA (ข้อมูลตั้งต้นระบบ)
-- ============================================================

-- 1. ปีการศึกษา
INSERT INTO academic_terms (id, academic_year, semester, is_active) VALUES
(1, '2569', '2', 1),
(2, '2569', '1', 0),
(3, '2568', '2', 0);

-- 2. ผู้มีสิทธิ์เข้าใช้งานระบบ (Authorized Accounts)
INSERT INTO login (lg_id, username, password, auth_provider) VALUES
(1, 'test-dev07@ru.ac.th', '2569@Com!\r\n', 'local'),
(2, 'scps2201@gmail.com', '123456', 'local'),
(3, 'test', '123456', 'local');

-- 3. รายวิชาหลัก 12 รายวิชา
INSERT INTO courses (id, course_code, course_name, credits, category) VALUES
(1, 'RAM1000', 'ความรู้คู่คุณธรรม', 3, 'วิชาศึกษาทั่วไป'),
(2, 'THA1001', 'ลักษณะและการใช้ภาษาไทย', 3, 'วิชาศึกษาทั่วไป'),
(3, 'ENG1001', 'ประโยคภาษาอังกฤษพื้นฐาน', 3, 'วิชาศึกษาทั่วไป'),
(4, 'HIS1001', 'อารยธรรมตะวันตก', 3, 'วิชาศึกษาทั่วไป'),
(5, 'LAW1001', 'หลักกฎหมายมหาชน', 3, 'วิชาเฉพาะคณะ'),
(6, 'LAW1002', 'หลักกฎหมายเอกชน', 3, 'วิชาเฉพาะคณะ'),
(7, 'MGT1001', 'หลักการจัดการ', 3, 'วิชาเฉพาะคณะ'),
(8, 'ACC1101', 'การบัญชีขั้นต้น 1', 3, 'วิชาเฉพาะคณะ'),
(9, 'POL1100', 'รัฐศาสตร์ทั่วไป', 3, 'วิชาเฉพาะคณะ'),
(10, 'POL1101', 'การเมืองการปกครองของไทย', 3, 'วิชาเฉพาะคณะ'),
(11, 'ECO1001', 'เศรษฐศาสตร์จุลภาค 1', 3, 'วิชาเฉพาะคณะ'),
(12, 'MCS1150', 'การสื่อสารมวลชนเบื้องต้น', 3, 'วิชาเฉพาะคณะ');

-- 4. คณะและสาขาวิทยบริการฯ (ทั้งหมด 33 แห่ง)
INSERT INTO faculties (id, faculty_code, faculty_name, campus_type, sort_order) VALUES
(11, 'LAW', 'คณะนิติศาสตร์', 'central', 1),
(12, 'BA', 'คณะบริหารธุรกิจ', 'central', 2),
(13, 'HUM', 'คณะมนุษยศาสตร์', 'central', 3),
(14, 'EDU', 'คณะศึกษาศาสตร์', 'central', 4),
(15, 'SCI', 'คณะวิทยาศาสตร์', 'central', 5),
(16, 'POL', 'คณะรัฐศาสตร์', 'central', 6),
(17, 'ECON', 'คณะเศรษฐศาสตร์', 'central', 7),
(18, 'MASS', 'คณะสื่อสารมวลชน', 'central', 8),
(19, 'HRD', 'คณะพัฒนาทรัพยากรมนุษย์', 'central', 9),
(20, 'PRE', 'PRE-DEGREE', 'central', 10),
(21, 'REG_BR_101', 'สาขาวิทยบริการฯ จังหวัดนครศรีธรรมราช', 'regional', 101),
(22, 'REG_BR_102', 'สาขาวิทยบริการฯ จังหวัดปราจีนบุรี', 'regional', 102),
(23, 'REG_BR_103', 'สาขาวิทยบริการฯ จังหวัดอุทัยธานี', 'regional', 103),
(24, 'REG_BR_104', 'สาขาวิทยบริการฯ จังหวัดอำนาจเจริญ', 'regional', 104),
(25, 'REG_BR_105', 'สาขาวิทยบริการฯ จังหวัดนครพนม', 'regional', 105),
(26, 'REG_BR_106', 'สาขาวิทยบริการฯ จังหวัดแพร่', 'regional', 106),
(27, 'REG_BR_107', 'สาขาวิทยบริการฯ จังหวัดนครราชสีมา', 'regional', 107),
(28, 'REG_BR_108', 'สาขาวิทยบริการฯ จังหวัดสุโขทัย', 'regional', 108),
(29, 'REG_BR_109', 'สาขาวิทยบริการฯ จังหวัดขอนแก่น', 'regional', 109),
(30, 'REG_BR_110', 'สาขาวิทยบริการฯ จังหวัดศรีสะเกษ', 'regional', 110),
(31, 'REG_BR_111', 'สาขาวิทยบริการฯ จังหวัดตรัง', 'regional', 111),
(32, 'REG_BR_112', 'สาขาวิทยบริการฯ จังหวัดลพบุรี', 'regional', 112),
(33, 'REG_BR_113', 'สาขาวิทยบริการฯ จังหวัดหนองบัวลำภู', 'regional', 113),
(34, 'REG_BR_114', 'สาขาวิทยบริการฯ จังหวัดชัยภูมิ', 'regional', 114),
(35, 'REG_BR_115', 'สาขาวิทยบริการฯ จังหวัดเพชรบูรณ์', 'regional', 115),
(36, 'REG_BR_116', 'สาขาวิทยบริการฯ จังหวัดบุรีรัมย์', 'regional', 116),
(37, 'REG_BR_117', 'สาขาวิทยบริการฯ จังหวัดเชียงราย', 'regional', 117),
(38, 'REG_BR_118', 'สาขาวิทยบริการฯ จังหวัดกาญจนบุรี', 'regional', 118),
(39, 'REG_BR_119', 'สาขาวิทยบริการฯ จังหวัดเชียงใหม่', 'regional', 119),
(40, 'REG_BR_120', 'สาขาวิทยบริการฯ จังหวัดสุรินทร์', 'regional', 120),
(41, 'REG_BR_121', 'สาขาวิทยบริการฯ จังหวัดอุดรธานี', 'regional', 121),
(42, 'REG_BR_122', 'สาขาวิทยบริการฯ จังหวัดพังงา', 'regional', 122),
(43, 'REG_BR_123', 'สาขาวิทยบริการฯ จังหวัดสงขลา', 'regional', 123);

-- 5. สาขาวิชาส่วนกลางและภูมิภาค (ทั้งหมด 168 สาขา)
INSERT INTO programs (id, faculty_id, program_code, faculty_dept, program_name, campus_type, sort_order) VALUES
(53, 11, 'LAW01', NULL, 'สาขานิติศาสตร์', 'central', 1),
(54, 12, 'BA01', NULL, 'สาขาการจัดการ', 'central', 1),
(55, 12, 'BA02', NULL, 'สาขาการเงินและการธนาคาร', 'central', 2),
(56, 12, 'BA03', NULL, 'สาขาการตลาด', 'central', 3),
(57, 12, 'BA04', NULL, 'สาขาบริหารทรัพยากรมนุษย์', 'central', 4),
(58, 12, 'BA05', NULL, 'สาขาธุรกิจระหว่างประเทศ', 'central', 5),
(59, 12, 'BA06', NULL, 'สาขาการบัญชีและการเงิน', 'central', 6),
(60, 12, 'BA07', NULL, 'สาขาการจัดการโลจิสติกส์และโซ่อุปทาน', 'central', 7),
(61, 12, 'BA08', NULL, 'สาขาการสื่อสารธุรกิจดิจิทัล', 'central', 8),
(62, 12, 'BA09', NULL, 'สาขาอุตสาหกรรมบริการและการท่องเที่ยว', 'central', 9),
(63, 12, 'BA10', NULL, 'สาขาการบัญชี', 'central', 10),
(64, 13, 'HUM01', NULL, 'สาขาวิชาภาษาอังกฤษ', 'central', 1),
(65, 13, 'HUM02', NULL, 'สาขาวิชาภาษาไทย', 'central', 2),
(66, 13, 'HUM03', NULL, 'สาขาประวัติศาสตร์', 'central', 3),
(67, 13, 'HUM04', NULL, 'สาขาวิชาปรัชญา', 'central', 4),
(68, 13, 'HUM05', NULL, 'สาขาสังคมวิทยาและมานุษยวิทยา', 'central', 5),
(69, 13, 'HUM06', NULL, 'สาขาประวัติศาสตร์เพื่อการท่องเที่ยว', 'central', 7),
(70, 13, 'HUM07', NULL, 'สาขาวิชาภาษาจีน', 'central', 8),
(71, 13, 'HUM08', NULL, 'สาขาวิชาภาษาญี่ปุ่น', 'central', 9),
(72, 13, 'HUM09', NULL, 'สาขาวิชาภาษาตะวันตก(ภาษาฝรั่งเศส,ภาษาเยอรมัน,ภาษาสเปน,ภาษารัสเซีย)', 'central', 10),
(73, 14, 'EDU01', NULL, 'สาขาวิชาภูมิศาสตร์(หลักสูตร 4 ปี)', 'central', 1),
(74, 14, 'EDU02', NULL, 'สาขาวิชาศึกษาศาสตร์ วิชาเอกภาษาไทย', 'central', 2),
(75, 14, 'EDU03', NULL, 'สาขาวิชาศึกษาศาสตร์ วิชาเอกภาษาอังกฤษ', 'central', 3),
(76, 14, 'EDU04', NULL, 'สาขาวิชาศึกษาศาสตร์ วิชาเอกสังคมศึกษา', 'central', 4),
(77, 14, 'EDU05', NULL, 'สาขาวิชาศึกษาศาสตร์ วิชาเอกคณิตศาสตร์', 'central', 5),
(78, 14, 'EDU06', NULL, 'สาขาวิชาศึกษาศาสตร์ วิชาเอกพลศึกษา', 'central', 6),
(79, 14, 'EDU07', NULL, 'สาขาวิชาคหกรรมศาสตร์(หลักสูตร 4 ปี)', 'central', 7),
(80, 14, 'EDU08', NULL, 'สาขาวิชาศึกษาศาสตร์ วิชาเอกภาษาจีน', 'central', 8),
(81, 14, 'EDU09', NULL, 'สาขาวิชาศึกษาศาสตร์ วิชาเอกศิลปศึกษา', 'central', 10),
(82, 14, 'EDU10', NULL, 'สาขาวิชาการวัดผล การประเมินผลและการวิจัยทางการศึกษา', 'central', 11),
(83, 14, 'EDU11', NULL, 'สาขาวิชาศึกษาศาสตร์ วิชาเอกคอมพิวเตอร์ศึกษา', 'central', 12),
(84, 14, 'EDU12', NULL, 'สาขาวิชาสุขศึกษาและพลศึกษา', 'central', 13),
(85, 14, 'EDU13', NULL, 'สาขาวิชาการศึกษาพิเศษ', 'central', 14),
(86, 14, 'EDU14', NULL, 'สาขาวิชาเทคโนโลยีดิจิทัลและนวัตกรรมการเรียนรู้', 'central', 15),
(87, 14, 'EDU15', NULL, 'สาขาวิชาจิตวิทยา วิชาเอกจิตวิทยาการปรึกษา(หลักสูตร 4 ปี)', 'central', 16),
(88, 14, 'EDU16', NULL, 'สาขาวิชาจิตวิทยา วิชาเอกจิตวิทยาอุตสาหกรรมและองค์การ(หลักสูตร 4 ปี)', 'central', 17),
(89, 14, 'EDU17', NULL, 'สาขาวิชาวิทยาศาสตร์การกีฬา วิชาเอกการกีฬาประยุกต์(หลักสูตร 4 ปี)', 'central', 18),
(90, 15, 'SCI01', NULL, 'สาขาคณิตศาสตร์', 'central', 1),
(91, 15, 'SCI02', NULL, 'สาขาเคมี', 'central', 2),
(92, 15, 'SCI03', NULL, 'สาขาฟิสิกส์', 'central', 3),
(93, 15, 'SCI04', NULL, 'สาขาชีววิทยา', 'central', 4),
(94, 15, 'SCI05', NULL, 'สาขาวิทยาการคอมพิวเตอร์', 'central', 5),
(95, 15, 'SCI06', NULL, 'สาขาเทคโนโลยีวัสดุ', 'central', 6),
(96, 15, 'SCI07', NULL, 'สาขาเทคโนโลยีอิเล็กทรอนิกส์', 'central', 8),
(97, 15, 'SCI08', NULL, 'สาขาวิทยาศาสตร์สิ่งแวดล้อม', 'central', 9),
(98, 15, 'SCI09', NULL, 'สาขาเทคโนโลยีการเกษตร', 'central', 10),
(99, 15, 'SCI10', NULL, 'สาขาสถิติศาสตร์และวิทยาการจัดการข้อมูล', 'central', 11),
(100, 16, 'POL01', NULL, 'สาขาวิชารัฐศาสตร์(ทุกแผน)', 'central', 1),
(101, 17, 'ECON01', NULL, 'สาขาวิชาเศรษฐศาสตร์', 'central', 1),
(102, 18, 'MASS01', NULL, 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'central', 1),
(103, 19, 'HRD01', NULL, 'สาขาวิชาการพัฒนาทรัพยากรมนุษย์', 'central', 1),
(104, 20, 'PRE01', NULL, 'PRE-DEGREE', 'central', 1),
(111, 13, 'HUM10', NULL, 'สาขาวิชาภาษาและวัฒนธรรมตะวันออก', 'central', 11),
(112, 14, 'EDU18', NULL, 'สาขาวิชาศึกษาศาสตร์ วิชาเอกวิทยาศาสตร์', 'central', 9),
(113, 15, 'SCI11', NULL, 'สาขาวิชาเคมีเครื่องสำอางและผลิตภัณฑ์ธรรมชาติ', 'central', 12),
(114, 21, 'REG_101_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(115, 21, 'REG_101_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(116, 21, 'REG_101_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(117, 21, 'REG_101_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(118, 21, 'REG_101_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(119, 22, 'REG_102_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(120, 22, 'REG_102_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(121, 22, 'REG_102_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(122, 22, 'REG_102_P4', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 4),
(123, 23, 'REG_103_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(124, 23, 'REG_103_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(125, 23, 'REG_103_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(126, 23, 'REG_103_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(127, 23, 'REG_103_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(128, 24, 'REG_104_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(129, 24, 'REG_104_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(130, 24, 'REG_104_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(131, 24, 'REG_104_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(132, 24, 'REG_104_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(133, 25, 'REG_105_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(134, 25, 'REG_105_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(135, 25, 'REG_105_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(136, 25, 'REG_105_P4', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 4),
(137, 26, 'REG_106_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(138, 26, 'REG_106_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(139, 26, 'REG_106_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(140, 26, 'REG_106_P4', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 4),
(141, 27, 'REG_107_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(142, 27, 'REG_107_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(143, 27, 'REG_107_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(144, 27, 'REG_107_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(145, 27, 'REG_107_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(146, 28, 'REG_108_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(147, 28, 'REG_108_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(148, 28, 'REG_108_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(149, 28, 'REG_108_P4', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 4),
(150, 29, 'REG_109_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(151, 29, 'REG_109_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(152, 29, 'REG_109_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(153, 29, 'REG_109_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(154, 29, 'REG_109_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(155, 30, 'REG_110_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(156, 30, 'REG_110_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(157, 30, 'REG_110_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(158, 30, 'REG_110_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(159, 30, 'REG_110_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(160, 31, 'REG_111_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(161, 31, 'REG_111_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(162, 31, 'REG_111_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(163, 31, 'REG_111_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(164, 31, 'REG_111_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(165, 32, 'REG_112_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(166, 32, 'REG_112_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(167, 32, 'REG_112_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(168, 32, 'REG_112_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(169, 32, 'REG_112_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(170, 33, 'REG_113_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(171, 33, 'REG_113_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(172, 33, 'REG_113_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(173, 33, 'REG_113_P4', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 4),
(174, 34, 'REG_114_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(175, 34, 'REG_114_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(176, 34, 'REG_114_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(177, 34, 'REG_114_P4', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 4),
(178, 35, 'REG_115_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(179, 35, 'REG_115_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(180, 35, 'REG_115_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(181, 35, 'REG_115_P4', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 4),
(182, 36, 'REG_116_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(183, 36, 'REG_116_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(184, 36, 'REG_116_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(185, 36, 'REG_116_P4', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 4),
(186, 37, 'REG_117_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(187, 37, 'REG_117_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(188, 37, 'REG_117_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(189, 37, 'REG_117_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(190, 37, 'REG_117_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(191, 38, 'REG_118_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(192, 38, 'REG_118_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(193, 38, 'REG_118_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(194, 38, 'REG_118_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(195, 38, 'REG_118_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(196, 39, 'REG_119_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(197, 39, 'REG_119_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(198, 39, 'REG_119_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(199, 39, 'REG_119_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(200, 39, 'REG_119_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(201, 40, 'REG_120_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(202, 40, 'REG_120_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(203, 40, 'REG_120_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(204, 40, 'REG_120_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(205, 40, 'REG_120_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(206, 41, 'REG_121_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(207, 41, 'REG_121_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(208, 41, 'REG_121_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(209, 41, 'REG_121_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(210, 41, 'REG_121_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(211, 42, 'REG_122_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(212, 42, 'REG_122_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(213, 42, 'REG_122_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(214, 42, 'REG_122_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(215, 42, 'REG_122_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(216, 43, 'REG_123_P1', 'คณะนิติศาสตร์', 'สาขานิติศาสตร์', 'regional', 1),
(217, 43, 'REG_123_P2', 'คณะบริหารธุรกิจ', 'สาขาการจัดการ', 'regional', 2),
(218, 43, 'REG_123_P3', 'คณะรัฐศาสตร์', 'สาขาวิชารัฐศาสตร์(Plan C)', 'regional', 3),
(219, 43, 'REG_123_P4', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 4),
(220, 43, 'REG_123_P5', 'PRE-DEGREE', 'PRE-DEGREE', 'regional', 5),
(224, 13, 'HUM11', NULL, 'สาขาสารสนเทศศาสตร์และบรรณารักษศาสตร์', 'central', 6),
(225, 15, 'SCI12', NULL, 'สาขาเทคโนโลยีอาหาร', 'central', 7),
(226, 15, 'NEW_4051', NULL, 'สาขาเทคโนโลยีชีวภาพ', 'central', 99),
(227, 28, 'REG_4103', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 99),
(228, 36, 'REG_4141', 'คณะสื่อสารมวลชน', 'สาขานิเทศศาสตร์และสื่อดิจิทัล', 'regional', 99),
(229, 14, 'PROG_1793670316500_5', NULL, 'สาขาวิชาการศึกษาตลอดชีวิต', 'central', 19);
