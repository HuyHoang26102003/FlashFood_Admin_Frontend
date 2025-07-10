import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AdminChatRoom } from "@/types/admin-chat";
import { Socket } from "socket.io-client";

interface GroupSettingsDialogProps {
  room: AdminChatRoom;
  socket: Socket | null;
  trigger: React.ReactNode;
}

export default function GroupSettingsDialog({
  room,
  socket,
  trigger,
}: GroupSettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-96 h-[90%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Settings: {room.groupName}</DialogTitle>
        </DialogHeader>
        <div>
          <p>Settings and participant management will be implemented here.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 