export interface AdminChatRoom {
  id: string;
  type: "ADMIN_DIRECT" | "ADMIN_GROUP";
  participants: AdminChatParticipant[];
  relatedId?: string;
  groupName?: string;
  groupDescription?: string;
  groupAvatar?: string;
  createdBy?: string;
  maxParticipants: number;
  pendingInvitations: PendingInvitation[];
  isPublic: boolean;
  allowedRoles: string[];
  category?: string;
  tags: string[];
  referencedOrders: string[];
  createdAt: Date;
  lastActivity: Date;
  updatedAt: Date;
  messages?: AdminChatMessage[];
  lastMessage?: AdminChatMessage;
  unreadCount?: number;
}

export interface AdminChatParticipant {
  userId: string;
  userType:
    | "SUPER_ADMIN"
    | "FINANCE_ADMIN"
    | "COMPANION_ADMIN"
    | "CUSTOMER_CARE_REPRESENTATIVE"
    | "ADMIN";
  role?: "CREATOR" | "ADMIN" | "MEMBER";
  joinedAt: Date;
  invitedBy?: string;
  name?: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface AdminChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderType:
    | "SUPER_ADMIN"
    | "FINANCE_ADMIN"
    | "COMPANION_ADMIN"
    | "CUSTOMER_CARE_REPRESENTATIVE"
    | "ADMIN";
  content: string;
  messageType: MessageType;
  orderReference?: OrderReference;
  groupInvitationData?: GroupInvitationData;
  systemMessageData?: SystemMessageData;
  fileAttachment?: FileAttachment;
  replyToMessageId?: string;
  replyToMessage?: AdminChatMessage;
  reactions: Record<string, string[]>;
  isEdited: boolean;
  editedAt?: Date;
  priority?: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  readBy: string[];
  senderInfo?: {
    name: string;
    avatar?: string;
    role: string;
  };
  senderDetails?: {
    id: string;
    name: string;
    avatar: {
      key: string;
      url: string;
    } | null;
    role: string;
  };
  replyToMessageDetails?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    messageType: MessageType;
  };
  taggedUsers?: string[];
  taggedUsersDetails?: TaggedUserDetail[];
}

export interface TaggedUserDetail {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  type: string;
}

export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  ORDER_INFO = "ORDER_INFO",
  ORDER_REFERENCE = "ORDER_REFERENCE",
  GROUP_INVITATION = "GROUP_INVITATION",
  SYSTEM_MESSAGE = "SYSTEM_MESSAGE",
  ADMIN_NOTIFICATION = "ADMIN_NOTIFICATION",
  FILE = "FILE",
  VOICE = "VOICE",
  LOCATION = "LOCATION",
  CONTACT = "CONTACT",
}

export interface OrderReference {
  orderId: string;
  orderStatus?: string;
  customerName?: string;
  restaurantName?: string;
  totalAmount?: number;
  issueDescription?: string;
  urgencyLevel?: "low" | "medium" | "high" | "critical";
}

export interface GroupInvitationData {
  inviteId: string;
  groupId: string;
  groupName: string;
  invitedBy: string;
  inviterName: string;
  expiresAt: Date;
  message?: string;
}

export interface SystemMessageData {
  type:
    | "USER_JOINED"
    | "USER_LEFT"
    | "USER_PROMOTED"
    | "USER_DEMOTED"
    | "GROUP_CREATED"
    | "GROUP_RENAMED"
    | "ORDER_ESCALATED";
  userId?: string;
  userName?: string;
  additionalInfo?: Record<string, unknown>;
}

export interface FileAttachment {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string;
}

export interface PendingInvitation {
  id: string;
  group: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    name: string;
  };
  message?: string;
  expiresAt: string;
}

// Socket event payloads
export interface CreateGroupPayload {
  groupName: string;
  groupDescription?: string;
  groupAvatar?: string;
  initialParticipants?: string[];
  allowedRoles?: string[];
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  maxParticipants?: number;
}

export interface StartDirectChatPayload {
  withAdminId: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "critical";
  initialOrderReference?: {
    orderId: string;
    issueDescription?: string;
    urgencyLevel?: "low" | "medium" | "high" | "critical";
  };
}

export interface SendMessagePayload {
  roomId: string;
  content: string;
  messageType?: MessageType;
  orderReference?: OrderReference;
  priority?: "low" | "medium" | "high" | "critical";
  replyToMessageId?: string;
  fileAttachment?: FileAttachment;
  taggedUsers?: string[];
}

export interface GetAdminChatsPayload {
  query?: string;
  category?: string;
  tags?: string[];
  roomType?: "ADMIN_DIRECT" | "ADMIN_GROUP";
  orderId?: string;
  limit?: number;
  offset?: number;
}

export interface AdminChatResponse {
  chats: AdminChatRoom[];
  total: number;
  hasMore: boolean;
}

export interface TypingIndicator {
  roomId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface GetRoomMessagesPayload {
  roomId: string;
  limit?: number;
  offset?: number;
  beforeMessageId?: string;
}

export interface RoomMessagesResponse {
  roomId: string;
  messages: AdminChatMessage[];
  hasMore: boolean;
  total: number;
  pagination: {
    limit: number;
    offset: number;
    beforeMessageId: string | null;
  };
  timestamp: string;
}
