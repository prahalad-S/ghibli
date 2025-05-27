const express = require("express");
const path = require("path");
require("dotenv").config();

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

app.use(express.static(path.join(__dirname, "frontend")));

app.use(express.json());

app.post("/api/ghibli-style", async (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ error: "Image URL is required" });

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "db21e45d3d8662f2bf2ad4f2e24dbb0e44e90207a55ed9b058bb69e2c9ab0e55",
        input: { image: image_url },
      }),
    });

    const data = await response.json();

    if (response.status !== 201) {
      return res.status(response.status).json({ error: data.detail || "Prediction failed" });
    }

    res.json(data);
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
