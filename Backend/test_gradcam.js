/**
 * DermPaw AI - Grad-CAM Integration Tests
 * Run: node test_gradcam.js
 * Requires: Flask running on port 5000, Node on port 8000
 */

const fs       = require("fs");
const path     = require("path");
const FormData = require("form-data");
const axios    = require("axios");

const FLASK_URL   = "http://127.0.0.1:5000";
const NODE_URL    = "http://127.0.0.1:8000";

// ---------------------------------------------------------------------------
// Minimal test image factory - creates a small valid JPEG buffer
// ---------------------------------------------------------------------------
function makeTestJpegBuffer() {
  // Minimal JPEG (10x10 grey) - enough to pass image decode
  // For real tests, place an actual dog skin image at test_dog.jpg
  const testFile = path.join(__dirname, "test_dog.jpg");
  if (fs.existsSync(testFile)) {
    return fs.readFileSync(testFile);
  }
  throw new Error(
    "test_dog.jpg not found. Place a real dog skin photo as test_dog.jpg in the backend folder."
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pass(n, msg) { console.log(`  PASS [Test ${n}] ${msg}`); }
function fail(n, msg) { console.error(`  FAIL [Test ${n}] ${msg}`); }

async function postToFlask(endpoint, imageBuffer, extra = {}) {
  const form = new FormData();
  form.append("image", imageBuffer, { filename: "test.jpg", contentType: "image/jpeg" });
  Object.entries(extra).forEach(([k, v]) => form.append(k, v));
  return axios.post(`${FLASK_URL}${endpoint}`, form, {
    headers: form.getHeaders(), timeout: 90000,
    validateStatus: () => true,
  });
}

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------
async function runTests() {
  let imgBuf;
  try { imgBuf = makeTestJpegBuffer(); } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  console.log("\nDermPaw AI - Grad-CAM Tests\n" + "=".repeat(50));

  // Test 1 - Valid image -> prediction + Grad-CAM
  try {
    const r = await postToFlask("/predict", imgBuf);
    const d = r.data;
    if (d.status === "predicted" && d.gradcam_image && d.gradcam_image.startsWith("data:image/jpeg;base64,")) {
      pass(1, `Valid image -> disease:${d.disease}  conf:${d.confidence}%  gradcam:${d.gradcam_image.length} chars`);
    } else {
      fail(1, `status=${d.status}  gradcam=${!!d.gradcam_image}  msg=${d.message}`);
    }
  } catch (e) { fail(1, e.message); }

  // Test 2 - No image -> 400
  try {
    const r = await axios.post(`${FLASK_URL}/predict`, {}, {
      headers: { "Content-Type": "application/json" }, timeout: 10000,
      validateStatus: () => true,
    });
    r.status === 400 ? pass(2, "No image -> 400") : fail(2, `Expected 400, got ${r.status}`);
  } catch (e) { fail(2, e.message); }

  // Test 3 - Invalid (text) file -> 400 or rejected
  try {
    const form = new FormData();
    form.append("image", Buffer.from("not-an-image"), { filename: "bad.jpg", contentType: "image/jpeg" });
    const r = await axios.post(`${FLASK_URL}/predict`, form, {
      headers: form.getHeaders(), timeout: 10000, validateStatus: () => true,
    });
    const ok = r.status === 400 || r.data?.status === "rejected" || r.data?.status === "error";
    ok ? pass(3, "Invalid image -> rejected/400") : fail(3, `Got status=${r.status} data.status=${r.data?.status}`);
  } catch (e) { fail(3, e.message); }

  // Test 4 - /gradcam endpoint - no class override (uses predicted class)
  try {
    const r = await postToFlask("/gradcam", imgBuf);
    const d = r.data;
    if (d.success && d.gradcam && d.gradcam.startsWith("data:image/jpeg;base64,")) {
      pass(4, `/gradcam -> targetClass:${d.targetClass}  layer:${d.layerName}  size:${d.originalWidth}x${d.originalHeight}`);
    } else {
      fail(4, JSON.stringify(d).substring(0, 200));
    }
  } catch (e) { fail(4, e.message); }

  // Tests 5-7 - class_name overrides
  for (const [n, cls] of [[5, "demodicosis"], [6, "dermatitis"], [7, "ringworm"]]) {
    try {
      const r = await postToFlask("/gradcam", imgBuf, { class_name: cls });
      const d = r.data;
      if (d.success && d.gradcam && d.targetClass === cls) {
        pass(n, `/gradcam class_name=${cls} -> OK`);
      } else {
        fail(n, `targetClass=${d.targetClass}  success=${d.success}`);
      }
    } catch (e) { fail(n, e.message); }
  }

  // Test 8 - /health endpoint shows gradcam enabled
  try {
    const r = await axios.get(`${FLASK_URL}/health`, { timeout: 5000 });
    const d = r.data;
    if (d.status === "ok" && d.gradcam === "enabled") {
      pass(8, `Health: model=${d.model}  conv_layer=${d.conv_layer}`);
    } else {
      fail(8, JSON.stringify(d));
    }
  } catch (e) { fail(8, e.message); }

  // Test 9 - Node /api/scan/ml-health
  try {
    const r = await axios.get(`${NODE_URL}/api/scan/ml-health`, {
      timeout: 10000, validateStatus: () => true,
      headers: { Authorization: "Bearer FAKE_TOKEN_FOR_HEALTH_CHECK" },
    });
    // 200 = Flask reachable, 401 = auth needed (means Node is up)
    r.status === 401 || r.data?.reachable !== undefined
      ? pass(9, `Node /api/scan/ml-health -> status ${r.status}`)
      : fail(9, `Unexpected status ${r.status}`);
  } catch (e) { fail(9, e.message); }

  // Test 10 - Grad-CAM failure tolerance (empty image buffer)
  try {
    const form = new FormData();
    form.append("image", Buffer.alloc(0), { filename: "empty.jpg", contentType: "image/jpeg" });
    const r = await axios.post(`${FLASK_URL}/gradcam`, form, {
      headers: form.getHeaders(), timeout: 10000, validateStatus: () => true,
    });
    const ok = r.status === 400 || r.data?.success === false;
    ok ? pass(10, "Empty image -> graceful error (not crash)") : fail(10, `Got ${r.status}`);
  } catch (e) { fail(10, e.message); }

  console.log("\n" + "=".repeat(50));
  console.log("Tests complete. If FAIL lines appear, check the relevant service.");
}

runTests().catch(console.error);
