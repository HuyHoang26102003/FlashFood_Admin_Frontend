"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Check, Plus, Search, User, Users, X } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { adminChatSocket } from "@/lib/adminChatSocket";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";

interface InviteToGroupDialogProps {
  socket: any;
  groupId: string;
  onInviteSent?: () => void;
  trigger?: React.ReactNode;
}

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar?: {
    url: string;
    key: string
  };
}

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export default function InviteToGroupDialog({
  socket,
  groupId,
  onInviteSent,
  trigger,
}: InviteToGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([]);
  const [invitationMessage, setInvitationMessage] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { toast } = useToast();

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/admin/internal-users/search?keyword=${query}`
      );
      if (response.data.EC === 0) {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching for users:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, handleSearch]);

  const toggleUserSelection = (user: AdminUser) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to invite.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const invitedUserIds = selectedUsers.map((u) => u.id);
      await adminChatSocket.sendGroupInvitation(socket, {
        groupId,
        invitedUserIds,
        message: invitationMessage,
      });

      toast({
        title: "Invitations sent",
        description: `Successfully sent invitations to ${selectedUsers.length} user(s).`,
      });

      setOpen(false);
      setSelectedUsers([]);
      setSearchQuery("");
      setInvitationMessage("");
      onInviteSent?.();
    } catch (error: any) {
      console.error("Error sending invitations:", error);
      toast({
        title: "Error sending invitations",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-transparent border-none shadow-none" asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Invite to Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-96 h-96 overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Invite to Group</span>
            </DialogTitle>
            <DialogDescription>
              Search for users to invite to this group chat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="h-48">
              <div className="space-y-2">
                {isLoading && <p>Loading...</p>}
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user)}
                    className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user?.avatar?.url} />
                        <AvatarFallback>
                          {user.first_name[0]}
                          {user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {selectedUsers.find((u) => u.id === user.id) && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Users</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {user.first_name} {user.last_name}
                      <button
                        type="button"
                        onClick={() => toggleUserSelection(user)}
                        className="rounded-full hover:bg-gray-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="invitation-message">
                Invitation Message (Optional)
              </Label>
              <Input
                id="invitation-message"
                placeholder="e.g., Join our project discussion!"
                value={invitationMessage}
                onChange={(e) => setInvitationMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || selectedUsers.length === 0}
            >
              {isLoading ? "Sending..." : `Send Invite(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
