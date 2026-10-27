import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { AdminUser } from "../types";

interface AdminStore {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  theme: "light" | "dark";
  setSession: (user: AdminUser, token: string) => void;
  setUser: (user: AdminUser) => void;
  toggleTheme: () => void;
  logout: () => void;
}

export const STORE_KEY = "waka-admin";

export const useStore = create<AdminStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        theme: "light",
        setSession: (user, token) => set({ user, token, isAuthenticated: true }),
        setUser: (user) => set({ user }),
        toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
        logout: () => set({ user: null, token: null, isAuthenticated: false }),
      }),
      { name: STORE_KEY },
    ),
  ),
);
