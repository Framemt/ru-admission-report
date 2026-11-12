# RU Admission Report System (ระบบรายงานสถิติการรับสมัครนักศึกษาใหม่)
มหาวิทยาลัยรามคำแหง (Ramkhamhaeng University)

ระบบเว็บแอปพลิเคชันสำหรับแสดงรายงานและสถิติการรับสมัครนักศึกษาใหม่ (ระดับปริญญาตรี) ทั้งส่วนกลางและส่วนภูมิภาค พัฒนาด้วย Angular และ Node.js Express เชื่อมต่อฐานข้อมูล MySQL พร้อมระบบรักษาความปลอดภัยและการส่งออกข้อมูลรายงาน

---

## 🛠️ Tech Stack

- **Frontend:** Angular 20 (Standalone Components), TypeScript, SCSS, Bootstrap 5, Bootstrap Icons
- **Backend:** Node.js, Express.js
- **Database:** MySQL (mysql2)
- **Authentication:** JWT (JSON Web Token), Google Identity Services (Google One Tap / Firebase)
- **Export:** ExcelJS (ส่งออกรายงานเป็นไฟล์ Excel สวยงามตามแบบฟอร์มทางการ)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
tes_sql/
├── backend/
│   ├── config/          # การตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
│   ├── middleware/      # ด่านตรวจ JWT Authentication Middleware
│   ├── routes/          # API Routes (auth, reports)
│   ├── database.sql     # โครงสร้างตารางและข้อมูลจริงตัวเต็ม 8 ตาราง
│   ├── .env.example     # ไฟล์ตัวอย่างสำหรับการตั้งค่า Environment
│   └── server.js        # Entry point ของ Backend API (Port 3000)
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── component/   # หน้าจอต่าง ๆ (Login, Home, รายงานส่วนกลาง, รายงานส่วนภูมิภาค, รายวิชาตามจังหวัด)
│   │   │   ├── guards/      # AuthGuard / GuestGuard ตรวจสอบสิทธิ์การเข้าถึงเส้นทาง
│   │   │   ├── services/    # Data Services (Auth, Reports, Excel Export)
│   │   │   └── interceptors/# แนบ Bearer Token ไปกับ HTTP Request ทุกครั้งอัตโนมัติ
│   │   └── styles.scss      # Global Theme และ Stylesheet
│   └── package.json
└── README.md
```

---

## 🚀 วิธีการติดตั้งและรันระบบ (Getting Started)

### 1. การติดตั้งฐานข้อมูล (Database Setup)
1. เปิดโปรแกรมจำลองเซิร์ฟเวอร์ เช่น **XAMPP / MySQL** หรือ **phpMyAdmin**
2. นำเข้าฐานข้อมูล:
   - นำไฟล์ `backend/database.sql` ไป **Import** เข้า MySQL
   *(ในไฟล์มีคำสั่งสร้างฐานข้อมูล `test_sql` พร้อมโครงสร้างและข้อมูลจริงครบทั้ง 8 ตาราง)*

---

### 2. การตั้งค่าและรัน Backend
1. เปิด Terminal แล้วเข้าไปที่โฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. คัดลอกไฟล์ `.env.example` แล้วเปลี่ยนชื่อเป็น `.env`:
   ```bash
   cp .env.example .env
   ```
   *(ตรวจสอบค่าพอร์ตหรือรหัสผ่าน MySQL ในไฟล์ `.env` ให้ตรงกับเครื่องของท่าน เช่น `DB_PASSWORD=`)*
4. เริ่มต้นรันเซิร์ฟเวอร์ Backend:
   ```bash
   npm run dev
   # หรือ npm start
   ```
   > เซิร์ฟเวอร์ API จะทำงานที่: `http://localhost:3000`

---

