const express = require("express");
const cors = require("cors");
require("dotenv").config();

const reportsRouter = require("./routes/reports");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// Unique Server Instance ID (เปลี่ยนใหม่ทุกครั้งที่ nodemon รีสตาร์ท)
const SERVER_INSTANCE_ID = "srv_" + Date.now();
app.set("serverInstanceId", SERVER_INSTANCE_ID);

// CORS configuration (อนุญาต Angular Frontend และสามารถขยายผ่าน .env ได้)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:4200", "http://127.0.0.1:4200"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// แนบ Server Instance ID ไปใน Response Header ทุกครั้ง
app.use((req, res, next) => {
  res.setHeader("X-Server-Instance", SERVER_INSTANCE_ID);
  res.setHeader("Access-Control-Expose-Headers", "X-Server-Instance");
  next();
});

app.use(express.json());

// Routes
app.use("/api", authRouter);
app.use("/api", reportsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "RU Admission Report API",
    serverInstanceId: SERVER_INSTANCE_ID,
    timestamp: new Date(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err.message || err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend Server is running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   - POST http://localhost:${PORT}/api/login`);
  console.log(`   - GET  http://localhost:${PORT}/api/summary`);
  console.log(`   - GET  http://localhost:${PORT}/api/terms`);
  console.log(
    `   - GET  http://localhost:${PORT}/api/reports/central?year=2569&semester=2`,
  );
  console.log(
    `   - GET  http://localhost:${PORT}/api/reports/regional?year=2569&semester=2`,
  );
  console.log(`   - GET  http://localhost:${PORT}/api/courses`);
  console.log(
    `   - GET  http://localhost:${PORT}/api/course-by-province?courseId=1`,
  );
  console.log(
    `   - GET  http://localhost:${PORT}/api/course-students?courseId=1&province=กรุงเทพมหานคร`,
  );
});
