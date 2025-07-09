"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { useCustomerCareStore } from "@/stores/customerCareStore";
import {
  createAdminChatSocket,
  getAdminChatSocket,
  adminChatSocket,
} from "@/lib/adminChatSocket";
import {
  AdminChatRoom,
  AdminChatMessage,
  MessageType,
} from "@/types/admin-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  Plus,
  Search,
  Users,
  Settings,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import CreateGroupDialog from "@/components/AdminChat/CreateGroupDialog";
import StartDirectChatDialog from "@/components/AdminChat/StartDirectChatDialog";
import axiosInstance from "@/lib/axios";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import InviteToGroupDialog from "@/components/AdminChat/InviteToGroupDialog";

interface MentionUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  avatar?: string;
  roleInChat: string;
}

interface TaggedUser {
  id: string; // This will be the userId
  name: string;
  startIndex: number;
  endIndex: number;
}

export default function InternalChatPage() {
  const [chatRooms, setChatRooms] = useState<AdminChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<AdminChatRoom | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [openInviteDialog, setOpenInviteDialog] = useState(false);

  // Mention states
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  const adminUser = useAdminStore((state) => state.user);
  const customerCareUser = useCustomerCareStore((state) => state.user);
  const currentUser = adminUser || customerCareUser;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const selectedRoomRef = useRef<AdminChatRoom | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the ref updated with the latest selectedRoom state
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debounced search for mentions
  const searchMentionUsers = useCallback(async (query: string) => {
    if (query.length < 1 || !selectedRoomRef.current) {
      setMentionUsers([]);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/group-chat/${selectedRoomRef.current.id}/members?keyword=${query}`
      );
      if (response.data.EC === 0) {
        setMentionUsers(response.data.data);
      } else {
        setMentionUsers([]);
      }
    } catch (error) {
      console.error("Error searching mention users:", error);
      setMentionUsers([]);
    }
  }, []);

  // Handle @ detection and mention popup
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    setNewMessage(value);

    // Only allow mentions in group chats
    if (selectedRoom?.type !== "ADMIN_GROUP") {
      return;
    }

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf("@", cursorPosition - 1);
    const spaceAfterAt = value.indexOf(" ", lastAtIndex);

    if (
      lastAtIndex !== -1 &&
      (spaceAfterAt === -1 || spaceAfterAt >= cursorPosition)
    ) {
      const query = value.substring(lastAtIndex + 1, cursorPosition);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentions(true);
        setActiveMentionIndex(0);
        searchMentionUsers(query);

        // Calculate popup position
        const input = inputRef.current;
        if (input) {
          const rect = input.getBoundingClientRect();
          setMentionPosition({
            top: rect.top - 200,
            left: rect.left,
          });
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Handle mention selection
  const selectMention = (user: MentionUser) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const lastAtIndex = newMessage.lastIndexOf("@", cursorPosition - 1);

    if (lastAtIndex !== -1) {
      const beforeAt = newMessage.substring(0, lastAtIndex);
      const afterMention = newMessage.substring(cursorPosition);
      const mentionText = `@${user.firstName} ${user.lastName}`;
      const newText = beforeAt + mentionText + " " + afterMention;

      setNewMessage(newText);
      setShowMentions(false);

      // Track tagged user
      const taggedUser: TaggedUser = {
        id: user.userId,
        name: `${user.firstName} ${user.lastName}`,
        startIndex: lastAtIndex,
        endIndex: lastAtIndex + mentionText.length,
      };

      setTaggedUsers((prev) => [...prev, taggedUser]);

      // Focus back to input
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = lastAtIndex + mentionText.length + 1;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Handle keyboard navigation in mentions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && mentionUsers.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveMentionIndex((prev) =>
            prev < mentionUsers.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveMentionIndex((prev) =>
            prev > 0 ? prev - 1 : mentionUsers.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (mentionUsers[activeMentionIndex]) {
            selectMention(mentionUsers[activeMentionIndex]);
          }
          break;
        case "Escape":
          setShowMentions(false);
          break;
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Remove tagged user when text is modified
  const removeTaggedUser = (userId: string) => {
    setTaggedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  useEffect(() => {
    if (!currentUser?.accessToken) {
      console.log("No user token available");
      return;
    }

    const initializeSocket = async () => {
      try {
        console.log("Initializing admin chat socket...");
        const socket = createAdminChatSocket(currentUser.accessToken);
        socketRef.current = socket;

        // Setup event listeners
        adminChatSocket.onAdminConnected(socket, (data) => {
          console.log("Admin connected:", data);
          setIsConnected(true);
          loadChatRooms();
        });

        adminChatSocket.onNewMessage(socket, (message) => {
          console.log("New message received:", message);
          if (
            selectedRoomRef.current &&
            message.roomId === selectedRoomRef.current.id
          ) {
            setMessages((prev) => [...prev, message]);
          }
          // Update chat rooms list with latest message
          setChatRooms((prev) =>
            prev.map((room) =>
              room.id === message.roomId
                ? {
                    ...room,
                    lastMessage: message,
                    lastActivity: new Date(message.timestamp),
                  }
                : room
            )
          );
        });

        adminChatSocket.onDirectChatStarted(socket, (room) => {
          console.log("Direct chat started:", room);
          setChatRooms((prev) => [room, ...prev]);
        });

        adminChatSocket.onGroupCreated(socket, (group) => {
          console.log("Group created:", group);
          setChatRooms((prev) => [group, ...prev]);
        });

        adminChatSocket.onUserJoinedGroup(socket, ({ room, user }) => {
          console.log("User joined group:", user, room);
          setChatRooms((prev) =>
            prev.map((r) => (r.id === room.id ? room : r))
          );
        });

        adminChatSocket.onRoomMessages(socket, (data) => {
          console.log("Received room messages:", data);
          if (data.roomId === selectedRoomRef.current?.id) {
            setMessages(data.messages);
          }
        });

        adminChatSocket.onRoomMessagesError(socket, (error) => {
          console.error("Error receiving room messages:", error);
        });

        adminChatSocket.onUserTagged(socket, (data) => {
          console.log("User tagged:", data);
          // Handle user tagged notifications
        });

        adminChatSocket.onTyping(socket, (data) => {
          if (
            selectedRoomRef.current &&
            data.roomId === selectedRoomRef.current.id &&
            data.userId !== currentUser.id
          ) {
            setTypingUsers((prev) => new Set(prev).add(data.userName));
          }
        });

        adminChatSocket.onStopTyping(socket, (data) => {
          if (
            selectedRoomRef.current &&
            data.roomId === selectedRoomRef.current.id
          ) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.userName);
              return newSet;
            });
          }
        });

        socket.on("connect", () => {
          console.log("Socket connected");
          setIsConnected(true);
        });

        socket.on("disconnect", () => {
          console.log("Socket disconnected");
          setIsConnected(false);
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
        setIsLoading(false);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser?.accessToken, currentUser?.id]);

  const loadChatRooms = async () => {
    if (!socketRef.current) return;

    try {
      const response = await adminChatSocket.getAdminChats(socketRef.current, {
        limit: 50,
        offset: 0,
      });
      setChatRooms(response.chats);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading chat rooms:", error);
      setIsLoading(false);
    }
  };

  const selectRoom = async (room: AdminChatRoom) => {
    if (!socketRef.current || room.id === selectedRoom?.id) return;

    try {
      setSelectedRoom(room);
      setMessages([]); // Clear messages while loading new room
      await adminChatSocket.joinRoom(socketRef.current, {
        roomId: room.id,
        roomType: room.type,
      });
      adminChatSocket.getRoomMessages(socketRef.current, {
        roomId: room.id,
        limit: 50,
      });
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !socketRef.current) return;

    try {
      const payload = {
        roomId: selectedRoom.id,
        content: newMessage.trim(),
        messageType: MessageType.TEXT,
        taggedUsers:
          taggedUsers.length > 0
            ? taggedUsers.map((user) => user.id)
            : undefined,
      };

      await adminChatSocket.sendMessage(socketRef.current, payload);
      setNewMessage("");
      setTaggedUsers([]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    handleKeyDown(e);
  };

  const startDirectChat = async (withAdminId: string) => {
    if (!socketRef.current) return;

    try {
      const room = await adminChatSocket.startDirectChat(socketRef.current, {
        withAdminId,
      });
      selectRoom(room);
    } catch (error) {
      console.error("Error starting direct chat:", error);
    }
  };

  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    return format(messageDate, "HH:mm");
  };

  const formatLastActivity = (date: Date | string) => {
    const activityDate = new Date(date);
    const now = new Date();
    const diffInHours =
      (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(activityDate, "HH:mm");
    } else {
      return format(activityDate, "MMM dd");
    }
  };

  const filteredRooms = chatRooms.filter(
    (room) =>
      room.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.participants.some((p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  useEffect(() => {
    const fetchAdminUsers = async () => {
      const response = await axiosInstance.get("/admin/internal-users/search");
      const { EC, EM, data } = response.data;
      console.log("check data", data);
    };
    fetchAdminUsers();
    console.log("cehck fetch here");
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading internal chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mentions Popup */}
      {showMentions && mentionUsers.length > 0 && (
        <div
          className="fixed z-50 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: mentionPosition.top,
            left: mentionPosition.left,
            width: "300px",
          }}
        >
          {mentionUsers.map((user, index) => (
            <div
              key={user.userId}
              className={cn(
                "flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-100",
                index === activeMentionIndex && "bg-blue-50"
              )}
              onClick={() => selectMention(user)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>
                  {user.firstName[0]}
                  {user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {user.userType}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 ">
          <div className="flex items-center  justify-between mb-4">
            <h1 className="text-xl w-1/2 font-semibold text-gray-900">
              Internal Chat
            </h1>
            <div className="flex w-1/2 items-center space-x-2 ">
              <CreateGroupDialog
                socket={socketRef.current}
                onGroupCreated={(group) => {
                  setChatRooms((prev) => [group, ...prev]);
                }}
                trigger={
                  <Button variant="ghost" size="sm" className="p-2 ">
                    <Users className="h-4 w-4" />
                  </Button>
                }
              />
              <StartDirectChatDialog
                socket={socketRef.current}
                currentUserId={currentUser?.id || ""}
                onChatStarted={(chat) => {
                  setChatRooms((prev) => [chat, ...prev]);
                  selectRoom(chat);
                }}
                trigger={
                  <Button variant="ghost" size="sm" className="p-2 w-96">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Connection Status */}
        <div className="px-4 py-2">
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span className="text-xs text-gray-600">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredRooms.map((room) => (
              <Card
                key={room.id}
                className={cn(
                  "p-3 mb-2 cursor-pointer transition-colors hover:bg-gray-50",
                  selectedRoom?.id === room.id && "bg-blue-50 border-blue-200"
                )}
                onClick={() => selectRoom(room)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {room.type === "ADMIN_GROUP" ? (
                        room.groupName?.[0]?.toUpperCase() || "G"
                      ) : (
                        <MessageCircle className="h-5 w-5" />
                      )}
                    </div>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {room.type === "ADMIN_GROUP"
                          ? room.groupName
                          : room.participants.find(
                              (p) => p.userId !== currentUser?.id
                            )?.name || "Direct Chat"}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatLastActivity(room.lastActivity)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {room.lastMessage?.content || "No messages yet"}
                      </p>
                      {room.unreadCount && room.unreadCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </div>

                    {room.type === "ADMIN_GROUP" && (
                      <div className="flex items-center mt-1">
                        <Users className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">
                          {room.participants.length} members
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {filteredRooms.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No chats found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {selectedRoom.type === "ADMIN_GROUP" ? (
                        selectedRoom.groupName?.[0]?.toUpperCase() || "G"
                      ) : (
                        <MessageCircle className="h-5 w-5" />
                      )}
                    </div>
                  </Avatar>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedRoom.type === "ADMIN_GROUP"
                        ? selectedRoom.groupName
                        : selectedRoom.participants.find(
                            (p) => p.userId !== currentUser?.id
                          )?.name || "Direct Chat"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedRoom.type === "ADMIN_GROUP"
                        ? `${selectedRoom.participants.length} members`
                        : "Online"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Popover onOpenChange={() => {}}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-48"
                      align="end"
                      side="left"
                      sideOffset={5}
                    >
                      <InviteToGroupDialog
                        onInviteSent={() => {
                          // can add logic here to refetch room data or show a toast
                          console.log("Invitations sent!");
                        }}
                        socket={socketRef.current}
                        groupId={selectedRoom?.id || ""}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start space-x-3",
                      message.senderId === currentUser?.id &&
                        "flex-row-reverse space-x-reverse"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <div className="w-full h-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                        {message.senderInfo?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    </Avatar>

                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md",
                        message.senderId === currentUser?.id && "items-end"
                      )}
                    >
                      <div
                        className={cn(
                          "px-4 py-2 rounded-2xl",
                          message.senderId === currentUser?.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>

                      <div
                        className={cn(
                          "flex items-center mt-1 space-x-2",
                          message.senderId === currentUser?.id && "justify-end"
                        )}
                      >
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.senderId !== currentUser?.id && (
                          <span className="text-xs text-gray-500">
                            {message.senderInfo?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {typingUsers.size > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span>
                      {Array.from(typingUsers).join(", ")}{" "}
                      {typingUsers.size === 1 ? "is" : "are"} typing...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Tagged Users Display */}
              {taggedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {taggedUsers.map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      @{user.name}
                      <button
                        type="button"
                        onClick={() => removeTaggedUser(user.id)}
                        className="rounded-full hover:bg-gray-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-end space-x-3">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-5 w-5" />
                </Button>

                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    placeholder="Type your message... Use @ to mention someone"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="resize-none"
                  />
                </div>

                <Button variant="ghost" size="sm">
                  <Smile className="h-5 w-5" />
                </Button>

                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a chat to start messaging
              </h3>
              <p className="text-gray-600">
                Choose from your existing chats or start a new conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
