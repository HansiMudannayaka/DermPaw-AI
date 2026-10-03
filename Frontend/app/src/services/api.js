/**
 * Centralized API configuration for DermPaw AI App
 */

// Host IP address where Node backend (port 8000) and Python Flask ML service (port 5000) run
export const HOST_IP = "192.168.1.6";

export const BACKEND_URL = `http://${HOST_IP}:8000`;
export const ML_URL = `http://${HOST_IP}:5000`;

export default {
  HOST_IP,
  BACKEND_URL,
  ML_URL,
};
