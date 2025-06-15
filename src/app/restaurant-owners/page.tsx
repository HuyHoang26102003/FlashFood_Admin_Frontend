"use client";
import React, { useEffect, useState } from "react";
import { Eye, Power, Trash } from "lucide-react";
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
import {
  Restaurant,
  restaurantService,
} from "@/services/companion-admin/restaurantService";
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
import { Avatar } from "@/types/common";
import FallbackImage from "@/components/FallbackImage";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ItemRestaurantBackend {
  id: string;
  restaurant_name: string;
  status: {
    is_active?: boolean;
    is_banned?: boolean;
  };
  address: {
    nationality: string;
    city: string;
    street: string;
  };
  avatar?: Avatar;
}

interface Restaurant {
  id: string;
  restaurant_name: string;
  address: string;
  cuisine: string;
  isActive: boolean;
  is_banned: boolean;
  rating: number | undefined;
  avatar?: Avatar;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: string;
  category: string[];
  avatar: {
    key: string;
    url: string;
  };
  availability: boolean;
  suggest_notes: string[];
  discount: string | null;
  purchase_count: number;
  created_at: number;
  updated_at: number;
  variants: {
    id: string;
    menu_id: string;
    variant: string;
    description: string;
    avatar: {
      key: string;
      url: string;
    };
    availability: boolean;
    default_restaurant_notes: string[];
    price: string;
    discount_rate: string;
    created_at: number;
    updated_at: number;
  }[];
}

