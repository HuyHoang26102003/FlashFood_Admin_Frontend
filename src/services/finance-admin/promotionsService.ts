import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { Promotion } from "@/app/promotions/page";

export const promotionsService = {
  getAllPromotions: async () => {
    const response = await axiosInstance.get(
      `finance-admin${API_ENDPOINTS.PROMOTIONS}`
    );
    return response.data;
  },

  findAllPaginated: async (limit?: number, page?: number) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.PROMOTIONS}/paginated`,
        {
          params: {
            limit,
            page,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching paginated promotions:", error.message);
      return {
        EC: 1,
        EM: "Error fetching promotions",
        data: { items: [], totalPages: 0, currentPage: 0, totalItems: 0 },
      };
    }
  },

  getDetailPromotion: async (id: string) => {
    const response = await axiosInstance.get(
      `finance-admin${API_ENDPOINTS.PROMOTIONS}/${id}`
    );
    return response.data;
  },

  createPromotion: async (promotion: Omit<Promotion, "id">) => {
    const response = await axiosInstance.post(
      `finance-admin${API_ENDPOINTS.PROMOTIONS}`,
      promotion
    );
    return response.data;
  },

  updatePromotion: async (id: string, promotion: Partial<Promotion>) => {
    const response = await axiosInstance.put(
      `${API_ENDPOINTS.PROMOTIONS}/${id}`,
      promotion
    );
    return response.data;
  },

  // deletePromotion: async (id: string) => {
  //     const response = await axiosInstance.delete(`${API_ENDPOINTS.PROMOTIONS}/${id}`);
  //     return response.data;
  // },

  // togglePromotionStatus: async (id: string, status: 'active' | 'inactive') => {
  //     const response = await axiosInstance.patch(`${API_ENDPOINTS.PROMOTIONS}/${id}/status`, { status });
  //     return response.data;
  // }
};
