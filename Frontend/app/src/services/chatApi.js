import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from "./api";

const API_BASE_URL = BACKEND_URL;

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
 * Send a chat message
 * @param {Object} params
 * @param {string} params.recipientId - Recipient user ID
 * @param {string} [params.consultationId] - Optional linked consultation ID
 * @param {string} params.text - Message content
 * @param {string} [params.image] - Optional image URL or base64
 */
export async function sendMessage({ recipientId, consultationId, text, image }) {
  return fetchWithAuth("/api/chat/messages", {
    method: "POST",
    body: JSON.stringify({
      recipientId,
      consultationId,
      text,
      image,
    }),
  });
}

/**
 * Fetch messages for a conversation or consultation
 * @param {string} conversationId - Conversation or Consultation ID
 */
export async function getMessages(conversationId) {
  return fetchWithAuth(`/api/chat/messages/${conversationId}`, {
    method: "GET",
  });
}

/**
 * Fetch all active conversations for the logged in user
 */
export async function getConversations() {
  return fetchWithAuth("/api/chat/conversations", {
    method: "GET",
  });
}

/**
 * Mark messages in a conversation as read
 * @param {string} conversationId
 */
export async function markRead(conversationId) {
  return fetchWithAuth(`/api/chat/read/${conversationId}`, {
    method: "PUT",
  });
}

/**
 * Check real-time availability of a doctor
 * @param {string} doctorId
 */
export async function getDoctorStatus(doctorId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat/doctor-status/${doctorId}`);
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, available: false };
  }
}

export default {
  sendMessage,
  getMessages,
  getConversations,
  markRead,
  getDoctorStatus,
};
