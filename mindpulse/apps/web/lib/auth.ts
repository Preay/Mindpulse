'use client';

import { create } from 'zustand';
import { User, TokenResponse } from '@mindpulse/shared-types';
import Cookies from 'js-cookie';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  setAuth: (user: User, tokens: { access_token: string; refresh_token: string }) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  restoreFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,

  setAuth: (user, tokens) => {
    set({ user, accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
    // Store tokens in cookies
    Cookies.set('accessToken', tokens.access_token, { expires: 1/24 }); // 1 hour
    Cookies.set('refreshToken', tokens.refresh_token, { expires: 30 }); // 30 days
  },

  logout: () => {
    set({ user: null, accessToken: null, refreshToken: null });
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  },

  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),

  restoreFromStorage: () => {
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');
    
    if (accessToken && refreshToken) {
      set({ accessToken, refreshToken });
    }
  },
}));
