import { API_IP } from "@/constants/links";
import { ChatMessage, ChatResponse } from "@/types/chat";
import { io } from "socket.io-client";

interface ChatHistoryResponse {
  roomId: string;
  messages: ChatMessage[];
}

let socketInstance: ReturnType<typeof io> | null = null;

export const createSocket = (token: string | null) => {
  if (!token) {
    console.error("No token provided, cannot create socket");
    throw new Error("Authentication token is required");
  }

  // Trim token to avoid whitespace issues
  const trimmedToken = token.trim();
  console.log("Creating new socket with token: Bearer [REDACTED]", {
    tokenLength: trimmedToken.length,
    startsWithEy: trimmedToken.startsWith("eyJ"),
    tokenSnippet: trimmedToken.slice(0, 10) + "...",
  });

  if (socketInstance) {
    if (socketInstance.connected) {
      console.log("Reusing existing connected socket");
      return socketInstance;
    }
    console.log("Cleaning up disconnected socket");
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(`${API_IP}:1310/chat`, {
    transports: ["websocket"], // Match React Native
    auth: {
      token: `Bearer ${trimmedToken}`, // This sends the token in the auth object
    },

    reconnection: false, // Disable reconnection for debugging
  });

  socketInstance.on("connect", () => {
    console.log("Socket connected successfully");
  });

  socketInstance.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message, error);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      console.error(
        "Server disconnected the socket. Possible causes: invalid token, missing auth header, or server-side validation failure."
      );
    }
  });

  socketInstance.on("error", (error) => {
    console.error("Server error:", error);
  });

  return socketInstance;
};

export const getSocket = () => socketInstance;

