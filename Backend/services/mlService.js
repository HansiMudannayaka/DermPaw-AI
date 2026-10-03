/**
 * DermPaw AI - ML Service (Node.js)
 * Communicates with the Python Flask ML service.
 * React Native talks to Node.js; Node.js talks to Flask.
 * Flask is NEVER called directly from React Native.
 */
const axios     = require("axios");
const FormData  = require("form-data");
const fs        = require("fs");

// NODE -> FLASK: base URL from environment variable
// Use LAN IP (e.g. 192.168.1.6) so this works from real phones on the same WiFi.
// 127.0.0.1 only works when both Node AND Flask run on the same machine
// AND the caller is also on that machine (which React Native on a phone is NOT).
const FLASK_ML_URL = process.env.FLASK_ML_URL || "http://127.0.0.1:5000";

/**
 * analyzeSkinImage
 * -----------------
 * Forwards a multipart image buffer to Flask /predict and returns
 * a clean, combined prediction + Grad-CAM response to the Express route.
 *
 * @param {Buffer}  imageBuffer   - raw image bytes
 * @param {string}  mimeType      - e.g. "image/jpeg"
 * @param {string}  filename      - original filename
 * @returns {object} { success, prediction, gradCam, rawFlaskResult }
 */
async function analyzeSkinImage(imageBuffer, mimeType, filename) {
  // Build multipart form for Flask
  const form = new FormData();
  form.append("image", imageBuffer, {
    filename   : filename || "skin.jpg",
    contentType: mimeType || "image/jpeg",
  });

  let flaskRes;
  try {
    flaskRes = await axios.post(`${FLASK_ML_URL}/predict`, form, {
      headers : form.getHeaders(),
      timeout : 60000,   // 60 s - Grad-CAM adds a few seconds
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  } catch (axiosErr) {
    // Flask unreachable or returned non-2xx
    const status  = axiosErr.response?.status;
    const message = axiosErr.response?.data?.message || axiosErr.message;
    const err = new Error(`Flask ML service error: ${message}`);
    err.flaskStatus = status || 503;
    throw err;
  }

  const data = flaskRes.data;

  // Pass through rejection / retake / unknown statuses unchanged
  if (data.status !== "predicted") {
    return { success: false, rawFlaskResult: data };
  }

  const diseaseName = (data.disease || "").toLowerCase();
  const confidenceVal = data.confidence || 0;

  // Calculate severity level dynamically:
  // - Severe diseases or high confidence (>80%): "High"
  // - Moderate confidence (55% - 80%): "Medium"
  // - Low confidence (<55%): "Low"
  const isCriticalCondition = diseaseName.includes("ringworm") || diseaseName.includes("tumor") || diseaseName.includes("dermatitis") || diseaseName.includes("infection") || diseaseName.includes("mange") || diseaseName.includes("scabies");

  let severity = "Medium";
  if (isCriticalCondition || confidenceVal >= 80) {
    severity = "High";
  } else if (confidenceVal < 55) {
    severity = "Low";
  }

  // NODE -> REACT NATIVE: normalised response
  return {
    success   : true,
    prediction: {
      disease    : data.disease,
      confidence : data.confidence,
      severity   : severity,
      priority   : severity,
      allScores  : data.all_scores || {},
      diseaseInfo: data.disease_info || {},
    },
    gradCam        : data.gradcam_image || "",   // base64 data-URI or ""
    rawFlaskResult : data,
  };
}

/**
 * getGradCam
 * ----------
 * Calls the dedicated /gradcam Flask endpoint.
 * Useful when you already have a prediction and want the heatmap separately.
 *
 * @param {Buffer}  imageBuffer
 * @param {string}  mimeType
 * @param {string}  filename
 * @param {string}  [className]  - optional target class override
 */
async function getGradCam(imageBuffer, mimeType, filename, className) {
  const form = new FormData();
  form.append("image", imageBuffer, {
    filename   : filename || "skin.jpg",
    contentType: mimeType || "image/jpeg",
  });
  if (className) {
    form.append("class_name", className);
  }

  let flaskRes;
  try {
    flaskRes = await axios.post(`${FLASK_ML_URL}/gradcam`, form, {
      headers : form.getHeaders(),
      timeout : 60000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  } catch (axiosErr) {
    const message = axiosErr.response?.data?.message || axiosErr.message;
    throw new Error(`Grad-CAM service error: ${message}`);
  }

  return flaskRes.data;
}

/**
 * healthCheck
 * -----------
 * Pings Flask /health. Useful for liveness checks.
 */
async function healthCheck() {
  try {
    const res = await axios.get(`${FLASK_ML_URL}/health`, { timeout: 5000 });
    return { reachable: true, ...res.data };
  } catch {
    return { reachable: false };
  }
}

module.exports = { analyzeSkinImage, getGradCam, healthCheck };
