// import express from "express";
// import mysql from "mysql";
// import cors from "cors";
// import axios from "axios";
// import jwt from "jsonwebtoken";

// const app = express();
// app.use(express.json());
// app.use(cors());

// // =======================
// // 🔧 MySQL Connection
// // =======================
// const conn = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "video",
// });

// conn.connect((err) => {
//   if (err) console.log("❌ MySQL connection error:", err);
//   else console.log("✅ Connected to MySQL");
// });

// // =======================
// // 🔑 100ms Config
// // =======================
// const ACCESS_KEY = "65b21401672616331ebab241"; // replace with your 100ms Access Key
// const SECRET = "F8DK9sBOBPMHNz4mYUGoWVwR_YgzlrxjIcSAzHA5-R821g_R8ex6mK7tMDZR1If8WBNhC062AbOFBUt2os269O5bk_-MbSpEwPornbRPmGCum3VqO3zg55d2_6UH7IE4b-UrQZ7FBTqhhpMRpWer1Tjv3vac405r0k7TeGfx6lQ="; // replace with your 100ms Secret
// const TEMPLATE_ID = "65b21444cd666ed1654e2128"; // replace with your 100ms template

// // =======================
// // 🟢 Generate Management Token (Server-Side Only)
// // =======================
// function generateManagementToken() {
//   const payload = {
//     access_key: ACCESS_KEY,
//     type: "management",
//     version: 2,
//     jti: Date.now().toString(),
//   };
//   return jwt.sign(payload, SECRET, { algorithm: "HS256", expiresIn: "24h" });
// }

// // =======================
// // 🟢 Create Room
// // =======================
// app.post("/create-room", async (req, res) => {
//   try {
//     const { name } = req.body;
//     const mgmtToken = generateManagementToken();

//     const response = await axios.post(
//       "https://api.100ms.live/v2/rooms",
//       {
//         name: name || `room-${Date.now()}`,
//         description: "Room created via Express backend",
//         template_id: TEMPLATE_ID,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${mgmtToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const roomData = response.data;

//     // Save room in DB
//     const sql = "INSERT INTO tbl_rooms (room_id, name) VALUES (?, ?)";
//     conn.query(sql, [roomData.id, roomData.name], (err) => {
//       if (err) console.error("❌ Error saving room:", err);
//     });

//     res.json({ success: true, room: roomData });
//   } catch (err) {
//     console.error("❌ Error creating room:", err.response?.data || err.message);
//     res.status(500).json({ success: false, message: "Room creation failed" });
//   }
// });

// // =======================
// // 🟢 Get Latest Room
// // =======================
// app.get("/latest-room", (req, res) => {
//   const sql = "SELECT * FROM tbl_rooms ORDER BY created_at DESC LIMIT 1";
//   conn.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ success: false, message: "DB error" });
//     if (results.length === 0) return res.status(404).json({ success: false, message: "No room found" });
//     res.json({ success: true, room: results[0] });
//   });
// });

// // =======================
// // 🟢 Generate Client Token for Joining Room
// // =======================
// app.post("/get-token", (req, res) => {
//   const { room_id, user_id, role } = req.body;

//   if (!room_id || !user_id || !role) {
//     return res.status(400).json({ success: false, message: "room_id, user_id, and role are required" });
//   }

//   try {
//     const payload = {
//       access_key: ACCESS_KEY,
//       room_id,
//       user_id,
//       role, // host or guest
//       type: "app", // must be "app" for client token
//       version: 2,
//       jti: Date.now().toString(),
//     };

//     const token = jwt.sign(payload, SECRET, { algorithm: "HS256", expiresIn: "24h" });

//     res.json({ success: true, token });
//   } catch (err) {
//     console.error("❌ Error generating client token:", err.message);
//     res.status(500).json({ success: false, message: "Token generation failed" });
//   }
// });

// // =======================
// // 🚀 Start Server
// // =======================
// app.listen(5050, () => {
//   console.log("✅ Server running on http://localhost:5050");
// });


import express from "express";
import mysql from "mysql";
import cors from "cors";
import axios from "axios";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

dotenv.config();

/* =======================
   📁 Ensure Upload Folder
======================= */
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* =======================
   📤 Multer Setup
======================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* =======================
   🗄 MySQL Connection
======================= */
const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "video",
});

conn.connect((err) => {
  if (err) console.log("❌ MySQL connection error:", err);
  else console.log("✅ Connected to MySQL");
});

/* =======================
   🔑 100ms Config
======================= */
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET = process.env.SECRET;
const TEMPLATE_ID = process.env.TEMPLATE_ID;
console.log("ACCESS_KEY:", ACCESS_KEY);
console.log("SECRET loaded:", !!SECRET);
console.log("TEMPLATE_ID:", TEMPLATE_ID);/* =======================
   🔐 Generate Management Token
======================= */
function generateManagementToken() {
  const payload = {
    access_key: ACCESS_KEY,
    type: "management",
    version: 2,
    jti: Date.now().toString(),
  };

  return jwt.sign(payload, SECRET, {
    algorithm: "HS256",
    expiresIn: "24h",
  });
}

/* =======================
   🟢 Create Room
======================= */
app.post("/create-room", async (req, res) => {
  try {
    const { name } = req.body;
    const mgmtToken = generateManagementToken();

    const response = await axios.post(
      "https://api.100ms.live/v2/rooms",
      {
        name: name || `room-${Date.now()}`,
        template_id: TEMPLATE_ID,
      },
      {
        headers: {
          Authorization: `Bearer ${mgmtToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const roomData = response.data;

    const sql = "INSERT INTO tbl_rooms (room_id, name) VALUES (?, ?)";
    conn.query(sql, [roomData.id, roomData.name]);

    res.json({ success: true, room: roomData });
  } catch (err) {
    console.error("❌ Room Error:", err.response?.data || err.message);
    res.status(500).json({ success: false });
  }
});

/* =======================
   🎟 Generate Join Token
======================= */
app.post("/get-token", (req, res) => {
  const { room_id, user_id, role } = req.body;

  if (!room_id || !user_id || !role) {
    return res.status(400).json({ success: false });
  }

  try {
    const payload = {
      access_key: ACCESS_KEY,
      room_id,
      user_id,
      role,
      type: "app",
      version: 2,
      jti: Date.now().toString(),
    };

    const token = jwt.sign(payload, SECRET, {
      algorithm: "HS256",
      expiresIn: "24h",
    });

    res.json({ success: true, token });
  } catch (err) {
    console.error("❌ Token Error:", err.message);
    res.status(500).json({ success: false });
  }
});

/* =======================
   🎥 Upload Recording
======================= */
app.post("/addrecording", upload.single("recording"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    console.log("Recording Saved:", req.file.filename);

    res.json({
      success: true,
      message: "Recording uploaded successfully",
      file: req.file.filename,
    });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({ success: false });
  }
});

/* =======================
   🚀 Start Server
======================= */
app.listen(5050, () => {
  console.log("✅ Server running on http://localhost:5050");
});