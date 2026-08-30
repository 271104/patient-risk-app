// Express backend: receives patient form data from React, forwards it to the
// Python FastAPI ML service, and returns the prediction to the frontend.
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/predict", async (req, res) => {
  try {
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await mlResponse.json();

    if (!mlResponse.ok) {
      return res.status(mlResponse.status).json({ error: data.detail || "Prediction failed" });
    }

    res.json(data);
  } catch (err) {
    console.error("Error calling ML service:", err.message);
    res.status(502).json({ error: "Could not reach the ML service. Is it running on " + ML_SERVICE_URL + "?" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`Forwarding predictions to ML service at ${ML_SERVICE_URL}`);
});
