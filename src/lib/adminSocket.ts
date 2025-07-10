import { io, Socket } from "socket.io-client";
import { API_IP, API_PORT } from "@/constants/links";

export interface NewlyCreatedEntityPayload {
  entity_name: string;
  entity_email?: string;
  timestamp: number;
  message: string;
  event_type: string;
}
let adminSocketInstance: Socket | null = null;

export const createAdminSocket = (token: string | null) => {
  if (!token) {
    console.error("No token provided, cannot create admin socket");
    throw new Error("Authentication token is required for admin socket");
  }

  const trimmedToken = token.trim();
  console.log("Creating new admin socket with token: Bearer [REDACTED]", {
    tokenLength: trimmedToken.length,
    startsWithEy: trimmedToken.startsWith("eyJ"),
    tokenSnippet: trimmedToken.slice(0, 10) + "...",
  });

  if (adminSocketInstance) {
    if (adminSocketInstance.connected) {
      console.log("Reusing existing connected admin socket");
      return adminSocketInstance;
    }
    console.log("Cleaning up disconnected admin socket");
    adminSocketInstance.disconnect();
    adminSocketInstance = null;
  }

  // Connect to the admin namespace - Clean auth object approach
  adminSocketInstance = io(`${API_IP}:${API_PORT}/admin`, {
    transports: ["websocket"], // Match server config
    auth: {
      token: `Bearer ${trimmedToken}`, // Server will read from handshake.auth.token
    },
    forceNew: true, // Force new connection to avoid cache issues
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  adminSocketInstance.on("connect", () => {
    console.log("✅ Admin socket connected successfully");
    console.log("🔍 Socket connected with ID:", adminSocketInstance?.id);
    console.log("🔍 Auth token being sent:", {
      hasToken: !!trimmedToken,
      tokenStart: trimmedToken.substring(0, 20) + "...",
      authObject: { token: `Bearer ${trimmedToken}`.substring(0, 30) + "..." },
    });

    // Auto-join admin_global room
    adminSocketInstance?.emit(
      "joinAdminRoom",
      { room: "admin_global" },
      (response: { success: boolean }) => {
        if (response?.success) {
          console.log("✅ Successfully joined admin_global room");
        } else {
          console.error("❌ Failed to join admin_global room:", response);
        }
      }
    );
  });

  adminSocketInstance.on("connect_error", (error) => {
    console.error("❌ Admin socket connection error:", error.message, error);
    console.error("🔍 Full error object:", error);
  });

  adminSocketInstance.on("disconnect", (reason) => {
    console.log("❌ Admin socket disconnected:", reason);
    if (reason === "io server disconnect") {
      console.error(
        "Server disconnected the admin socket. Possible causes: invalid token, missing auth header, or server-side validation failure."
      );
    }
  });

  adminSocketInstance.on("error", (error) => {
    console.error("❌ Admin socket server error:", error);
  });

  // Listen for newly created entity notifications - but don't show toasts here
  // Let components handle their own notifications to avoid duplicates
  adminSocketInstance.on(
    "newly_created_entity_notification",
    (data: NewlyCreatedEntityPayload) => {
      console.log("📊 Received entity notification:", data.entity_name, data);
    }
  );

  return adminSocketInstance;
};

export const getAdminSocket = () => adminSocketInstance;

export const disconnectAdminSocket = () => {
  if (adminSocketInstance) {
    console.log("🔌 Disconnecting admin socket");
    adminSocketInstance.disconnect();
    adminSocketInstance = null;
  }
};

export const adminSocket = {
  onNewlyCreatedEntity: (callback: (data: NewlyCreatedEntityPayload) => void) => {
    if (adminSocketInstance) {
      adminSocketInstance.on("newly_created_entity_notification", callback);
    }
  },

  offNewlyCreatedEntity: (
    callback?: (data: NewlyCreatedEntityPayload) => void
  ) => {
    if (adminSocketInstance) {
      if (callback) {
        adminSocketInstance.off("newly_created_entity_notification", callback);
      } else {
        adminSocketInstance.off("newly_created_entity_notification");
      }
    }
  },
};