### 3. การตั้งค่าและรัน Frontend
1. เปิด Terminal ใหม่ แล้วเข้าไปที่โฟลเดอร์ `frontend`:
   ```bash
   cd frontend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. เริ่มต้นรัน Frontend:
   ```bash
   npm start
   ```
4. เปิดเบราว์เซอร์แล้วเข้าไปที่:
   ```text
   http://localhost:4200
   ```

---

## 🔐 บัญชีเข้าใช้งานระบบตัวอย่าง (Demo Accounts)

สามารถใช้ข้อมูลด้านล่างนี้เพื่อเข้าสู่ระบบทดสอบ หรือเข้าสู่ระบบผ่านบัญชี Google:

| ชื่อผู้ใช้งาน (Username) | รหัสผ่าน (Password) | สิทธิ์ / บทบาท |
|---|---|---|
| `test-dev07@ru.ac.th` | `2569@Com!` | บุคลากร / ผู้ดูแลระบบ |
| `scps2201@gmail.com` | `123456` | ผู้ใช้งานทั่วไป |
| `test` | `123456` | บัญชีทดสอบ |

---

## 🛡️ ระบบการยืนยันตัวตนและความปลอดภัย (Authentication & Security)

- **Local Login (ระบบชื่อผู้ใช้/รหัสผ่าน):** ตรวจสอบรหัสผ่านกับฐานข้อมูล MySQL และออกรหัสความปลอดภัย **JWT (JSON Web Token)** ที่มีอายุการใช้งาน 8 ชั่วโมง
- **Google Sign-In & One Tap:** รองรับการยืนยันตัวตนผ่าน Google Identity Services (GIS) โดยเมื่อเข้าสู่ระบบด้วย Google ระบบจะนำอีเมลไปตรวจสอบสิทธิ์กับฐานข้อมูล `test_sql` ก่อนทุกครั้ง
  - **กรณีมีสิทธิ์:** ระบบจะออก Session Token ให้เข้าใช้งานหน้าจอรายงานได้ทันที
  - **กรณีไม่มีสิทธิ์ (Unauthorized):** ระบบจะแสดงหน้าต่างแจ้งเตือน *Access Denied* พร้อมตัวเลือกลงทะเบียนขอเปิดสิทธิ์
- **Route Guards & Interceptors:** 
  - `authGuard`: ป้องกันผู้ใช้งานที่ยังไม่ได้เข้าสู่ระบบเข้าถึงหน้ารายงาน
  - `guestGuard`: ป้องกันผู้ใช้งานที่เข้าสู่ระบบแล้วย้อนกลับไปหน้าล็อกอิน
  - `authInterceptor`: แนบ `Authorization: Bearer <token>` ไปกับทุก API Request อัตโนมัติ

---

## 📡 สรุปรายการ Backend API Endpoints

| Method | Endpoint | รายละเอียดการทำงาน | สิทธิ์การเข้าถึง |
|---|---|---|---|
| `POST` | `/api/login` | เข้าสู่ระบบด้วย Username & Password | ทุกคน (Public) |
| `POST` | `/api/register` | สมัครสมาชิกใหม่เข้าสู่ระบบ | ทุกคน (Public) |
| `POST` | `/api/auth/google-verify` | ตรวจสอบสิทธิ์บัญชี Google ใน MySQL | ทุกคน (Public) |
| `POST` | `/api/auth/google-register` | ลงทะเบียนบัญชี Google เข้าสู่ MySQL | ทุกคน (Public) |
| `GET` | `/api/terms` | ดึงรายการปีการศึกษาและภาคเรียนทั้งหมด | Bearer Token |
| `GET` | `/api/summary` | ข้อมูลภาพรวมสถิตินักศึกษาหน้า Dashboard | Bearer Token |
| `GET` | `/api/reports/central` | สถิติรายงานการรับสมัครนักศึกษาใหม่ (ส่วนกลาง) | Bearer Token |
| `GET` | `/api/reports/regional` | สถิติรายงานการรับสมัครนักศึกษาใหม่ (ส่วนภูมิภาค) | Bearer Token |
| `GET` | `/api/reports/course-by-province`| สถิติการลงทะเบียนรายวิชาจำแนกตามจังหวัด | Bearer Token |

---

## 📊 ฟีเจอร์หลักของระบบ (Key Features)

1. **Modern Responsive Login:**
   - ดีไซน์แบบ Double Sliding Animation สำหรับหน้าจอคอมพิวเตอร์
   - ปรับเป็น Responsive Horizontal Slide นุ่มนวลสำหรับหน้าจอสมาร์ตโฟนและแท็บเล็ต
2. **Academic Term Selector:**
   - ระบบเลือกสลับดูข้อมูลย้อนหลังตามปีการศึกษาและภาคการศึกษา (เช่น ภาค 1/2569, ภาค 2/2569) ได้แบบ Real-time
3. **Comprehensive Reports:** 
   - รายงานสถิติการรับสมัครส่วนกลางแยกตามคณะและสาขาวิชา (168 สาขา)
   - รายงานสถิติการรับสมัครส่วนภูมิภาคแยกตามสาขาวิทยบริการฯ ทั่วประเทศ
   - รายงานสถิติการลงทะเบียนรายวิชาตามรายจังหวัด
4. **Excel Export (จัดรูปแบบตรงตามมาตรฐาน):**
   - ส่งออกข้อมูลเป็นไฟล์ Excel (.xlsx) ด้วย ExcelJS ที่มีหัวตาราง จัดสีพื้นหลัง และเส้นขอบถูกต้องตามรูปแบบรายงานทางการ
