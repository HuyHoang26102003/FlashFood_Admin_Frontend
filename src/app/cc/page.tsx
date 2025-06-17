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
import { ArrowUpDown, Eye, MoreHorizontal, Power, Trash } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
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

  const handleStatusChange = async (id: string, shouldBan: boolean) => {
    try {
      const response = await customerCareService.toggleCustomerCareStatus(
        id,
        shouldBan
      );
      if (response.EC === 0) {
        setCustomerCare((prevCC) =>
          prevCC.map((cc) =>
            cc.id === id
              ? { ...cc, is_banned: shouldBan, available_for_work: !shouldBan }
              : cc
          )
        );
      }
    } catch (error) {
      console.error("Error toggling customer care status:", error);
    }
  };

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
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 w-full p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32">
              <div className="grid gap-4">
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => {
                    // Handle view details
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Details
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => handleStatusChange(cc.id, !cc.is_banned)}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {cc.is_banned ? "Unban" : "Ban"}
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

  const fetchCustomerCare = async () => {
    setIsLoading(true);
    try {
      const response = await customerCareService.findAllPaginated(10, currentPage);
      const { totalItems: items, totalPages: pages, items: ccItems } = response.data;
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

  useEffect(() => {
    setIsLoading(true);
    fetchCustomerCare();
  }, [currentPage]);

  useEffect(() => {
    const totalCount = customerCare.length;
    const activeCount = customerCare.filter((cc) => !cc.is_banned && cc.available_for_work).length;
    const bannedCount = customerCare.filter((cc) => cc.is_banned).length;

    setStats({
      total: totalCount,
      active: activeCount,
      banned: bannedCount,
    });
  }, [customerCare]);

  const table = useReactTable({
    data: customerCare,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="p-4">
      {isLoading && <Spinner isVisible={isLoading} isOverlay />}
      <h1 className="text-2xl font-bold mb-4">Customer Care Dashboard</h1>

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
        <div className="justify-between flex items-center">
          <h2 className="text-xl font-semibold mb-4">
            Customer Care Representatives
          </h2>
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
    </div>
  );
};

export default Page;
