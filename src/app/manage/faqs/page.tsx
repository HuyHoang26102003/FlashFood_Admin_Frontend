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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreHorizontal, Plus, Edit, Trash } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HARDED_CODE_DATA } from "@/utils/harded_code_data";
import axios from "axios";

// Định nghĩa type cho FAQ
interface AnswerItem {
  type: "text" | "image" | "image_row";
  value: string | { key: string; url: string } | { key: string; url: string }[];
}

interface FAQ {
  id: string;
  question: string;
  answer: AnswerItem[];
  type: "SERVICE" | "ACCOUNT" | "GENERAL" | "PAYMENT";
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  target_user: string[];
  created_by_id?: string;
  created_by?: { first_name: string; last_name: string };
  created_at: string;
  updated_at: string | null;
}

const page = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [newFAQ, setNewFAQ] = useState<FAQ | null>(null);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openAdd, setOpenAdd] = useState<boolean>(false);

  const fetchFAQs = async () => {
    try {
      const response = await axiosInstance.get("/faqs");
      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setFaqs(data);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  // Handle mở modal edit
  const handleEdit = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setOpenEdit(true);
  };

  // Handle mở modal add
  const handleOpenAdd = () => {
    setNewFAQ({
      id: "",
      question: "",
      answer: [{ type: "text", value: "" }],
      type: "GENERAL",
      status: "ACTIVE",
      target_user: ["CUSTOMER"],
      created_at: (Date.now() / 1000).toString(),
      updated_at: null,
    });
    setOpenAdd(true);
  };

  // Handle submit chỉnh sửa FAQ
  const handleSaveEdit = async () => {
    if (!selectedFAQ) return;
    try {
      const response = await axiosInstance.patch(`/faqs/${selectedFAQ.id}`, {
        question: selectedFAQ.question,
        answer: selectedFAQ.answer,
        type: selectedFAQ.type,
        status: selectedFAQ.status,
        target_user: selectedFAQ.target_user,
      });
      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setFaqs((prev) =>
          prev.map((f) => (f.id === selectedFAQ.id ? selectedFAQ : f))
        );
        setOpenEdit(false);
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
    }
  };

  // Handle submit thêm FAQ mới
  const handleSaveAdd = async () => {
    if (!newFAQ) return;
    try {
      const response = await axiosInstance.post("/faqs", {
        question: newFAQ.question,
        answer: newFAQ.answer,
        type: newFAQ.type,
        status: newFAQ.status,
        target_user: newFAQ.target_user,
      });
      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setFaqs((prev) => [...prev, data]);
        fetchFAQs();
        setOpenAdd(false);
      }
    } catch (error) {
      console.error("Error adding FAQ:", error);
    }
  };

  // Handle thay đổi giá trị trong form (edit)
  const handleChangeEdit = (field: keyof FAQ, value: string | string[]) => {
    setSelectedFAQ((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle thay đổi giá trị trong form (add)
  const handleChangeAdd = (field: keyof FAQ, value: string | string[]) => {
    setNewFAQ((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle thêm answer row
  const handleAddAnswerRow = (isEdit: boolean) => {
    const setter = isEdit ? setSelectedFAQ : setNewFAQ;
    setter((prev) =>
      prev
        ? { ...prev, answer: [...prev.answer, { type: "text", value: "" }] }
        : null
    );
  };

  // Handle xóa answer row
  const handleDeleteAnswerRow = (isEdit: boolean, index: number) => {
    const setter = isEdit ? setSelectedFAQ : setNewFAQ;
    setter((prev) =>
      prev
        ? { ...prev, answer: prev.answer.filter((_, i) => i !== index) }
        : null
    );
  };

  // Handle thay đổi answer type/value
  const handleAnswerChange = (
    isEdit: boolean,
    index: number,
    field: "type" | "value",
    value:
      | string
      | { key: string; url: string }
      | { key: string; url: string }[]
  ) => {
    const setter = isEdit ? setSelectedFAQ : setNewFAQ;
    setter((prev) => {
      if (!prev) return null;
      const newAnswer = [...prev.answer];
      if (field === "type") {
        newAnswer[index] = {
          ...newAnswer[index],
          type: value as "text" | "image" | "image_row",
          value: "",
        };
      } else {
        newAnswer[index] = { ...newAnswer[index], value };
      }
      return { ...prev, answer: newAnswer };
    });
  };

  // Handle upload ảnh lên Cloudinary
  const handleImageUpload = async (
    isEdit: boolean,
    index: number,
    files: FileList,
    isImageRow: boolean
  ) => {
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

      if (isImageRow) {
        handleAnswerChange(isEdit, index, "value", [
          ...(Array.isArray(newFAQ?.answer[index].value)
            ? newFAQ?.answer[index].value
            : []),
          uploadedImage,
        ]);
      } else {
        handleAnswerChange(isEdit, index, "value", uploadedImage);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  // Apply latest FAQ
  const handleApplyLatest = () => {
    const latestFAQ = faqs[faqs.length - 1];
    if (latestFAQ) {
      setNewFAQ((prev) =>
        prev
          ? {
              ...prev,
              question: latestFAQ.question,
              answer: [...latestFAQ.answer],
              type: latestFAQ.type,
              status: latestFAQ.status,
              target_user: [...latestFAQ.target_user],
            }
          : null
      );
    }
  };

  // Định nghĩa columns cho react-table
  const columns: ColumnDef<FAQ>[] = [
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
      accessorKey: "question",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Question
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("question")}</div>,
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
      accessorKey: "type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("type")}</div>,
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
        <div>
          {new Date(
            Number(row.getValue("created_at")) * 1000
          ).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const faq = row.original;
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
                  onClick={() => handleEdit(faq)}
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
    data: faqs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderAnswerRow = (
    item: AnswerItem,
    index: number,
    isEdit: boolean
  ) => (
    <div key={index} className="flex items-center gap-2 mb-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-1/4">
            {item.type}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-32">
          <div className="grid gap-2">
            <Button
              variant="ghost"
              onClick={() => handleAnswerChange(isEdit, index, "type", "text")}
            >
              Text
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleAnswerChange(isEdit, index, "type", "image")}
            >
              Image
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                handleAnswerChange(isEdit, index, "type", "image_row")
              }
            >
              Image Row
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {item.type === "text" ? (
        <Input
          value={typeof item.value === "string" ? item.value : ""}
          onChange={(e) =>
            handleAnswerChange(isEdit, index, "value", e.target.value)
          }
          className="w-2/4"
        />
      ) : (
        <label className="w-2/4 flex items-center gap-2">
          <input
            type="file"
            multiple={item.type === "image_row"}
            hidden
            onChange={(e) =>
              e.target.files &&
              handleImageUpload(
                isEdit,
                index,
                e.target.files,
                item.type === "image_row"
              )
            }
          />
          {item.value && typeof item.value !== "string" && (
            <img
              src={
                "url" in item.value
                  ? item.value.url
                  : (item.value as any)[0]?.url
              }
              alt="preview"
              className="w-12 h-12 rounded-md"
            />
          )}
          <span>{item.value ? "Change Image" : "Upload Image"}</span>
        </label>
      )}

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddAnswerRow(isEdit)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" disabled>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteAnswerRow(isEdit, index)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">FAQs Manager</h1>
        <Button onClick={handleOpenAdd}>Add New FAQ</Button>
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

      {/* Modal chỉnh sửa FAQ */}
      {selectedFAQ && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="h-[90vh] w-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Edit FAQ - {selectedFAQ.id}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="question" className="text-right">
                  Question
                </Label>
                <Input
                  id="question"
                  value={selectedFAQ.question}
                  onChange={(e) => handleChangeEdit("question", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid gap-2">
                <Label>Answer</Label>
                {selectedFAQ.answer.map((item, index) =>
                  renderAnswerRow(item, index, true)
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select
                  value={selectedFAQ.type}
                  onValueChange={(value) => handleChangeEdit("type", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICE">SERVICE</SelectItem>
                    <SelectItem value="ACCOUNT">ACCOUNT</SelectItem>
                    <SelectItem value="GENERAL">GENERAL</SelectItem>
                    <SelectItem value="PAYMENT">PAYMENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={selectedFAQ.status}
                  onValueChange={(value) => handleChangeEdit("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target_user" className="text-right">
                  Target User
                </Label>
                <select
                  id="target_user"
                  multiple
                  value={selectedFAQ.target_user}
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
                  <option value="DRIVER">DRIVER</option>
                  <option value="RESTAURANT">RESTAURANT</option>
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

      {/* Modal thêm FAQ mới */}
      {newFAQ && (
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className="h-[90vh] w-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Add New FAQ</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="question" className="text-right">
                  Question
                </Label>
                <Input
                  id="question"
                  value={newFAQ.question}
                  onChange={(e) => handleChangeAdd("question", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid gap-2">
                <Label>Answer</Label>
                {newFAQ.answer.map((item, index) =>
                  renderAnswerRow(item, index, false)
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select
                  value={newFAQ.type}
                  onValueChange={(value) => handleChangeAdd("type", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICE">SERVICE</SelectItem>
                    <SelectItem value="ACCOUNT">ACCOUNT</SelectItem>
                    <SelectItem value="GENERAL">GENERAL</SelectItem>
                    <SelectItem value="PAYMENT">PAYMENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={newFAQ.status}
                  onValueChange={(value) => handleChangeAdd("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target_user" className="text-right">
                  Target User
                </Label>
                <select
                  id="target_user"
                  multiple
                  value={newFAQ.target_user}
                  onChange={(e) =>
                    handleChangeAdd(
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
                  <option value="DRIVER">DRIVER</option>
                  <option value="RESTAURANT">RESTAURANT</option>
                  <option value="CUSTOMER_CARE">CUSTOMER_CARE</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleApplyLatest}>
                Apply Latest FAQ
              </Button>
              <Button variant="outline" onClick={() => setOpenAdd(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdd}>Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default page;
