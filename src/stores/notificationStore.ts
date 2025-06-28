import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

// Notification preferences interface
export interface NotificationPreferences {
  orders: boolean;
  restaurants: boolean;
  customers: boolean;
  drivers: boolean;
  customerCare: boolean;
  customerCareInquiries: boolean;
}

// Notification store interface
interface NotificationState {
  preferences: NotificationPreferences;
  setPreferences: (preferences: NotificationPreferences) => void;
  updatePreference: (
    key: keyof NotificationPreferences,
    value: boolean
  ) => void;
  resetToDefaults: () => void;
}

// Default notification preferences (all enabled by default)
const defaultPreferences: NotificationPreferences = {
  orders: true,
  restaurants: true,
  customers: true,
  drivers: true,
  customerCare: true,
  customerCareInquiries: true,
};

// Create notification store with Zustand
export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        preferences: defaultPreferences,
        setPreferences: (preferences: NotificationPreferences) =>
          set({ preferences }),
        updatePreference: (
          key: keyof NotificationPreferences,
          value: boolean
        ) =>
          set((state) => ({
            preferences: {
              ...state.preferences,
              [key]: value,
            },
          })),
        resetToDefaults: () => set({ preferences: defaultPreferences }),
      }),
      {
        name: "notification-preferences-storage",
        partialize: (state) => ({
          preferences: state.preferences,
        }),
      }
    ),
    { name: "NotificationStore" }
  )
);
