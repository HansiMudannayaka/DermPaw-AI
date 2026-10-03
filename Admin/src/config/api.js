// Centralized API configuration for DermPaw AI Admin Dashboard
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  ADMIN_DASHBOARD: `${API_BASE_URL}/api/admin/dashboard`,
  ADMIN_PREDICTIONS: `${API_BASE_URL}/api/admin/predictions`,
  ADMIN_REPORTS: `${API_BASE_URL}/api/admin/reports`,
  ADMIN_NOTIFY: `${API_BASE_URL}/api/admin/notify`,
  USERS: `${API_BASE_URL}/api/users`,
  ARTICLES: `${API_BASE_URL}/api/articles`,
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
};
