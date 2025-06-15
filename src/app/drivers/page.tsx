"use client";

import { useEffect, useState } from "react";
import {
  driverService,
  Driver,
  DriverOrder,
} from "@/services/companion-admin/driverService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/Spinner";
import { Eye, Power, Trash } from "lucide-react";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/react-table";
import FallbackImage from "@/components/FallbackImage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatEpochToExactTime } from "@/utils/functions/formatTime";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverOrders, setDriverOrders] = useState<DriverOrder[]>([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    const fetchDrivers = async () => {
      try {
        console.log("Fetching page:", currentPage);
        const response = await driverService.findAllPaginated(10, currentPage);
        const {
          totalItems: items,
          totalPages: pages,
          items: driverItems,
        } = response.data;
        if (response.EC === 0) {
          setDrivers(driverItems);
          setTotalItems(items);
          setTotalPages(pages);
        } else {
          console.error("API error:", response.EM);
          setDrivers([]);
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
        setDrivers([]);
      }
      setIsLoading(false);
    };

    fetchDrivers();
  }, [currentPage]);

  const handleViewOrders = async (driver: Driver) => {
    setSelectedDriver(driver);
    try {
      const orders = await driverService.getDriverOrders(driver.id);
      setDriverOrders(orders.data);
      setIsOrderDialogOpen(true);
    } catch (error) {
      console.error("Error fetching driver orders:", error);
    }
  };

  const handleStatusChange = async (driverId: string, isBanned: boolean) => {
    try {
      await driverService.updateDriverStatus(driverId, isBanned);
      setDrivers((prevDrivers) =>
        prevDrivers.map((driver) =>
          driver.id === driverId ? { ...driver, is_banned: isBanned } : driver
        )
      );
    } catch (error) {
      console.error("Error updating driver status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "banned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: ColumnDef<Driver>[] = [
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
      accessorKey: "contact_email",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const driver = row.original;
        return (
          <div className="flex flex-row items-center gap-2">
            <FallbackImage
              src={driver?.avatar?.url}
              alt="avatar"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
            <span>{driver?.contact_email[0]?.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Driver Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const driver = row.original;
        return (
          <div className="text-center">
            {driver.first_name} {driver.last_name}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const driver = row.original;
        return (
          <div className="text-center">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                driver.is_banned
                  ? "banned"
                  : driver.available_for_work
                  ? "active"
                  : "inactive"
              )}`}
            >
              {driver.is_banned
                ? "Banned"
                : driver.available_for_work
                ? "Active"
                : "Inactive"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "rating",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rating
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const driver = row.original;
        return (
          <div className="text-center">
            <div className="flex items-center gap-1">
              <span>{driver.rating.average_rating.toFixed(1)}</span>
              <span className="text-gray-500">
                ({driver.rating.review_count} reviews)
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: "Actions",
      cell: ({ row }) => {
        const driver = row.original;
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
                  onClick={() => handleViewOrders(driver)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Orders
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() =>
                    handleStatusChange(driver.id, !driver.is_banned)
                  }
                >
                  <Power className="mr-2 h-4 w-4" />
                  {driver.is_banned ? "Unban" : "Ban"}
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
    data: drivers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      console.log("Changing to page:", page);
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-4">
      <Spinner isVisible={isLoading} isOverlay />
      <h1 className="text-2xl font-bold mb-4">Driver Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Drivers</h2>
          <div className="text-3xl font-bold text-blue-600">{totalItems}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Active Drivers</h2>
          <div className="text-3xl font-bold text-green-600">
            {drivers?.filter((driver) => driver.available_for_work).length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Inactive Drivers</h2>
          <div className="text-3xl font-bold text-yellow-600">
            {drivers?.filter((driver) => !driver.available_for_work && !driver.is_banned).length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Banned Drivers</h2>
          <div className="text-3xl font-bold text-red-600">
            {drivers?.filter((driver) => driver.is_banned).length}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="justify-between flex items-center">
          <h2 className="text-xl font-semibold mb-4">Driver List</h2>
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Driver Order History</DialogTitle>
            <DialogDescription>
              View order history for {selectedDriver?.first_name}{" "}
              {selectedDriver?.last_name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4">
              {driverOrders?.map((order) => {
                const totalItems = order.order_items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );
                const totalAmount = order.order_items.reduce(
                  (sum, item) =>
                    sum + item.price_at_time_of_order * item.quantity,
                  0
                );

                return (
                  <Accordion type="single" collapsible key={order.id}>
                    <AccordionItem value={order.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col items-start text-left">
                          <div className="flex items-center gap-4">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                            <span className="text-sm font-medium">
                              ${totalAmount.toFixed(2)}
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
                              <p className="text-sm font-medium">Status</p>
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Total Amount
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ${totalAmount.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Delivery Fee
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ${order.delivery_fee}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Payment Status
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.payment_status}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Payment Method
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.payment_method}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Order Time</p>
                              <p className="text-sm text-muted-foreground">
                                {formatEpochToExactTime(
                                  Number(order.order_time)
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Delivery Time
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatEpochToExactTime(
                                  Number(order.delivery_time)
                                )}
                              </p>
                            </div>
                          </CardContent>

                          <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {order.order_items.map((item) => (
                              <div
                                key={item.item_id}
                                className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-white rounded-md border hover:shadow-md transition-shadow"
                              >
                                {item.menu_item?.avatar ? (
                                  <FallbackImage
                                    src={item.menu_item.avatar.url}
                                    alt={`${item.name} avatar`}
                                    width={48}
                                    height={48}
                                    className="rounded-sm aspect-square object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs">
                                    No Image
                                  </div>
                                )}
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">
                                      {item.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Price: $
                                      {item.price_at_time_of_order.toFixed(2)} x{" "}
                                      {item.quantity}
                                    </p>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-500">
                                        Item ID
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {item.item_id}
                                      </p>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-500">
                                        Variant ID
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {item.variant_id}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>

                          <CardHeader>
                            <CardTitle>Restaurant Information</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4">
                              {order.restaurant?.avatar && (
                                <FallbackImage
                                  src={order.restaurant.avatar.url}
                                  alt="Restaurant Avatar"
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium">Name</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.restaurant?.restaurant_name}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Restaurant ID
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.restaurant?.id}
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
