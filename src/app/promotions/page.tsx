"use client";
import React, { useEffect, useState } from "react";
import { Eye, Pencil, Power, Trash, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  TableHeader,
  TableBody,
  Table,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { promotionsService } from "@/services/finance-admin/promotionsService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { Spinner } from "@/components/Spinner";
import FallbackImage from "@/components/FallbackImage";
import { Card, CardContent } from "@/components/ui/card";
import IdCell from "@/components/IdCell";

export type Promotion = {
  id: string;
  name: string;
  promotion_cost_price?: number;
  description: string;
  cost: number; // promotion_cost_price
  startDate: number; // epoch timestamp
  endDate: number; // epoch timestamp
  start_date?: number; // epoch timestamp
  end_date?: number; // epoch timestamp
  discount_type: "PERCENTAGE" | "FIXED";
  discount_value: number;
  minimum_order_value: number;
  status: "ACTIVE" | "INACTIVE";
  food_categories: string[];
  avatar?: { url: string; key: string };
};

// Add this interface before the Page component
interface PromotionDetails {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  discount_type: "PERCENTAGE" | "FIXED";
  discount_value: string;
  promotion_cost_price: string;
  minimum_order_value: string;
  avatar?: {
    key: string;
    url: string;
  };
  status: "ACTIVE" | "INACTIVE";
  bogo_details: null | {
    buy_quantity: number;
    get_quantity: number;
    item_id: string;
  };
  created_at: string;
  updated_at: string;
  restaurants?: {
    id: string;
    restaurant_name: string;
    avatar?: {
      key: string;
      url: string;
    };
    status: {
      is_active: boolean;
    };
  }[];
}

const data: Promotion[] = [
  {
    id: "m5gr84i9",
    name: "Summer Special",
    description: "Summer discounts",
    cost: 299.99,
    startDate: new Date("2024-06-01").getTime() / 1000,
    endDate: new Date("2024-08-31").getTime() / 1000,
    discount_type: "PERCENTAGE",
    discount_value: 20,
    minimum_order_value: 500,
    status: "ACTIVE",
    food_categories: ["FF_FC_9aaf160a-d64d-48e5-bcdb-3ccc3329204d"],
  },
];

const Page = () => {
  const [listPromotions, setListPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );
  const [newPromotion, setNewPromotion] = useState<Promotion | null>(null);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openAdd, setOpenAdd] = useState<boolean>(false);
  const [openDetails, setOpenDetails] = useState<boolean>(false);
  const [selectedPromotionDetails, setSelectedPromotionDetails] =
    useState<PromotionDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState<boolean>(false);

  // Handle fetch promotion details
  const handleViewDetails = async (promotionId: string) => {
    setIsDetailsLoading(true);
    try {
      const response = await promotionsService.getDetailPromotion(promotionId);
      if (response.EC === 0) {
        setSelectedPromotionDetails(response.data);
        setOpenDetails(true);
      }
    } catch (error) {
      console.error("Error fetching promotion details:", error);
    }
    setIsDetailsLoading(false);
  };

  const columns: ColumnDef<Promotion>[] = [
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
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Promotion Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "cost",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cost
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("cost"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
        return <div className="font-medium text-center">{formatted}</div>;
      },
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const timestamp = row.getValue("startDate") as number;
        const date = new Date(timestamp * 1000);
        return (
          <div className="text-center">{date.toLocaleDateString("en-GB")}</div>
        );
      },
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          End Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const timestamp = row.getValue("endDate") as number;
        const date = new Date(timestamp * 1000);
        return (
          <div className="text-center">{date.toLocaleDateString("en-GB")}</div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <Button variant="ghost">Actions</Button>,
      cell: ({ row }) => {
        const promotion = row.original;
        console.log("chec kpromotion what", promotion);
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 w-full p-0 text-center">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32">
              <div className="grid gap-4">
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => handleViewDetails(promotion.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Details
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                >
                  <Power className="mr-2 h-4 w-4" />
                  Inactivate
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => handleEdit(promotion)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
  ];

  const table = useReactTable({
    data: listPromotions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    const result = promotionsService.findAllPaginated();
    result
      .then((res) => {
        setListPromotions(
          res.data.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            cost: item.promotion_cost_price,
            startDate: item.start_date,
            endDate: item.end_date,
            discount_type: item.discount_type,
            discount_value: item.discount_value,
            minimum_order_value: item.minimum_order_value,
            status: item.status,
            food_categories: item.food_categories,
            avatar: item.avatar,
          }))
        );
      })
      .catch((err) => {
        console.log("check er", err);
        setListPromotions(data);
      });
  }, []);

  // Handle mở modal edit
  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setOpenEdit(true);
  };

  // Handle mở modal add
  const handleOpenAdd = () => {
    setNewPromotion({
      id: "",
      name: "",
      description: "",
      cost: 0,
      startDate: Math.floor(Date.now() / 1000),
      endDate: Math.floor(Date.now() / 1000) + 86400, // +1 day
      discount_type: "PERCENTAGE",
      discount_value: 0,
      minimum_order_value: 0,
      status: "ACTIVE",
      food_categories: [],
    });
    setOpenAdd(true);
  };

  // Handle thay đổi giá trị trong form (edit)
  const handleChangeEdit = (
    field: keyof Promotion,
    value: string | number | string[]
  ) => {
    setSelectedPromotion((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle thay đổi giá trị trong form (add)
  const handleChangeAdd = (
    field: keyof Promotion,
    value: string | number | string[]
  ) => {
    setNewPromotion((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle submit chỉnh sửa promotion
  const handleSaveEdit = async () => {
    if (!selectedPromotion) return;
    try {
      await promotionsService.updatePromotion(selectedPromotion.id, {
        name: selectedPromotion.name,
        description: selectedPromotion.description,
        start_date: selectedPromotion.startDate,
        end_date: selectedPromotion.endDate,
        discount_type: selectedPromotion.discount_type,
        discount_value: selectedPromotion.discount_value,
        promotion_cost_price: selectedPromotion.cost,
        minimum_order_value: selectedPromotion.minimum_order_value,
        status: selectedPromotion.status,
        food_categories: selectedPromotion.food_categories,
        avatar: selectedPromotion.avatar,
      });
      setListPromotions((prev) =>
        prev.map((p) => (p.id === selectedPromotion.id ? selectedPromotion : p))
      );
      setOpenEdit(false);
    } catch (error) {
      console.error("Error updating promotion:", error);
    }
  };

  // Handle submit thêm promotion mới
  const handleSaveAdd = async () => {
    if (!newPromotion) return;
    try {
      const response = await promotionsService.createPromotion({
        name: newPromotion.name,
        description: newPromotion.description,
        start_date: newPromotion.startDate,
        end_date: newPromotion.endDate,
        discount_type: newPromotion.discount_type,
        discount_value: newPromotion.discount_value,
        promotion_cost_price: newPromotion.cost,
        minimum_order_value: newPromotion.minimum_order_value,
        status: newPromotion.status,
        food_categories: newPromotion.food_categories,
        avatar: newPromotion.avatar,
        cost: newPromotion.cost,
        endDate: newPromotion.end_date || newPromotion.endDate,
        startDate: newPromotion.start_date || newPromotion.startDate,
      });
      setListPromotions((prev) => [...prev, response.data]);
      setOpenAdd(false);
    } catch (error) {
      console.error("Error adding promotion:", error);
    }
  };

  // Handle upload avatar lên Cloudinary
  const handleImageUpload = async (isEdit: boolean, files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("file", file));
    formData.append(
      "upload_preset",
      `${process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}`
    );

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      const { public_id, secure_url } = response.data;
      const uploadedImage = { key: public_id, url: secure_url };

      if (isEdit) {
        setSelectedPromotion((prev) =>
          prev ? { ...prev, avatar: uploadedImage } : null
        );
      } else {
        setNewPromotion((prev) =>
          prev ? { ...prev, avatar: uploadedImage } : null
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Promotions Manager</h1>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add New Promotion
        </Button>
      </div>

      <div className="w-full">
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal chỉnh sửa Promotion */}
      {selectedPromotion && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="h-[90vh] w-full overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Edit Promotion - {selectedPromotion.id}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={selectedPromotion.name}
                  onChange={(e) => handleChangeEdit("name", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={selectedPromotion.description}
                  onChange={(e) =>
                    handleChangeEdit("description", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">
                  Cost
                </Label>
                <Input
                  id="cost"
                  type="number"
                  value={selectedPromotion.cost}
                  onChange={(e) =>
                    handleChangeEdit("cost", parseFloat(e.target.value))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={
                    new Date(selectedPromotion.startDate * 1000)
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(e) =>
                    handleChangeEdit(
                      "startDate",
                      Math.floor(new Date(e.target.value).getTime() / 1000)
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={
                    new Date(selectedPromotion.endDate * 1000)
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(e) =>
                    handleChangeEdit(
                      "endDate",
                      Math.floor(new Date(e.target.value).getTime() / 1000)
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discount_type" className="text-right">
                  Discount Type
                </Label>
                <Select
                  value={selectedPromotion.discount_type}
                  onValueChange={(value) =>
                    handleChangeEdit("discount_type", value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                    <SelectItem value="FIXED">FIXED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discount_value" className="text-right">
                  Discount Value
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  value={selectedPromotion.discount_value}
                  onChange={(e) =>
                    handleChangeEdit(
                      "discount_value",
                      parseFloat(e.target.value)
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minimum_order_value" className="text-right">
                  Minimum Order Value
                </Label>
                <Input
                  id="minimum_order_value"
                  type="number"
                  value={selectedPromotion.minimum_order_value}
                  onChange={(e) =>
                    handleChangeEdit(
                      "minimum_order_value",
                      parseFloat(e.target.value)
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={selectedPromotion.status}
                  onValueChange={(value) => handleChangeEdit("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="food_categories" className="text-right">
                  Food Categories
                </Label>
                <Input
                  id="food_categories"
                  value={selectedPromotion.food_categories.join(", ")}
                  onChange={(e) =>
                    handleChangeEdit(
                      "food_categories",
                      e.target.value.split(", ")
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="avatar" className="text-right">
                  Avatar
                </Label>
                <label className="col-span-3 flex items-center gap-2">
                  <input
                    type="file"
                    hidden
                    onChange={(e) =>
                      e.target.files && handleImageUpload(true, e.target.files)
                    }
                  />
                  {selectedPromotion.avatar && (
                    <FallbackImage
                      height={32}
                      width={32}
                      src={selectedPromotion.avatar.url}
                      alt="preview"
                      className="w-12 h-12 rounded-md"
                    />
                  )}
                  <span>
                    {selectedPromotion.avatar ? "Change Image" : "Upload Image"}
                  </span>
                </label>
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

      {/* Modal thêm Promotion mới */}
      {newPromotion && (
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className="h-[90vh] w-full overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Add New Promotion</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newPromotion.name}
                  onChange={(e) => handleChangeAdd("name", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newPromotion.description}
                  onChange={(e) =>
                    handleChangeAdd("description", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">
                  Cost
                </Label>
                <Input
                  id="cost"
                  type="number"
                  value={newPromotion.cost}
                  onChange={(e) =>
                    handleChangeAdd("cost", parseFloat(e.target.value))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={
                    new Date(newPromotion.startDate * 1000)
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(e) =>
                    handleChangeAdd(
                      "startDate",
                      Math.floor(new Date(e.target.value).getTime() / 1000)
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={
                    new Date(newPromotion.endDate * 1000)
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(e) =>
                    handleChangeAdd(
                      "endDate",
                      Math.floor(new Date(e.target.value).getTime() / 1000)
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discount_type" className="text-right">
                  Discount Type
                </Label>
                <Select
                  value={newPromotion.discount_type}
                  onValueChange={(value) =>
                    handleChangeAdd("discount_type", value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                    <SelectItem value="FIXED">FIXED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discount_value" className="text-right">
                  Discount Value
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  value={newPromotion.discount_value}
                  onChange={(e) =>
                    handleChangeAdd(
                      "discount_value",
                      parseFloat(e.target.value)
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minimum_order_value" className="text-right">
                  Minimum Order Value
                </Label>
                <Input
                  id="minimum_order_value"
                  type="number"
                  value={newPromotion.minimum_order_value}
                  onChange={(e) =>
                    handleChangeAdd(
                      "minimum_order_value",
                      parseFloat(e.target.value)
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={newPromotion.status}
                  onValueChange={(value) => handleChangeAdd("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="food_categories" className="text-right">
                  Food Categories
                </Label>
                <Input
                  id="food_categories"
                  value={newPromotion.food_categories.join(", ")}
                  onChange={(e) =>
                    handleChangeAdd(
                      "food_categories",
                      e.target.value.split(", ")
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="avatar" className="text-right">
                  Avatar
                </Label>
                <label className="col-span-3 flex items-center gap-2">
                  <input
                    type="file"
                    hidden
                    onChange={(e) =>
                      e.target.files && handleImageUpload(false, e.target.files)
                    }
                  />
                  {newPromotion.avatar && (
                    <FallbackImage
                      height={32}
                      width={32}
                      src={selectedPromotion?.avatar?.url}
                      alt="preview"
                      className="w-12 h-12 rounded-md"
                    />
                  )}
                  <span>
                    {newPromotion.avatar ? "Change Image" : "Upload Image"}
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenAdd(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdd}>Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Details Promotion */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="h-[90vh] w-full overflow-y-scroll">
          <DialogHeader>
            <DialogTitle>Promotion Details</DialogTitle>
          </DialogHeader>
          <Spinner isVisible={isDetailsLoading} isOverlay />
          {selectedPromotionDetails && (
            <>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="">
                  <Label className="text-right font-semibold">Name</Label>
                  <div className="col-span-3">
                    {selectedPromotionDetails.name}
                  </div>
                </div>
                <div className="">
                  <Label className="text-right font-semibold">
                    Description
                  </Label>
                  <div className="col-span-3">
                    {selectedPromotionDetails.description}
                  </div>
                </div>
                <div className="">
                  <Label className="text-right font-semibold">Cost</Label>
                  <div className="col-span-3">
                    ${selectedPromotionDetails.promotion_cost_price}
                  </div>
                </div>
                <div className="">
                  <Label className="text-right font-semibold">
                    Discount Type
                  </Label>
                  <div className="col-span-3">
                    {selectedPromotionDetails.discount_type}
                  </div>
                </div>
                <div className="">
                  <Label className="text-right font-semibold">Start Date</Label>
                  <div className="col-span-3">
                    {new Date(
                      Number(selectedPromotionDetails.start_date) * 1000
                    ).toLocaleDateString()}
                  </div>
                </div>
                <div className="">
                  <Label className="text-right font-semibold">End Date</Label>
                  <div className="col-span-3">
                    {new Date(
                      Number(selectedPromotionDetails.end_date) * 1000
                    ).toLocaleDateString()}
                  </div>
                </div>
                <div className="">
                  <Label className="text-right font-semibold">
                    Discount Value
                  </Label>
                  <div className="col-span-3">
                    {selectedPromotionDetails.discount_type === "PERCENTAGE"
                      ? `${selectedPromotionDetails.discount_value}%`
                      : `$${selectedPromotionDetails.discount_value}`}
                  </div>
                </div>
                <div className="">
                  <Label className="text-right font-semibold">
                    Minimum Order Value
                  </Label>
                  <div className="col-span-3">
                    ${selectedPromotionDetails.minimum_order_value}
                  </div>
                </div>
                <div className="">
                  <Label className="text-right font-semibold">Status</Label>
                  <div className="col-span-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedPromotionDetails.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedPromotionDetails.status}
                    </span>
                  </div>
                </div>
                {selectedPromotionDetails.avatar && (
                  <div className="">
                    <Label className="text-right font-semibold">Avatar</Label>
                    <div className="col-span-3">
                      <FallbackImage
                        height={32}
                        width={64}
                        src={selectedPromotionDetails.avatar.url}
                        alt="preview"
                        className=" rounded-md"
                      />
                    </div>
                  </div>
                )}
                <div className="">
                  <Label className="text-right font-semibold">Created At</Label>
                  <div className="col-span-3">
                    {new Date(
                      selectedPromotionDetails.created_at
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="">
                  <Label className="text-right font-semibold">Updated At</Label>
                  <div className="col-span-3">
                    {new Date(
                      selectedPromotionDetails.updated_at
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              {selectedPromotionDetails.restaurants &&
                selectedPromotionDetails.restaurants.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Participating Restaurants
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPromotionDetails.restaurants.map(
                        (restaurant) => (
                          <Card key={restaurant.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {restaurant.avatar && (
                                  <FallbackImage
                                    src={restaurant.avatar.url}
                                    alt={restaurant.restaurant_name}
                                    width={48}
                                    height={48}
                                    className="rounded-full"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium">
                                      {restaurant.restaurant_name}
                                    </p>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        restaurant.status.is_active
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {restaurant.status.is_active
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                  </div>
                                  <IdCell id={restaurant.id} />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  </div>
                )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
