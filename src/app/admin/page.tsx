"use client";
import { superAdminService } from "@/services/super-admin/superAdminService";
import { useAdminStore } from "@/stores/adminStore";
import React, { useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import IdCell from "@/components/IdCell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Define enums and types
enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  COMPANION_ADMIN = "COMPANION_ADMIN",
  FINANCE_ADMIN = "FINANCE_ADMIN",
}

enum AdminPermission {
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_RESTAURANTS = "MANAGE_RESTAURANTS",
  MANAGE_ORDERS = "MANAGE_ORDERS",
  MANAGE_PROMOTIONS = "MANAGE_PROMOTIONS",
  MANAGE_PAYMENTS = "MANAGE_PAYMENTS",
  MANAGE_SUPPORT = "MANAGE_SUPPORT",
  MANAGE_DRIVERS = "MANAGE_DRIVERS",
  BAN_ACCOUNTS = "BAN_ACCOUNTS",
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
  MANAGE_ADMINS = "MANAGE_ADMINS",
}

enum AdminStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

interface Admin {
  id: string;
  role: AdminRole;
  avatar: { url: string; key: string } | null;
  permissions: AdminPermission[];
  last_active: string | null;
  created_at: string;
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
  status: AdminStatus;
}

const Page = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAdminStore();
  const { toast } = useToast();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    admin: Admin | null;
    originalPermissions: AdminPermission[];
    currentPermissions: AdminPermission[];
    changedPermissions: AdminPermission[];
  }>({
    isOpen: false,
    admin: null,
    originalPermissions: [],
    currentPermissions: [],
    changedPermissions: [],
  });

  useEffect(() => {
    const fetchAllAdmin = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await superAdminService.getAllAdmin();
        if (response.EC === 0) {
          setAdmins(response.data);
        } else {
          setError(response.EM || "Failed to fetch admins");
        }
      } catch (error) {
        console.error("Error fetching admins:", error);
        setError("An error occurred while fetching admins");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAdmin();
  }, []);

  const handleAdjustPermissions = (admin: Admin) => {
    // Store both original and current permissions
    const adminPermissions = [...admin.permissions];
    setDialogState({
      isOpen: true,
      admin,
      originalPermissions: adminPermissions,
      currentPermissions: adminPermissions,
      changedPermissions: [],
    });
    setOpenPopoverId(null);
  };

  const handlePermissionChange = (
    permission: AdminPermission,
    checked: boolean
  ) => {
    setDialogState((prev) => {
      // Update current permissions
      const newCurrentPermissions = checked
        ? [...prev.currentPermissions, permission]
        : prev.currentPermissions.filter((p) => p !== permission);

      // Calculate if this is a real change from original state
      const wasOriginallyChecked =
        prev.originalPermissions.includes(permission);

      let newChangedPermissions = [...prev.changedPermissions];

      if (wasOriginallyChecked !== checked) {
        // This permission was changed by the user
        if (!newChangedPermissions.includes(permission)) {
          newChangedPermissions.push(permission);
        }
      } else {
        // This permission was changed back to its original state
        newChangedPermissions = newChangedPermissions.filter(
          (p) => p !== permission
        );
      }

      return {
        ...prev,
        currentPermissions: newCurrentPermissions,
        changedPermissions: newChangedPermissions,
      };
    });
  };

  const handleSavePermissions = async () => {
    if (!dialogState.admin || !user?.id) return;

    // Only send the permissions that were actually changed by the user
    const changedPermissions = dialogState.changedPermissions;

    // We need to know which permissions to add and which to remove
    const permissionsToUpdate = dialogState.changedPermissions.map(
      (permission) => {
        return {
          permission,
          action: dialogState.currentPermissions.includes(permission)
            ? "add"
            : "remove",
        };
      }
    );

    try {
      setIsSaving(true);
      console.log("Changed permissions:", changedPermissions);
      console.log("Permissions to update:", permissionsToUpdate);

      const response = await superAdminService.updateAdminPermissions(
        dialogState.admin.id,
        {
          permissions: changedPermissions,
          // requesterId: user.id,
        }
      );

      if (response.EC === 0) {
        const adminListResponse = await superAdminService.getAllAdmin();
        if (adminListResponse.EC === 0) {
          setAdmins(adminListResponse.data);
          toast({
            title: "Success",
            description: "Permissions updated successfully",
          });
        }
      } else {
        toast({
          title: "Error",
          description: response.EM || "Failed to update permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating permissions",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setDialogState({
        isOpen: false,
        admin: null,
        originalPermissions: [],
        currentPermissions: [],
        changedPermissions: [],
      });
    }
  };

  const handleCancelPermissions = () => {
    setDialogState({
      isOpen: false,
      admin: null,
      originalPermissions: [],
      currentPermissions: [],
      changedPermissions: [],
    });
  };

  const columns: ColumnDef<Admin>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <IdCell id={row.getValue("id")} />,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const admin = row.original;
        return (
          <div>
            {admin.first_name || admin.last_name
              ? `${admin.first_name || ""} ${admin.last_name || ""}`
              : "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const admin = row.original;
        return <div>{admin.role}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue("status") === AdminStatus.ACTIVE
              ? "default"
              : row.getValue("status") === AdminStatus.SUSPENDED
              ? "outline"
              : "destructive"
          }
        >
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const admin = row.original;
        const canManagePermissions =
          admin.role !== AdminRole.SUPER_ADMIN && admin.id !== user?.id;

        return (
          <Popover
            open={openPopoverId === admin.id}
            onOpenChange={(open) => setOpenPopoverId(open ? admin.id : null)}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-48"
              align="end"
              side="left"
              sideOffset={5}
            >
              <div className="grid gap-2">
                {canManagePermissions && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAdjustPermissions(admin)}
                  >
                    Adjust Permissions
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
  ];

  const table = useReactTable({
    data: admins,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner isVisible={true} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={dialogState.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelPermissions();
          }
        }}
      >
        <DialogContent className="w-full overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Adjust permissions for {dialogState.admin?.first_name}{" "}
              {dialogState.admin?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {Object.values(AdminPermission).map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission}
                    checked={dialogState.currentPermissions.includes(
                      permission
                    )}
                    onCheckedChange={(checked) => {
                      if (typeof checked === "boolean") {
                        handlePermissionChange(permission, checked);
                      }
                    }}
                    aria-label={`Toggle ${permission} permission`}
                    disabled={isSaving}
                  />
                  <label
                    htmlFor={permission}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            {dialogState.changedPermissions.length > 0 && (
              <p className="text-xs text-muted-foreground mr-auto">
                {dialogState.changedPermissions.length} permission(s) changed
              </p>
            )}
            <Button
              variant="outline"
              onClick={handleCancelPermissions}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={dialogState.changedPermissions.length === 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
