const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { pool, isDbConnected } = require("../config/db");

// POST /api/login
router.post("/login", async (req, res) => {
  const username = (req.body.username || req.body.email || "").trim();
  const password = (req.body.password || "").trim();

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "กรุณากรอกชื่อผู้ใช้/อีเมลและรหัสผ่าน",
    });
  }

  try {
    if (pool && isDbConnected()) {
      const [rows] = await pool.query(
        "SELECT lg_id, username, password FROM login WHERE username = ?",
        [username],
      );

      if (rows.length > 0) {
        const user = rows[0];
        const dbPassword = user.password ? user.password.trim() : "";

        if (dbPassword === password) {
          // สร้าง Secure Session Token
          // สร้าง Real JWT Token (มีข้อมูล id, username และเวลาหมดอายุ)
          const token = jwt.sign(
            { id: user.lg_id, username: user.username },
            process.env.JWT_SECRET ||
              "ru_admission_secret_key_2026_super_secure",
            { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
          );

          return res.json({
            success: true,
            message: "เข้าสู่ระบบสำเร็จ",
            token: token,
            username: user.username,
            serverInstanceId: req.app.get("serverInstanceId") || "",
            user: {
              id: user.lg_id,
              username: user.username,
            },
          });
        }
      }
    }

    return res.status(401).json({
      success: false,
      message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง",
    });
  }
});

// POST /api/register (ลงทะเบียนผู้ใช้งานใหม่ด้วย Username / Password)
router.post("/register", async (req, res) => {
  const username = (req.body.username || req.body.email || "").trim();
  const password = (req.body.password || "").trim();

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "กรุณากรอกชื่อผู้ใช้/อีเมลและรหัสผ่านให้ครบถ้วน",
    });
  }

  try {
    if (pool && isDbConnected()) {
      const [existing] = await pool.query(
        "SELECT lg_id FROM login WHERE LOWER(username) = ?",
        [username.toLowerCase()]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบ",
        });
      }

      const [insertRes] = await pool.query(
        "INSERT INTO login (username, password, auth_provider) VALUES (?, ?, 'local')",
        [username, password]
      );

      const userId = insertRes.insertId;
      const token = jwt.sign(
        { id: userId, username: username },
        process.env.JWT_SECRET || "ru_admission_secret_key_2026_super_secure",
        { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
      );

      return res.json({
        success: true,
        message: "ลงทะเบียนสำเร็จและเข้าสู่ระบบเรียบร้อย",
        token: token,
        username: username,
        serverInstanceId: req.app.get("serverInstanceId") || "",
        user: {
          id: userId,
          username: username,
        },
      });
    }

    return res.status(503).json({
      success: false,
      message: "ระบบฐานข้อมูลยังไม่พร้อมใช้งาน",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง",
    });
  }
});

// POST /api/auth/google-verify (ตรวจสอบว่าอีเมล Gmail มีใน MySQL หรือยัง)
router.post("/auth/google-verify", async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const displayName = (req.body.name || req.body.displayName || "").trim();
  const photoUrl = req.body.photoUrl || "";

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "ไม่พบข้อมูลอีเมลจาก Google",
    });
  }

  try {
    if (pool && isDbConnected()) {
      const [rows] = await pool.query(
        "SELECT lg_id, username FROM login WHERE LOWER(username) = ?",
        [email]
      );

      if (rows.length > 0) {
        const user = rows[0];
        const token = jwt.sign(
          { id: user.lg_id, username: user.username },
          process.env.JWT_SECRET || "ru_admission_secret_key_2026_super_secure",
          { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
        );

        return res.json({
          success: true,
          isNewUser: false,
          message: "เข้าสู่ระบบด้วย Google สำเร็จ",
          token: token,
          username: user.username,
          displayName: displayName || user.username,
          serverInstanceId: req.app.get("serverInstanceId") || "",
          user: {
            id: user.lg_id,
            username: user.username,
          },
        });
      } else {
        // ยังไม่มีชื่อใน MySQL -> ไม่อนุญาตให้เข้าใช้งาน (Strict Whitelist)
        return res.status(403).json({
          success: false,
          hasAccess: false,
          message: "ขออภัย บัญชีอีเมลนี้ยังไม่ได้รับสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบเพื่อขอเปิดสิทธิ์",
          email: email,
        });
      }
    }

    return res.status(503).json({
      success: false,
      message: "ระบบฐานข้อมูลยังไม่พร้อมใช้งาน",
    });
  } catch (error) {
    console.error("Google verify error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการตรวจสอบบัญชี Google",
    });
  }
});

// POST /api/auth/google-register (ลงทะเบียนผู้ใช้ Gmail ใหม่ลงใน MySQL)
router.post("/auth/google-register", async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const fullName = (req.body.fullName || req.body.name || (email.split('@')[0])).trim();
  const department = (req.body.department || "").trim();
  const phone = (req.body.phone || "").trim();

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "กรุณาระบุอีเมล",
    });
  }

  try {
    if (pool && isDbConnected()) {
      const [existing] = await pool.query(
        "SELECT lg_id, username FROM login WHERE LOWER(username) = ?",
        [email]
      );

      let userId;
      if (existing.length > 0) {
        userId = existing[0].lg_id;
        await pool.query(
          "UPDATE login SET auth_provider = 'google' WHERE lg_id = ?",
          [userId]
        );
      } else {
        const [insertRes] = await pool.query(
          "INSERT INTO login (username, password, auth_provider) VALUES (?, ?, 'google')",
          [email, "GOOGLE_AUTH_OAUTH"]
        );
        userId = insertRes.insertId;
      }

      const token = jwt.sign(
        { id: userId, username: email },
        process.env.JWT_SECRET || "ru_admission_secret_key_2026_super_secure",
        { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
      );

      return res.json({
        success: true,
        message: "ลงทะเบียนและเข้าสู่ระบบสำเร็จ",
        token: token,
        username: email,
        displayName: fullName,
        serverInstanceId: req.app.get("serverInstanceId") || "",
        user: {
          id: userId,
          username: email,
          fullName: fullName,
          department: department,
        },
      });
    }

    return res.status(503).json({
      success: false,
      message: "ระบบฐานข้อมูลยังไม่พร้อมใช้งาน",
    });
  } catch (error) {
    console.error("Google register error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลงทะเบียน",
    });
  }
});

module.exports = router;
