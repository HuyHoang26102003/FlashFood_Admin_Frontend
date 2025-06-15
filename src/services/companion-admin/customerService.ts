import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants/api";

// Define CustomerCare interface
export interface CustomerCare {
  id: string;
  first_name: string;
  last_name: string;
  active_points: number;
  avatar: {
    url: string;
    key: string;
  };
  is_assigned: boolean;
  available_for_work: boolean;
  address: string;
  contact_email: {
    email: string;
  }[];
}

export const customerService = {
  getAllCustomers: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.CUSTOMERS);
      // API might return { data: [customers] } or just [customers]
      const data = response.data;
      return data;
    } catch (error: any) {
      console.error("Error fetching customers:", error.message);
      return [];
    }
  },

  findAllPaginated: async (limit?: number, page?: number) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.CUSTOMERS}/paginated`,
        {
          params: {
            limit,
            page,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching paginated customers:", error.message);
      return {
        EC: 1,
        EM: "Error fetching customers",
        data: { items: [], totalPages: 0, currentPage: 0, totalItems: 0 },
      };
    }
  },

  createCustomer: async () => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.CUSTOMERS, {
        /* customer data */
      });
      return response.data;
    } catch (error: any) {
      console.error("Error creating customer:", error.message);
      return null;
    }
  },
  updateCustomerStatus: async (customerId: string, newStatus: boolean) => {
    try {
      const response = await axiosInstance.put(
        `${API_ENDPOINTS.CUSTOMERS}/${customerId}/status`,
        { isActive: newStatus }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating customer status:", error.message);
      return null;
    }
  },
  getCustomerOrders: async (customerId: string) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.CUSTOMERS}${API_ENDPOINTS.ORDERS}/${customerId}`
      );
      // API might return { data: [customers] } or just [customers]
      const data = response.data;
      return data;
    } catch (error: any) {
      console.error("Error fetching customers:", error.message);
      return [];
    }
  },
  findAllComplaintHistory: async (customerId: string) => {
    const response = await axiosInstance.get(
      `customer-care-inquiries/customer/${customerId}`
    );
    return response.data;
  },
};

// interface ApiResponse<T> {
//   EC: number;
//   EM: string;
//   data: T;
// }
