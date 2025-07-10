"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { useCustomerCareStore } from "@/stores/customerCareStore";
import {
  createAdminChatSocket,
  adminChatSocket,
} from "@/lib/adminChatSocket";
import {
  AdminChatRoom,
  AdminChatMessage,
  MessageType,
  TaggedUserDetail,
  PendingInvitation,
  OrderReference,
} from "@/types/admin-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  Reply,
  FileText,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CreateGroupDialog from "@/components/AdminChat/CreateGroupDialog";
import StartDirectChatDialog from "@/components/AdminChat/StartDirectChatDialog";
import axiosInstance from "@/lib/axios";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import InviteToGroupDialog from "@/components/AdminChat/InviteToGroupDialog";
import { Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import GroupSettingsDialog from "@/components/AdminChat/GroupSettingsDialog";
import OrderReferenceDialog from "@/components/AdminChat/OrderReferenceDialog";

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
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const { toast } = useToast();

  // Reply functionality
  const [replyToMessage, setReplyToMessage] = useState<AdminChatMessage | null>(null);
  const [orderReference, setOrderReference] = useState<OrderReference | null>(null);

  // Mention states
  const [showMentions, setShowMentions] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [isMentionLoading, setIsMentionLoading] = useState(false);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  // Sending message state
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const adminUser = useAdminStore((state) => state.user);
  const customerCareUser = useCustomerCareStore((state) => state.user);
  const currentUser = adminUser || customerCareUser;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
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
  const searchMentionUsers = useCallback(
    async (query: string) => {
      if (!selectedRoomRef.current) {
        setMentionUsers([]);
        return;
      }

      setIsMentionLoading(true);
      try {
        const response = await axiosInstance.get(
          `/admin/group-chat/${
            selectedRoomRef.current.id
          }/members?keyword=${query}`
        );
        if (response.data.EC === 0) {
          setMentionUsers(response.data.data);
        } else {
          setMentionUsers([]);
        }
      } catch (error) {
        console.error("Error searching mention users:", error);
        setMentionUsers([]);
      } finally {
        setIsMentionLoading(false);
      }
    },
    [selectedRoomRef]
  );

  // Handle @ detection and mention popup
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    setNewMessage(value);

    // Emit typing event
    if (selectedRoom && socketRef.current) {
      if (!typingTimeoutRef.current) {
        adminChatSocket.typing(socketRef.current, {
          roomId: selectedRoom.id,
          roomType: selectedRoom.type,
        });
      } else {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && selectedRoom) {
          adminChatSocket.stopTyping(socketRef.current, {
            roomId: selectedRoom.id,
            roomType: selectedRoom.type,
          });
          typingTimeoutRef.current = null;
        }
      }, 2000); // Stop typing after 2 seconds of inactivity
    }

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
        setShowMentions(true);
        setActiveMentionIndex(0);

        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        setIsMentionLoading(true); // Show loading immediately
        debounceTimeoutRef.current = setTimeout(() => {
          searchMentionUsers(query);
        }, 300);
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
          loadPendingInvites();
        });

        adminChatSocket.onNewMessage(socket, (message) => {
          console.log("New message received:", message);
          if (
            selectedRoomRef.current &&
            message.roomId === selectedRoomRef.current.id
          ) {
            setMessages((prev) => [...prev, message]);
            // If the message is from the current user, re-enable the input
            if (message.senderId === (adminUser?.id || customerCareUser?.id)) {
              setIsSendingMessage(false);
            }
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
          if (selectedRoomRef.current?.id === room.id) {
            setSelectedRoom(room);
          }
          setChatRooms((prev) =>
            prev.map((r) => (r.id === room.id ? room : r))
          );
        });

        adminChatSocket.onUserLeftGroup(socket, ({ room, user }) => {
          console.log("User left group:", user.name);
          const isCurrentUserLeaving = user.userId === currentUser?.id;

          if (selectedRoomRef.current?.id === room.id) {
            if (isCurrentUserLeaving) {
              setSelectedRoom(null);
            } else {
              setSelectedRoom(room);
            }
          }
          if (isCurrentUserLeaving) {
            setChatRooms((prev) => prev.filter((r) => r.id !== room.id));
          } else {
            setChatRooms((prev) =>
              prev.map((r) => (r.id === room.id ? room : r))
            );
          }
        });

        adminChatSocket.onRoomMessages(socket, (data) => {
          console.log("Received room messages:", data);
          if (data.roomId === selectedRoomRef.current?.id) {
            setMessages(data.messages);
          }
          setIsMessagesLoading(false);
        });

        adminChatSocket.onRoomMessagesError(socket, (error) => {
          console.error("Error receiving room messages:", error);
          setIsMessagesLoading(false);
        });

        adminChatSocket.onUserTagged(socket, (data) => {
          if (
            data.taggedUser === currentUser?.id &&
            selectedRoomRef.current?.id !== data.message.roomId
          ) {
            toast({
              title: `New Mention in ${
                chatRooms.find((r) => r.id === data.message.roomId)
                  ?.groupName || "another chat"
              }`,
              description: `${
                data.message.senderDetails?.name || "Someone"
              } mentioned you.`,
              action: (
                <Button
                  onClick={() => {
                    const roomToSelect = chatRooms.find(
                      (r) => r.id === data.message.roomId
                    );
                    if (roomToSelect) selectRoom(roomToSelect);
                  }}
                >
                  Go to Chat
                </Button>
              ),
            });
          }
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

  const loadPendingInvites = async () => {
    if (!socketRef.current) return;
    try {
      const invites = await adminChatSocket.getPendingInvitations(
        socketRef.current
      );
      setPendingInvites(invites);
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
    }
  };

  const handleRespondToInvite = useCallback(
    async (inviteId: string, response: "ACCEPT" | "DECLINE") => {
      if (!socketRef.current) return;
      try {
        const result = await adminChatSocket.respondToInvitation(
          socketRef.current,
          {
            inviteId,
            response,
          }
        );
        if (result.success) {
          setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
          if (response === "ACCEPT" && result.room) {
            setChatRooms((prev) => [result.room!, ...prev]);
            selectRoom(result.room!);
            toast({
              title: "Group Joined",
              description: `You have successfully joined ${result.room.groupName}.`,
            });
          }
        }
      } catch (error) {
        console.error(`Error responding to invitation (${response}):`, error);
        toast({
          title: "Error",
          description: "Failed to respond to the invitation.",
          variant: "destructive",
        });
      }
    },
    []
  );

  const handleLeaveGroup = useCallback(async () => {
    if (!selectedRoom || !socketRef.current || selectedRoom.type !== "ADMIN_GROUP")
      return;
    try {
      await adminChatSocket.leaveRoom(socketRef.current, {
        roomId: selectedRoom.id,
        roomType: "ADMIN_GROUP",
      });
      // UI will update via onUserLeftGroup event
      toast({
        title: "Group Left",
        description: `You have left ${selectedRoom.groupName}.`,
      });
    } catch (error) {
      console.error("Error leaving group:", error);
      toast({
        title: "Error",
        description: "Failed to leave the group.",
        variant: "destructive",
      });
    }
  }, [selectedRoom]);

  const selectRoom = async (room: AdminChatRoom) => {
    if (!socketRef.current || room.id === selectedRoom?.id) return;

    try {
      setSelectedRoom(room);
      setMessages([]); // Clear messages while loading new room
      setIsMessagesLoading(true);
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
      setIsMessagesLoading(false);
    }
  };

  const handleReply = (message: AdminChatMessage) => {
    setReplyToMessage(message);
    inputRef.current?.focus();
  };

  const handleRemoveReply = () => {
    setReplyToMessage(null);
  };

  const handleOrderReferenceSelected = (orderRef: OrderReference) => {
    setOrderReference(orderRef);
  };

  const handleRemoveOrderReference = () => {
    setOrderReference(null);
  };

  const sendMessage = async () => {
    if (isSendingMessage || !newMessage.trim() || !selectedRoom || !socketRef.current)
      return;

    setIsSendingMessage(true);
    try {
      // Stop typing indicator when sending a message
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        if (socketRef.current && selectedRoom) {
          adminChatSocket.stopTyping(socketRef.current, {
            roomId: selectedRoom.id,
            roomType: selectedRoom.type,
          });
          typingTimeoutRef.current = null;
        }
      }

      const payload = {
        roomId: selectedRoom.id,
        content: newMessage.trim(),
        messageType: orderReference ? MessageType.ORDER_REFERENCE : MessageType.TEXT,
        taggedUsers:
          taggedUsers.length > 0
            ? taggedUsers.map((user) => user.id)
            : undefined,
        replyToMessageId: replyToMessage?.id,
        orderReference: orderReference || undefined,
      };

      await adminChatSocket.sendMessage(socketRef.current, payload);
      setNewMessage("");
      setTaggedUsers([]);
      setReplyToMessage(null);
      setOrderReference(null);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsSendingMessage(false); // Re-enable on error
    }
  };

  const renderMessageContent = (
    content: string,
    taggedUsersDetails?: TaggedUserDetail[]
  ) => {
    if (!taggedUsersDetails?.length) {
      return <span>{content}</span>;
    }

    const mentionElements = taggedUsersDetails.map((user) => (
      <strong
        key={user.id}
        className="text-blue-500 font-semibold bg-blue-200 px-1 rounded-sm mr-1"
      >
        {`@${user.fullName}`}
      </strong>
    ));

    return (
      <span>
        {mentionElements}
        {content}
      </span>
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    handleKeyDown(e);
  };

  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastActivity = (date: Date | string) => {
    const activityDate = new Date(date);
    const now = new Date();
    const diffInHours =
      (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return activityDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return activityDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
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
      const { data } = response.data;
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

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Invitations
            </h3>
            <div className="mt-2 space-y-1">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-2 rounded-lg bg-yellow-100 text-yellow-800"
                >
                  <p className="text-sm font-medium">
                    Join <strong>{invite.group.name}</strong>
                  </p>
                  <p className="text-xs">from {invite.inviter.name}</p>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => handleRespondToInvite(invite.id, "DECLINE")}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                      onClick={() => handleRespondToInvite(invite.id, "ACCEPT")}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                      className="w-48 p-1"
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

                      {selectedRoom.type === "ADMIN_GROUP" && (
                        <>
                          <GroupSettingsDialog
                            room={selectedRoom}
                            socket={socketRef.current}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                              >
                                Group Settings
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-50"
                            onClick={handleLeaveGroup}
                          >
                            Leave Group
                          </Button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isMessagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading messages...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-end gap-2 group",
                        msg.senderId === currentUser?.id
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      {msg.senderId !== currentUser?.id && msg.senderDetails && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={msg.senderDetails.avatar?.url}
                            alt={msg.senderDetails.name}
                            className="bg-primary-400"
                          />
                          <AvatarFallback>
                            {msg.senderDetails.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() || "???"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex items-end gap-2 max-w-md">
                        <div
                          className={cn(
                            "p-3 rounded-lg",
                            msg.senderId === currentUser?.id
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-info-100 text-muted-foreground rounded-bl-none"
                          )}
                        >
                          {msg.senderId !== currentUser?.id && msg.senderDetails && (
                            <p className="text-xs font-bold mb-1 text-primary">
                              {msg.senderDetails.name || "Unknown User"}
                            </p>
                          )}
                          {msg.replyToMessageDetails && (
                            <div className="mb-2 p-2 bg-black/10 rounded border-l-2 border-primary">
                              <p className="text-xs font-medium text-blue-200">
                                Replying to {msg.replyToMessageDetails.senderName}
                              </p>
                              <p className="text-xs opacity-75 truncate">
                                {msg.replyToMessageDetails.content}
                              </p>
                            </div>
                          )}
                          {msg.orderReference && (
                            <div className="mb-2 p-2 bg-orange-100 rounded border-l-2 border-orange-500">
                              <div className="flex items-center gap-1 mb-1">
                                <Package className="h-3 w-3" />
                                <p className="text-xs font-medium text-orange-700">
                                  Order Reference
                                </p>
                              </div>
                              <p className="text-xs text-orange-600">
                                #{msg.orderReference.orderId} • {msg.orderReference.customerName}
                              </p>
                              {msg.orderReference.issueDescription && (
                                <p className="text-xs text-orange-600 mt-1">
                                  {msg.orderReference.issueDescription}
                                </p>
                              )}
                            </div>
                          )}
                          <p className="text-sm break-words">
                            {renderMessageContent(
                              msg.content,
                              msg.taggedUsersDetails
                            )}
                          </p>
                          <p className="text-xs text-right mt-1 opacity-70">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                        {/* Reply button - shows on hover */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={() => handleReply(msg)}
                        >
                          <Reply className="h-3 w-3" />
                        </Button>
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
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Reply Preview */}
              {replyToMessage && (
                <div className="mb-3 p-2 bg-blue-50 rounded border-l-2 border-blue-500 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700">
                      Replying to {replyToMessage.senderDetails?.name || "Unknown User"}
                    </p>
                    <p className="text-xs text-blue-600 truncate">
                      {replyToMessage.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveReply}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Order Reference Preview */}
              {orderReference && (
                <div className="mb-3 p-2 bg-orange-50 rounded border-l-2 border-orange-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs font-medium text-orange-700">
                        Order #{orderReference.orderId} - {orderReference.customerName}
                      </p>
                      <p className="text-xs text-orange-600">
                        {orderReference.restaurantName} • ${orderReference.totalAmount} • {orderReference.urgencyLevel}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveOrderReference}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="start">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        // TODO: Implement file upload
                        toast({
                          title: "Coming Soon",
                          description: "File upload functionality will be implemented soon.",
                        });
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Local File
                    </Button>
                    <OrderReferenceDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Order Reference
                        </Button>
                      }
                      onOrderSelected={handleOrderReferenceSelected}
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder={
                      replyToMessage
                        ? "Reply to message..."
                        : "Type your message... Use @ to mention someone"
                    }
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="resize-none"
                    disabled={isSendingMessage}
                  />
                  {/* Mentions Popup */}
                  {showMentions && (
                    <div
                      className="absolute z-50 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto bottom-full left-0 mb-2"
                      style={{
                        width: "300px",
                      }}
                    >
                      {isMentionLoading ? (
                        <div className="p-4 text-center text-gray-500">
                          Loading users...
                        </div>
                      ) : mentionUsers.length > 0 ? (
                        mentionUsers.map((user, index) => (
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
                              <p className="text-xs text-gray-500">
                                {user.email}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {user.userType}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No users found.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="sm">
                  <Smile className="h-5 w-5" />
                </Button>

                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSendingMessage}
                  className="px-4"
                >
                  {isSendingMessage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
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
