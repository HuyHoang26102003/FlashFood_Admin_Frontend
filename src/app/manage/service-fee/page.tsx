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
import { Textarea } from "@/components/ui/textarea";
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
import { Spinner } from "@/components/Spinner";
import { SimplePagination } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";

// Định nghĩa type cho finance rule
interface DriverFixedWage {
  [key: string]: string | number;
}

interface FinanceRule {
  id: string;
  driver_fixed_wage: DriverFixedWage;
  customer_care_hourly_wage: number;
  app_service_fee: number;
  restaurant_commission: number;
  created_by_id: string;
  created_by: {
    first_name: string;
    last_name: string;
  };
  description?: string;
  created_at: number;
  updated_at?: number;
}

const FinanceRulePage = () => {
  const adminStore = useAdminStore((state) => state.user);

  const [rules, setRules] = useState<FinanceRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<FinanceRule | null>(null);
  const [newRule, setNewRule] = useState<FinanceRule | null>(null);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openAdd, setOpenAdd] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newWageEntry, setNewWageEntry] = useState({ range: "", value: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/finance-rules/paginated?page=${currentPage}&limit=10`
      );
      const { EC, data } = response.data;
      if (EC === 0 && data) {
        setRules(data.items);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching finance rules:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // Fetch finance rules từ API
  useEffect(() => {
    fetchRules();
  }, [currentPage]);

  // Handle mở modal edit
  const handleEdit = (rule: FinanceRule) => {
    setSelectedRule(rule);
    setOpenEdit(true);
  };

  // Handle mở modal add
  const handleOpenAdd = () => {
    setNewRule({
      id: "", // Sẽ được server tạo
      driver_fixed_wage: {},
      customer_care_hourly_wage: 0,
      app_service_fee: 0,
      restaurant_commission: 0,
      created_by_id: "", // Giả sử sẽ được điền từ context auth sau
      created_by: { first_name: "", last_name: "" }, // Tạm để trống
      description: "",
      created_at: Date.now() / 1000, // Epoch seconds
    });
    setNewWageEntry({ range: "", value: "" });
    setOpenAdd(true);
  };

  // Handle submit chỉnh sửa rule
  const handleSaveEdit = async () => {
    if (!selectedRule) return;
    try {
      const response = await axiosInstance.patch(
        `/finance-rules/${selectedRule.id}`,
        {
          ...selectedRule,
          id: undefined,
          created_at: undefined,
          updated_at: selectedRule?.updated_at
            ? +selectedRule?.updated_at
            : undefined,
          created_by: undefined,
          customer_care_hourly_wage: +selectedRule.customer_care_hourly_wage,
          app_service_fee: +selectedRule.app_service_fee,
          restaurant_commission: +selectedRule.restaurant_commission,
        }
      );
      const { EC } = response.data;
      if (EC === 0) {
        setOpenEdit(false);
        fetchRules();
        toast({
          title: "Success",
          description: "Rule updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update rule.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating rule:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Handle submit thêm rule mới
  const handleSaveAdd = async () => {
    if (!newRule) return;
    try {
      const response = await axiosInstance.post("/finance-rules", {
        app_service_fee: +newRule.app_service_fee,
        restaurant_commission: +newRule.restaurant_commission,
        created_by_id: adminStore?.id ?? "",
        description: newRule.description,
        customer_care_hourly_wage: +newRule.customer_care_hourly_wage,
        driver_fixed_wage: newRule.driver_fixed_wage,
      });
      const { EC } = response.data;
      if (EC === 0) {
        setOpenAdd(false);
        fetchRules();
        toast({
          title: "Success",
          description: "Rule added successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add rule.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding rule:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Handle thay đổi giá trị trong form (edit)
  const handleChangeEdit = (field: keyof FinanceRule, value: string) => {
    setSelectedRule((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle thay đổi giá trị trong form (add)
  const handleChangeAdd = (field: keyof FinanceRule, value: string) => {
    setNewRule((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle thay đổi JSON driver_fixed_wage (edit)
  const handleDriverWageChangeEdit = (range: string, value: string) => {
    setSelectedRule((prev) =>
      prev
        ? {
            ...prev,
            driver_fixed_wage: {
              ...prev.driver_fixed_wage,
              [range]: value,
            },
          }
        : null
    );
  };

  // Handle thay đổi JSON driver_fixed_wage (add)
  const handleDriverWageChangeAdd = (range: string, value: string) => {
    setNewRule((prev) =>
      prev
        ? {
            ...prev,
            driver_fixed_wage: {
              ...prev.driver_fixed_wage,
              [range]: value,
            },
          }
        : null
    );
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Apply latest service fee
  const handleApplyLatest = () => {
    const latestRule = rules[rules.length - 1]; // Lấy rule mới nhất
    if (latestRule) {
      setNewRule((prev) =>
        prev
          ? {
              ...prev,
              driver_fixed_wage: { ...latestRule.driver_fixed_wage },
              customer_care_hourly_wage: latestRule.customer_care_hourly_wage,
              app_service_fee: latestRule.app_service_fee,
              restaurant_commission: latestRule.restaurant_commission,
            }
          : null
      );
    }
  };

  // Định nghĩa columns cho react-table
  const columns: ColumnDef<FinanceRule>[] = [
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
      accessorKey: "description",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Description
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("description") || "N/A"}</div>,
    },
    {
      accessorKey: "created_by",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created By
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const createdBy = row.getValue(
          "created_by"
        ) as FinanceRule["created_by"];
        console.log(createdBy);
        return (
          <div>
            {createdBy?.first_name
              ? `${createdBy?.last_name} ${createdBy?.first_name}`
              : "N/A"}
          </div>
        );
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
        <div>
          {new Date(
            (row.getValue("created_at") as number) * 1000
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
        const rule = row.original;
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
                  onClick={() => handleEdit(rule)}
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
    data: rules,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto p-4">
      <Spinner isVisible={isLoading} isOverlay />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Service Fee Manager</h1>
        <Button onClick={handleOpenAdd}>Add New Rule</Button>
      </div>

      {/* Table dùng react-table */}
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

      {/* Modal chỉnh sửa rule */}
      {selectedRule && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="h-[90vh] w-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Edit Finance Rule - {selectedRule.id}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer_care" className="text-right">
                  Customer Care Hourly Wage
                </Label>
                <Input
                  id="customer_care"
                  type="number"
                  value={selectedRule.customer_care_hourly_wage}
                  onChange={(e) =>
                    handleChangeEdit(
                      "customer_care_hourly_wage",
                      e.target.value
                    )
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="app_fee" className="text-right">
                  App Service Fee
                </Label>
                <Input
                  id="app_fee"
                  type="number"
                  value={selectedRule.app_service_fee}
                  onChange={(e) =>
                    handleChangeEdit("app_service_fee", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="restaurant_commission" className="text-right">
                  Restaurant Commission
                </Label>
                <Input
                  id="restaurant_commission"
                  type="number"
                  value={selectedRule.restaurant_commission}
                  onChange={(e) =>
                    handleChangeEdit("restaurant_commission", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid gap-2">
                <Label>Driver Fixed Wage</Label>
                {Object.entries(selectedRule.driver_fixed_wage).map(
                  ([range, value]) => (
                    <div key={range} className="flex items-center gap-2">
                      <Input value={range} disabled className="w-1/3" />
                      <Input
                        value={value}
                        onChange={(e) =>
                          handleDriverWageChangeEdit(range, e.target.value)
                        }
                        className="w-2/3"
                      />
                    </div>
                  )
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={selectedRule.description || ""}
                  onChange={(e) =>
                    handleChangeEdit("description", e.target.value)
                  }
                  className="col-span-3"
                />
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

      {/* Modal thêm rule mới */}
      {newRule && (
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className="h-[90vh] w-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Add New Finance Rule</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer_care" className="text-right">
                  Customer Care Hourly Wage
                </Label>
                <Input
                  id="customer_care"
                  type="number"
                  value={newRule.customer_care_hourly_wage}
                  onChange={(e) =>
                    handleChangeAdd("customer_care_hourly_wage", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="app_fee" className="text-right">
                  App Service Fee
                </Label>
                <Input
                  id="app_fee"
                  type="number"
                  value={newRule.app_service_fee}
                  onChange={(e) =>
                    handleChangeAdd("app_service_fee", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="restaurant_commission" className="text-right">
                  Restaurant Commission
                </Label>
                <Input
                  id="restaurant_commission"
                  type="number"
                  value={newRule.restaurant_commission}
                  onChange={(e) =>
                    handleChangeAdd("restaurant_commission", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid gap-2">
                <Label>Driver Fixed Wage</Label>
                {Object.entries(newRule.driver_fixed_wage).map(
                  ([range, value]) => (
                    <div key={range} className="flex items-center gap-2 mb-1">
                      <Input value={range} disabled className="w-1/3" />
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) =>
                          handleDriverWageChangeAdd(range, e.target.value)
                        }
                        className="w-1/3"
                      />
                    </div>
                  )
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="e.g., 0-5km"
                    value={newWageEntry.range}
                    onChange={(e) =>
                      setNewWageEntry({
                        ...newWageEntry,
                        range: e.target.value,
                      })
                    }
                    className="w-1/3"
                  />
                  <Input
                    placeholder="Wage"
                    type="number"
                    value={newWageEntry.value}
                    onChange={(e) =>
                      setNewWageEntry({
                        ...newWageEntry,
                        value: e.target.value,
                      })
                    }
                    className="w-1/3"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newWageEntry.range) {
                        handleDriverWageChangeAdd(
                          newWageEntry.range,
                          newWageEntry.value || "0"
                        );
                        setNewWageEntry({ range: "", value: "" });
                      }
                    }}
                  >
                    Add Range
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newRule.description || ""}
                  onChange={(e) =>
                    handleChangeAdd("description", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleApplyLatest}>
                Apply Latest Service Fee
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

export default FinanceRulePage;
