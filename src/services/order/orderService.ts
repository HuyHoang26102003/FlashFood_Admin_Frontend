import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants/api";

export const orderService = {
  getAllOrders: async () => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.ORDERS}`);
    return response.data;
  },

  findAllPaginated: async (limit?: number, page?: number) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ORDERS}/paginated`,
        {
          params: {
            limit,
            page,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching paginated orders:", error.message);
      return {
        EC: 1,
        EM: "Error fetching orders",
        data: { items: [], totalPages: 0, currentPage: 0, totalItems: 0 },
      };
    }
  },

  findOrderById: async (id: string) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.ORDERS}/${id}`);
    return response.data;
  },

  //   createPromotion: async (promotion: Omit<Promotion, "id">) => {
  //     const response = await axiosInstance.post(
  //       `customer-care${API_ENDPOINTS.PROMOTIONS}`,
  //       promotion
  //     );
  //     return response.data;
  //   },

  // updateInquiry: async (id: string, reqBody: Partial<any>) => {
  //   const response = await axiosInstance.patch(
  //     `${API_ENDPOINTS.CUSTOMER_CARE_INQUIRIES}/${id}`,
  //     reqBody
  //   );
  //   return response.data;
  // },
};
