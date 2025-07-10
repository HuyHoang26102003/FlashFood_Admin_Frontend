
import { Avatar } from "./common";

export interface Address {
  id: string;
  street: string;
  city: string;
  postal_code: number;
  location: {
    lat: number;
    lng: number;
  };
  title: string;
}

export interface OrderItem {
  name: string;
  item_id: string;
  quantity: number;
  variant_id: string;
  price_at_time_of_order: string;
  item: {
    id: string;
    restaurant_id: string;
    name: string;
    price: string;
    avatar: Avatar;
  };
}

export interface Restaurant {
  id: string;
  restaurant_name: string;
  avatar: Avatar;
  status: {
    is_open: boolean;
    is_active: boolean;
    is_accepted_orders: boolean;
  };
}

export interface Driver {
    id: string;
    first_name: string;
    last_name: string;
    avatar: Avatar;
}

export interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    avatar: Avatar;
}

export interface OrderDetail {
  id: string;
  status: string;
  total_amount: string;
  delivery_fee: string;
  service_fee: string;
  payment_status: string;
  payment_method: string;
  order_items: OrderItem[];
  order_time: string;
  delivery_time: string | null;
  restaurant: Restaurant;
  driver: Driver;
  customer: Customer;
  restaurantAddress: Address;
  customerAddress: Address;
} 