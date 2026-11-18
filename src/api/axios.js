import axios from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const MAX_CONCURRENT = 3;
let activeRequests = 0;
const requestQueue = [];

const acquireSlot = () => {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    requestQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
};

const releaseSlot = () => {
  activeRequests--;
  const next = requestQueue.shift();
  if (next) next();
};

export const getLocalAccessToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
};

api.interceptors.request.use(
  async (config) => {
    await acquireSlot();

    const token = getLocalAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    releaseSlot();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    releaseSlot();
    return response;
  },
  async (error) => {
    releaseSlot();

    const originalRequest = error.config;

    // Retry safe GET requests on 429
    if (error.response?.status === 429 && originalRequest) {
      if (originalRequest.skipRateLimitRetry) {
        return Promise.reject(error);
      }

      const method = String(originalRequest.method || "get").toUpperCase();
      const isRetrySafe = method === "GET" || method === "HEAD";
      if (!isRetrySafe) {
        return Promise.reject(error);
      }

      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 2) {
        const retryAfterHeader = error.response?.headers?.["retry-after"];
        const retryAfterSeconds = Number(retryAfterHeader);
        const retryAfterDelay =
          Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds * 1000
            : null;
        const baseDelay =
          retryAfterDelay ?? Math.pow(2, originalRequest._retryCount) * 500;
        const jitter = Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
        return api(originalRequest);
      }
    }

    // 401 Unauthorized handling
    if (error.response?.status === 401 && originalRequest) {
      const url = originalRequest.url || "";
      const isAuthEndpoint = url.includes("/auth/");
      const hadAccessToken = Boolean(getLocalAccessToken());

      if (hadAccessToken && !isAuthEndpoint) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          document.cookie =
            "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          window.dispatchEvent(new Event("auth_logout"));
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
