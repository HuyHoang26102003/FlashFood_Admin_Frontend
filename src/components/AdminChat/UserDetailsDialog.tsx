"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminProfile, CustomerCareProfile } from "@/types/user-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Briefcase } from "lucide-react";

interface UserDetailsDialogProps {
  user: AdminProfile | CustomerCareProfile | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-4 py-2">
      <dt className="text-sm text-gray-500 col-span-1">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 col-span-2">{value}</dd>
    </div>
);

export default function UserDetailsDialog({ user, isOpen, setIsOpen }: UserDetailsDialogProps) {
  if (!user) return null;
  
  const isCC = "available_for_work" in user;
  const userRole = isCC ? "Customer Care" : (user as AdminProfile).role;
  const email = isCC ? (user as CustomerCareProfile).contact_email[0]?.email : (user as AdminProfile).user.email;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-6 w-6 mr-2" />
            User Profile
          </DialogTitle>
           <DialogDescription>
            Details for {user.first_name} {user.last_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-4">
                 <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar?.url} />
                    <AvatarFallback className="text-2xl">
                        {user.first_name?.[0]?.toUpperCase()}
                        {user.last_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-xl font-bold">{user.first_name} {user.last_name}</h3>
                    <p className="text-gray-500">{email}</p>
                    <Badge variant="outline" className="mt-2">{userRole.replace(/_/g, ' ')}</Badge>
                </div>
            </div>

            {isCC ? (
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center"><Briefcase className="h-4 w-4 mr-2"/>Work Status</h4>
                    <DetailRow label="Availability" value={<Badge variant={(user as CustomerCareProfile).available_for_work ? 'default' : 'secondary'}>{(user as CustomerCareProfile).available_for_work ? 'Available' : 'Unavailable'}</Badge>} />
                    <DetailRow label="Currently Assigned" value={(user as CustomerCareProfile).is_assigned ? 'Yes' : 'No'} />
                    <DetailRow label="Active Workload" value={(user as CustomerCareProfile).active_workload} />
                </div>
            ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                     <h4 className="font-semibold mb-2 flex items-center"><Shield className="h-4 w-4 mr-2"/>Admin Details</h4>
                     <DetailRow label="Status" value={<Badge>{(user as AdminProfile).status}</Badge>} />
                     <DetailRow label="Permissions" value={
                         <div className="flex flex-wrap gap-1">
                            {(user as AdminProfile).permissions.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                         </div>
                     } />
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 