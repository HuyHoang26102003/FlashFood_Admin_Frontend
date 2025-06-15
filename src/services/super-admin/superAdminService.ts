import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants/api";

interface UpdatePermissionsPayload {
  permissions: string[];
  requesterId: string;
}

export const superAdminService = {
  getAllAdmin: async () => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.ADMIN}`);
    return response.data;
  },
  findAdminById: async (id: string) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.ADMIN}/${id}`);
    return response.data;
  },

  updateAdminPermissions: async (
    adminId: string,
    payload: UpdatePermissionsPayload
  ) => {
    const response = await axiosInstance.patch(
      `${API_ENDPOINTS.ADMIN}/permissions/${adminId}`,
      payload
    );
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
