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
} from "@/components/ui/dialog";

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
  const [error, setError] = useState<string | null>(null);
  const { user } = useAdminStore();
  const [selectedPermissions, setSelectedPermissions] = useState<
    AdminPermission[]
  >([]);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

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
    setSelectedAdmin(admin);
    setSelectedPermissions(admin.permissions);
    setIsPermissionsDialogOpen(true);
    setOpenPopoverId(null);
  };

  const handlePermissionChange = (
    permission: AdminPermission,
    checked: boolean
  ) => {
    setSelectedPermissions((prev) =>
      checked ? [...prev, permission] : prev.filter((p) => p !== permission)
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedAdmin || !user?.id) return;
    try {
      const response = await superAdminService.updateAdminPermissions(
        selectedAdmin.id,
        {
          permissions: selectedPermissions,
          requesterId: user.id,
        }
      );

      if (response.EC === 0) {
        // Refresh the admin list after successful update
        const adminListResponse = await superAdminService.getAllAdmin();
        if (adminListResponse.EC === 0) {
          setAdmins(adminListResponse.data);
        }
      } else {
        console.error("Failed to update permissions:", response.EM);
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
    }
    setIsPermissionsDialogOpen(false);
    setSelectedAdmin(null);
    setSelectedPermissions([]);
  };

  const handleCancelPermissions = () => {
    setIsPermissionsDialogOpen(false);
    setSelectedAdmin(null);
    setSelectedPermissions([]);
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
      accessorKey: "rple",
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
          <>
            <Popover
              open={openPopoverId === admin.id}
              onOpenChange={(open) => setOpenPopoverId(open ? admin.id : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
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

            <Dialog
              open={isPermissionsDialogOpen}
              onOpenChange={setIsPermissionsDialogOpen}
            >
              <DialogContent className="w-full overflow-y-auto h-[90]">
                <DialogHeader>
                  <DialogTitle>Manage Permissions</DialogTitle>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto py-4">
                  <div className="space-y-2">
                    {Object.values(AdminPermission).map((permission) => (
                      <div
                        key={permission}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={permission}
                          checked={selectedPermissions.includes(permission)}
                          onCheckedChange={(checked) => {
                            handlePermissionChange(
                              permission,
                              checked as boolean
                            );
                          }}
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
                  <Button variant="outline" onClick={handleCancelPermissions}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePermissions}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
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
    </div>
  );
};

export default Page;
