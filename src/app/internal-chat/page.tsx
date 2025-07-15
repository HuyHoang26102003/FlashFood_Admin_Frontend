"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { useCustomerCareStore } from "@/stores/customerCareStore";
import { createAdminChatSocket, adminChatSocket } from "@/lib/adminChatSocket";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import InviteToGroupDialog from "@/components/AdminChat/InviteToGroupDialog";
import { Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import GroupSettingsDialog from "@/components/AdminChat/GroupSettingsDialog";
import OrderReferenceDialog from "@/components/AdminChat/OrderReferenceDialog";
import OrderHoverContent from "@/components/AdminChat/OrderHoverContent";
import UserHoverContent from "@/components/AdminChat/UserHoverContent";

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

interface GroupSettingsUpdate {
  groupId: string;
  newSettings: Partial<AdminChatRoom>;
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
  console.log("check pendingInvites", pendingInvites?.[0]);

  // Reply functionality
  const [replyToMessage, setReplyToMessage] = useState<AdminChatMessage | null>(
    null
  );
  const [orderReference, setOrderReference] = useState<OrderReference | null>(
    null
  );

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
          `/admin/group-chat/${selectedRoomRef.current.id}/members?keyword=${query}`
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

        adminChatSocket.onDirectChatStarted(socket, (data) => {
          console.log("Direct chat started:", data);

          // Refresh chat rooms to get the new direct chat
          loadChatRooms();

          toast({
            title: "Direct Chat Started",
            description: data.withUserName
              ? `Direct chat started with ${data.withUserName}`
              : "Direct chat started successfully",
          });
        });

        adminChatSocket.onDirectChatError(socket, (error) => {
          console.error("Direct chat error:", error);
          toast({
            title: "Error",
            description: error.error || "Failed to start direct chat.",
            variant: "destructive",
          });
        });

        adminChatSocket.onGroupCreated(socket, (group) => {
          console.log("Group created:", group);
          setChatRooms((prev) => [group, ...prev]);
        });

        adminChatSocket.onUserJoinedGroup(socket, (data) => {
          console.log("User joined group:", data);

          // Check if data exists and has valid fields
          if (!data || !data.groupId || !data.userId) {
            console.warn("Invalid data in userJoinedGroup event:", data);
            return;
          }

          const { groupId, userId, userName, userRole } = data;

          // Show notification that someone joined the group
          toast({
            title: "New Member",
            description: `${userName} has joined the group.`,
          });

          // Re-emit getAdminChats to refresh the entire chat rooms list
          console.log("Re-fetching all chats due to user joined group");
          loadChatRooms();

          // If currently viewing this group, refresh room messages
          if (selectedRoomRef.current?.id === groupId) {
            console.log("Re-fetching room messages due to user joined group");
            adminChatSocket.getRoomMessages(socket, {
              roomId: groupId,
              limit: 50,
            });
          }
        });

        adminChatSocket.onUserLeftGroup(socket, (data) => {
          console.log("User left group:", data);

          // Check if data exists and has valid fields
          if (!data || !data.groupId || !data.userId) {
            console.warn("Invalid data in userLeftGroup event:", data);
            return;
          }

          const { groupId, userId, userName } = data;

          // Show notification that someone left the group
          toast({
            title: "Member Left",
            description: `${userName} has left the group.`,
          });

          // Re-emit getAdminChats to refresh the entire chat rooms list
          console.log("Re-fetching all chats due to user left group");
          loadChatRooms();

          // If currently viewing this group, refresh room messages
          if (selectedRoomRef.current?.id === groupId) {
            console.log("Re-fetching room messages due to user left group");
            adminChatSocket.getRoomMessages(socket, {
              roomId: groupId,
              limit: 50,
            });
          }
        });

        // Handle when the current user leaves a group (confirmation event)
        adminChatSocket.onGroupLeft(socket, (data) => {
          console.log("Current user left group:", data);

          if (!data || !data.groupId) {
            console.warn("Invalid data in groupLeft event:", data);
            return;
          }

          // Clear selected room if leaving the currently selected group
          if (selectedRoomRef.current?.id === data.groupId) {
            setSelectedRoom(null);
          }

          // Re-emit getAdminChats to refresh the entire chat rooms list
          console.log("Re-fetching all chats due to current user left group");
          loadChatRooms();

          // Show success message
          toast({
            title: "Left Group",
            description:
              data.message || "You have successfully left the group.",
          });
        });

        adminChatSocket.onGroupSettingsUpdated(
          socket,
          (data: GroupSettingsUpdate) => {
            setChatRooms((prev) =>
              prev.map((r) =>
                r.id === data.groupId ? { ...r, ...data.newSettings } : r
              )
            );
            if (selectedRoomRef.current?.id === data.groupId) {
              setSelectedRoom((prev) =>
                prev ? { ...prev, ...data.newSettings } : null
              );
            }
            toast({
              title: "Group Updated",
              description: "The group settings have been successfully updated.",
            });
          }
        );

        adminChatSocket.onParticipantManaged(socket, (data) => {
          console.log("Participant managed:", data);

          // Check if data is valid
          if (!data || !data.groupId) {
            console.warn("Invalid data in participantManaged event:", data);
            return;
          }

          const { groupId, action, managerName, reason } = data;

          // Show notification about the action
          toast({
            title: "Participant Update",
            description: `${managerName} ${action.toLowerCase()}d a member${
              reason ? `: ${reason}` : "."
            }`,
          });

          // Re-emit getAdminChats to refresh the entire chat rooms list
          console.log("Re-fetching all chats due to participant managed");
          loadChatRooms();

          // If currently viewing this group, refresh room messages
          if (selectedRoomRef.current?.id === groupId) {
            console.log("Re-fetching room messages due to participant managed");
            adminChatSocket.getRoomMessages(socket, {
              roomId: groupId,
              limit: 50,
            });
          }
        });

        adminChatSocket.onRemovedFromGroup(socket, (data) => {
          console.log("Removed from group:", data);

          if (!data || !data.groupId) {
            console.warn("Invalid data in removedFromGroup event:", data);
            return;
          }

          // Clear selected room if removed from currently selected group
          if (selectedRoomRef.current?.id === data.groupId) {
            setSelectedRoom(null);
          }

          // Re-emit getAdminChats to refresh the entire chat rooms list
          console.log("Re-fetching all chats due to removal from group");
          loadChatRooms();

          toast({
            title: "Removed from Group",
            description: data.reason
              ? `You were removed by ${data.removedByName}: ${data.reason}`
              : `You were removed from the group by ${data.removedByName}.`,
            variant: "destructive",
          });
        });

        adminChatSocket.onParticipantManageError(socket, (error) => {
          console.error("Participant manage error:", error);
          toast({
            title: "Error",
            description: error.error || "Failed to manage participant.",
            variant: "destructive",
          });
        });

        // Real-time invitation events
        adminChatSocket.onGroupInvitationReceived(socket, (data) => {
          console.log("New group invitation received:", data);
          toast({
            title: "New Group Invitation",
            description: `${data.inviterName} invited you to join a group.`,
            action: (
              <Button
                onClick={() => loadPendingInvites()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                View Invites
              </Button>
            ),
          });
          // Refresh pending invites to show the new one
          loadPendingInvites();
        });

        adminChatSocket.onInvitationsSent(socket, (data) => {
          console.log("Invitations sent notification:", data);
          toast({
            title: "Invitations Sent",
            description: `${data.invitedCount} invitation(s) sent successfully.`,
          });
        });

        adminChatSocket.onJoinedGroup(socket, (data) => {
          console.log("Joined group:", data);
          toast({
            title: "Welcome!",
            description: data.message,
          });

          // Re-emit getAdminChats to refresh the entire chat rooms list
          console.log("Re-fetching all chats due to joined group");
          loadChatRooms();

          // Auto-select the group that was just joined and fetch its messages
          setTimeout(() => {
            setChatRooms((prev) => {
              const joinedRoom = prev.find((room) => room.id === data.groupId);
              if (joinedRoom) {
                selectRoom(joinedRoom);
                // Also refresh messages for the joined room
                console.log("Re-fetching room messages for joined group");
                adminChatSocket.getRoomMessages(socket, {
                  roomId: data.groupId,
                  limit: 50,
                });
              }
              return prev;
            });
          }, 500); // Small delay to ensure chat rooms are loaded
        });

        adminChatSocket.onInvitationDeclined(socket, (data) => {
          console.log("Invitation declined:", data);
          if (selectedRoomRef.current?.id === data.groupId) {
            toast({
              title: "Invitation Declined",
              description: `${data.declinedByName} declined the group invitation.`,
            });
          }
        });

        adminChatSocket.onInvitationResponse(socket, (data) => {
          console.log("Invitation response:", data);
          // Response feedback is now handled in handleRespondToInvite
          // This event is mainly for confirmation that the backend processed it
        });

        adminChatSocket.onInvitationResponseError(socket, (error) => {
          console.error("Invitation response error:", error);
          toast({
            title: "Error",
            description: error.error || "Failed to respond to invitation.",
            variant: "destructive",
          });
        });

        adminChatSocket.onRoomLeft(socket, (data) => {
          console.log("Room left:", data);
          if (data.roomType === "ADMIN_GROUP") {
            toast({
              title: "Left Group",
              description: "You have successfully left the group.",
            });
          }
        });

        adminChatSocket.onLeaveRoomError(socket, (error) => {
          console.error("Leave room error:", error);
          toast({
            title: "Error",
            description: error.error || "Failed to leave the group.",
            variant: "destructive",
          });
        });

        // Pending invitations events
        adminChatSocket.onPendingInvitations(socket, (data) => {
          console.log("Received pending invitations:", data);
          console.log(
            "Invitations structure:",
            JSON.stringify(data.invitations, null, 2)
          );

          // Validate and set invitations with fallbacks
          const validInvitations = (data.invitations || []).map((invite) => ({
            ...invite,
            groupName: invite.groupName || "Unknown Group",
            inviterName: invite.inviterName || "Unknown User",
          }));

          setPendingInvites(validInvitations);
        });

        adminChatSocket.onInvitationsError(socket, (error) => {
          console.error("Error fetching pending invitations:", error);
          toast({
            title: "Error",
            description: error.error || "Failed to fetch pending invitations.",
            variant: "destructive",
          });
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

        adminChatSocket.onInvitationError(socket, (error) => {
          console.error("Error sending invitation:", error);
          toast({
            title: "Error",
            description: error.message || error.error,
            variant: "destructive",
          });
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

  const loadPendingInvites = () => {
    if (!socketRef.current) return;
    try {
      adminChatSocket.getPendingInvitations(socketRef.current);
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
    }
  };

  const handleRespondToInvite = useCallback(
    async (inviteId: string, response: "ACCEPT" | "DECLINE") => {
      if (!socketRef.current) return;

      // Find the invitation being responded to
      const invitation = pendingInvites.find((inv) => inv.id === inviteId);

      try {
        const result = await adminChatSocket.respondToInvitation(
          socketRef.current,
          {
            inviteId,
            response,
          }
        );

        if (result.success) {
          // Remove the invitation from pending list immediately
          setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));

          // Also refresh pending invitations from server to ensure sync
          setTimeout(() => {
            loadPendingInvites();
          }, 100);

          if (response === "ACCEPT") {
            // For accept, we'll get the room via onJoinedGroup event
            // Just show immediate feedback
            toast({
              title: "Invitation Accepted",
              description: `Joining ${invitation?.groupName || "group"}...`,
            });
          } else {
            // For decline, show immediate feedback
            toast({
              title: "Invitation Declined",
              description: `You declined the invitation to join ${
                invitation?.groupName || "group"
              }.`,
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
    [pendingInvites]
  );

  const handleLeaveGroup = useCallback(async () => {
    if (
      !selectedRoom ||
      !socketRef.current ||
      selectedRoom.type !== "ADMIN_GROUP"
    )
      return;

    try {
      const groupName = selectedRoom.groupName;

      // Use the leaveRoom event that matches the backend implementation
      const result = await adminChatSocket.leaveRoom(socketRef.current, {
        roomId: selectedRoom.id,
        roomType: "ADMIN_GROUP",
      });

      if (result.success) {
        // Clear the selected room immediately
        setSelectedRoom(null);

        // Re-emit getAdminChats to refresh the entire chat rooms list
        console.log("Re-fetching all chats due to manual group leave");
        loadChatRooms();

        toast({
          title: "Group Left",
          description: `You have left ${groupName}.`,
        });
      }
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
    if (
      isSendingMessage ||
      !newMessage.trim() ||
      !selectedRoom ||
      !socketRef.current
    )
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
        messageType: orderReference
          ? MessageType.ORDER_REFERENCE
          : MessageType.TEXT,
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
    if (!taggedUsersDetails || taggedUsersDetails.length === 0) {
      return <span>{content}</span>;
    }

    const userMap = new Map(taggedUsersDetails.map((u) => [u.fullName, u]));
    const names = taggedUsersDetails.map((u) =>
      u.fullName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
    );

    if (names.length === 0) {
      return <span>{content}</span>;
    }

    const regex = new RegExp(`@(${names.join("|")})`, "g");
    const parts = content.split(regex);

    return (
      <span>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            // This will be the full name captured by the regex
            const user = userMap.get(part);
            if (user) {
              return (
                <HoverCard key={`${user.id}-${index}`}>
                  <HoverCardTrigger>
                    <strong className="text-blue-500 font-semibold bg-blue-200 px-1 rounded-sm cursor-pointer">
                      {`@${user.fullName}`}
                    </strong>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-0">
                    <UserHoverContent userId={user.id} />
                  </HoverCardContent>
                </HoverCard>
              );
            }
          }
          return part;
        })}
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
      (room.participants &&
        room.participants.some((p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase())
        ))
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
    <div className="flex mt-4 max-h-[calc(100vh-10rem)]">
      {/* Sidebar */}
      <div className="w-80 mr-2 bg-white border-r border-gray-200 flex flex-col">
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
          <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Group Invitations ({pendingInvites.length})
              </h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {pendingInvites.length} pending
              </Badge>
            </div>
            <div className="space-y-3">
              {pendingInvites.filter(
                (invite) => invite && invite.groupName && invite.inviterName
              ).length > 0 ? ( // Filter out invalid invites
                pendingInvites
                  .filter(
                    (invite) => invite && invite.groupName && invite.inviterName
                  )
                  .map((invite) => (
                    <div
                      key={invite.id}
                      className="p-3 rounded-lg bg-white border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            <strong className="text-blue-600">
                              {invite?.groupName || "Unknown Group"}
                            </strong>
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            Invited by{" "}
                            <span className="font-medium">
                              {invite.inviterName || "Unknown User"}
                            </span>
                          </p>
                          {invite.message && (
                            <p className="text-xs text-gray-500 italic mb-2 p-2 bg-gray-50 rounded">
                              "{invite.message}"
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-gray-500">
                                Expires:{" "}
                                {invite.expiresAt
                                  ? new Date(
                                      invite.expiresAt
                                    ).toLocaleDateString()
                                  : "Never"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  handleRespondToInvite(
                                    invite.inviteId,
                                    "DECLINE"
                                  )
                                }
                              >
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                                onClick={() =>
                                  handleRespondToInvite(
                                    invite.inviteId,
                                    "ACCEPT"
                                  )
                                }
                              >
                                Accept
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    No valid invitations found
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat List */}
        <ScrollArea className="flex-1 w-full ">
          <div className="p-2 w-full">
            {filteredRooms.map((room) => (
              <Card
                key={room.id}
                className={cn(
                  "p-3 mb-2 w-72 mx-auto cursor-pointer transition-colors hover:bg-gray-50",
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
      <div className="flex-1 bg-gray-50 flex flex-col">
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
                            currentUserId={currentUser?.id || ""}
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
                  {messages.map((msg) => {
                    const replyInfo = msg.replyToMessage
                      ? {
                          senderName: msg.replyToMessage.senderDetails?.name,
                          content: msg.replyToMessage.content,
                        }
                      : msg.replyToMessageDetails
                      ? {
                          senderName: msg.replyToMessageDetails.senderName,
                          content: msg.replyToMessageDetails.content,
                        }
                      : null;

                    if (msg.senderId === "SYSTEM") {
                      return (
                        <div
                          key={msg.id}
                          className="flex justify-center items-center my-3"
                        >
                          <div className="text-center text-xs text-muted-foreground bg-accent rounded-full px-4 py-1.5">
                            {renderMessageContent(
                              msg.content,
                              msg.taggedUsersDetails
                            )}
                            <span className="ml-2 text-muted-foreground/70">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex items-end gap-2 group",
                          msg.senderId === currentUser?.id
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        {msg.senderId !== currentUser?.id &&
                          msg.senderDetails && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage
                                src={
                                  typeof msg?.senderDetails?.avatar === "object"
                                    ? msg.senderDetails.avatar?.url
                                    : msg?.senderDetails?.avatar || undefined
                                }
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
                            {msg.senderId !== currentUser?.id &&
                              msg.senderDetails && (
                                <p className="text-xs font-bold mb-1 text-primary">
                                  {msg.senderDetails.name || "Unknown User"}
                                </p>
                              )}
                            {replyInfo && (
                              <div className="mb-2 p-2 bg-black/10 rounded border-l-2 border-primary">
                                <p
                                  className={cn(
                                    "text-xs font-medium",
                                    msg.senderId === currentUser?.id
                                      ? "text-gray-200"
                                      : "text-gray-700"
                                  )}
                                >
                                  Replying to{" "}
                                  {replyInfo.senderName || "Unknown User"}
                                </p>
                                <p className="text-xs opacity-75  truncate">
                                  {replyInfo.content}
                                </p>
                              </div>
                            )}
                            {msg.taggedUsersDetails &&
                              msg.taggedUsersDetails.length > 0 && (
                                <div className="mb-2 p-2 bg-blue-100 rounded border-l-2 border-blue-500">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Users className="h-4 w-4 text-blue-700" />
                                    <p className="text-xs font-medium text-blue-700">
                                      Tagged Users
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {msg.taggedUsersDetails.map((user) => (
                                      <HoverCard key={user.id}>
                                        <HoverCardTrigger>
                                          <Badge
                                            variant="secondary"
                                            className="cursor-pointer text-blue-500"
                                          >
                                            @{user.fullName}
                                          </Badge>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-auto p-0">
                                          <UserHoverContent userId={user.id} />
                                        </HoverCardContent>
                                      </HoverCard>
                                    ))}
                                  </div>
                                </div>
                              )}
                            {msg.orderReference && (
                              <HoverCard>
                                <HoverCardTrigger>
                                  <div className="mb-2 p-2 bg-orange-100 rounded border-l-2 border-orange-500 cursor-pointer">
                                    <div className="flex items-center gap-1 mb-1">
                                      <Package className="h-3 w-3" />
                                      <p className="text-xs font-medium text-orange-700">
                                        Order Reference
                                      </p>
                                    </div>
                                    <p className="text-xs text-orange-600">
                                      #{msg.orderReference.orderId} •{" "}
                                      {msg.orderReference.customerName}
                                    </p>
                                    {msg.orderReference.issueDescription && (
                                      <p className="text-xs text-orange-600 mt-1">
                                        {msg.orderReference.issueDescription}
                                      </p>
                                    )}
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-auto p-0">
                                  <OrderHoverContent
                                    orderId={msg.orderReference.orderId}
                                  />
                                </HoverCardContent>
                              </HoverCard>
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
                    );
                  })}

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
                      Replying to{" "}
                      {replyToMessage.senderDetails?.name || "Unknown User"}
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
                        Order #{orderReference.orderId} -{" "}
                        {orderReference.customerName}
                      </p>
                      <p className="text-xs text-orange-600">
                        {orderReference.restaurantName} • $
                        {orderReference.totalAmount} •{" "}
                        {orderReference.urgencyLevel}
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
                      className="flex items-center gap-1 text-primary-500"
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
                          description:
                            "File upload functionality will be implemented soon.",
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
                              <AvatarImage src={user?.avatar} />
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
