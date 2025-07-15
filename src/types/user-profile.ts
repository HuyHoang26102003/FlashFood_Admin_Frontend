import { Avatar } from "./common";

export interface ContactEmail {
    email: string;
    title: string;
    is_default: boolean;
}

export interface ContactPhone {
    title: string;
    number?: string;
    is_default: boolean;
}

export interface CustomerCareProfile {
    id: string;
    contact_email: ContactEmail[];
    contact_phone: ContactPhone[];
    first_name: string;
    last_name: string;
    created_at: string;
    updated_at: string;
    last_login: string;
    avatar: Avatar;
    available_for_work: boolean;
    is_assigned: boolean;
    active_point: number;
    active_workload: number;
    is_banned: boolean;
}

export interface AdminProfile {
    id: string;
    user_id: string;
    role: string;
    avatar: null | Avatar;
    last_login: null | string;
    permissions: string[];
    first_name: string;
    last_name: string;
    status: string;
    user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        avatar: null | Avatar;
    };
}

export type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  user_email: string;
  avatar: {
    key: string;
    url: string;
  };
}; 