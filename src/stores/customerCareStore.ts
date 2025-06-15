import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

// Định nghĩa interface cho Contact Email
interface ContactEmail {
  email: string;
  title: string;
  is_default: boolean;
}

// Định nghĩa interface cho Contact Phone
interface ContactPhone {
  title: string;
  is_default: boolean;
}

// Định nghĩa interface cho dữ liệu Customer Care User
export interface CustomerCareUser {
  email: string;
  accessToken: string;
  user_type: string[];
  first_name: string;
  last_name: string;
  app_preferences: null | Record<string, any>;
  id: string;
  logged_in_as: "CUSTOMER_CARE_REPRESENTATIVE";
  contact_email: ContactEmail[];
  contact_phone: ContactPhone[];
  avatar: null | {
    url: string;
    key: string;
  };
  available_for_work: boolean;
  is_assigned: boolean;
  iat: number;
  exp: number;
}

// Định nghĩa interface cho Customer Care Store
interface CustomerCareState {
  user: CustomerCareUser | null;
  isAuthenticated: boolean;
  setUser: (user: CustomerCareUser) => void;
  logout: () => void;
}

// Tạo store với Zustand
export const useCustomerCareStore = create<CustomerCareState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        setUser: (user: CustomerCareUser) =>
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
        name: "customer-care-storage", // Key riêng cho Customer Care
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "CustomerCareStore" }
  )
);
