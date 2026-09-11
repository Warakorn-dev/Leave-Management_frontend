import axios from 'axios';
import Swal from 'sweetalert2';
import idleState from '@/lib/idleState';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: '/api', // Always use Next.js proxy to avoid CORS issues
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if available
axiosInstance.interceptors.request.use(
  (config) => {
    // Only access sessionStorage on the client side
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('accessToken') || sessionStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Something went wrong';

      // Only show alerts on the client side
      if (typeof window !== 'undefined') {
        const url = originalRequest?.url || '';
        const isAuthRequest =
          url.includes('/auth/login') ||
          url.includes('/auth/captcha') ||
          url.includes('/auth/forgot-password') ||
          url.includes('/auth/reset-password');
        const isAuthPage =
          window.location.pathname === '/login' ||
          window.location.pathname === '/forgot-password' ||
          window.location.pathname === '/reset-password';

        if (status === 401 && !originalRequest._retry) {
          // If 401 occurs during login or on auth pages (e.g. wrong password/credentials),
          // do NOT show session expired popup. Let the login form display the error.
          if (isAuthRequest || isAuthPage) {
            return Promise.reject(error);
          }

          // ── GUARD 1: Idle popup already showing ──────────────────────────
          // The idle popup is up; don't touch session or redirect.
          if (idleState.isPopupShowing || sessionStorage.getItem('idleTimeoutTriggered') === 'true') {
            return Promise.reject(error);
          }

          // ── GUARD 2: Account deactivated / suspended ──────────────────────
          if (message === 'ACCOUNT_DEACTIVATED' || message === 'ACCOUNT_SUSPENDED') {
            Swal.fire({
              icon: 'error',
              title: 'แจ้งเตือน!!',
              text: message === 'ACCOUNT_SUSPENDED' ? 'user ของคุณโดนระงับการใช้งาน!!' : 'บัญชีของคุณถูกระงับการใช้งานในขณะนี้',
              confirmButtonColor: '#ef4444'
            }).then(() => {
              sessionStorage.clear();
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
            });
            return Promise.reject(error);
          }

          // ── GUARD 3: Session expired (401 from backend) ──────────────────
          // Whether the user was idle or the token just expired normally,
          // always show the session-expired popup instead of silently redirecting.
          // We check if we have a refresh token first; if refresh also fails,
          // we show the popup instead of hard-redirecting.
          const refreshToken = sessionStorage.getItem('refreshToken');

          if (refreshToken) {
            if (isRefreshing) {
              return new Promise(function (resolve, reject) {
                failedQueue.push({ resolve, reject });
              })
                .then((token) => {
                  originalRequest.headers.Authorization = 'Bearer ' + token;
                  return axiosInstance(originalRequest);
                })
                .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
              const res = await axios.post('/api/auth/refresh', {}, {
                headers: { Authorization: `Bearer ${refreshToken}` },
              });

              if (res.data?.accessToken) {
                const newAccessToken = res.data.accessToken;
                sessionStorage.setItem('accessToken', newAccessToken);
                if (res.data.refreshToken) {
                  sessionStorage.setItem('refreshToken', res.data.refreshToken);
                }
                axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
                originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
                processQueue(null, newAccessToken);
                return axiosInstance(originalRequest);
              }
            } catch {
              processQueue(null, null);
              // Refresh failed → show session-expired popup
              const timeoutMinutes = Math.round(idleState.timeoutMs / 60000);
              idleState.showExpiredPopup(timeoutMinutes);
              return Promise.reject(error);
            } finally {
              isRefreshing = false;
            }
          }

          // No refresh token at all → show session-expired popup
          const timeoutMinutes = Math.round(idleState.timeoutMs / 60000);
          idleState.showExpiredPopup(timeoutMinutes);
          return Promise.reject(error);

        } else if (status === 403) {
          Swal.fire({
            icon: 'error',
            title: 'ปฏิเสธการเข้าถึง',
            text: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
          });
        } else if (status === 404) {
          console.warn('API Not Found:', error.config.url);
        } else if (status >= 500) {
          Swal.fire({
            icon: 'error',
            title: 'ข้อผิดพลาดจากเซิร์ฟเวอร์',
            text: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง',
          });
        } else if (status === 413) {
          Swal.fire({
            icon: 'error',
            title: 'ไฟล์ขนาดใหญ่เกินไป',
            text: message || 'ขนาดไฟล์เกินขีดจำกัดที่ตั้งไว้',
          });
        } else if (status === 422 || status === 400) {
          // Bad request or validation error
          console.warn('Validation error:', message);
          if (!isAuthRequest && !isAuthPage) {
            Swal.fire({
              icon: 'warning',
              title: 'ข้อมูลไม่ถูกต้อง',
              text: message || 'โปรดตรวจสอบข้อมูลที่กรอกอีกครั้ง',
            });
          }
        }
      }
    } else if (error.request) {
      console.error('No response received from the server.', error.message);
      // Suppress Network Error if we are navigating to login or already there,
      // as the browser cancels pending requests during navigation, which Axios sees as a Network Error.
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        Swal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาดเครือข่าย',
          text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตของคุณ',
        });
      }
    } else {
      console.error('Error setting up the request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
