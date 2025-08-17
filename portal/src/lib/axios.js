//portal/src/lib/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://labsystjust.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include authToken
api.interceptors.request.use((config) => {
  const authToken = localStorage.getItem("authToken");
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
