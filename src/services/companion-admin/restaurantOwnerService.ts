import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants/api";

export interface RestaurantOwner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  avatar: {
    url: string;
    key: string;
  };
  restaurant: {
    id: string;
    name: string;
    address: string;
  };
}

export const restaurantOwnerService = {
  getAllRestaurantOwners: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RESTAURANT_OWNERS);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching restaurant owners:", error.message);
      return { data: [] };
    }
  },

  findAllPaginated: async (limit?: number, page?: number) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.RESTAURANT_OWNERS}/paginated`,
        {
          params: {
            limit,
            page,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching paginated restaurant owners:", error.message);
      return {
        EC: 1,
        EM: "Error fetching restaurant owners",
        data: { items: [], totalPages: 0, currentPage: 0, totalItems: 0 },
      };
    }
  },

  createRestaurantOwner: async () => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RESTAURANT_OWNERS);
      return response.data;
    } catch (error: any) {
      console.error("Error creating restaurant owner:", error.message);
      return { EC: 1, data: null };
    }
  },

  updateRestaurantOwnerStatus: async (ownerId: string, newStatus: boolean) => {
    try {
      const response = await axiosInstance.put(
        `${API_ENDPOINTS.RESTAURANT_OWNERS}/${ownerId}/status`,
        { isActive: newStatus }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating restaurant owner status:", error.message);
      return null;
    }
  }
}; 