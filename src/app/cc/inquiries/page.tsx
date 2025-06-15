"use client";
import React, { useEffect, useState } from "react";
import { Eye, MoreHorizontal } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown } from "lucide-react";
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
import IdCell from "@/components/IdCell";
import { inquiryService } from "@/services/customer-cares/inquiryService";
import FallbackImage from "@/components/FallbackImage";

interface EscalatedInquiry {
  id: string;
  customer_id: string;
  assignee_type: string;
  subject: string;
  description: string;
  issue_type: string;
  status: string;
  priority: string;
  resolution_type: string | null;
  resolution_notes: string | null;
  created_at: number;
  updated_at: number;
  resolved_at: number | null;
  first_response_at: number | null;
  last_response_at: number | null;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: {
      key: string;
      url: string;
    };
  };
  assigned_customer_care?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: {
      key: string;
      url: string;
    };
  };
}

const Page = () => {
  const [inquiries, setInquiries] = useState<EscalatedInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInquiry, setSelectedInquiry] =
    useState<EscalatedInquiry | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchEscalatedInquiries();
  }, []);

  const fetchEscalatedInquiries = async () => {
    setIsLoading(true);
    try {
      const response = await inquiryService.getAllEscalatedInquiries();
      if (response.EC === 0) {
        setInquiries(response.data);
      }
    } catch (error) {
      console.error("Error fetching escalated inquiries:", error);
    }
    setIsLoading(false);
  };

  const handleViewDetails = (inquiry: EscalatedInquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailsDialogOpen(true);
  };

  const columns: ColumnDef<EscalatedInquiry>[] = [
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
      accessorKey: "customer",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const inquiry = row.original;
        return (
          <div className="flex flex-row items-center gap-2">
            <FallbackImage
              src={inquiry.customer?.avatar?.url}
              alt="avatar"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
            <span>
              {inquiry.customer.first_name} {inquiry.customer.last_name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Subject
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
        const inquiry = row.original;
        return (
          <div className="text-center">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                ${
                  inquiry.status === "RESOLVED"
                    ? "bg-green-100 text-green-800"
                    : inquiry.status === "ESCALATE"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
            >
              {inquiry.status}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const inquiry = row.original;
        return (
          <div className="text-center">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                ${
                  inquiry.priority === "HIGH"
                    ? "bg-red-100 text-red-800"
                    : inquiry.priority === "MEDIUM"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
            >
              {inquiry.priority}
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
        const inquiry = row.original;
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
                  onClick={() => handleViewDetails(inquiry)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
  ];

  const table = useReactTable({
    data: inquiries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4">
      <Spinner isVisible={isLoading} isOverlay />
      <h1 className="text-2xl font-bold mb-4">Escalated Inquiries</h1>

      <div className="mt-8">
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

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              View details for inquiry from{" "}
              {selectedInquiry?.customer.first_name}{" "}
              {selectedInquiry?.customer.last_name}
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <Card>
              <CardHeader>
                <CardTitle>Inquiry Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Inquiry ID</p>
                  <IdCell id={selectedInquiry.id} />
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${
                        selectedInquiry.status === "RESOLVED"
                          ? "bg-green-100 text-green-800"
                          : selectedInquiry.status === "ESCALATE"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                  >
                    {selectedInquiry.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">Subject</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedInquiry.subject}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedInquiry.description}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Issue Type</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedInquiry.issue_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${
                        selectedInquiry.priority === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : selectedInquiry.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {selectedInquiry.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p className="text-sm text-muted-foreground">
                    {formatEpochToExactTime(selectedInquiry.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Updated At</p>
                  <p className="text-sm text-muted-foreground">
                    {formatEpochToExactTime(selectedInquiry.updated_at)}
                  </p>
                </div>
                {selectedInquiry.resolved_at && (
                  <div>
                    <p className="text-sm font-medium">Resolved At</p>
                    <p className="text-sm text-muted-foreground">
                      {formatEpochToExactTime(selectedInquiry.resolved_at)}
                    </p>
                  </div>
                )}
                {selectedInquiry.resolution_notes && (
                  <div>
                    <p className="text-sm font-medium">Resolution Notes</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedInquiry.resolution_notes}
                    </p>
                  </div>
                )}
              </CardContent>

              {selectedInquiry.assigned_customer_care && (
                <CardHeader>
                  <CardTitle>Assigned Customer Care</CardTitle>
                  <CardContent className="flex items-center gap-4">
                    {selectedInquiry.assigned_customer_care.avatar && (
                      <FallbackImage
                        src={selectedInquiry.assigned_customer_care.avatar.url}
                        alt="Customer Care Avatar"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedInquiry.assigned_customer_care.first_name}{" "}
                        {selectedInquiry.assigned_customer_care.last_name}
                      </p>
                    </div>
                  </CardContent>
                </CardHeader>
              )}
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
