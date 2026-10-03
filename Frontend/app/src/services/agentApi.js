import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from "./api";

export const API_BASE_URL = BACKEND_URL;

/**
 * Helper to perform authenticated API calls
 */
async function fetchWithAuth(endpoint, options = {}) {
  const token = await AsyncStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `API error (${response.status})`);
  }
  return data;
}

/**
 * Initializes or creates a new agent session.
 */
export async function initializeAgentSession({
  petId,
  scanId,
  prediction,
  image,
  gradCamImage,
}) {
  return fetchWithAuth("/api/agent/session", {
    method: "POST",
    body: JSON.stringify({
      petId,
      scanId,
      prediction,
      image,
      gradCamImage,
    }),
  });
}

/**
 * Retrieves an active agent session.
 */
export async function getAgentSession(sessionId) {
  return fetchWithAuth(`/api/agent/session/${sessionId}`, {
    method: "GET",
  });
}

/**
 * Sends a conversational message or trigger intent to the AI agent.
 */
export async function sendAgentMessage({ sessionId, message, actionIntent }) {
  return fetchWithAuth("/api/agent/message", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      message,
      actionIntent,
    }),
  });
}


/**
 * Submits an escalation review request to a veterinarian.
 */
export async function escalateToDoctor({ sessionId, doctorId, adviceNotes }) {
  return fetchWithAuth("/api/agent/escalate", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      doctorId,
      adviceNotes,
    }),
  });
}

// ===========================================================================
// NEW: Analyze dog skin image
// React Native -> Node /api/scan/analyze -> Flask /predict -> Grad-CAM
// ===========================================================================

/**
 * analyzeDogSkinImage
 * --------------------
 * Uploads a dog skin image to the Node backend which forwards it to Flask.
 * Never calls Flask directly from React Native (API key security / CORS).
 *
 * @param {string} imageUri  - local file URI from camera/gallery (e.g. file:///...)
 * @returns {Promise<{success, prediction, gradCam, rawFlaskResult?}>}
 *
 * Expected success response:
 * {
 *   success: true,
 *   prediction: {
 *     disease: "dermatitis",
 *     confidence: 87.42,
 *     allScores: { demodicosis: 4.1, dermatitis: 87.42, ... },
 *     diseaseInfo: { full_name, description, severity, color }
 *   },
 *   gradCam: "data:image/jpeg;base64,..."
 * }
 */
export async function analyzeDogSkinImage(imageUri) {
  const token = await AsyncStorage.getItem("token");

  // Build multipart FormData - do NOT set Content-Type header manually;
  // fetch/axios will add the correct boundary automatically.
  const formData = new FormData();
  formData.append("image", {
    uri : imageUri,
    name: "dog_skin.jpg",
    type: "image/jpeg",
  });

  const response = await fetch(`${API_BASE_URL}/api/scan/analyze`, {
    method : "POST",
    headers: {
      // Do NOT add "Content-Type" here - React Native fetch sets it with boundary
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Analysis failed (${response.status})`);
  }

  return data;
}

/**
 * getImageUri
 * -----------
 * Normalises a gradCam value that could be:
 *   - a base64 data URI:  "data:image/jpeg;base64,..."
 *   - an https URL:       "https://..."
 *   - empty / undefined
 *
 * Returns a URI string usable by <Image source={{ uri: ... }} />
 * or null if the value is unusable.
 */
export function getImageUri(image) {
  if (!image || typeof image !== "string" || image.trim() === "") return null;
  // base64 data URI and https URLs are both valid React Native Image sources
  return image;
}