const Page = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    ban: 0,
  });
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [isMenuItemsDialogOpen, setIsMenuItemsDialogOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMenuItemsLoading, setIsMenuItemsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const handleStatusChange = async (id: string, shouldBan: boolean) => {
    try {
      const response = await restaurantService.toggleRestaurantStatus(
        id,
        shouldBan
      );
      if (response.EC === 0) {
        setRestaurants((prevRestaurants) =>
          prevRestaurants.map((restaurant) =>
            restaurant.id === id
              ? { ...restaurant, is_banned: shouldBan, isActive: !shouldBan }
              : restaurant
          )
        );
      }
    } catch (error) {
      console.error("Error toggling restaurant status:", error);
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    try {
      const response = await restaurantService.deleteRestaurant(id);
      if (response.EC === 0) {
        fetchRestaurants();
      }
    } catch (error) {
      console.error("Error deleting restaurant:", error);
    }
  };

  const columns: ColumnDef<Restaurant>[] = [
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
          Restaurant Name
        </Button>
      ),
      cell: ({ row }) => {
        const restaurant = row.original;
        return (
          <div className="flex items-center gap-2">
            <FallbackImage
              src={restaurant?.avatar?.url}
              alt={restaurant.restaurant_name}
              width={32}
              height={32}
              className="rounded-sm aspect-square object-cover"
            />
            <div className="text-left">{restaurant.restaurant_name}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: ({ column }) => (
        <Button
          className="text-center pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Adress
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        if (!row) {
          return <div className="text-center">-</div>;
        }

        const address = row.getValue("address");
        if (!address) {
          return <div className="text-center">-</div>;
        }

        const addressStr = `${(address as { street: string }).street}, ${
          (address as { city: string }).city
        } ${(address as { nationality: string }).nationality}`;
        return (
          <div className="text-left">
            {addressStr.length > 20
              ? `${addressStr.slice(0, 20)}...`
              : addressStr}
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
        const restaurant = row.original;
        return (
          <div className="text-center">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
              ${
                restaurant.is_banned
                  ? "bg-red-100 text-red-800"
                  : restaurant.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {restaurant.is_banned
                ? "Banned"
                : restaurant.isActive
                ? "Active"
                : "Inactive"}
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
        const restaurant = row.original;
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
                  onClick={() => handleViewMenuItems(restaurant)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Menu Items
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() =>
                    handleStatusChange(restaurant.id, !restaurant.is_banned)
                  }
                >
                  <Power className="mr-2 h-4 w-4" />
                  {restaurant.is_banned ? "Unban" : "Ban"}
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start text-destructive"
                  onClick={() => handleDeleteRestaurant(restaurant.id)}
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

  useEffect(() => {
    setIsLoading(true);
    const fetchDrivers = async () => {
      try {
        console.log("Fetching page:", currentPage);
        const response = await restaurantService.findAllPaginated(
          10,
          currentPage
        );
        const {
          totalItems: items,
          totalPages: pages,
          items: restaurantItems,
        } = response.data;
        if (response.EC === 0) {
          setRestaurants(restaurantItems);
          setTotalItems(items);
          setTotalPages(pages);
        } else {
          console.error("API error:", response.EM);
          setRestaurants([]);
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
        setRestaurants([]);
      }
      setIsLoading(false);
    };

    fetchDrivers();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      console.log("Changing to page:", page);
      setCurrentPage(page);
    }
  };

  const fetchRestaurants = async () => {
    const result = restaurantService.findAllPaginated();
    result
      .then((res) => {
        const responseData = res.data;
        console.log(
          "check what here",
          responseData.items.map((item: ItemRestaurantBackend) => ({
            id: item.id,
            name: item.restaurant_name,
            address: `${item.address.street} ${item.address.city} ${item.address.nationality}`,
            cuisine: "",
            isActive: item.status.is_active,
            is_banned: item.status.is_banned,
            rating: undefined,
            avatar: item?.avatar,
          }))
        );
        const buildData = responseData.items.map(
          (item: ItemRestaurantBackend) => ({
            id: item.id,
            name: item.restaurant_name,
            address: `${item.address.street} ${item.address.city} ${item.address.nationality}`,
            cuisine: "",
            isActive: item.status.is_active ?? false,
            is_banned: item.status.is_banned ?? false,
            rating: undefined,
            avatar: item?.avatar,
          })
        );
        const {
          totalItems: items,
          totalPages: pages,
          items: restaurantItems,
        } = res.data;
        if (res.EC === 0) {
          setRestaurants(restaurantItems);
          setTotalItems(items);
          setTotalPages(pages);
        } else {
          console.error("API error:", res.EM);
          setRestaurants([]);
        }
        setRestaurants(buildData);
      })
      .catch((err) => {
        console.log("check err", err);
        setRestaurants([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    const totalCount = restaurants.length;
    const activeCount = restaurants.filter(
      (r) => r.isActive && !r.is_banned
    ).length;
    const bannedCount = restaurants.filter((r) => r.is_banned).length;

    setStats({
      total: totalCount,
      active: activeCount,
      ban: bannedCount,
    });
  }, [restaurants]);

  // const handleGenerateRestaurant = async () => {
  //   setIsLoading(true);
  //   const result = await restaurantService.createRestaurant();
  //   setIsLoading(false);
  //   if (result.EC === 0) {
  //     fetchRestaurants();
  //   }
  // };

  const fetchMenuItems = async (restaurantId: string) => {
    setIsMenuItemsLoading(true);
    try {
      const response = await restaurantService.getMenuItems(restaurantId);
      if (response.EC === 0) {
        setMenuItems(response.data);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
    setIsMenuItemsLoading(false);
  };

  const handleViewMenuItems = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsMenuItemsDialogOpen(true);
    fetchMenuItems(restaurant.id);
  };

  const table = useReactTable({
    data: restaurants,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4">
      <Spinner isVisible={isLoading} isOverlay />
      <h1 className="text-2xl font-bold mb-4">Restaurant Owners Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Restaurants</h2>
          <div className="text-3xl font-bold text-blue-600">{totalItems}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Active Restaurants</h2>
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
        <div className="justify-between flex items-center">
          <h2 className="text-xl font-semibold mb-4">Restaurant List</h2>
          {/* <Button onClick={handleGenerateRestaurant}>
            Generate Restaurant
          </Button> */}
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

      <Dialog
        open={isMenuItemsDialogOpen}
        onOpenChange={setIsMenuItemsDialogOpen}
      >
        <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Restaurant Menu Items</DialogTitle>
            <DialogDescription>
              View menu items for {selectedRestaurant?.restaurant_name}
            </DialogDescription>
          </DialogHeader>
          <Spinner isVisible={isMenuItemsLoading} isOverlay />

          <div className="space-y-4">
            {menuItems.map((item) => (
              <Accordion type="single" collapsible key={item.id}>
                <AccordionItem value={item.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-col items-start text-left">
                      <div className="flex items-center gap-4">
                        <FallbackImage
                          src={item.avatar?.url}
                          alt={item.name}
                          width={32}
                          height={32}
                          className="rounded-sm aspect-square object-cover"
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ${item.price}
                        </span>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${
                              item.availability
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          {item.availability ? "Available" : "Unavailable"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.purchase_count} purchases
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardHeader>
                        <CardTitle>Menu Item Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4">
                          <FallbackImage
                            src={item.avatar?.url}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="rounded-sm aspect-square object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium">Name</p>
                            <p className="text-sm text-muted-foreground">
                              {item.name}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Price</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Description</p>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Availability</p>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${
                                item.availability
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {item.availability ? "Available" : "Unavailable"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Purchase Count</p>
                          <p className="text-sm text-muted-foreground">
                            {item.purchase_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Created At</p>
                          <p className="text-sm text-muted-foreground">
                            {formatEpochToExactTime(item.created_at)}
                          </p>
                        </div>
                      </CardContent>

                      <CardHeader>
                        <CardTitle>Variants</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {item.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-white rounded-md border hover:shadow-md transition-shadow"
                          >
                            {variant.avatar && (
                              <FallbackImage
                                src={variant.avatar.url}
                                alt={variant.variant}
                                width={48}
                                height={48}
                                className="rounded-sm aspect-square object-cover"
                              />
                            )}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">
                                  {variant.variant}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  ${variant.price}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {variant.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                    ${
                                      variant.availability
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {variant.availability
                                    ? "Available"
                                    : "Unavailable"}
                                </span>
                                {variant.discount_rate !== "0" && (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {variant.discount_rate}% off
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
