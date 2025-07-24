import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_IP, API_PORT } from "@/constants/links";
import { Enum_BotActionCode } from "@/constants/api_rules";

export enum ResponseType {
  TEXT = "TEXT",
  OPTIONS = "OPTIONS",
  GUIDE = "GUIDE",
  ACTION = "ACTION",
  ACTION_RESULT = "ACTION_RESULT",
}

export interface RevenueData {
  message: string;
  revenue: number;
  orderCount: number;
  date: string;
}

export interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
}

export interface CustomerData {
  message: string;
  customers: CustomerInfo[];
  count?: number;
  customerCount?: number;
}

export interface OrderData {
  id: string;
  status: string;
  details?: string;
  customer_name?: string;
  customer_id?: string;
  total_amount?: number;
  restaurant_name?: string;
  count?: number;
  orderCount?: number;
  message?: string;
  pendingCount?: number;
}

export type MessageContent = 
  | string 
  | OptionItem[] 
  | RevenueData 
  | OrderData 
  | CustomerData 
  | Record<string, unknown>;

export interface ChatMessage {
  id: string;
  content: MessageContent;
  type: ResponseType;
  action_code?: Enum_BotActionCode;
  timestamp: number;
  isUser: boolean;
}

export interface OptionItem {
  id: number;
  text: string;
  next_id: number | null;
}

export interface BotResponse {
  content: MessageContent;
  type: ResponseType;
  action_code?: Enum_BotActionCode;
}

export const useAdminChatSocket = (token: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMessage: ChatMessage = {
        ...message,
        id: Date.now().toString() + Math.random(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    []
  );

  const sendMessage = useCallback(
    (message: string) => {
      if (!socket || !isConnected) return;

      // Add user message to chat
      addMessage({
        content: message,
        type: ResponseType.TEXT,
        isUser: true,
      });

      // Emit to server
      socket.emit("adminMessage", { message });
    },
    [socket, isConnected, addMessage]
  );

  const sendNextStep = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit("nextStep");
  }, [socket, isConnected]);

  const sendGetHelp = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit("getHelp");
  }, [socket, isConnected]);

  useEffect(() => {
    if (!token) {
      console.log("No token provided for admin chat socket");
      return;
    }

    const trimmedToken = token.trim();
    console.log("Creating admin chat socket connection");

    const socketInstance = io(`${API_IP}:${API_PORT}/admin-chatbot`, {
      transports: ["websocket"],
      auth: {
        token: `Bearer ${trimmedToken}`,
      },
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Admin chat socket connected successfully");
      setIsConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Admin chat socket connection error:", error);
      setIsConnected(false);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Admin chat socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("adminBotResponse", (response: BotResponse) => {
      console.log("🤖 Received bot response:", response);
      addMessage({
        content: response.content,
        type: response.type,
        action_code: response.action_code,
        isUser: false,
      });
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        console.log("🔌 Disconnecting admin chat socket");
        socketInstance.disconnect();
      }
    };
  }, [token, addMessage]);

  return {
    socket,
    isConnected,
    messages,
    sendMessage,
    sendNextStep,
    sendGetHelp,
    clearMessages: () => setMessages([]),
  };
};
