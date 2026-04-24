import axios from 'axios';

import getToken from '../utils/auth';

const crud_api = axios.create({
  baseURL: import.meta.env.VITE_CRUD_API_URL,
  withCredentials: true,
});

crud_api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await getToken();

        // Retry the original request
        return crud_api(originalRequest);

      } catch (reauthError) {
        // If the initData is too old or hash is invalid
        return Promise.reject(reauthError);
      }
    }
    return Promise.reject(error);
  }
);

export default crud_api;
