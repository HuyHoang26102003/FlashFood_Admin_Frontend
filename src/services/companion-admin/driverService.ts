import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants/api";
// import { Customer } from "@/app/customers/page";

export interface Driver {
  id: string;
  first_name: string;
  active_points: number;
  last_name: string;
  rating: { review_count: number; average_rating: number };
  avatar: {
    url: string;
    key: string;
  };
  vehicle: {
    color: string;
    model: string;
    license_plate: string;
  };
  available_for_work: boolean;
  address: string;
  contact_email: {
    email: string;
  }[];
  is_banned: boolean;
}

export interface DriverOrder {
  id: string;
  customer_id: string;
  restaurant_id: string;
  driver_id: string;
  distance: string;
  status: string;
  total_amount: string;
  delivery_fee: string;
  payment_status: string;
  payment_method: string;
  customer_location: string;
  restaurant_location: string;
  order_items: {
    name: string;
    item_id: string;
    quantity: number;
    variant_id: string;
    price_at_time_of_order: number;
    menu_item: {
      id: string;
      name: string;
      price: string;
      avatar: {
        key: string;
        url: string;
      };
      restaurant: {
        id: string;
        address_id: string;
        restaurant_name: string;
        avatar: {
          key: string;
          url: string;
        } | null;
      };
    };
  }[];
  customer_note: string;
  restaurant_note: string;
  order_time: string;
  delivery_time: string;
  tracking_info: string;
  updated_at: number;
  cancelled_by: string | null;
  cancelled_by_id: string | null;
  cancellation_reason: string | null;
  cancellation_title: string | null;
  cancellation_description: string | null;
  cancelled_at: string | null;
  restaurant: {
    id: string;
    address_id: string;
    restaurant_name: string;
    avatar: {
      key: string;
      url: string;
    } | null;
    specialize_in: string[];
  };
  customer: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar: {
      key: string;
      url: string;
    };
  };
  restaurantAddress: {
    id: string;
    street: string;
    city: string;
    nationality: string;
    is_default: boolean;
    created_at: number;
    updated_at: number;
    postal_code: number;
    location: {
      lat: number;
      lng: number;
    };
    title: string;
  };
  customerAddress: {
    id: string;
    street: string;
    city: string;
    nationality: string;
    is_default: boolean;
    created_at: number;
    updated_at: number;
    postal_code: number;
    location: {
      lat: number;
      lng: number;
    };
    title: string;
  };
  customer_address: {
    id: string;
    street: string;
    city: string;
    nationality: string;
    is_default: boolean;
    created_at: number;
    updated_at: number;
    postal_code: number;
    location: {
      lat: number;
      lng: number;
    };
    title: string;
  };
  restaurant_address: {
    id: string;
    street: string;
    city: string;
    nationality: string;
    is_default: boolean;
    created_at: number;
    updated_at: number;
    postal_code: number;
    location: {
      lat: number;
      lng: number;
    };
    title: string;
  };
}

export const driverService = {
  getAllDrivers: async () => {
    const response = await axiosInstance.get(
      `companion-admin${API_ENDPOINTS.DRIVERS}`
    );
    return response.data;
  },

  findAllPaginated: async (limit?: number, page?: number) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.DRIVERS}/paginated`,
        {
          params: {
            limit,
            page,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching paginated drivers:", error.message);
      return {
        EC: 1,
        EM: "Error fetching drivers",
        data: { items: [], totalPages: 0, currentPage: 0, totalItems: 0 },
      };
    }
  },

  createDriver: async () => {
    const response = await axiosInstance.post(
      `companion-admin${API_ENDPOINTS.DRIVERS}`
    );
    return response.data;
  },

  getDriverOrders: async (driverId: string) => {
    const response = await axiosInstance.get(
      `${API_ENDPOINTS.DRIVERS}/orders/${driverId}`
    );
    return response.data;
  },

  updateDriverStatus: async (driverId: string, isBanned: boolean) => {
    const response = await axiosInstance.patch(
      `${API_ENDPOINTS.DRIVERS}/${driverId}/status`,
      { is_banned: isBanned }
    );
    return response.data;
  },

  // updatePromotion: async (id: string, promotion: Partial<Promotion>) => {
  //     const response = await axiosInstance.put(`${API_ENDPOINTS.PROMOTIONS}/${id}`, promotion);
  //     return response.data;
  // },

  // deletePromotion: async (id: string) => {
  //     const response = await axiosInstance.delete(`${API_ENDPOINTS.PROMOTIONS}/${id}`);
  //     return response.data;
  // },

  // togglePromotionStatus: async (id: string, status: 'active' | 'inactive') => {
  //     const response = await axiosInstance.patch(`${API_ENDPOINTS.PROMOTIONS}/${id}/status`, { status });
  //     return response.data;
  // }
};
