import axios from 'axios';

import { AuthResponseSchema } from '../types/AuthResponse';
import type { Role } from '../types/Role';

const tg = window.Telegram.WebApp;

// Holds the pending request for a new token
let tokenPromise: Promise<Role> | null = null;

async function getToken(): Promise<Role> {
  // If there are no pending requests for a new token ...
  if (!tokenPromise) {
    // Call the backend to exchange InitData for a Cookie
    tokenPromise = axios.post(
      import.meta.env.VITE_CRUD_API_URL + '/auth/token',
      { initData: tg.initData },
      { withCredentials: true }

    ).then(response => {
      // Validate the response
      const parsed = AuthResponseSchema.parse(response.data);

      return parsed.role;

    }).catch(_error => {
      throw new Error('Authentication failed');
    }).finally(() => {
      // Indicate that there are no pending requests
      tokenPromise = null;
    });
  }
  return tokenPromise;
}

export default getToken;