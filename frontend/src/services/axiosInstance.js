import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
let isHandlingUnauthorized = false;
const AUTH_OPTIONAL_PATHS = ["/auth/login", "/auth/admin/register", "/health"];

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const requestUrl = config.url || "";
  const needsAuth = !AUTH_OPTIONAL_PATHS.some((path) =>
    requestUrl.includes(path),
  );

  if (needsAuth && !token) {
    const error = new Error("Missing authentication token");
    error.code = "MISSING_TOKEN";
    return Promise.reject(error);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      localStorage.removeItem("token");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }

      setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 300);
    }

    return Promise.reject(error);
  },
);

export default api;
