import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AdminChatRoom } from "@/types/admin-chat";
import { adminChatSocket } from "@/lib/adminChatSocket";
import { Socket } from "socket.io-client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, UserX, UserCheck } from "lucide-react";

interface GroupSettingsDialogProps {
  room: AdminChatRoom;
  socket: Socket | null;
  currentUserId: string;
  trigger: React.ReactNode;
}

export default function GroupSettingsDialog({
  room,
  socket,
  currentUserId,
  trigger,
}: GroupSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState(room.groupName || "");
  const [groupDescription, setGroupDescription] = useState(
    room.groupDescription || ""
  );
  const [tags, setTags] = useState(room.tags?.join(", ") || "");
  const [isPublic, setIsPublic] = useState(room.isPublic || false);
  const { toast } = useToast();

  const currentUserParticipant = useMemo(
    () => room.participants.find((p) => p.userId === currentUserId),
    [room.participants, currentUserId]
  );

  const canManageSettings =
    currentUserParticipant?.role === "CREATOR" ||
    currentUserParticipant?.role === "ADMIN";

  const handleSaveChanges = () => {
    if (!socket || !canManageSettings) return;

    adminChatSocket.updateGroupSettings(socket, {
      groupId: room.id,
      groupName,
      groupDescription,
      tags: tags.split(",").map((t) => t.trim()),
      isPublic,
    });

    toast({
      title: "Settings Updated",
      description: "Group settings have been sent for update.",
    });
    setOpen(false);
  };

  const handleManageParticipant = (
    participantId: string,
    action: "PROMOTE" | "DEMOTE" | "REMOVE",
    newRole?: "CREATOR" | "ADMIN" | "MEMBER"
  ) => {
    if (!socket || !canManageSettings) return;

    adminChatSocket.manageGroupParticipant(socket, {
      groupId: room.id,
      participantId,
      action,
      newRole,
    });

    toast({
      title: "Action Sent",
      description: `The action '${action}' for the participant has been sent.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-full h-[90%]  overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Group Settings: {room.groupName}</DialogTitle>
          <DialogDescription>
            Manage your group settings and participants.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="font-medium">General Settings</h4>
            <div className="grid gap-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={!canManageSettings}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group-desc">Group Description</Label>
              <Textarea
                id="group-desc"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                disabled={!canManageSettings}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group-tags">Tags (comma-separated)</Label>
              <Input
                id="group-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={!canManageSettings}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is-public">Public Group</Label>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={!canManageSettings}
              />
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium">Participants</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {room.participants.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback>
                        {p.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.role}</p>
                    </div>
                  </div>
                  {canManageSettings && p.userId !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {p.role === "MEMBER" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleManageParticipant(
                                p.userId,
                                "PROMOTE",
                                "ADMIN"
                              )
                            }
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Promote to group administrator</span>
                          </DropdownMenuItem>
                        )}
                        {p.role === "ADMIN" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleManageParticipant(
                                p.userId,
                                "DEMOTE",
                                "MEMBER"
                              )
                            }
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            <span>Demote to Member</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() =>
                            handleManageParticipant(p.userId, "REMOVE")
                          }
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          <span>Remove from Group</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {canManageSettings && (
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
