import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants/api";

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
  is_banned: boolean;
}

export const customerCareService = {
  getAllCustomerCareRepresentatives: async () => {
    try {
      const response = await axiosInstance.get(
        `companion-admin${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES}`
      );
      console.log("API Response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching customer care representatives:",
        error.message
      );
      return { data: [] };
    }
  },

  findAllPaginated: async (limit?: number, page?: number) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES_PAGINATED}`,
        {
          params: {
            limit,
            page,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching paginated customer care representatives:",
        error.message
      );
      return {
        EC: 1,
        EM: "Error fetching customer care representatives",
        data: { items: [], totalPages: 0, currentPage: 0, totalItems: 0 },
      };
    }
  },

  createCustomerCareRepresentative: async () => {
    try {
      const response = await axiosInstance.post(
        `/companion-admin${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES}`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Error creating customer care representative:",
        error.message
      );
      return { EC: 1, data: null };
    }
  },

  updateCustomerCareRepresentative: async (
    id: string,
    customerCare: Partial<CustomerCare>
  ) => {
    try {
      const response = await axiosInstance.put(
        `${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES}/${id}`,
        customerCare
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Error updating customer care representative:",
        error.message
      );
      return null;
    }
  },

  deleteCustomerCareRepresentative: async (id: string) => {
    try {
      const response = await axiosInstance.delete(
        `${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES}/${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Error deleting customer care representative:",
        error.message
      );
      return null;
    }
  },

  toggleCustomerCareStatus: async (id: string, available_for_work: boolean) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES}/${id}/status`,
        { available_for_work }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error toggling customer care status:", error.message);
      return null;
    }
  },
};

// export const customerCareService = {
//   getAllCustomerCareRepresentatives: async () => {
//     try {
//       const response = await axiosInstance.get(
//         `companion-admin${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES}`
//       );
//       return response.data;
//     } catch (error: any) {
//       console.error(
//         "Error fetching customer care representatives:",
//         error.message
//       );
//       return { data: [] };
//     }
//   },

//   createCustomerCareRepresentative: async () => {
//     try {
//       const response = await axiosInstance.post(
//         `/companion-admin${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES}`
//       );
//       return response.data;
//     } catch (error: any) {
//       console.error(
//         "Error creating customer care representative:",
//         error.message
//       );
//       return { EC: 1, data: null };
//     }
//   },

//   updateCustomerCareRepresentative: async (
//     id: string,
//     customerCare: Partial<CustomerCare>
//   ) => {
//     try {
//       const response = await axiosInstance.put(
//         `${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES}/${id}`,
//         customerCare
//       );
//       return response.data;
//     } catch (error: any) {
//       console.error(
//         "Error updating customer care representative:",
//         error.message
//       );
//       return null;
//     }
//   },

//   deleteCustomerCareRepresentative: async (id: string) => {
//     try {
//       const response = await axiosInstance.delete(
//         `${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES}/${id}`
//       );
//       return response.data;
//     } catch (error: any) {
//       console.error(
//         "Error deleting customer care representative:",
//         error.message
//       );
//       return null;
//     }
//   },

//   toggleCustomerCareStatus: async (id: string, available_for_work: boolean) => {
//     try {
//       const response = await axiosInstance.patch(
//         `${API_ENDPOINTS.CUSTOMER_CARE_REPRESENTATIVES}/${id}/status`,
//         { available_for_work }
//       );
//       return response.data;
//     } catch (error: any) {
//       console.error("Error toggling customer care status:", error.message);
//       return null;
//     }
//   },
// };
