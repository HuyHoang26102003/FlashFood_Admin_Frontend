"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Search, User, Loader2 } from "lucide-react";
import { adminChatSocket } from "@/lib/adminChatSocket";
import { StartDirectChatPayload } from "@/types/admin-chat";
import axiosInstance from "@/lib/axios";
import { Socket } from "socket.io-client";

interface StartDirectChatDialogProps {
  socket: Socket | null;
  currentUserId: string;
  onChatStarted?: (chat: any) => void;
  trigger?: React.ReactNode;
}

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  logged_in_as: string;
  avatar?: {
    key: string;
    url: string;
  };
  isOnline?: boolean;
}

export default function StartDirectChatDialog({
  socket,
  currentUserId,
  onChatStarted,
  trigger,
}: StartDirectChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "critical"
  >("medium");
  const [category, setCategory] = useState("");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const categories = [
    "General",
    "Order Issues",
    "Technical Support",
    "Finance",
    "Urgent",
    "Emergency",
  ];

  const priorities = [
    { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
    { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-800" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" },
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "FINANCE_ADMIN":
        return "Finance Admin";
      case "COMPANION_ADMIN":
        return "Companion Admin";
      case "CUSTOMER_CARE_REPRESENTATIVE":
        return "Customer Care";
      default:
        return role;
    }
  };

  const getFullName = (user: AdminUser) => {
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
  };

  // Search for users using the API
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setAdminUsers([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axiosInstance.get(
        `/admin/internal-users/search?keyword=${encodeURIComponent(query)}`
      );

      if (response.data.EC === 0) {
        // Filter out current user
        const users = response.data.data.filter(
          (user: AdminUser) => user.id !== currentUserId
        );
        setAdminUsers(users);
      } else {
        setAdminUsers([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setAdminUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !socket) {
      return;
    }

    setIsLoading(true);

    try {
      const payload: StartDirectChatPayload = {
        withAdminId: selectedUser.id,
        category: category || undefined,
        priority: priority,
      };

      console.log("checekc waht apualoda", payload);

      const chat = await adminChatSocket.startDirectChat(socket, payload);

      onChatStarted?.(chat);
      setOpen(false);

      // Reset form
      setSelectedUser(null);
      setSearchQuery("");
      setCategory("");
      setPriority("medium");
      setAdminUsers([]);
    } catch (error) {
      console.error("Error starting direct chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Start Chat
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="00 w-96">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Start Direct Chat</span>
            </DialogTitle>
            <DialogDescription>
              Start a private conversation with another admin or customer care
              representative.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Search */}
            <div className="space-y-2">
              <Label>Select User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {adminUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.avatar?.url}
                        alt={getFullName(user)}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-medium">
                        {(
                          user.first_name?.[0] ||
                          user.email?.[0] ||
                          "?"
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {getFullName(user) || user.email}
                        </h4>
                        {user.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {user.email}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {getRoleLabel(user.logged_in_as)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {adminUsers.length === 0 &&
                !isSearching &&
                searchQuery.trim() && (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                )}
            </div>

            {selectedUser && (
              <>
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                          priority === p.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setPriority(p.value as any)}
                      >
                        <Badge className={p.color}>{p.label}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedUser}>
              {isLoading ? "Starting..." : "Start Chat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
