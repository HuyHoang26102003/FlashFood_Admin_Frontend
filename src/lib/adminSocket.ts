import { io, Socket } from "socket.io-client";
import { toast } from "@/hooks/use-toast";
import { API_IP, API_PORT } from "@/constants/links";

interface AdminSocketEvents {
  newly_created_entity_notification: (data: {
    entity_name: string;
    timestamp: number;
    message: string;
    event_type: string;
  }) => void;
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
      (response: any) => {
        if (response?.success) {
          console.log("✅ Successfully joined admin_global room");
          toast({
            title: "Real-time Updates Active",
            description: "Dashboard is now receiving live updates",
            variant: "default",
          });
        } else {
          console.error("❌ Failed to join admin_global room:", response);
        }
      }
    );
  });

  adminSocketInstance.on("connect_error", (error) => {
    console.error("❌ Admin socket connection error:", error.message, error);
    console.error("🔍 Full error object:", error);
    toast({
      title: "Connection Error",
      description: "Failed to connect to real-time updates",
      variant: "destructive",
    });
  });

  adminSocketInstance.on("disconnect", (reason) => {
    console.log("❌ Admin socket disconnected:", reason);
    if (reason === "io server disconnect") {
      console.error(
        "Server disconnected the admin socket. Possible causes: invalid token, missing auth header, or server-side validation failure."
      );
      toast({
        title: "Connection Lost",
        description: "Real-time updates have been disconnected",
        variant: "destructive",
      });
    }
  });

  adminSocketInstance.on("error", (error) => {
    console.error("❌ Admin socket server error:", error);
  });

  // Listen for newly created entity notifications
  adminSocketInstance.on("newly_created_entity_notification", (data) => {
    if (data.entity_name === "Order") {
      console.log("📊 Received order created:", data);
    }

    // Show toast notification
    toast({
      title: "New Entity Created",
      description: data.message || `New ${data.entity_name} has been created`,
      variant: "default",
    });
  });

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
  onNewlyCreatedEntity: (
    callback: (data: {
      entity_name: string;
      timestamp: number;
      message: string;
      event_type: string;
    }) => void
  ) => {
    if (adminSocketInstance) {
      adminSocketInstance.on("newly_created_entity_notification", callback);
    }
  },

  offNewlyCreatedEntity: (callback?: (data: any) => void) => {
    if (adminSocketInstance) {
      if (callback) {
        adminSocketInstance.off("newly_created_entity_notification", callback);
      } else {
        adminSocketInstance.off("newly_created_entity_notification");
      }
    }
  },
};
