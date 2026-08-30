import axios from 'axios';
import Swal from 'sweetalert2';

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
        if (status === 401 && !originalRequest._retry) {
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

          // Try to refresh token
          const refreshToken = sessionStorage.getItem('refreshToken');
          
          if (refreshToken) {
            if (isRefreshing) {
              return new Promise(function(resolve, reject) {
                failedQueue.push({ resolve, reject });
              }).then(token => {
                originalRequest.headers.Authorization = 'Bearer ' + token;
                return axiosInstance(originalRequest);
              }).catch(err => {
                return Promise.reject(err);
              });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
              // Call API to refresh token
              const res = await axios.post('/api/auth/refresh', {}, {
                headers: { Authorization: `Bearer ${refreshToken}` }
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
            } catch (refreshError) {
              processQueue(refreshError, null);
              // Refresh failed, clear session and go to login
              sessionStorage.clear();
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          }

          // No refresh token available, clear session and go to login
          sessionStorage.clear();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
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
        } else if (status === 422 || status === 400) {
          // Bad request or validation error
          // Usually handled by the component, but we can log it
          console.warn('Validation error:', message);
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

