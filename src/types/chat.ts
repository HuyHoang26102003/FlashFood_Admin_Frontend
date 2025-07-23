import { Avatar } from "./common";

export interface CustomerSender {
  id: string;
  first_name: string;
  last_name: string;
  avatar: Avatar | null;
}

export interface DriverSender {
  id: string;
  first_name: string;
  last_name: string;
  avatar: Avatar | null;
}

export interface RestaurantSender {
  id: string;
  restaurant_name: string;
  avatar: Avatar | null;
}

export interface CustomerCareSender {
  id: string;
  first_name: string;
  last_name: string;
  avatar: Avatar | null;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderType: string;
  content: string;
  messageType: string;
  timestamp: string;
  readBy: string[];
  customerSender: CustomerSender | null;
  driverSender: DriverSender | null;
  restaurantSender: RestaurantSender | null;
  customerCareSender: CustomerCareSender | null;
  sender:
    | CustomerSender
    | DriverSender
    | RestaurantSender
    | CustomerCareSender
    | null;
  messages?: Message[];
}

export interface ChatRoom {
  roomId: string;
  type: string;
  otherParticipant: {
    userId: string;
    userType: string;
  };
  lastMessage: Message;
  lastActivity: string;
  relatedId: string | null;
  messages?: Message[];
}

export interface ChatResponse {
  ongoing: ChatRoom[];
  awaiting: ChatRoom[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderType: string;
  content: string;
  messageType: string;
  timestamp: string;
  readBy: string[];
  customerSender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: { key: string; url: string } | null;
    phone: string;
  } | null;
  driverSender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: { key: string; url: string } | null;
    contact_email: string | string[];
    contact_phone: string | { is_default: boolean; number: string }[];
  } | null;
  restaurantSender?: {
    id: string;
    restaurant_name: string;
    avatar?: { key: string; url: string } | null;
    contact_email: string | string[];
    contact_phone: string | { is_default: boolean; number: string }[];
  } | null;
  customerCareSender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: { key: string; url: string } | null;
    contact_phone: string | { is_default: boolean; number: string }[];
  } | null;
}

// ============ SUPPORT CHAT TYPES ============

export interface SupportSession {
  sessionId: string;
  userId: string;
  userType: string;
  chatMode: "bot" | "human";
  status: "active" | "waiting" | "assigned" | "ended";
  priority: "low" | "medium" | "high" | "urgent";
  category?: string;
  agentId?: string;
  startTime: string;
  lastActivity: string;
  slaDeadline?: string;
  transferHistory?: TransferRecord[];
  customerProfile?: CustomerProfile;
  metadata?: Record<string, any>;
}

export interface SupportMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderType:
    | "CUSTOMER_CARE_REPRESENTATIVE"
    | "CUSTOMER"
    | "DRIVER"
    | "RESTAURANT_OWNER"
    | "BOT"
    | "ADMIN";
  content: string;
  messageType: "text" | "image" | "voice" | "file";
  timestamp: string;
  metadata?: Record<string, any>;
  sender?: string;
  agentName?: string;
  options?: Array<{ text: string; value: string }>;
  quickReplies?: string[];
  cards?: Array<{
    title: string;
    description?: string;
    image?: string;
    actions?: Array<{ text: string; value: string }>;
  }>;
  formFields?: Array<{
    name: string;
    label: string;
    type: "text" | "number" | "email" | "select";
    required?: boolean;
    options?: string[];
  }>;
  followUpPrompt?: string;
  suggestedActions?: string[];
  confidence?: number;
  queueInfo?: {
    position: number;
    estimatedWaitTime: number;
  };
  isTemporary?: boolean;
}

export interface AgentProfile {
  id: string;
  name: string;
  email: string;
  skills: string[];
  languages: string[];
  maxSessions: number;
  specializations: string[];
  tier: "tier1" | "tier2" | "tier3" | "supervisor";
  avatar?: string;
  contactInfo?: {
    phone?: string;
    extension?: string;
  };
}

export interface AgentMetrics {
  agentId: string;
  status: "available" | "unavailable" | "busy";
  activeSessions: number;
  totalSessionsToday: number;
  totalSessionsWeek: number;
  totalSessionsMonth: number;
  averageResponseTime: number; // in seconds
  averageSessionDuration: number; // in seconds
  customerSatisfactionRating: number; // 1-5 scale
  totalRatings: number;
  escalationRate: number; // percentage
  resolutionRate: number; // percentage
  lastActivity: string;
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface CustomerProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  userType: string;
  avatar?: string;
  previousSessions?: number;
  satisfactionRating?: number;
  isVip?: boolean;
  preferredLanguage?: string;
  accountCreated?: string;
  lastOrderDate?: string;
  totalOrders?: number;
  notes?: string[];
}

export interface TransferRecord {
  fromAgentId: string;
  toAgentId: string;
  reason: string;
  timestamp: string;
  transferType: "manual" | "automatic" | "escalation";
}

export interface QueueStatus {
  sessionId: string;
  position: number;
  estimatedWait: number; // in minutes
  priority: "low" | "medium" | "high" | "urgent";
  waitingSince: string;
  category?: string;
}

export interface SupportMetrics {
  totalActiveSessions: number;
  totalWaitingCustomers: number;
  averageWaitTime: number; // in minutes
  averageResponseTime: number; // in seconds
  customerSatisfactionAverage: number;
  agentsOnline: number;
  agentsAvailable: number;
  agentsBusy: number;
  escalationRate: number; // percentage
  resolutionRate: number; // percentage
  slaViolations: number;
  peakHours: Array<{
    hour: number;
    sessionCount: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
}

export interface ChatbotResponse {
  message: string;
  type: "text" | "options" | "cards" | "form" | "transfer";
  options?: Array<{ text: string; value: string }>;
  quickReplies?: string[];
  cards?: Array<{
    title: string;
    description?: string;
    image?: string;
    actions?: Array<{ text: string; value: string }>;
  }>;
  formFields?: Array<{
    name: string;
    label: string;
    type: "text" | "number" | "email" | "select";
    required?: boolean;
    options?: string[];
  }>;
  followUpPrompt?: string;
  suggestedActions?: string[];
  confidence?: number;
  requiresHuman?: boolean;
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
}

export interface SupportSessionRequest {
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  metadata?: Record<string, any>;
  initialMessage?: string;
  customerInfo?: Partial<CustomerProfile>;
}

export interface AgentRegistrationData {
  skills: string[];
  languages?: string[];
  maxSessions?: number;
  specializations?: string[];
  tier?: "tier1" | "tier2" | "tier3" | "supervisor";
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  contactInfo?: {
    phone?: string;
    extension?: string;
  };
}

export interface SupportTicket {
  id: string;
  sessionId?: string;
  customerId: string;
  subject: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in-progress" | "resolved" | "closed";
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
  customerSatisfaction?: number;
  tags: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}
