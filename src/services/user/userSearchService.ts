import axiosInstance from "@/lib/axios";

export interface UserSearchResult {
  id: string;
  type: "customer_care" | "admin" | "customer" | "driver" | "restaurant";
  first_name: string;
  last_name: string;
  owner_name?: string;
  restaurant_name?:string;
  avatar: {
    key: string;
    url: string;
  } | null;
  email?: string;
  user_email?: string;
  created_at: string | null;
  last_login: string | null;
}

export interface UserSearchResponse {
  EC: number;
  EM: string;
  data: {
    results: UserSearchResult[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  };
}

export const userSearchService = {
  searchUsers: async (query: string, userType?: 'customer' | 'driver' | 'restaurant' | 'customer_care' | 'admin'): Promise<UserSearchResponse> => {
    const response = await axiosInstance.get(`/users/search?q=${encodeURIComponent(query)}&user_type=${userType}`);
    return response.data;
  },
}; 