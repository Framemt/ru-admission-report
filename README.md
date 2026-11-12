# RU Admission Report System (ระบบรายงานสถิติการรับสมัครนักศึกษาใหม่)
มหาวิทยาลัยรามคำแหง (Ramkhamhaeng University)

ระบบเว็บแอปพลิเคชันสำหรับแสดงรายงานและสถิติการรับสมัครนักศึกษาใหม่ (ระดับปริญญาตรี) ทั้งส่วนกลางและส่วนภูมิภาค พัฒนาด้วย Angular และ Node.js Express เชื่อมต่อฐานข้อมูล MySQL

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
│   ├── middleware/      # JWT Authentication Middleware
│   ├── routes/          # API Routes (auth, reports)
│   ├── database.sql     # โครงสร้างตารางและข้อมูลจำลองตัวเต็ม 8 ตาราง
│   ├── .env.example     # ไฟล์ตัวอย่างสำหรับการตั้งค่า Environment
│   └── server.js        # Entry point ของ Backend API (Port 3000)
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── component/   # หน้าจอต่าง ๆ (Login, Home, รายงานส่วนกลาง, รายงานส่วนภูมิภาค, รายวิชาตามจังหวัด)
│   │   │   ├── guards/      # AuthGuard / GuestGuard ตรวจสอบสิทธิ์การเข้าถึงหน้าเว็บ
│   │   │   ├── services/    # Data Services (Auth, Reports, Excel Export)
│   │   │   └── interceptors/# แนบ Bearer Token ไปกับ HTTP Requests
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
   *(ในไฟล์มีคำสั่งสร้างฐานข้อมูล `test_sql` และข้อมูลเริ่มต้นทั้ง 8 ตารางให้อัตโนมัติ)*

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
   *(ตรวจสอบค่าพอร์ตหรือรหัสผ่าน MySQL ในไฟล์ `.env` ให้ตรงกับเครื่องของท่าน)*
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

สามารถใช้ข้อมูลด้านล่างนี้เพื่อเข้าสู่ระบบทดสอบ หรือล็อกอินผ่าน Google Sign-In:

| ชื่อผู้ใช้งาน (Username) | รหัสผ่าน (Password) | สิทธิ์ / บทบาท |
|---|---|---|
| `test-dev07@ru.ac.th` | `2569@Com!` | บุคลากร / ผู้ดูแลระบบ |
| `scps2201@gmail.com` | `123456` | ผู้ใช้งานทั่วไป |
| `test` | `123456` | บัญชีทดสอบ |

---

## 📊 ฟีเจอร์หลักของระบบ
- **Modern Authentication:** หน้าเข้าสู่ระบบและสมัครสมาชิกแบบ Double Sliding Card นุ่มนวล รองรับทั้งระบบรหัสผ่านและ Google One Tap
- **Comprehensive Reports:** 
  - รายงานสถิติการรับสมัครส่วนกลางแยกตามคณะ/สาขา
  - รายงานสถิติการรับสมัครส่วนภูมิภาคแยกตามสาขาวิทยบริการฯ
  - รายงานสถิติการลงทะเบียนรายวิชาตามรายจังหวัด
- **Excel Export:** ส่งออกข้อมูลรายงานออกเป็นไฟล์ Excel ที่จัดรูปแบบคอลัมน์และหัวตารางตรงตามมาตรฐานงานสารสนเทศ
- **Security:** ป้องกันเส้นทางด้วย JWT Bearer Token, Route Guards และ CORS Configuration
