import { create } from "zustand";

interface AuthState {
  token: string | null;
  wallet: string | null;
  setAuth: (token: string, wallet: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("qadam_token") : null,
  wallet: typeof window !== "undefined" ? localStorage.getItem("qadam_wallet") : null,

  setAuth: (token, wallet) => {
    localStorage.setItem("qadam_token", token);
    localStorage.setItem("qadam_wallet", wallet);
    set({ token, wallet });
  },

  clearAuth: () => {
    localStorage.removeItem("qadam_token");
    localStorage.removeItem("qadam_wallet");
    set({ token: null, wallet: null });
  },

  isAuthenticated: () => get().token !== null,
}));
