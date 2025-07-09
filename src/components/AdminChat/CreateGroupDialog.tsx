"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Users } from "lucide-react";
import { adminChatSocket } from "@/lib/adminChatSocket";
import { CreateGroupPayload } from "@/types/admin-chat";

interface CreateGroupDialogProps {
  socket: any;
  onGroupCreated?: (group: any) => void;
  trigger?: React.ReactNode;
}

export default function CreateGroupDialog({
  socket,
  onGroupCreated,
  trigger,
}: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    groupName: "",
    groupDescription: "",
    category: "",
    tags: [] as string[],
    isPublic: false,
    maxParticipants: 50,
    allowedRoles: [
      "SUPER_ADMIN",
      "FINANCE_ADMIN",
      "COMPANION_ADMIN",
      "CUSTOMER_CARE_REPRESENTATIVE",
    ] as string[],
  });
  const [newTag, setNewTag] = useState("");

  const roles = [
    { id: "SUPER_ADMIN", label: "Super Admin" },
    { id: "FINANCE_ADMIN", label: "Finance Admin" },
    { id: "COMPANION_ADMIN", label: "Companion Admin" },
    { id: "CUSTOMER_CARE_REPRESENTATIVE", label: "Customer Care" },
  ];

  const categories = [
    "General",
    "Order Issues",
    "Technical Support",
    "Finance",
    "Management",
    "Emergency",
  ];

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        allowedRoles: [...formData.allowedRoles, roleId],
      });
    } else {
      setFormData({
        ...formData,
        allowedRoles: formData.allowedRoles.filter((role) => role !== roleId),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.groupName.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload: CreateGroupPayload = {
        groupName: formData.groupName.trim(),
        groupDescription: formData.groupDescription.trim() || undefined,
        category: formData.category || undefined,
        tags: formData.tags,
        isPublic: formData.isPublic,
        maxParticipants: formData.maxParticipants,
        allowedRoles: formData.allowedRoles,
      };

      const group = await adminChatSocket.createAdminGroup(socket, payload);

      onGroupCreated?.(group);
      setOpen(false);

      // Reset form
      setFormData({
        groupName: "",
        groupDescription: "",
        category: "",
        tags: [],
        isPublic: false,
        maxParticipants: 50,
        allowedRoles: [
          "SUPER_ADMIN",
          "FINANCE_ADMIN",
          "COMPANION_ADMIN",
          "CUSTOMER_CARE_REPRESENTATIVE",
        ],
      });
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md w-96">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Create New Group</span>
            </DialogTitle>
            <DialogDescription>
              Create a new chat group for team collaboration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={formData.groupName}
                onChange={(e) =>
                  setFormData({ ...formData, groupName: e.target.value })
                }
                placeholder="Enter group name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.groupDescription}
                onChange={(e) =>
                  setFormData({ ...formData, groupDescription: e.target.value })
                }
                placeholder="Brief description of the group"
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
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

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Allowed Roles */}
            <div className="space-y-2">
              <Label>Allowed Roles</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.id}
                      checked={formData.allowedRoles.includes(role.id)}
                      onCheckedChange={(checked) =>
                        handleRoleChange(role.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={role.id} className="text-sm">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="2"
                max="100"
                value={formData.maxParticipants}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxParticipants: parseInt(e.target.value) || 50,
                  })
                }
              />
            </div>

            {/* Public Group */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublic: checked as boolean })
                }
              />
              <Label htmlFor="isPublic">
                Public group (anyone with allowed role can join)
              </Label>
            </div>
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
            <Button
              type="submit"
              disabled={isLoading || !formData.groupName.trim()}
            >
              {isLoading ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
