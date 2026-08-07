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
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Something went wrong';

      // Only show alerts on the client side
      if (typeof window !== 'undefined') {
        if (status === 401) {
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
          // Token expired or unauthorized
          sessionStorage.clear();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        } else if (status === 403) {
          Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You do not have permission to perform this action.',
          });
        } else if (status === 404) {
          console.warn('API Not Found:', error.config.url);
        } else if (status >= 500) {
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Internal server error occurred. Please try again later.',
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
          title: 'Network Error',
          text: 'Cannot connect to the server. Please check your internet connection.',
        });
      }
    } else {
      console.error('Error setting up the request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

