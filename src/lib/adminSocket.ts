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

// Throttle mechanism to prevent duplicate events
const THROTTLE_DURATION = 5000; // 5 seconds
let isThrottled = false;
let lastEntityType: string | null = null;

// Process event with throttling
const processEventWithThrottling = (
  data: NewlyCreatedEntityPayload,
  callback: (data: NewlyCreatedEntityPayload) => void
) => {
  const entityType = data.entity_name;
  const entityEmail = data.entity_email || 'no email';
  
  console.log(`[SOCKET THROTTLE] 🔄 Processing event: ${entityType} (${entityEmail}), throttled: ${isThrottled}, lastType: ${lastEntityType}`);
  
  // If throttled and same entity type, block the event
  if (isThrottled && entityType === lastEntityType) {
    console.log(`[SOCKET THROTTLE] 🛑 BLOCKED duplicate ${entityType} event (throttled)`);
    return;
  }
  
  // Not throttled or different entity type, process the event
  console.log(`[SOCKET THROTTLE] ✅ ALLOWED ${entityType} event (will show notification and increment counter)`);
  
  // CRITICAL: Call the callback BEFORE setting the throttle
  // This ensures the event is processed by AdminDashboard
  callback(data);
  
  // Set throttle for this entity type AFTER processing the event
  lastEntityType = entityType;
  isThrottled = true;
  
  // Release throttle after duration
  setTimeout(() => {
    console.log(`[SOCKET THROTTLE] 🔓 Released throttle for ${entityType}`);
    isThrottled = false;
    lastEntityType = null;
  }, THROTTLE_DURATION);
};

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
      processEventWithThrottling(data, (processedData) => {
        console.log(
          `[Admin Socket] Received entity notification:
        - Entity Name: ${processedData.entity_name}
        - Message: ${processedData.message}
        - Event Type: ${processedData.event_type}
        - Timestamp: ${new Date(processedData.timestamp).toLocaleString()}`,
          processedData
        );
      });
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
  onNewlyCreatedEntity: (
    callback: (data: NewlyCreatedEntityPayload) => void
  ) => {
    if (adminSocketInstance) {
      console.log(`[adminSocket] 🔌 Registering onNewlyCreatedEntity handler`, callback);
      
      // First, remove any existing listeners to avoid duplicates
      adminSocketInstance.off("newly_created_entity_notification");
      
      // Then register the new listener with throttling
      adminSocketInstance.on("newly_created_entity_notification", (data) => {
        console.log(`[adminSocket] 📩 Raw event received: ${data.entity_name}`);
        
        // CRITICAL FIX: Ensure we're calling the callback directly for debugging
        try {
          processEventWithThrottling(data, (processedData) => {
            console.log(`[adminSocket] 📤 Calling handler for: ${processedData.entity_name}`);
            callback(processedData);
          });
        } catch (error) {
          console.error(`[adminSocket] ❌ Error processing event:`, error);
        }
      });
      
      return true;
    }
    console.warn(`[adminSocket] ⚠️ Cannot register handler - socket not connected`);
    return false;
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
