import axios from "axios";
import { useAdminStore } from "@/stores/adminStore";
// import { API_BASE_URL } from '@/utils/constants/api';

const axiosInstance = axios.create({
  baseURL: "http://localhost:1310",
  headers: {
    "Content-Type": "application/json",
  },

  // withCredentials: true,
});

// Function to get access token from store

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const adminStore = useAdminStore.getState();
    if (adminStore.user?.accessToken) {
      config.headers.Authorization = `Bearer ${adminStore.user.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized access
          const adminStore = useAdminStore.getState();
          adminStore.logout();
          break;
        case 403:
          // Handle forbidden access
          break;
        case 404:
          // Handle not found
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
