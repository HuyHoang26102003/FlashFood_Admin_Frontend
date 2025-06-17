"use client";
import React, { useEffect, useState } from "react";
import { Eye, MoreHorizontal, ArrowLeft } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEpochToRelativeTime } from "@/utils/functions/formatRelativeTime";
import axiosInstance from "@/lib/axios";
import { ENUM_INQUIRY_PRIORITY, ENUM_INQUIRY_STATUS } from "@/types/inquiries";
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
  const [status, setStatus] = useState<ENUM_INQUIRY_STATUS>(ENUM_INQUIRY_STATUS.OPEN);
  const [priority, setPriority] = useState<ENUM_INQUIRY_PRIORITY>(ENUM_INQUIRY_PRIORITY.LOW);
  const [issueType, setIssueType] = useState<string>("OTHER");
  const [resolutionType, setResolutionType] = useState<string>("OTHER");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEscalatedInquiries();
  }, []);

  useEffect(() => {
    if (selectedInquiry) {
      setStatus(selectedInquiry.status as ENUM_INQUIRY_STATUS);
      setPriority(selectedInquiry.priority as ENUM_INQUIRY_PRIORITY);
      setIssueType(selectedInquiry.issue_type || "OTHER");
      setResolutionType(selectedInquiry.resolution_type || "OTHER");
      setResolutionNotes(selectedInquiry.resolution_notes || "");
    }
  }, [selectedInquiry]);

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

  const handleSave = async () => {
    if (!selectedInquiry || !resolutionType || !issueType || !priority || !status || !resolutionNotes) {
      console.log("Please fill all fields");
      return;
    }
    
    setIsLoading(true);
    setIsSubmitting(true);
    
    const currentTime = Math.floor(Date.now() / 1000);
    
    const requestBody = {
      status,
      priority,
      issue_type: issueType,
      resolution_type: status === ENUM_INQUIRY_STATUS.RESOLVED ? resolutionType : undefined,
      resolution_notes: resolutionNotes,
      last_response_at: currentTime,
      resolved_at: status === ENUM_INQUIRY_STATUS.RESOLVED ? currentTime : undefined,
      first_response_at: selectedInquiry.first_response_at || currentTime,
    };

    try {
      const response = await axiosInstance.patch(
        `customer-care-inquiries/${selectedInquiry.id}`,
        requestBody
      );
      
      if (response.data.EC === 0) {
        fetchEscalatedInquiries();
        setIsDetailsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating inquiry:", error);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  // Function to get status color
  const getStatusColor = (status: ENUM_INQUIRY_STATUS) => {
    switch (status) {
      case ENUM_INQUIRY_STATUS.OPEN:
        return "bg-blue-500";
      case ENUM_INQUIRY_STATUS.IN_PROGRESS:
        return "bg-orange-400";
      case ENUM_INQUIRY_STATUS.RESOLVED:
        return "bg-green-500";
      case ENUM_INQUIRY_STATUS.ESCALATE:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Function to get priority color
  const getPriorityColor = (priority: ENUM_INQUIRY_PRIORITY) => {
    switch (priority) {
      case ENUM_INQUIRY_PRIORITY.HIGH:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
        <DialogContent className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailsDialogOpen(false)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Tickets
              </Button>
              <h2 className="text-xl font-semibold">
                Ticket #{selectedInquiry?.id}
              </h2>
            </div>

          {selectedInquiry && (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`}></div>
                    <CardTitle className="text-lg">Ticket Details</CardTitle>
                    {priority === ENUM_INQUIRY_PRIORITY.HIGH && (
                      <Badge className={getPriorityColor(priority)}>High Priority</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Created: {formatEpochToRelativeTime(selectedInquiry.created_at)} ago
                  </div>
              </CardHeader>

                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-3 gap-6">
                    {/* Left side - Basic Information */}
                    <div className="col-span-2 space-y-6">
                      <h3 className="font-medium">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-6">
                <div>
                          <label className="text-sm font-medium">Status</label>
                          <Select value={status} onValueChange={(value) => setStatus(value as ENUM_INQUIRY_STATUS)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ENUM_INQUIRY_STATUS.OPEN}>Open</SelectItem>
                              <SelectItem value={ENUM_INQUIRY_STATUS.IN_PROGRESS}>In Progress</SelectItem>
                              <SelectItem value={ENUM_INQUIRY_STATUS.RESOLVED}>Resolved</SelectItem>
                              <SelectItem value={ENUM_INQUIRY_STATUS.CLOSED}>Closed</SelectItem>
                              <SelectItem value={ENUM_INQUIRY_STATUS.ESCALATE}>Escalate</SelectItem>
                            </SelectContent>
                          </Select>
                </div>

                <div>
                          <label className="text-sm font-medium">Priority</label>
                          <Select value={priority} onValueChange={(value) => setPriority(value as ENUM_INQUIRY_PRIORITY)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ENUM_INQUIRY_PRIORITY.URGENT}>Urgent</SelectItem>
                              <SelectItem value={ENUM_INQUIRY_PRIORITY.HIGH}>High</SelectItem>
                              <SelectItem value={ENUM_INQUIRY_PRIORITY.MEDIUM}>Medium</SelectItem>
                              <SelectItem value={ENUM_INQUIRY_PRIORITY.LOW}>Low</SelectItem>
                            </SelectContent>
                          </Select>
                </div>

                <div>
                          <label className="text-sm font-medium">Issue Type</label>
                          <Select value={issueType} onValueChange={setIssueType}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Issue Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACCOUNT">Account</SelectItem>
                              <SelectItem value="PAYMENT">Payment</SelectItem>
                              <SelectItem value="PRODUCT">Product</SelectItem>
                              <SelectItem value="DELIVERY">Delivery</SelectItem>
                              <SelectItem value="REFUND">Refund</SelectItem>
                              <SelectItem value="TECHNICAL">Technical</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                </div>

                <div>
                          <label className="text-sm font-medium">Resolution Type</label>
                          <Select value={resolutionType} onValueChange={setResolutionType}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Resolution Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="REFUND">Refund</SelectItem>
                              <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                              <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                              <SelectItem value="ACCOUNT_FIX">Account Fix</SelectItem>
                              <SelectItem value="TECHNICAL_SUPPORT">Technical Support</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                </div>

                    {/* Right side - Customer Information */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Customer Information</h3>

                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage
                            src={selectedInquiry.customer?.avatar?.url}
                            alt={selectedInquiry.customer.first_name.slice(0, 1)}
                          />
                          <AvatarFallback>
                            {selectedInquiry.customer.first_name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                <div>
                          <div className="font-medium">
                            {selectedInquiry.customer.last_name} {selectedInquiry.customer.first_name}
                          </div>
                </div>
                </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Timeline</h4>
                        <div className="text-sm space-y-1">
                          {selectedInquiry.first_response_at && (
                <div>
                              First Response: {formatEpochToRelativeTime(selectedInquiry.first_response_at)} ago
                </div>
                          )}
                          {selectedInquiry.last_response_at && (
                <div>
                              Last Response: {formatEpochToRelativeTime(selectedInquiry.last_response_at)} ago
                </div>
                          )}
                {selectedInquiry.resolved_at && (
                  <div>
                              Resolved: {formatEpochToRelativeTime(selectedInquiry.resolved_at)} ago
                  </div>
                )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Content */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Ticket Content</h3>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject</label>
                      <div className="p-3 bg-gray-50 rounded-md">{selectedInquiry.subject}</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <div className="p-3 bg-gray-50 rounded-md">{selectedInquiry.description}</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Resolution Notes</label>
                      <textarea
                        className="w-full p-3 border rounded-md"
                        rows={4}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Add resolution notes..."
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                    </div>
                  </CardContent>
            </Card>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
