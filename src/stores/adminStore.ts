import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

// Định nghĩa interface cho dữ liệu Admin User
export interface AdminUser {
  email: string;
  user_type: string[];
  first_name: string;
  accessToken: string;
  last_name: string;
  avatar?: {
    url: string;
    key: string;
  } | null; // Cập nhật để phù hợp với response
  app_preferences: null | Record<string, any>;
  id: string;
  logged_in_as:
    | "SUPER_ADMIN"
    | "COMPANION_ADMIN"
    | "FINANCE_ADMIN"
    | "CUSTOMER_CARE_REPRESENTATIVE"; // Giữ các vai trò hiện tại
  role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER_CARE_REPRESENTATIVE";
  permissions: string[];
  last_active: string | null;
  created_at: string;
  updated_at: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  iat: number;
  exp: number;
}

// Định nghĩa interface cho Admin Store
interface AdminState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  setUser: (user: AdminUser) => void;
  logout: () => void;
}

// Tạo store với Zustand
export const useAdminStore = create<AdminState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        setUser: (user: AdminUser) =>
          set({
            user,
            isAuthenticated: true,
          }),
        logout: () =>
          set({
            user: null,
            isAuthenticated: false,
          }),
      }),
      {
        name: "admin-storage", // Đổi tên key để tránh xung đột với store mới
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "AdminStore" }
  )
);
