const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
require("dotenv").config();

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();

// Setup uploads folder
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

app.use(express.static(path.join(__dirname, "frontend")));
app.use(express.json());
app.use("/uploads", express.static(uploadFolder)); // Serve uploaded files

// Upload image
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Convert to Ghibli-style
app.post("/api/ghibli-style", async (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ error: "Image URL is required" });

    // Ensure full URL
    let fullImageUrl = image_url;
    if (image_url.startsWith("/")) {
      const host = req.get("host");
      const protocol = req.protocol;
      fullImageUrl = `${protocol}://${host}${image_url}`;
    }

    console.log("Sending to Replicate:", fullImageUrl);

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "7be575a9c8b24e419a6e6d3303c189532653b6a61c7d7b7a87edb5d80000a14e",
        input: {
          image: fullImageUrl,
          prompt: "ghibli style"
        },
      }),
    });

    const data = await response.json();
    console.log("Replicate response:", data);

    if (response.status !== 201) {
      return res.status(response.status).json({ error: data.detail || "Prediction failed" });
    }

    res.json(data);
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete uploaded image
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

// Catch-all: serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
