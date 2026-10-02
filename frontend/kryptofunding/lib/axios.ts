import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3005/api/v1",
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axios.post(
        "http://localhost:3005/api/v1/user/auth/refresh",
        {},
        { withCredentials: true },
      );
      processQueue(null);
      return api(originalRequest);
    } catch {
      try {
        await axios.post(
          "http://localhost:3005/api/v1/admin/auth/refresh",
          {},
          { withCredentials: true },
        );
        processQueue(null);
        return api(originalRequest);
      } catch {
        await axios
          .post("/auth/logout")
          .catch(() => {});
        processQueue(error);
        return Promise.reject(error);
      }
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
