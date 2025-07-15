"use client";
import React, { useEffect, useState, useRef } from "react";
import { Eye, Power, Loader2 } from "lucide-react";
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
import { customerService } from "@/services/companion-admin/customerService";
import { Customer, Order } from "@/types/orders";
import { Spinner } from "@/components/Spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEpochToExactTime } from "@/utils/functions/formatTime";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FallbackImage from "@/components/FallbackImage";
import { SimplePagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userSearchService } from "@/services/user/userSearchService";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { superAdminService } from "@/services/super-admin/superAdminService";
import { useToast } from "@/hooks/use-toast";
import { UserSearchResult } from "@/services/user/userSearchService";

const Page = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    ban: 0,
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isOrderHistoryDialogOpen, setIsOrderHistoryDialogOpen] =
    useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [isBanLoading, setIsBanLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customersSearchResult, setCustomersSearchResult] = useState<
    Customer[]
  >([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);

  const handleStatusChange = (id: string, shouldBan: boolean) => {
    setSelectedCustomerId(id);
    if (shouldBan) {
      setIsUnbanning(false);
    } else {
      setIsUnbanning(true);
    }
    setIsBanDialogOpen(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedCustomerId || !banReason.trim()) return;

    try {
      setIsBanLoading(true);
      const response = await superAdminService.banAccount(
        selectedCustomerId,
        "Customer",
        banReason
      );

      if (response.EC === 0) {
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) =>
            customer.id === selectedCustomerId
              ? {
                  ...customer,
                  is_banned: !isUnbanning,
                }
              : customer
          )
        );
        setIsBanDialogOpen(false);
        setBanReason("");
        setSelectedCustomerId(null);
        toast({
          title: "Success",
          description: `Customer has been successfully ${
            isUnbanning ? "unbanned" : "banned"
          }.`,
        });
      } else {
        toast({
          title: "Error",
          description:
            response.EM ||
            `Failed to ${isUnbanning ? "unban" : "ban"} customer.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(
        `Error ${isUnbanning ? "unbanning" : "banning"} customer:`,
        error
      );
      toast({
        title: "Error",
        description: `An unexpected error occurred.`,
        variant: "destructive",
      });
    } finally {
      setIsBanLoading(false);
    }
  };

  const columns: ColumnDef<Customer>[] = [
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
          className="text-left pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-2">
            <FallbackImage
              src={customer.avatar?.url}
              alt={customer.first_name}
              width={32}
              height={32}
              className="rounded-full aspect-square object-cover"
            />
            <div className="text-left">
              {customer.first_name} {customer.last_name}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "contact_email",
      header: "Contact Info",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-left space-y-1">
            <div className="text-sm">
              {customer.contact_email?.[0]?.email || "No email"}
            </div>
            <div className="text-sm text-muted-foreground">
              {customer.contact_phone?.[0]?.number || "No phone"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "total_orders",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Orders
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-center font-medium">
            {customer.total_orders || 0}
          </div>
        );
      },
    },
    {
      accessorKey: "total_spent",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Spent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-center font-medium">
            ${customer.total_spent?.toFixed(2) || "0.00"}
          </div>
        );
      },
    },
    {
      id: "status",
      header: () => (
        <Button className="text-center" variant="ghost">
          Status
        </Button>
      ),
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-center">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
              ${
                customer.is_banned
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {customer.is_banned ? "Banned" : "Active"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 w-full p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40">
              <div className="grid gap-4">
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => handleViewOrderHistory(customer)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Orders
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(customer.id, !customer.is_banned);
                  }}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {customer.is_banned ? "Unban" : "Ban"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
  ];

  const fetchCustomersForPolling = async () => {
    try {
      const response = await customerService.findAllPaginated(10, currentPage);
      const {
        totalItems: items,
        totalPages: pages,
        items: customerItems,
      } = response.data;
      if (response.EC === 0) {
        setCustomers(customerItems);
        setTotalItems(items);
        setTotalPages(pages);
      } else {
        console.error("API error:", response.EM);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    }
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await customerService.findAllPaginated(10, currentPage);
      const {
        totalItems: items,
        totalPages: pages,
        items: customerItems,
      } = response.data;
      if (response.EC === 0) {
        setCustomers(customerItems);
        setTotalItems(items);
        setTotalPages(pages);
      } else {
        console.error("API error:", response.EM);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    // Set up 30-second polling for live updates
    const pollInterval = setInterval(() => {
      console.log("🔄 Polling customers data...");
      fetchCustomersForPolling();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    const totalCount = totalItems;
    const activeCount = customers.filter((c) => !c.is_banned).length;
    const bannedCount = customers.filter((c) => c.is_banned).length;

    setStats({
      total: totalCount,
      active: activeCount,
      ban: bannedCount,
    });
  }, [customers, totalItems]);

  const fetchOrderHistory = async (customerId: string) => {
    setIsOrdersLoading(true);
    try {
      const response = await customerService.getCustomerOrders(customerId);
      if (response.EC === 0) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error("Error fetching order history:", error);
    }
    setIsOrdersLoading(false);
  };

  const handleViewOrderHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsOrderHistoryDialogOpen(true);
    fetchOrderHistory(customer.id);
  };

  const handleSearch = async (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setCustomersSearchResult([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await userSearchService.searchUsers(
          query,
          "customer"
        );
        if (response.EC === 0) {
          const convertedResults: Customer[] = response.data.results.map(
            (user: UserSearchResult) => ({
              id: user.id,
              first_name: user.first_name || "",
              last_name: user.last_name || "",
              contact_email: [
                {
                  email: user.user_email || "",
                  title: "Primary",
                  is_default: true,
                },
              ],
              contact_phone: [],
              avatar: user.avatar || null,
              total_orders: 0,
              total_spent: 0,
              is_banned: false,
              created_at: "",
              updated_at: "",
            })
          );
          setCustomersSearchResult(convertedResults);
        } else {
          setCustomersSearchResult([]);
        }
      } catch (error) {
        console.error("Error searching customers:", error);
        setCustomersSearchResult([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const table = useReactTable({
    data: searchQuery ? customersSearchResult : customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4">
      <Spinner isVisible={isLoading} isOverlay />
      <Breadcrumb className="my-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-primary-600 max-md:text-xs font-bold"
              href="/"
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-primary-600 max-md:text-xs font-bold" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary-600 max-md:text-xs font-bold">
              Customers
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Customers</h2>
          <div className="text-3xl font-bold text-blue-600">{totalItems}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Active Customers</h2>
          <div className="text-3xl font-bold text-green-600">
            {stats.active}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Banned</h2>
          <div className="text-3xl font-bold text-red-600">{stats.ban}</div>
        </div>
      </div>

      <div className="mt-8">
        <div className="justify-between flex items-center mb-4">
          <h2 className="text-xl font-semibold mb-4">Customer List</h2>
          <div className="self-end relative">
            <Input
              className="w-72"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            )}
          </div>
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
        <div className="mt-4">
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <Dialog
        open={isOrderHistoryDialogOpen}
        onOpenChange={setIsOrderHistoryDialogOpen}
      >
        <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order History</DialogTitle>
            <DialogDescription>
              View order history for {selectedCustomer?.first_name}{" "}
              {selectedCustomer?.last_name}
            </DialogDescription>
          </DialogHeader>
          <Spinner isVisible={isOrdersLoading} isOverlay />
          <div className="space-y-4">
            {orders.map((order) => {
              const totalItems = order.order_items.reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              return (
                <Accordion type="single" collapsible key={order.id}>
                  <AccordionItem value={order.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${
                              order.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="text-sm font-medium">
                            ${Number(order.total_amount).toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {totalItems} items
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatEpochToExactTime(Number(order.order_time))}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card>
                        <CardHeader>
                          <CardTitle>Order Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Order ID</p>
                            <p className="text-sm text-muted-foreground">
                              {order.id}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Total Amount</p>
                            <p className="text-sm text-muted-foreground">
                              ${Number(order.total_amount).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Order Time</p>
                            <p className="text-sm text-muted-foreground">
                              {formatEpochToExactTime(Number(order.order_time))}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>
              {isUnbanning ? "Unban Customer" : "Ban Customer"}
            </DialogTitle>
            <DialogDescription>
              {isUnbanning
                ? "Please provide a reason for unbanning this customer."
                : "Please provide a reason for banning this customer. This will be recorded for administrative purposes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                {isUnbanning ? "Unban Reason" : "Ban Reason"}
              </Label>
              <Input
                id="reason"
                placeholder={
                  isUnbanning
                    ? "Enter the reason for unbanning..."
                    : "Enter the reason for banning..."
                }
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsBanDialogOpen(false);
                setBanReason("");
                setSelectedCustomerId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusSubmit}
              disabled={!banReason.trim() || isBanLoading}
            >
              {isBanLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUnbanning ? "Unbanning..." : "Banning..."}
                </>
              ) : isUnbanning ? (
                "Unban Customer"
              ) : (
                "Ban Customer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
