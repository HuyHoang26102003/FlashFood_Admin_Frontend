"use client";

import { useState, useEffect } from "react";
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
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Search, User } from "lucide-react";
import { adminChatSocket } from "@/lib/adminChatSocket";
import { StartDirectChatPayload } from "@/types/admin-chat";
import axiosInstance from "@/lib/axios";

interface StartDirectChatDialogProps {
  socket: any;
  currentUserId: string;
  onChatStarted?: (chat: any) => void;
  trigger?: React.ReactNode;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "critical"
  >("medium");
  const [category, setCategory] = useState("");

  // Mock admin users - in real app, this would come from an API
  const [adminUsers] = useState<AdminUser[]>([
    {
      id: "admin1",
      name: "John Smith",
      email: "john@flashfood.com",
      role: "SUPER_ADMIN",
      isOnline: true,
    },
    {
      id: "admin2",
      name: "Sarah Johnson",
      email: "sarah@flashfood.com",
      role: "FINANCE_ADMIN",
      isOnline: false,
    },
    {
      id: "admin3",
      name: "Mike Wilson",
      email: "mike@flashfood.com",
      role: "COMPANION_ADMIN",
      isOnline: true,
    },
    {
      id: "cc1",
      name: "Lisa Brown",
      email: "lisa@flashfood.com",
      role: "CUSTOMER_CARE_REPRESENTATIVE",
      isOnline: true,
    },
    {
      id: "cc2",
      name: "David Lee",
      email: "david@flashfood.com",
      role: "CUSTOMER_CARE_REPRESENTATIVE",
      isOnline: false,
    },
  ]);

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

  const filteredUsers = adminUsers.filter(
    (user) =>
      user.id !== currentUserId &&
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getRoleLabel(user.role)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      return;
    }

    setIsLoading(true);

    try {
      const payload: StartDirectChatPayload = {
        withAdminId: selectedUser.id,
        category: category || undefined,
        priority: priority,
      };

      const chat = await adminChatSocket.startDirectChat(socket, payload);

      onChatStarted?.(chat);
      setOpen(false);

      // Reset form
      setSelectedUser(null);
      setSearchQuery("");
      setCategory("");
      setPriority("medium");
    } catch (error) {
      console.error("Error starting direct chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchAdminUsers = async () => {
      const response = await axiosInstance.get("/admin");
      const { EC, EM, data } = response.data;
      console.log("check data", data);
    };
    fetchAdminUsers();
    console.log("cehck fetch here");
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

      <DialogContent className="bg-red-300 w-96">
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredUsers.map((user) => (
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
                      <div className="w-full h-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white font-medium">
                        {user.name[0].toUpperCase()}
                      </div>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {user.name}
                        </h4>
                        {user.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {user.email}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
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
