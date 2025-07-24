"use client";
import { IMAGE_LINKS } from "@/assets/imageLinks";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customerCareService } from "@/services/companion-admin/customerCareService";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Power,
  Loader2,
  Trash,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { Spinner } from "@/components/Spinner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
interface CustomerCare {
  id: string;
  first_name: string;
  last_name: string;
  active_point: number;
  avatar: {
    url: string;
    key: string;
  };
  is_assigned: boolean;
  available_for_work: boolean;
  is_banned: boolean;
  address: string;
  contact_email: {
    email: string;
  }[];
}

const Page = () => {
  const [customerCare, setCustomerCare] = useState<CustomerCare[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [selectedCCId, setSelectedCCId] = useState<string | null>(null);
  const [isBanLoading, setIsBanLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerCareSearchResult, setCustomerCareSearchResult] = useState<
    CustomerCare[]
  >([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingCCId, setDeletingCCId] = useState<string | null>(null);

  const handleDeleteCC = (ccId: string) => {
    setDeletingCCId(ccId);
    setIsDeleting(true);
    setTimeout(() => {
      setCustomerCare((prev) => prev.filter((cc) => cc.id !== ccId));
      setCustomerCareSearchResult((prev) =>
        prev.filter((cc) => cc.id !== ccId)
      );
      setIsDeleting(false);
      setDeletingCCId(null);
      toast({
        title: "Deleted",
        description:
          "The customer care representative has been removed from the list.",
      });
    }, 1500);
  };

  const handleStatusChange = (id: string, shouldBan: boolean) => {
    setSelectedCCId(id);
    if (shouldBan) {
      setIsUnbanning(false);
    } else {
      setIsUnbanning(true);
    }
    setIsBanDialogOpen(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedCCId || !banReason.trim()) return;

    try {
      setIsBanLoading(true);
      const response = await superAdminService.banAccount(
        selectedCCId,
        "CustomerCare",
        banReason
      );

      if (response.EC === 0) {
        setCustomerCare((prevCC) =>
          prevCC.map((cc) =>
            cc.id === selectedCCId
              ? {
                  ...cc,
                  is_banned: !isUnbanning,
                }
              : cc
          )
        );
        setIsBanDialogOpen(false);
        setBanReason("");
        setSelectedCCId(null);
        toast({
          title: "Success",
          description: `Customer Care Representative has been successfully ${
            isUnbanning ? "unbanned" : "banned"
          }.`,
        });
      } else {
        toast({
          title: "Error",
          description:
            response.EM ||
            `Failed to ${
              isUnbanning ? "unban" : "ban"
            } customer care representative.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(
        `Error ${
          isUnbanning ? "unbanning" : "banning"
        } customer care representative:`,
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

  const handleSearch = async (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setCustomerCareSearchResult([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await userSearchService.searchUsers(
          query,
          "customer_care"
        );
        if (response.EC === 0) {
          // Convert UserSearchResult to CustomerCare type
          const convertedResults: CustomerCare[] = response.data.results.map(
            (user) => ({
              id: user.id,
              first_name: user.first_name || "",
              last_name: user.last_name || "",
              active_point: 0,
              avatar: user.avatar || { url: "", key: "" },
              is_assigned: false,
              available_for_work: true,
              is_banned: false,
              address: "",
              contact_email: [{ email: user.user_email || "" }],
            })
          );
          setCustomerCareSearchResult(convertedResults);
        } else {
          setCustomerCareSearchResult([]);
        }
      } catch (error) {
        console.error("Error searching customer care:", error);
        setCustomerCareSearchResult([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const columns: ColumnDef<CustomerCare>[] = [
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
        const cc = row.original;
        return (
          <div className="flex flex-row items-center gap-2">
            <Image
              src={cc?.avatar?.url ?? IMAGE_LINKS.DEFAULT_AVATAR}
              alt="avatar"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
            <span>{cc?.contact_email[0]?.email}</span>
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
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const cc = row.original;
        return (
          <div className="text-center">
            {cc.first_name} {cc.last_name}
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
        const cc = row.original;
        return (
          <div className="text-center">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                cc.is_banned
                  ? "bg-red-100 text-red-800"
                  : cc.available_for_work
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {cc.is_banned
                ? "Banned"
                : cc.available_for_work
                ? "Active"
                : "Inactive"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "is_assigned",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assignment Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue("is_assigned") ? "Assigned" : "Unassigned"}
        </div>
      ),
    },
    {
      accessorKey: "active_point",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Active Points
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-center">{row.getValue("active_point")}</div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: "Actions",
      cell: ({ row }) => {
        const cc = row.original;
        if (isDeleting && deletingCCId === cc.id) {
          return (
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          );
        }
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 w-full p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32">
              <div className="grid gap-4">
                {/* <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => {
                    // Handle view details
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Details
                </Button> */}
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    handleStatusChange(cc.id, !cc.is_banned);
                  }}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {cc.is_banned ? "Unban" : "Ban"}
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start text-destructive hover:text-destructive"
                  onClick={() => handleDeleteCC(cc.id)}
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

  const fetchCustomerCare = async () => {
    setIsLoading(true);
    try {
      const response = await customerCareService.findAllPaginated(
        10,
        currentPage
      );
      const {
        totalItems: items,
        totalPages: pages,
        items: ccItems,
      } = response.data;
      if (response.EC === 0) {
        setCustomerCare(ccItems);
        setTotalItems(items);
        setTotalPages(pages);
      } else {
        console.error("API error:", response.EM);
        setCustomerCare([]);
      }
    } catch (error) {
      console.error("Error fetching customer care:", error);
      setCustomerCare([]);
    }
    setIsLoading(false);
  };

  const fetchCustomerCareForPolling = async () => {
    try {
      const response = await customerCareService.findAllPaginated(
        10,
        currentPage
      );
      const {
        totalItems: items,
        totalPages: pages,
        items: ccItems,
      } = response.data;
      if (response.EC === 0) {
        setCustomerCare(ccItems);
        setTotalItems(items);
        setTotalPages(pages);
      } else {
        console.error("API error:", response.EM);
        setCustomerCare([]);
      }
    } catch (error) {
      console.error("Error fetching customer care:", error);
      setCustomerCare([]);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchCustomerCare();

    // Set up 30-second polling for live updates
    const pollInterval = setInterval(() => {
      console.log("🔄 Polling customer care data...");
      fetchCustomerCareForPolling();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [currentPage]);

  useEffect(() => {
    const totalCount = customerCare.length;
    const activeCount = customerCare.filter(
      (cc) => !cc.is_banned && cc.available_for_work
    ).length;
    const bannedCount = customerCare.filter((cc) => cc.is_banned).length;

    setStats({
      total: totalCount,
      active: activeCount,
      banned: bannedCount,
    });
  }, [customerCare]);

  const table = useReactTable({
    data: searchQuery ? customerCareSearchResult : customerCare,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="p-4">
      {isLoading && <Spinner isVisible={isLoading} isOverlay />}
      <Breadcrumb className="mb-4">
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
              Customer Care Represetatives
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Customer Care</h2>
          <div className="text-3xl font-bold text-blue-600">{totalItems}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Active Customer Care</h2>
          <div className="text-3xl font-bold text-green-600">
            {stats.active}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Banned Customer Care</h2>
          <div className="text-3xl font-bold text-red-600">{stats.banned}</div>
        </div>
      </div>

      <div className="mt-8">
        <div className="justify-between flex items-center mb-4">
          <h2 className="text-xl font-semibold mb-4">
            Customer Care Representatives
          </h2>
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
              {table.getRowModel().rows.length > 0 ? (
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
                    No customer care representatives found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-8">
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
            {(() => {
              const pages = [];
              if (totalPages <= 4) {
                // If total pages is 4 or less, show all pages
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => handlePageChange(i)}
                        isActive={currentPage === i}
                      >
                        {i}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              } else {
                // Always show first page
                pages.push(
                  <PaginationItem key={1}>
                    <PaginationLink
                      onClick={() => handlePageChange(1)}
                      isActive={currentPage === 1}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                );

                // Show dots if current page is more than 2
                if (currentPage > 2) {
                  pages.push(
                    <PaginationItem key="ellipsis1">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                // Show current page if it's not first or last
                if (currentPage !== 1 && currentPage !== totalPages) {
                  pages.push(
                    <PaginationItem key={currentPage}>
                      <PaginationLink
                        onClick={() => handlePageChange(currentPage)}
                        isActive={true}
                      >
                        {currentPage}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }

                // Show dots if current page is less than totalPages - 1
                if (currentPage < totalPages - 1) {
                  pages.push(
                    <PaginationItem key="ellipsis2">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                // Always show last page
                pages.push(
                  <PaginationItem key={totalPages}>
                    <PaginationLink
                      onClick={() => handlePageChange(totalPages)}
                      isActive={currentPage === totalPages}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return pages;
            })()}
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

      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>Ban Customer Care Representative</DialogTitle>
            <DialogDescription>
              Please provide a reason for banning this customer care
              representative. This will be recorded for administrative purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Ban Reason</Label>
              <Input
                id="reason"
                placeholder="Enter the reason for banning..."
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
                setSelectedCCId(null);
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
                  Banning...
                </>
              ) : (
                "Ban Representative"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
