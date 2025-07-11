import { io, Socket } from "socket.io-client";
import {
  AdminChatRoom,
  AdminChatMessage,
  AdminChatResponse,
  CreateGroupPayload,
  StartDirectChatPayload,
  SendMessagePayload,
  GetAdminChatsPayload,
  PendingInvitation,
  TypingIndicator,
  GetRoomMessagesPayload,
  RoomMessagesResponse,
  OrderReference,
  AdminChatParticipant,
} from "@/types/admin-chat";

let adminChatSocketInstance: Socket | null = null;

export const createAdminChatSocket = (token: string | null) => {
  if (!token) {
    console.error("No token provided, cannot create admin chat socket");
    throw new Error("Authentication token is required");
  }

  const trimmedToken = token.trim();
  console.log("Creating new admin chat socket with token: Bearer [REDACTED]", {
    tokenLength: trimmedToken.length,
    startsWithEy: trimmedToken.startsWith("eyJ"),
    tokenSnippet: trimmedToken.slice(0, 10) + "...",
  });

  if (adminChatSocketInstance) {
    if (adminChatSocketInstance.connected) {
      console.log("Reusing existing connected admin chat socket");
      return adminChatSocketInstance;
    }
    console.log("Cleaning up disconnected admin chat socket");
    adminChatSocketInstance.disconnect();
    adminChatSocketInstance = null;
  }

  adminChatSocketInstance = io("http://localhost:1310/admin-chat", {
    transports: ["websocket"],
    auth: {
      token: `Bearer ${trimmedToken}`,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  adminChatSocketInstance.on("connect", () => {
    console.log("Admin chat socket connected successfully");
  });

  adminChatSocketInstance.on("connect_error", (error) => {
    console.error("Admin chat socket connection error:", error.message, error);
  });

  adminChatSocketInstance.on("disconnect", (reason) => {
    console.log("Admin chat socket disconnected:", reason);
    if (reason === "io server disconnect") {
      console.error(
        "Server disconnected the admin chat socket. Possible causes: invalid token, missing auth header, or server-side validation failure."
      );
    }
  });

  adminChatSocketInstance.on("error", (error) => {
    console.error("Admin chat server error:", error);
  });

  return adminChatSocketInstance;
};

export const getAdminChatSocket = () => adminChatSocketInstance;

export const adminChatSocket = {
  // Connection events
  onAdminConnected: (
    socket: Socket,
    callback: (data: {
      adminId: string;
      role: string;
      timestamp: string;
    }) => void
  ) => {
    socket.on("adminConnected", callback);
  },

  // Group management
  createAdminGroup: (socket: Socket, payload: CreateGroupPayload) => {
    return new Promise<AdminChatRoom>((resolve, reject) => {
      console.log("Emitting createAdminGroup event", payload);

      socket.emit(
        "createAdminGroup",
        payload,
        (response: AdminChatRoom | { error: string }) => {
          console.log("Received response from createAdminGroup:", response);
          if ("error" in response) {
            console.error(
              "Error in createAdminGroup response:",
              response.error
            );
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  onGroupCreated: (
    socket: Socket,
    callback: (group: AdminChatRoom) => void
  ) => {
    socket.on("groupCreated", callback);
  },

  sendGroupInvitation: (
    socket: Socket,
    payload: {
      groupId: string;
      invitedUserIds: string[];
      message?: string;
      expiresAt?: string;
    }
  ) => {
    return new Promise<{ success: boolean; invitesSent: number }>(
      (resolve, reject) => {
        console.log("Emitting sendGroupInvitation event", payload);

        socket.emit(
          "sendGroupInvitation",
          payload,
          (
            response:
              | { success: boolean; invitesSent: number }
              | { error: string }
          ) => {
            console.log(
              "Received response from sendGroupInvitation:",
              response
            );
            if ("error" in response) {
              console.error(
                "Error in sendGroupInvitation response:",
                response.error
              );
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      }
    );
  },

  respondToInvitation: (
    socket: Socket,
    payload: {
      inviteId: string;
      response: "ACCEPT" | "DECLINE";
      reason?: string;
    }
  ) => {
    return new Promise<{ success: boolean; groupId?: string }>(
      (resolve, reject) => {
        console.log("Emitting respondToInvitation event", payload);

        socket.emit(
          "respondToInvitation",
          payload,
          (
            response: { success: boolean; groupId?: string } | { error: string }
          ) => {
            console.log(
              "Received response from respondToInvitation:",
              response
            );
            if ("error" in response) {
              console.error(
                "Error in respondToInvitation response:",
                response.error
              );
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      }
    );
  },

  getPendingInvitations: (socket: Socket) => {
    console.log("Emitting getPendingInvitations event");
    socket.emit("getPendingInvitations");
  },

  onPendingInvitations: (
    socket: Socket,
    callback: (data: {
      invitations: PendingInvitation[];
      count: number;
      timestamp: string;
    }) => void
  ) => {
    socket.on("pendingInvitations", callback);
  },

  onInvitationsError: (
    socket: Socket,
    callback: (error: { error: string; timestamp: string }) => void
  ) => {
    socket.on("invitationsError", callback);
  },

  // Direct chat
  startDirectChat: (socket: Socket, payload: StartDirectChatPayload) => {
    return new Promise<AdminChatRoom>((resolve, reject) => {
      console.log("Emitting startDirectChat event", payload);

      socket.emit(
        "startDirectChat",
        payload,
        (response: AdminChatRoom | { error: string }) => {
          console.log("Received response from startDirectChat:", response);
          if ("error" in response) {
            console.error("Error in startDirectChat response:", response.error);
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  onDirectChatStarted: (
    socket: Socket,
    callback: (room: AdminChatRoom) => void
  ) => {
    socket.on("directChatStarted", callback);
  },

  // Messaging
  sendMessage: (socket: Socket, payload: SendMessagePayload) => {
    return new Promise<AdminChatMessage>((resolve, reject) => {
      console.log("Emitting sendMessage event", payload);

      socket.emit(
        "sendMessage",
        payload,
        (response: AdminChatMessage | { error: string }) => {
          console.log("Received response from sendMessage:", response);
          if ("error" in response) {
            console.error("Error in sendMessage response:", response.error);
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  onNewMessage: (
    socket: Socket,
    callback: (message: AdminChatMessage) => void
  ) => {
    console.log("Setting up newMessage listener for admin chat");
    socket.on("newMessage", (message: AdminChatMessage) => {
      console.log("Received new admin chat message:", message);
      callback(message);
    });
  },

  onOrderReferenced: (
    socket: Socket,
    callback: (data: {
      message: AdminChatMessage;
      orderDetails: OrderReference;
    }) => void
  ) => {
    socket.on("orderReferenced", callback);
  },

  onUserTagged: (
    socket: Socket,
    callback: (data: { message: AdminChatMessage; taggedUser: string }) => void
  ) => {
    socket.on("userTagged", callback);
  },

  // Chat retrieval
  getAdminChats: (socket: Socket, payload?: GetAdminChatsPayload) => {
    return new Promise<AdminChatResponse>((resolve, reject) => {
      console.log("Emitting getAdminChats event", payload);

      socket.emit(
        "getAdminChats",
        payload || {},
        (response: AdminChatResponse | { error: string }) => {
          console.log("Received response from getAdminChats:", response);
          if ("error" in response) {
            console.error("Error in getAdminChats response:", response.error);
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  // Room management
  joinRoom: (
    socket: Socket,
    payload: { roomId: string; roomType: "ADMIN_DIRECT" | "ADMIN_GROUP" }
  ) => {
    return new Promise<{
      success: boolean;
      room: AdminChatRoom;
    }>((resolve, reject) => {
      console.log("Emitting joinRoom event", payload);

      socket.emit(
        "joinRoom",
        payload,
        (
          response:
            | {
                success: boolean;
                room: AdminChatRoom;
              }
            | { error: string }
        ) => {
          console.log("Received response from joinRoom:", response);
          if ("error" in response) {
            console.error("Error in joinRoom response:", response.error);
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  leaveRoom: (
    socket: Socket,
    payload: { roomId: string; roomType: "ADMIN_DIRECT" | "ADMIN_GROUP" }
  ) => {
    return new Promise<{ success: boolean }>((resolve, reject) => {
      console.log("Emitting leaveRoom event", payload);

      socket.emit(
        "leaveRoom",
        payload,
        (response: { success: boolean } | { error: string }) => {
          console.log("Received response from leaveRoom:", response);
          if ("error" in response) {
            console.error("Error in leaveRoom response:", response.error);
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  onUserJoinedGroup: (
    socket: Socket,
    callback: (data: {
      groupId: string;
      userId: string;
      userName: string;
      userRole: string;
      timestamp: string;
    }) => void
  ) => {
    socket.on("userJoinedGroup", callback);
  },

  onUserLeftGroup: (
    socket: Socket,
    callback: (data: {
      groupId: string;
      userId: string;
      userName: string;
      timestamp: string;
    }) => void
  ) => {
    socket.on("userLeftGroup", callback);
  },

  onGroupLeft: (
    socket: Socket,
    callback: (data: {
      success: boolean;
      groupId: string;
      message: string;
      timestamp: string;
    }) => void
  ) => {
    socket.on("groupLeft", callback);
  },

  // Typing indicators
  typing: (
    socket: Socket,
    payload: { roomId: string; roomType: "ADMIN_DIRECT" | "ADMIN_GROUP" }
  ) => {
    console.log("Emitting typing event", payload);
    socket.emit("typing", payload);
  },

  stopTyping: (
    socket: Socket,
    payload: { roomId: string; roomType: "ADMIN_DIRECT" | "ADMIN_GROUP" }
  ) => {
    console.log("Emitting stopTyping event", payload);
    socket.emit("stopTyping", payload);
  },

  onTyping: (socket: Socket, callback: (data: TypingIndicator) => void) => {
    socket.on("typing", callback);
  },

  onStopTyping: (socket: Socket, callback: (data: TypingIndicator) => void) => {
    socket.on("stopTyping", callback);
  },

  // Message history
  getRoomMessages: (socket: Socket, payload: GetRoomMessagesPayload) => {
    console.log("Emitting getRoomMessages event", payload);
    socket.emit("getRoomMessages", payload);
  },

  onRoomMessages: (
    socket: Socket,
    callback: (data: RoomMessagesResponse) => void
  ) => {
    socket.on("roomMessages", callback);
  },

  onRoomMessagesError: (
    socket: Socket,
    callback: (error: { message: string }) => void
  ) => {
    socket.on("roomMessagesError", callback);
  },
  onInvitationError: (
    socket: Socket,
    callback: (error: { message?: string; error?: string }) => void
  ) => {
    socket.on("invitationError", callback);
  },

  // Real-time invitation events
  onGroupInvitationReceived: (
    socket: Socket,
    callback: (data: {
      inviteIds: string[];
      groupId: string;
      invitedBy: string;
      inviterName: string;
      inviterRole: string;
      message?: string;
      expiresAt?: string;
      timestamp: string;
    }) => void
  ) => {
    socket.on("groupInvitationReceived", callback);
  },

  onInvitationsSent: (
    socket: Socket,
    callback: (data: {
      groupId: string;
      invitedCount: number;
      invitedBy: string;
      inviterName: string;
      timestamp: string;
    }) => void
  ) => {
    socket.on("invitationsSent", callback);
  },

  onJoinedGroup: (
    socket: Socket,
    callback: (data: {
      groupId: string;
      message: string;
      timestamp: string;
    }) => void
  ) => {
    socket.on("joinedGroup", callback);
  },

  onInvitationDeclined: (
    socket: Socket,
    callback: (data: {
      groupId: string;
      declinedBy: string;
      declinedByName: string;
      reason?: string;
      timestamp: string;
    }) => void
  ) => {
    socket.on("invitationDeclined", callback);
  },

  onInvitationResponse: (
    socket: Socket,
    callback: (data: {
      success: boolean;
      response: "ACCEPT" | "DECLINE";
      groupId: string;
      timestamp: string;
    }) => void
  ) => {
    socket.on("invitationResponse", callback);
  },

  onInvitationResponseError: (
    socket: Socket,
    callback: (error: { error: string; timestamp: string }) => void
  ) => {
    socket.on("invitationResponseError", callback);
  },

  onRoomLeft: (
    socket: Socket,
    callback: (data: {
      roomId: string;
      roomType: "ADMIN_DIRECT" | "ADMIN_GROUP";
      timestamp: string;
    }) => void
  ) => {
    socket.on("roomLeft", callback);
  },

  onLeaveRoomError: (
    socket: Socket,
    callback: (error: { error: string; timestamp: string }) => void
  ) => {
    socket.on("leaveRoomError", callback);
  },

  // Read receipts
  markMessageAsRead: (
    socket: Socket,
    payload: { messageId: string; roomId: string }
  ) => {
    console.log("Emitting markMessageAsRead event", payload);
    socket.emit("markMessageAsRead", payload);
  },

  onMessageRead: (
    socket: Socket,
    callback: (data: {
      messageId: string;
      readBy: string;
      roomId: string;
    }) => void
  ) => {
    socket.on("messageRead", callback);
  },

  // Order integration
  getOrderDetails: (socket: Socket, payload: { orderId: string }) => {
    return new Promise<OrderReference>((resolve, reject) => {
      console.log("Emitting getOrderDetails event", payload);

      socket.emit(
        "getOrderDetails",
        payload,
        (response: OrderReference | { error: string }) => {
          console.log("Received response from getOrderDetails:", response);
          if ("error" in response) {
            console.error("Error in getOrderDetails response:", response.error);
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  getChatsByOrderId: (socket: Socket, payload: { orderId: string }) => {
    return new Promise<AdminChatRoom[]>((resolve, reject) => {
      console.log("Emitting getChatsByOrderId event", payload);

      socket.emit(
        "getChatsByOrderId",
        payload,
        (response: AdminChatRoom[] | { error: string }) => {
          console.log("Received response from getChatsByOrderId:", response);
          if ("error" in response) {
            console.error(
              "Error in getChatsByOrderId response:",
              response.error
            );
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  // Utility
  ping: (socket: Socket) => {
    return new Promise<string>((resolve, reject) => {
      console.log("Emitting ping event");

      socket.emit("ping", (response: string | { error: string }) => {
        console.log("Received response from ping:", response);
        if (typeof response === "object" && "error" in response) {
          console.error("Error in ping response:", response.error);
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  },

  onPong: (socket: Socket, callback: (data: string) => void) => {
    socket.on("pong", callback);
  },

  // Group settings
  updateGroupSettings: (
    socket: Socket,
    payload: {
      groupId: string;
      groupName?: string;
      groupDescription?: string;
      groupAvatar?: string;
      allowedRoles?: string[];
      category?: string;
      tags?: string[];
      isPublic?: boolean;
      maxParticipants?: number;
    }
  ) => {
    return new Promise<AdminChatRoom>((resolve, reject) => {
      console.log("Emitting updateGroupSettings event", payload);

      socket.emit(
        "updateGroupSettings",
        payload,
        (response: AdminChatRoom | { error: string }) => {
          console.log("Received response from updateGroupSettings:", response);
          if ("error" in response) {
            console.error(
              "Error in updateGroupSettings response:",
              response.error
            );
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  onGroupSettingsUpdated: (
    socket: Socket,
    callback: (data: {
      groupId: string;
      newSettings: Partial<AdminChatRoom>;
    }) => void
  ) => {
    socket.on("groupSettingsUpdated", callback);
  },

  // Participant management
  manageGroupParticipant: (
    socket: Socket,
    payload: {
      groupId: string;
      participantId: string;
      action: "PROMOTE" | "DEMOTE" | "REMOVE";
      newRole?: "CREATOR" | "ADMIN" | "MEMBER";
      reason?: string;
    }
  ) => {
    return new Promise<{ success: boolean; room: AdminChatRoom }>(
      (resolve, reject) => {
        console.log("Emitting manageGroupParticipant event", payload);

        socket.emit(
          "manageGroupParticipant",
          payload,
          (
            response:
              | { success: boolean; room: AdminChatRoom }
              | { error: string }
          ) => {
            console.log(
              "Received response from manageGroupParticipant:",
              response
            );
            if ("error" in response) {
              console.error(
                "Error in manageGroupParticipant response:",
                response.error
              );
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      }
    );
  },

  onParticipantManaged: (
    socket: Socket,
    callback: (data: {
      room: AdminChatRoom;
      action: string;
      participant: AdminChatParticipant;
    }) => void
  ) => {
    socket.on("participantManaged", callback);
  },
};
