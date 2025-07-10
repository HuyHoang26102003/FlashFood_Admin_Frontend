"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { AdminProfile, CustomerCareProfile } from "@/types/user-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserDetailsDialog from "./UserDetailsDialog";

interface UserHoverContentProps {
  userId: string;
}

export default function UserHoverContent({ userId }: UserHoverContentProps) {
  const [user, setUser] = useState<AdminProfile | CustomerCareProfile | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      let url = "";
      if (userId.startsWith("FF_CC_")) {
        url = `/customer-cares/${userId}`;
      } else if (userId.startsWith("FF_ADMIN_")) {
        url = `/admin/${userId}`;
      } else {
        // Fallback for other user types if any, e.g. USR_
        // For now, let's assume it might be a generic user lookup
        setError("Unknown or unsupported user type for profile card.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(url);
        if (response.data.EC === 0) {
          setUser(response.data.data);
        } else {
          setError(response.data.EM || "Failed to fetch user details.");
        }
      } catch (err) {
        setError("An error occurred while fetching user details.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 w-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md w-64">
        {error}
      </div>
    );
  }

  if (!user) {
    return <div className="p-4 text-sm w-64">No user details found.</div>;
  }

  const isCC = "available_for_work" in user;
  const userRole = isCC ? "Customer Care" : (user as AdminProfile).role;
  const email = isCC
    ? (user as CustomerCareProfile).contact_email[0]?.email
    : (user as AdminProfile).user.email;

  return (
    <>
      <div className="p-3 space-y-3 max-w-xs">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar?.url} />
            <AvatarFallback>
              {user.first_name?.[0]?.toUpperCase()}
              {user.last_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">
              {user.first_name} {user.last_name}
            </h4>
            <p className="text-sm text-gray-500 truncate">{email}</p>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <Badge variant="outline">{userRole.replace(/_/g, " ")}</Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDialogOpen(true)}
          >
            View Profile
          </Button>
        </div>
      </div>
      <UserDetailsDialog
        user={user}
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
      />
    </>
  );
} 