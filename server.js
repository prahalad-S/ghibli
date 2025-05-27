const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
require("dotenv").config();

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

// Setup multer for file uploads (store files in 'uploads' folder)
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    // Use timestamp + original name for uniqueness
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.use(express.static(path.join(__dirname, "frontend")));
app.use(express.json());

// Upload endpoint: saves file and returns its URL (served statically)
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  // URL accessible by client
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Serve uploaded images statically
app.use("/uploads", express.static(uploadFolder));

// Ghibli style API call: expects JSON with { image_url: "..."}
app.post("/api/ghibli-style", async (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ error: "Image URL is required" });

    // Full URL to send to Replicate must be absolute (include host)
    // If image_url starts with "/", prefix with host from headers
    let fullImageUrl = image_url;
    if (image_url.startsWith("/")) {
      const host = req.get("host");
      const protocol = req.protocol;
      fullImageUrl = `${protocol}://${host}${image_url}`;
    }

  const response = await fetch("https://api.replicate.com/v1/predictions", {
  method: "POST",
  headers: {
    Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    version: "db21e45d3d8662f2bf2ad4f2e24dbb0e44e90207a55ed9b058bb69e2c9ab0e55",
    input: { image: fullImageUrl },
  }),
});

const data = await response.json();
console.log("Replicate response:", data); // <--- Add this

    if (response.status !== 201) {
      return res.status(response.status).json({ error: data.detail || "Prediction failed" });
    }

    res.json(data);
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete uploaded image endpoint after saving
app.post("/delete-uploaded", (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: "Filename is required" });

  const filePath = path.join(uploadFolder, filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Failed to delete uploaded image:", err);
      return res.status(500).json({ error: "Failed to delete file" });
    }
    res.json({ message: "File deleted successfully" });
  });
});

// For all other routes, serve frontend index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
