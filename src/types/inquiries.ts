import { Avatar } from "./common";

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  avatar: Avatar;
}

export interface Inquiry {
  id: string;
  customer_id: string;
  assignee_type: string;
  subject: string;
  description: string;
  issue_type:
    | "ACCOUNT"
    | "PAYMENT"
    | "PRODUCT"
    | "DELIVERY"
    | "REFUND"
    | "TECHNICAL"
    | "OTHER";
  status: ENUM_INQUIRY_STATUS;
  priority: ENUM_INQUIRY_PRIORITY;
  resolution_type:
    | "REFUND"
    | "REPLACEMENT"
    | "INVESTIGATING"
    | "ACCOUNT_FIX"
    | "TECHNICAL_SUPPORT"
    | "OTHER"
    | null;
  resolution_notes: string | null;
  created_at: number;
  updated_at: number;
  resolved_at: number | null;

  // History tracking fields
  escalation_history: Array<{
    customer_care_id: string;
    reason: string;
    timestamp: number;
    escalated_to: "ADMIN" | "CUSTOMER_CARE";
    escalated_to_id: string;
  }>;
  rejection_history: Array<{
    customer_care_id: string;
    reason: string;
    timestamp: number;
  }>;
  transfer_history: Array<{
    from_customer_care_id: string;
    to_customer_care_id: string;
    reason: string;
    timestamp: number;
  }>;

  // Counter fields
  escalation_count: number;
  rejection_count: number;
  transfer_count: number;

  // Performance metrics
  response_time: number;
  resolution_time: number;
  first_response_at: number | null;
  last_response_at: number | null;

  // Relations
  customer: Customer;
  order: any | null;
  assigned_admin: any | null;
  assigned_customer_care: any | null;
}

export enum ENUM_INQUIRY_ISSUE_TYPE {
  ACCOUNT = "ACCOUNT",
  PAYMENT = "PAYMENT",
  PRODUCT = "PRODUCT",
  DELIVERY = "DELIVERY",
  REFUND = "REFUND",
  TECHNICAL = "TECHNICAL",
  OTHER = "OTHER",
}

export enum ENUM_INQUIRY_RESOLUTION_TYPE {
  REFUND = "REFUND",
  REPLACEMENT = "REPLACEMENT",
  INVESTIGATING = "INVESTIGATING",
  ACCOUNT_FIX = "ACCOUNT_FIX",
  TECHNICAL_SUPPORT = "TECHNICAL_SUPPORT",
  OTHER = "OTHER",
}

export enum ENUM_INQUIRY_STATUS {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  ESCALATE = "ESCALATE",
}
export enum ENUM_INQUIRY_PRIORITY {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}
