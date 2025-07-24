"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { OrderDetail } from "@/types/order-detail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import OrderDetailsDialog from "./OrderDetailsDialog";

interface OrderHoverContentProps {
  orderId: string;
}

export default function OrderHoverContent({ orderId }: OrderHoverContentProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(`/orders/${orderId}`);
        if (response.data.EC === 0) {
          setOrder(response.data.data);
        } else {
          setError(response.data.EM || "Failed to fetch order details.");
        }
      } catch (err) {
        setError("An error occurred while fetching order details.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>;
  }

  if (!order) {
    return <div className="p-4 text-sm">No order details found.</div>;
  }

  return (
    <>
      <div className="p-2 space-y-2 max-w-sm">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-base">Order #{order.id.split('_').pop()?.slice(0, 8)}...</h4>
          <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>{order.status}</Badge>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>Customer:</div>
          <div className="font-medium truncate">{order.customer.first_name} {order.customer.last_name}</div>
          <div>Restaurant:</div>
          <div className="font-medium truncate">{order.restaurant.restaurant_name}</div>
          <div>Total:</div>
          <div className="font-medium">${order.total_amount}</div>
          <div>Payment:</div>
          <div className="font-medium">{order.payment_method} ({order.payment_status})</div>
        </div>
        <Button size="sm" className="w-full mt-2" onClick={() => setIsDialogOpen(true)}>
          View Full Details
        </Button>
      </div>
      <OrderDetailsDialog order={order} isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
    </>
  );
} 