export const chatSocket = {
  getAllChats: (socket: ReturnType<typeof io>) => {
    return new Promise<ChatResponse>((resolve, reject) => {
      console.log("Emitting getAllChats event");

      if (!socket.connected) {
        console.log("Socket not connected, attempting to connect...");
        socket.connect();
      }

      socket.emit(
        "getAllChats",
        (response: ChatResponse | { error: string }) => {
          console.log("Received response from getAllChats:", response);
          if ("error" in response) {
            console.error("Error in getAllChats response:", response.error);
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  getChatHistory: (socket: ReturnType<typeof io>, roomId: string) => {
    return new Promise<ChatHistoryResponse>((resolve, reject) => {
      console.log("Emitting getChatHistory event for room:", roomId);

      if (!socket.connected) {
        console.log("Socket not connected, attempting to connect...");
        socket.connect();
      }

      // Listen for chatHistory event
      const handleChatHistory = (response: ChatHistoryResponse) => {
        console.log("Received chat history:", response);
        socket.off("chatHistory", handleChatHistory);
        resolve(response);
      };

      socket.on("chatHistory", handleChatHistory);

      // Emit getChatHistory event
      socket.emit("getChatHistory", { roomId }, (error: string) => {
        if (error) {
          console.error("Error in getChatHistory:", error);
          socket.off("chatHistory", handleChatHistory);
          reject(error);
        }
      });
    });
  },

  startChat: (
    socket: ReturnType<typeof io>,
    withUserId: string,
    type: string
  ) => {
    return new Promise<{
      chatId: string;
      withUser: string;
      type: string;
      dbRoomId: string;
    }>((resolve, reject) => {
      console.log("Emitting startChat event", { withUserId, type });

      if (!socket.connected) {
        console.log("Socket not connected, attempting to connect...");
        socket.connect();
      }

      // Listen for chatStarted event
      const handleChatStarted = (response: {
        chatId: string;
        withUser: string;
        type: string;
        dbRoomId: string;
      }) => {
        console.log("Received chatStarted:", response);
        socket.off("chatStarted", handleChatStarted);
        resolve(response);
      };

      socket.on("chatStarted", handleChatStarted);

      // Emit startChat event
      console.log("check whate here", { withUserId, type });
      socket.emit("startChat", { withUserId, type }, (error: string) => {
        if (error) {
          console.error("Error in startChat:", error);
          socket.off("chatStarted", handleChatStarted);
          reject(new Error(error));
        }
      });
    });
  },

  sendMessage: (
    socket: ReturnType<typeof io>,
    roomId: string,
    content: string,
    type: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO"
  ) => {
    return new Promise<ChatMessage>((resolve, reject) => {
      console.log("Emitting sendMessage event", { roomId, content, type });

      if (!socket.connected) {
        console.log("Socket not connected, attempting to connect...");
        socket.connect();
      }

      socket.emit(
        "sendMessage",
        { roomId, content, type },
        (response: ChatMessage | { error: string }) => {
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
    socket: ReturnType<typeof io>,
    callback: (message: ChatMessage) => void
  ) => {
    console.log("Setting up newMessage listener");
    socket.on("newMessage", (message: ChatMessage) => {
      console.log("Received new message:", message);
      callback(message);
    });
  },

  // ============ SUPPORT CHAT METHODS ============

  // Agent registration and status management
  registerAgent: async (
    socket: ReturnType<typeof io>,
    agentData: {
      skills: string[];
      languages?: string[];
      maxSessions?: number;
      specializations?: string[];
      tier?: "tier1" | "tier2" | "tier3" | "supervisor";
    }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Agent registration timeout"));
      }, 10000);

      socket.emit("agentRegister", agentData, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Failed to register agent"));
        }
      });
    });
  },

  setAgentAvailable: async (socket: ReturnType<typeof io>): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Set availability timeout"));
      }, 5000);

      socket.emit("agentAvailable", {}, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Failed to set agent available"));
        }
      });
    });
  },

  setAgentUnavailable: async (
    socket: ReturnType<typeof io>,
    reason?: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Set unavailability timeout"));
      }, 5000);

      socket.emit("agentUnavailable", { reason }, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(
            new Error(response?.error || "Failed to set agent unavailable")
          );
        }
      });
    });
  },

  // Support session management
  startSupportChat: async (
    socket: ReturnType<typeof io>,
    sessionData?: {
      category?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      metadata?: Record<string, any>;
    }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Start support chat timeout"));
      }, 10000);

      socket.emit("startSupportChat", sessionData, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Failed to start support chat"));
        }
      });
    });
  },

  sendSupportMessage: async (
    socket: ReturnType<typeof io>,
    messageData: {
      sessionId: string;
      message: string;
      messageType?: "text" | "image" | "voice" | "file";
      metadata?: Record<string, any>;
    }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Send support message timeout"));
      }, 10000);

      socket.emit("sendSupportMessage", messageData, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(
            new Error(response?.error || "Failed to send support message")
          );
        }
      });
    });
  },

  sendAgentMessage: async (
    socket: ReturnType<typeof io>,
    messageData: {
      sessionId: string;
      message: string;
      messageType?: "text" | "image" | "voice" | "file";
      metadata?: Record<string, any>;
    }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Send agent message timeout"));
      }, 10000);

      socket.emit("sendAgentMessage", messageData, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Failed to send agent message"));
        }
      });
    });
  },

  requestHumanAgent: async (
    socket: ReturnType<typeof io>,
    requestData: {
      sessionId: string;
      category?: string;
      reason?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      requiredSkills?: string[];
    }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Request human agent timeout"));
      }, 10000);

      socket.emit("requestHumanAgent", requestData, (response: any) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  },

  transferSession: async (
    socket: ReturnType<typeof io>,
    transferData: {
      sessionId: string;
      toAgentId?: string;
      reason?: string;
      targetTier?: "tier2" | "tier3" | "supervisor";
    }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Transfer session timeout"));
      }, 10000);

      socket.emit("transferSession", transferData, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Failed to transfer session"));
        }
      });
    });
  },

  escalateSession: async (
    socket: ReturnType<typeof io>,
    escalationData: {
      sessionId: string;
      reason: string;
      targetTier: string;
      currentPriority: string;
    }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Escalate session timeout"));
      }, 10000);

      socket.emit("escalateSession", escalationData, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Failed to escalate session"));
        }
      });
    });
  },

  endSupportSession: async (
    socket: ReturnType<typeof io>,
    endData: {
      sessionId: string;
      resolution?: string;
      customerSatisfaction?: number;
      tags?: string[];
    }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("End support session timeout"));
      }, 10000);

      socket.emit("endSupportSession", endData, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Failed to end support session"));
        }
      });
    });
  },

  switchChatMode: async (
    socket: ReturnType<typeof io>,
    modeData: {
      sessionId: string;
      mode: "bot" | "human";
      reason?: string;
    }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Switch chat mode timeout"));
      }, 5000);

      socket.emit("switchChatMode", modeData, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Failed to switch chat mode"));
        }
      });
    });
  },

  getSupportMetrics: async (socket: ReturnType<typeof io>): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Get support metrics timeout"));
      }, 5000);

      socket.emit("getSupportMetrics", {}, (response: any) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  },

  getConversationAnalytics: async (
    socket: ReturnType<typeof io>,
    data?: { userId?: string }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Get conversation analytics timeout"));
      }, 5000);

      socket.emit("getConversationAnalytics", data, (response: any) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  },

  clearConversationContext: async (
    socket: ReturnType<typeof io>
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Clear context timeout"));
      }, 5000);

      socket.emit("clearConversationContext", {}, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Failed to clear context"));
        }
      });
    });
  },

  // Event listeners for support chat
  onAgentRegistered: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("agentRegistered", callback);
  },

  onAgentStatusChanged: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("agentStatusChanged", callback);
  },

  onNewCustomerAssigned: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("newCustomerAssigned", callback);
  },

  onCustomerMessage: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("customerMessage", callback);
  },

  onAgentMessage: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("agentMessage", callback);
  },

  onChatbotMessage: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("chatbotMessage", callback);
  },

  onSupportChatStarted: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("supportChatStarted", callback);
  },

  onAgentAssigned: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("agentAssigned", callback);
  },

  onQueueUpdate: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("queueUpdate", callback);
  },

  onSessionTransferred: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("sessionTransferred", callback);
  },

  onSessionEscalated: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("sessionEscalated", callback);
  },

  onSessionEnded: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("sessionEnded", callback);
  },

  onChatModeChanged: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("chatModeChanged", callback);
  },

  onSupportMetrics: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("supportMetrics", callback);
  },

  onConversationAnalytics: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("conversationAnalytics", callback);
  },

  onContextCleared: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("contextCleared", callback);
  },

  onSystemMessage: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("systemMessage", callback);
  },

  onFollowUpMessage: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("followUpMessage", callback);
  },

  onSlaViolation: (
    socket: ReturnType<typeof io>,
    callback: (data: any) => void
  ) => {
    socket.on("slaViolation", callback);
  },

  // Remove listeners
  offSupportEvents: (socket: ReturnType<typeof io>) => {
    socket.off("agentRegistered");
    socket.off("agentStatusChanged");
    socket.off("newCustomerAssigned");
    socket.off("customerMessage");
    socket.off("agentMessage");
    socket.off("chatbotMessage");
    socket.off("supportChatStarted");
    socket.off("agentAssigned");
    socket.off("queueUpdate");
    socket.off("sessionTransferred");
    socket.off("sessionEscalated");
    socket.off("sessionEnded");
    socket.off("chatModeChanged");
    socket.off("supportMetrics");
    socket.off("conversationAnalytics");
    socket.off("contextCleared");
    socket.off("systemMessage");
    socket.off("followUpMessage");
    socket.off("slaViolation");
  },
};
