import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { Avatar } from "@/types/common";

// Define Restaurant interface
export interface Restaurant {
  id: string;
  restaurant_name: string;
  address: { city: string; street: string; nationality: string };
  avatar: Avatar;
  cuisine: string;
  rating?: number;
  isActive: boolean;
  is_banned: boolean;
}

// interface MenuItem {
//   id: string;
//   restaurant_id: string;
//   name: string;
//   description: string;
//   price: string;
//   category: string[];
//   avatar: {
//     key: string;
//     url: string;
//   };
//   availability: boolean;
//   suggest_notes: string[];
//   discount: string | null;
//   purchase_count: number;
//   created_at: number;
//   updated_at: number;
//   variants: {
//     id: string;
//     menu_id: string;
//     variant: string;
//     description: string;
//     avatar: {
//       key: string;
//       url: string;
//     };
//     availability: boolean;
//     default_restaurant_notes: string[];
//     price: string;
//     discount_rate: string;
//     created_at: number;
//     updated_at: number;
//   }[];
// }

export const restaurantService = {
  getAllRestaurants: async () => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.RESTAURANTS}`);
    return response.data;
  },
  findAllPaginated: async (limit?: number, page?: number) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.RESTAURANTS}/paginated`,
        {
          params: {
            limit,
            page,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching paginated restaurants:", error.message);
      return {
        EC: 1,
        EM: "Error fetching restaurants",
        data: { items: [], totalPages: 0, currentPage: 0, totalItems: 0 },
      };
    }
  },

  createRestaurant: async () => {
    const response = await axiosInstance.post(
      `/companion-admin${API_ENDPOINTS.RESTAURANTS}`
    );
    return response.data;
  },

  updateRestaurant: async (id: string, restaurant: Partial<Restaurant>) => {
    const response = await axiosInstance.put(
      `${API_ENDPOINTS.RESTAURANTS}/${id}`,
      restaurant
    );
    return response.data;
  },

  deleteRestaurant: async (id: string) => {
    const response = await axiosInstance.delete(
      `${API_ENDPOINTS.RESTAURANTS}/${id}`
    );
    return response.data;
  },

  toggleRestaurantStatus: async (id: string, isActive: boolean) => {
    const response = await axiosInstance.patch(
      `${API_ENDPOINTS.RESTAURANTS}/${id}/status`,
      { isActive }
    );
    return response.data;
  },

  getMenuItems: async (restaurantId: string) => {
    const response = await axiosInstance.get(
      `${API_ENDPOINTS.RESTAURANTS}/menu-items/${restaurantId}`
    );
    return response.data;
  },
};
