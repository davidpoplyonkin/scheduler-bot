import axios, { AxiosError } from 'axios';
import { notifications } from '@mantine/notifications';

import getToken from '../utils/auth';
import i18n from '../i18n';
import { StructuredApiError } from '../types/error';

const crud_api = axios.create({
  baseURL: import.meta.env.VITE_CRUD_API_URL,
  withCredentials: true,
});

crud_api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

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

    // Parse structured error response
    const responseData = error.response?.data as {
      detail?: string;
      nonCritical?: boolean;
      nonSensitive?: boolean;
    } | undefined;

    const detail = responseData?.detail ?? error.message;
    const nonCritical = responseData?.nonCritical ?? false;
    const nonSensitive = responseData?.nonSensitive ?? false;

    const structuredError = new StructuredApiError(
      error,
      detail,
      nonCritical,
      nonSensitive,
    );

    // If non-critical, show notification
    if (structuredError.nonCritical) {
      const message = structuredError.nonSensitive
        ? structuredError.detail
        : i18n.t('notifications.genericError', { ns: 'shared' });

      notifications.show({
        title: i18n.t('notifications.errorTitle', { ns: 'shared' }),
        message,
        color: 'red',
      });
    }

    return Promise.reject(structuredError);
  }
);

export default crud_api;
