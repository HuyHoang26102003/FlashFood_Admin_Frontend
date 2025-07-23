// src/app/notifications-manager/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAdminStore } from "@/stores/adminStore";
import { formatEpochToDate } from "@/utils/functions/formatDate";
import { Spinner } from "@/components/Spinner";
import { SimplePagination } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";

// Định nghĩa type cho Notification
interface Avatar {
  url: string;
  key: string;
}

interface TargetContent {
  avatar?: Avatar;
  title: string;
  desc: string;
  image?: Avatar; // Thay đổi từ string sang Avatar để đồng nhất với upload
  link?: string;
}

interface Notification {
  id: string;
  avatar: Avatar;
  title: string;
  desc: string;
  image?: Avatar; // Thay đổi từ string sang Avatar
  link?: string;
  target_user: string[];
  target_user_id?: string | null;
  created_by_id: string;
  created_by?: { first_name: string; last_name: string };
  created_at: string;
  updated_at: string | null;
}

interface BroadcastNotification {
  avatar: Avatar;
  target_user: string[];
  created_by_id: string;
  content: {
    customer?: TargetContent;
    restaurant?: TargetContent;
    driver?: TargetContent;
    customer_care?: TargetContent;
  };
}

const Page = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [newBroadcast, setNewBroadcast] =
    useState<BroadcastNotification | null>(null);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openAdd, setOpenAdd] = useState<boolean>(false);
  const adminZ = useAdminStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/notifications/paginated?page=${currentPage}&limit=10`
      );
      const { EC, data } = response.data;
      if (EC === 0 && data) {
        setNotifications(data.items);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  // Handle mở modal edit
  const handleEdit = (notification: Notification) => {
    setSelectedNotification(notification);
    setOpenEdit(true);
  };

  // Handle mở modal add (broadcast)
  const handleOpenAdd = () => {
    setNewBroadcast({
      target_user: ["CUSTOMER"],
      created_by_id: adminZ?.id || "",
      content: {
        customer: {
          // avatar: { url: "", key: "" },
          title: "",
          desc: "",
          image: { url: "", key: "" }, // Khởi tạo image như Avatar
        },
      },
    });
    setOpenAdd(true);
  };

  // Handle submit chỉnh sửa notification
  const handleSaveEdit = async () => {
    if (!selectedNotification) return;
    try {
      const response = await axiosInstance.patch(
        `/notifications/${selectedNotification.id}`,
        {
          avatar: { url: selectedNotification.avatar.url, key: "abc" },
          title: selectedNotification.title,
          desc: selectedNotification.desc,
          image: selectedNotification.image?.url, // Gửi URL của image
          link: selectedNotification.link,
          target_user: selectedNotification.target_user,
        }
      );
      const { EC } = response.data;
      if (EC === 0) {
        setOpenEdit(false);
        fetchNotifications();
        toast({
          title: "Success",
          description: "Notification updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update notification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAdd = async () => {
    if (!newBroadcast) return;

    try {
      // Tạo bản sao của newBroadcast
      const updatedBroadcast = {
        ...newBroadcast,
        avatar: { url: newBroadcast.avatar.url, key: "abc" },
      };

      // Lọc content để chỉ giữ lại các role trong target_user
      const filteredContent: typeof updatedBroadcast.content = {};
      updatedBroadcast.target_user.forEach((target) => {
        const roleKey =
          target.toLowerCase() as keyof typeof newBroadcast.content;
        const roleContent = newBroadcast.content[roleKey];

        if (roleContent) {
          // Nếu image.url rỗng hoặc không tồn tại, set image thành undefined
          const updatedRoleContent = {
            ...roleContent,
            avatar: roleContent.avatar?.url || "", // Gửi URL của avatar
            image: roleContent.image?.url, // Gửi URL của image
            title: roleContent.title || "",
            desc: roleContent.desc || "",
            link: roleContent.link || "",
          };
          filteredContent[roleKey] = updatedRoleContent;
        }
      });

      // Cập nhật updatedBroadcast chỉ với content đã lọc
      updatedBroadcast.content = filteredContent;

      // Gửi request với updatedBroadcast
      console.log("Request body:", JSON.stringify(updatedBroadcast, null, 2));
      const response = await axiosInstance.post(
        "/notifications/broadcast",
        updatedBroadcast
      );
      const { EC, EM } = response.data;
      if (EC === 0) {
        fetchNotifications();
        setOpenAdd(false);
        toast({
          title: "Success",
          description: "Broadcast sent successfully.",
        });
      } else {
        console.error("Broadcast failed:", EM);
        toast({
          title: "Error",
          description: "Failed to send broadcast.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Handle thay đổi giá trị trong form (edit)
  const handleChangeEdit = (
    field: keyof Notification,
    value: string | string[] | Avatar
  ) => {
    setSelectedNotification((prev) =>
      prev ? { ...prev, [field]: value } : null
    );
  };

  // Handle thay đổi giá trị trong form (add)
  const handleChangeAdd = (
    target: string,
    field: keyof TargetContent,
    value: string | Avatar
  ) => {
    setNewBroadcast((prev) =>
      prev
        ? {
            ...prev,
            content: {
              ...prev.content,
              [target.toLowerCase()]: {
                ...prev.content[
                  target.toLowerCase() as keyof typeof prev.content
                ],
                [field]: value,
              },
            },
          }
        : null
    );
  };

  // Handle thay đổi target_user trong broadcast
  const handleTargetUserChange = (value: string[]) => {
    setNewBroadcast((prev) => {
      if (!prev) return null;
      const newContent = { ...prev.content };
      value.forEach((target) => {
        if (!newContent[target.toLowerCase() as keyof typeof newContent]) {
          newContent[target.toLowerCase() as keyof typeof newContent] = {
            avatar: { url: "", key: "" },
            title: "",
            desc: "",
            image: { url: "", key: "" }, // Khởi tạo image như Avatar
          };
        }
      });
      return { ...prev, target_user: value, content: newContent };
    });
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle upload ảnh lên Cloudinary
  const handleImageUpload = async (
    isEdit: boolean,
    target: string | null, // null cho edit, target cho add
    field: "avatar" | "image", // Phân biệt avatar hay image
    files: FileList
  ) => {
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axiosInstance.post(`upload/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const uploadResponse = response.data;

      if (
        uploadResponse.EC === 0 &&
        uploadResponse.data?.url &&
        uploadResponse.data?.public_id
      ) {
        const uploadedImage = {
          url: uploadResponse.data.url,
          key: uploadResponse.data.public_id,
        };

        if (isEdit) {
          setSelectedNotification((prev) =>
            prev ? { ...prev, [field]: uploadedImage } : null
          );
        } else if (target) {
          handleChangeAdd(target, field, uploadedImage);
        }
      } else {
        console.error("Image upload failed:", uploadResponse.EM);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  // Apply latest notification
  const handleApplyLatest = () => {
    const latestNotification = notifications[notifications.length - 1];
    if (latestNotification) {
      setNewBroadcast((prev) =>
        prev
          ? {
              ...prev,
              target_user: [...latestNotification.target_user],
              content: {
                customer: latestNotification.target_user.includes("CUSTOMER")
                  ? {
                      avatar: latestNotification.avatar,
                      title: latestNotification.title,
                      desc: latestNotification.desc,
                      image: latestNotification.image,
                      link: latestNotification.link,
                    }
                  : undefined,
                restaurant: latestNotification.target_user.includes(
                  "RESTAURANT"
                )
                  ? {
                      avatar: latestNotification.avatar,
                      title: latestNotification.title,
                      desc: latestNotification.desc,
                      image: latestNotification.image,
                      link: latestNotification.link,
                    }
                  : undefined,
                driver: latestNotification.target_user.includes("DRIVER")
                  ? {
                      avatar: latestNotification.avatar,
                      title: latestNotification.title,
                      desc: latestNotification.desc,
                      image: latestNotification.image,
                      link: latestNotification.link,
                    }
                  : undefined,
                customer_care: latestNotification.target_user.includes(
                  "CUSTOMER_CARE"
                )
                  ? {
                      avatar: latestNotification.avatar,
                      title: latestNotification.title,
                      desc: latestNotification.desc,
                      image: latestNotification.image,
                      link: latestNotification.link,
                    }
                  : undefined,
              },
            }
          : null
      );
    }
  };

  // Định nghĩa columns cho react-table
  const columns: ColumnDef<Notification>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("title")}</div>,
    },
    {
      accessorKey: "target_user",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Target User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const targetUsers = row.getValue("target_user") as string[];
        return <div>{targetUsers.join(", ") || "N/A"}</div>;
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>{formatEpochToDate(Number(row.getValue("created_at")))}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const notification = row.original;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32">
              <div className="grid gap-4">
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => handleEdit(notification)}
                >
                  <span>Edit</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
  ];

  const table = useReactTable({
    data: notifications,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto p-4">
      <Spinner isVisible={isLoading} isOverlay />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notifications Manager</h1>
        <Button onClick={handleOpenAdd}>Broadcast Notification</Button>
      </div>

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

      <div className="mt-4">
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modal chỉnh sửa notification */}
      {selectedNotification && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="h-[90vh] w-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>
                Edit Notification - {selectedNotification.id}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="avatar" className="text-right">
                  Avatar
                </Label>
                <label className="col-span-3 flex items-center gap-2">
                  <input
                    type="file"
                    hidden
                    onChange={(e) =>
                      e.target.files &&
                      handleImageUpload(true, null, "avatar", e.target.files)
                    }
                  />
                  {selectedNotification.avatar.url && (
                    <img
                      src={selectedNotification.avatar.url}
                      alt="preview"
                      className="w-12 h-12 rounded-md"
                    />
                  )}
                  <span>
                    {selectedNotification.avatar.url
                      ? "Change Avatar"
                      : "Upload Avatar"}
                  </span>
                </label>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={selectedNotification.title}
                  onChange={(e) => handleChangeEdit("title", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desc" className="text-right">
                  Description
                </Label>
                <Input
                  id="desc"
                  value={selectedNotification.desc}
                  onChange={(e) => handleChangeEdit("desc", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  Image
                </Label>
                <label className="col-span-3 flex items-center gap-2">
                  <input
                    type="file"
                    hidden
                    onChange={(e) =>
                      e.target.files &&
                      handleImageUpload(true, null, "image", e.target.files)
                    }
                  />
                  {selectedNotification.image?.url && (
                    <img
                      src={selectedNotification.image.url}
                      alt="preview"
                      className="w-12 h-12 rounded-md"
                    />
                  )}
                  <span className="rounded-md bg-primary px-2 border hover:bg-emerald-400 border-gray-100 cursor-pointer hover:duration-200 shadow-sm">
                    {selectedNotification.image?.url
                      ? "Change Image"
                      : "Upload Image"}
                  </span>
                </label>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="link" className="text-right">
                  Link
                </Label>
                <Input
                  id="link"
                  value={selectedNotification.link || ""}
                  onChange={(e) => handleChangeEdit("link", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target_user" className="text-right">
                  Target User
                </Label>
                <select
                  id="target_user"
                  multiple
                  value={selectedNotification.target_user}
                  onChange={(e) =>
                    handleChangeEdit(
                      "target_user",
                      Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      )
                    )
                  }
                  className="col-span-3 border rounded-md p-2 h-24"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="RESTAURANT">RESTAURANT</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="CUSTOMER_CARE">CUSTOMER_CARE</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenEdit(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal thêm broadcast notification */}
      {newBroadcast && (
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className="h-[90vh] w-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Broadcast Notification</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target_user" className="text-right">
                  Target User
                </Label>
                <select
                  id="target_user"
                  multiple
                  value={newBroadcast.target_user}
                  onChange={(e) =>
                    handleTargetUserChange(
                      Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      )
                    )
                  }
                  className="col-span-3 border rounded-md p-2 h-24"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="RESTAURANT">RESTAURANT</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="CUSTOMER_CARE">CUSTOMER_CARE</option>
                </select>
              </div>
              {newBroadcast.target_user.map((target) => (
                <div key={target} className="grid gap-2 border p-4 rounded-md">
                  <h3 className="text-lg font-semibold">{target}</h3>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`${target}_avatar`} className="text-right">
                      Avatar
                    </Label>
                    <label className="col-span-3 flex items-center gap-2">
                      <input
                        type="file"
                        hidden
                        onChange={(e) =>
                          e.target.files &&
                          handleImageUpload(
                            false,
                            target,
                            "avatar",
                            e.target.files
                          )
                        }
                      />
                      {newBroadcast.content[
                        target.toLowerCase() as keyof typeof newBroadcast.content
                      ]?.avatar?.url && (
                        <img
                          src={
                            newBroadcast.content[
                              target.toLowerCase() as keyof typeof newBroadcast.content
                            ]!.avatar?.url
                          }
                          alt="preview"
                          className="w-12 h-12 rounded-md"
                        />
                      )}
                      <span>
                        {newBroadcast.content[
                          target.toLowerCase() as keyof typeof newBroadcast.content
                        ]?.avatar?.url
                          ? "Change Avatar"
                          : "Upload Avatar"}
                      </span>
                    </label>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`${target}_title`} className="text-right">
                      Title
                    </Label>
                    <Input
                      id={`${target}_title`}
                      value={
                        newBroadcast.content[
                          target.toLowerCase() as keyof typeof newBroadcast.content
                        ]?.title || ""
                      }
                      onChange={(e) =>
                        handleChangeAdd(target, "title", e.target.value)
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`${target}_desc`} className="text-right">
                      Description
                    </Label>
                    <Input
                      id={`${target}_desc`}
                      value={
                        newBroadcast.content[
                          target.toLowerCase() as keyof typeof newBroadcast.content
                        ]?.desc || ""
                      }
                      onChange={(e) =>
                        handleChangeAdd(target, "desc", e.target.value)
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`${target}_image`} className="text-right">
                      Image
                    </Label>
                    <label className="col-span-3 flex items-center gap-2">
                      <input
                        type="file"
                        hidden
                        onChange={(e) =>
                          e.target.files &&
                          handleImageUpload(
                            false,
                            target,
                            "image",
                            e.target.files
                          )
                        }
                      />
                      {newBroadcast.content[
                        target.toLowerCase() as keyof typeof newBroadcast.content
                      ]?.image?.url && (
                        <img
                          src={
                            newBroadcast.content[
                              target.toLowerCase() as keyof typeof newBroadcast.content
                            ]!.image!.url
                          }
                          alt="preview"
                          className="w-12 h-12 rounded-md"
                        />
                      )}
                      <span>
                        {newBroadcast.content[
                          target.toLowerCase() as keyof typeof newBroadcast.content
                        ]?.image?.url
                          ? "Change Image"
                          : "Upload Image"}
                      </span>
                    </label>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`${target}_link`} className="text-right">
                      Link
                    </Label>
                    <Input
                      id={`${target}_link`}
                      value={
                        newBroadcast.content[
                          target.toLowerCase() as keyof typeof newBroadcast.content
                        ]?.link || ""
                      }
                      onChange={(e) =>
                        handleChangeAdd(target, "link", e.target.value)
                      }
                      className="col-span-3"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleApplyLatest}>
                Apply Latest Notification
              </Button>
              <Button variant="outline" onClick={() => setOpenAdd(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdd}>Broadcast</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Page;
