const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const REPLICATE_API_TOKEN = "YOUR_REPLICATE_API_TOKEN";
const MODEL_VERSION = "cjwbw/anything-to-ghibli:da4b8d778b8e82c3ab671b8e3fd4fda7dbf568c2e2c22ecf6d29145f1d173c45";

app.post("/api/ghibli-style", async (req, res) => {
  const { image_url } = req.body;

  const prediction = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: { image: image_url }
    })
  }).then(res => res.json());

  let output = null;
  while (!prediction.output && prediction.status !== "failed") {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
    });
    const statusJson = await statusRes.json();
    prediction.output = statusJson.output;
    prediction.status = statusJson.status;
  }

  if (prediction.output) {
    res.json({ output_url: prediction.output[0] });
  } else {
    res.status(500).json({ error: "Style transfer failed." });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
