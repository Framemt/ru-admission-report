const jwt = require("jsonwebtoken");

/**
 * ด่านตรวจ Token (JWT Authentication Middleware)
 * คอยตรวจว่าคำขอที่ส่งมามี Header "Authorization: Bearer <token>" ที่ถูกต้องหรือไม่
 */
function authenticateToken(req, res, next) {
  // 1. ดึงค่า Authorization Header จาก Request
  const authHeader = req.headers["authorization"];

  // 2. แยกคำว่า 'Bearer ' ออก เพื่อเอาเฉพาะตัวรหัส Token
  // รูปแบบ Header จะเป็น: "Bearer eyJhbGciOi..."
  const token = authHeader && authHeader.split(" ")[1];

  // 3. ถ้าไม่มี Token แนบมาเลย -> ปฏิเสธทันที (401 Unauthorized)
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "กรุณาเข้าสู่ระบบก่อนใช้งาน (ไม่พบ Token)",
    });
  }

  // 4. ตรวจสอบความถูกต้องของ Token ด้วย jwt.verify (ใช้รหัสลับเดียวกับตอนสร้าง)
  jwt.verify(
    token,
    process.env.JWT_SECRET || "ru_admission_secret_key_2026_super_secure",
    (err, user) => {
      // ถ้า Token ปลอม หรือหมดอายุแล้ว -> ส่ง 401 ปฏิเสธ
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Session หมดอายุ หรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
        });
      }

      // ถ้าบัตรถูกต้อง -> ปล่อยผ่านให้ไปดึงข้อมูลใน Service ต่อได้
      req.user = user;
      next();
    },
  );
}

module.exports = { authenticateToken };
