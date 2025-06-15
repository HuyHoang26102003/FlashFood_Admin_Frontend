"use client";

import { useEffect, useState, useRef } from "react";
import {
  Paperclip,
  Smile,
  Camera,
  Phone,
  Video,
  MoreVertical,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCustomerCareStore } from "@/stores/customerCareStore";
import { useAdminStore } from "@/stores/adminStore";
import { chatSocket, createSocket } from "@/lib/socket";
import {
  ChatResponse,
  CustomerCareSender,
  CustomerSender,
  DriverSender,
  RestaurantSender,
  ChatMessage,
  Message,
} from "@/types/chat";
import { formatDateToRelativeTime } from "@/utils/functions/formatRelativeTime";
import { limitCharacters } from "@/utils/functions/stringFunc";

interface Avatar {
  key: string;
  url: string;
}

interface LastMessage {
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
}

interface Participant {
  userId: string;
  userType: string;
  first_name?: string;
  last_name?: string;
  restaurant_name?: string;
  avatar?: Avatar | null;
  phone?: string;
  contact_email?: string[];
  contact_phone?: { phone: string }[];
}

interface ChatRoom {
  roomId: string;
  type: string;
  otherParticipant: Participant;
  lastMessage: LastMessage;
  lastActivity: string;
  relatedId: string | null;
}

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<ChatResponse>({
    ongoing: [],
    awaiting: [],
  });
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<ReturnType<typeof createSocket> | null>(
    null
  );
  const [pendingMessages, setPendingMessages] = useState<
    {
      content: string;
      roomId: string;
      timestamp: string;
    }[]
  >([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // const hasFetchedHistory = useRef<{ [key: string]: boolean }>({});

  const getAccessToken = () => {
    const customerCareStore = useCustomerCareStore.getState();
    const adminStore = useAdminStore.getState();
    return customerCareStore.isAuthenticated && customerCareStore.user
      ? customerCareStore.user.accessToken
      : adminStore.isAuthenticated && adminStore.user
      ? adminStore.user.accessToken
      : null;
  };

  const fetchAllChats = async (
    socketInstance: ReturnType<typeof createSocket>
  ) => {
    try {
      console.log("Starting to fetch all chats...");
      console.log("Socket connection status:", socketInstance.connected);

      const result = await chatSocket.getAllChats(socketInstance);
      console.log("Successfully fetched chats:", result);
      setChats(result);
      if (result.ongoing.length > 0 && !selectedRoomId) {
        const firstRoomId = result.ongoing[0].roomId;
        setSelectedRoomId(firstRoomId);
      }
      return result;
    } catch (error) {
      console.error("Error in fetchAllChats:", error);
      throw error;
    }
  };

  const fetchChatHistory = async (
    socketInstance: ReturnType<typeof createSocket>,
    roomId: string
  ) => {
    try {
      console.log("Fetching chat history for room:", roomId);
      const result = await chatSocket.getChatHistory(socketInstance, roomId);
      console.log("Successfully fetched chat history:", result);

      // Only update chat history for the current room
      if (roomId === selectedRoomId) {
        setChatHistory((prev) => {
          // Keep temporary messages for the current room
          const tempMessages = prev.filter(
            (msg) => msg.roomId === roomId && msg.id.startsWith("temp-")
          );
          return [...result.messages, ...tempMessages];
        });
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  useEffect(() => {
    console.log("Component mounted, initializing socket...");
    const token = getAccessToken();
    if (!token) {
      console.error("No token provided, skipping socket connection");
      return;
    }

    const newSocket = createSocket(token);
    setSocket(newSocket);

    const handleConnect = () => {
      console.log("Socket connected in component");
      fetchAllChats(newSocket);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected in component");
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("error", (error) => {
      console.error("Socket server error:", error);
    });

    if (newSocket.connected) {
      console.log("Socket already connected, fetching chats...");
      fetchAllChats(newSocket);
    }

    return () => {
      console.log("Component unmounting, cleaning up socket...");
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("error");
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    console.log("Setting up message listener with socket:", socket.id);

    const handleNewMessage = (message: ChatMessage) => {
      console.log("New message received in handler:", message);

      // Always fetch all chats to update the chat list
      fetchAllChats(socket);

      // Only update chat history if it's the current room
      if (message.roomId === selectedRoomId) {
        console.log("Updating chat history for current room:", selectedRoomId);
        const normalizedContent = message.content.normalize("NFC");

        // Update pending messages
        setPendingMessages((prev) => {
          const updatedPending = prev.filter(
            (pending) =>
              !(
                pending.content.normalize("NFC") === normalizedContent &&
                pending.roomId === message.roomId
              )
          );
          return updatedPending;
        });

        // Update chat history
        setChatHistory((prev) => {
          const updatedHistory = prev.filter(
            (msg) =>
              !(
                msg.content.normalize("NFC") === normalizedContent &&
                msg.roomId === message.roomId &&
                msg.senderType === "CUSTOMER_CARE_REPRESENTATIVE" &&
                msg.id.startsWith("temp-")
              )
          );
          return [...updatedHistory, message];
        });
      }
    };

    chatSocket.onNewMessage(socket, handleNewMessage);

    return () => {
      console.log("Cleaning up message listener");
      socket.off("newMessage");
    };
  }, [socket, selectedRoomId]);

  useEffect(() => {
    if (selectedRoomId && socket) {
      fetchChatHistory(socket, selectedRoomId);
    }
  }, [selectedRoomId, socket]);

  const getSenderName = (message: ChatMessage) => {
    if (message.customerSender) {
      return `${message.customerSender.first_name} ${message.customerSender.last_name}`;
    } else if (message.driverSender) {
      return `${message.driverSender.first_name} ${message.driverSender.last_name}`;
    } else if (message.restaurantSender) {
      return message.restaurantSender.restaurant_name;
    } else if (message.customerCareSender) {
      return `${message.customerCareSender.first_name} ${message.customerCareSender.last_name}`;
    }
    return "Unknown";
  };

  const getSenderAvatar = (message: ChatMessage | Message) => {
    if (message.customerSender && message.customerSender.avatar) {
      return message.customerSender.avatar.url;
    } else if (message.driverSender && message.driverSender.avatar) {
      return message.driverSender.avatar.url;
    } else if (message.restaurantSender && message.restaurantSender.avatar) {
      return message.restaurantSender.avatar.url;
    } else if (
      message.customerCareSender &&
      message.customerCareSender.avatar
    ) {
      return message.customerCareSender.avatar.url;
    }
    return "";
  };

  const isCurrentUser = (message: ChatMessage) => {
    return message.senderType === "CUSTOMER_CARE_REPRESENTATIVE";
  };

  const getParticipantName = (chat: ChatRoom) => {
    const participant = chat.otherParticipant;
    if (!participant) return "Unknown";
    if (participant.restaurant_name) {
      return participant.restaurant_name;
    }
    return (
      `${participant.first_name || ""} ${participant.last_name || ""}`.trim() ||
      "Unknown"
    );
  };

  const getParticipantAvatar = (chat: ChatRoom) => {
    return chat.otherParticipant?.avatar?.url || "";
  };

  const selectedChat =
    chats.ongoing.find((chat) => chat.roomId === selectedRoomId) ||
    chats.awaiting.find((chat) => chat.roomId === selectedRoomId);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (message.trim() && selectedRoomId && socket) {
      try {
        const tempMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          roomId: selectedRoomId,
          senderId: "current-user",
          senderType: "CUSTOMER_CARE_REPRESENTATIVE",
          content: message,
          messageType: "TEXT",
          timestamp: new Date().toISOString(),
          readBy: [],
          customerSender: null,
          driverSender: null,
          restaurantSender: null,
          customerCareSender: null,
        };

        setChatHistory((prev) => {
          const newHistory = [...prev, tempMessage];
          console.log("Updated chatHistory:", newHistory);
          return newHistory;
        });

        await new Promise((resolve) => {
          setPendingMessages((prev) => {
            const newPending = [
              ...prev,
              {
                content: message,
                roomId: selectedRoomId,
                timestamp: tempMessage.timestamp,
              },
            ];
            console.log("Updated pendingMessages:", newPending);
            resolve(newPending);
            return newPending;
          });
        });

        setMessage("");

        await chatSocket.sendMessage(socket, selectedRoomId, message, "TEXT");

        // Timeout to clear pending message if no server response
        setTimeout(() => {
          setPendingMessages((prev) =>
            prev.filter(
              (pending) =>
                !(
                  pending.content === message &&
                  pending.roomId === selectedRoomId
                )
            )
          );
        }, 10000);

        await fetchAllChats(socket);
      } catch (error) {
        console.error("Error sending message:", error);
        setChatHistory((prev) =>
          prev.filter(
            (msg) =>
              !(
                msg.content === message &&
                msg.roomId === selectedRoomId &&
                msg.senderType === "CUSTOMER_CARE_REPRESENTATIVE" &&
                msg.id.startsWith("temp-")
              )
          )
        );
        setPendingMessages((prev) =>
          prev.filter(
            (pending) =>
              !(
                pending.content === message && pending.roomId === selectedRoomId
              )
          )
        );
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const isMessagePending = (msg: ChatMessage) => {
    return (
      msg.senderType === "CUSTOMER_CARE_REPRESENTATIVE" &&
      msg.id.startsWith("temp-") &&
      pendingMessages.some(
        (pending) =>
          pending.content.normalize("NFC") === msg.content.normalize("NFC") &&
          pending.roomId === msg.roomId
      )
    );
  };

  return (
    <div className="flex overflow-hidden  py-4">
      <div className="w-1/3  border-r border-gray-200 pr-4 overflow-y-auto">
        <Input placeholder="Search" className="mb-4 bg-white" />
        <div className="flex-col mb-4 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2 bg-white">Ongoing chats</h2>
          <div className="space-y-2">
            {chats.ongoing.map((chat) => (
              <div
                key={chat.roomId}
                className={`flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer ${
                  selectedRoomId === chat.roomId ? "bg-gray-100" : ""
                }`}
                onClick={() => setSelectedRoomId(chat.roomId)}
              >
                <Avatar>
                  <AvatarImage
                    src={getParticipantAvatar(chat)}
                    alt={getParticipantName(chat)}
                  />
                  <AvatarFallback>
                    {getParticipantName(chat)[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">
                      {getParticipantName(chat)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateToRelativeTime(chat.lastMessage.timestamp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs leading-3 text-gray-600">
                      {limitCharacters(chat.lastMessage.content, 16)}
                    </span>
                    {chat.lastMessage.readBy.length === 1 && (
                      <Badge className="bg-danger-500 h-5 text-white">1</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-col bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mt-4 mb-2 bg-white">
            Waiting list
          </h2>
          <div className="space-y-2">
            {chats.awaiting.map((chat) => (
              <div
                key={chat.roomId}
                className={`flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer ${
                  selectedRoomId === chat.roomId ? "bg-gray-100" : ""
                }`}
                onClick={() => setSelectedRoomId(chat.roomId)}
              >
                <Avatar>
                  <AvatarImage
                    src={getParticipantAvatar(chat)}
                    alt={getParticipantName(chat)}
                  />
                  <AvatarFallback>
                    {getParticipantName(chat)[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {getParticipantName(chat)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDateToRelativeTime(chat.lastMessage.timestamp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {chat.lastMessage.content}
                    </span>
                    {chat.lastMessage.readBy.length === 1 && (
                      <Badge className="bg-danger-500 h-4 text-white">1</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-4 py-2 bg-violet-300 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src={selectedChat ? getParticipantAvatar(selectedChat) : ""}
                alt={selectedChat ? getParticipantName(selectedChat) : "User"}
              />
              <AvatarFallback>
                {selectedChat ? getParticipantName(selectedChat)[0] : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="">
              <h2 className="font-semibold">
                {selectedChat ? getParticipantName(selectedChat) : "User"}
              </h2>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5 text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5 text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-14rem)] p-4 overflow-y-auto bg-red-500">
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                isCurrentUser(msg) ? "justify-end" : "justify-start"
              } mb-4`}
            >
              {!isCurrentUser(msg) && (
                <Avatar className="mr-2 mt-1">
                  <AvatarImage
                    src={getSenderAvatar(msg)}
                    alt={getSenderName(msg)}
                  />
                  <AvatarFallback>
                    {getSenderName(msg)[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  isCurrentUser(msg)
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <p>{msg.content}</p>
                <div className="flex justify-between items-center">
                  <p
                    className={`text-xs mt-1 ${
                      isCurrentUser(msg) ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    {formatDateToRelativeTime(msg.timestamp)}
                  </p>
                  {isCurrentUser(msg) && isMessagePending(msg) && (
                    <p className="text-xs mt-1 ml-2 text-yellow-300">
                      sending...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="bg-white border-t border-gray-200 p-4 py-2 flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5 text-gray-500" />
          </Button>
          <Input
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button variant="ghost" size="icon">
            <Smile className="h-5 w-5 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon">
            <Camera className="h-5 w-5 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-primary"
            onClick={handleSendMessage}
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
