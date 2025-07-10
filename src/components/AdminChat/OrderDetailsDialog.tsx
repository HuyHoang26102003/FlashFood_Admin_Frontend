"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OrderDetail, OrderItem } from "@/types/order-detail";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Package, User, Store, Truck } from "lucide-react";

interface OrderDetailsDialogProps {
  order: OrderDetail | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-2">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="text-sm font-medium text-gray-900 text-right">{value}</dd>
  </div>
);

const EntityCard = ({ title, name, avatarUrl, icon: Icon }: { title: string, name: string, avatarUrl?: string, icon: React.ElementType }) => (
    <div className="p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center"><Icon className="h-4 w-4 mr-2" />{title}</h4>
        <div className="flex items-center space-x-3">
            <Avatar>
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{name}</span>
        </div>
    </div>
)

export default function OrderDetailsDialog({ order, isOpen, setIsOpen }: OrderDetailsDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <Package className="h-6 w-6 mr-2" />
             Order Details: #{order.id.split('_').pop()?.slice(0,8)}...
          </DialogTitle>
          <DialogDescription>
            Placed on {format(new Date(Number(order.order_time) * 1000), "PPP p")}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
            <div className="p-1 pr-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <EntityCard title="Customer" name={`${order.customer.first_name} ${order.customer.last_name}`} avatarUrl={order.customer.avatar?.url} icon={User} />
                    <EntityCard title="Restaurant" name={order.restaurant.restaurant_name} avatarUrl={order.restaurant.avatar?.url} icon={Store} />
                    {order.driver && <EntityCard title="Driver" name={`${order.driver.first_name} ${order.driver.last_name}`} avatarUrl={order.driver.avatar?.url} icon={Truck} />}
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        {order.order_items.map((item: OrderItem) => (
                            <div key={item.item_id} className="flex justify-between items-center py-2">
                                <div>
                                    <p className="font-medium">{item.name} <span className="text-sm text-gray-500">x{item.quantity}</span></p>
                                </div>
                                <p className="font-medium">${(Number(item.price_at_time_of_order) * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                         <Separator className="my-2" />
                        <DetailRow label="Subtotal" value={`$${order.order_items.reduce((acc, item) => acc + Number(item.price_at_time_of_order) * item.quantity, 0).toFixed(2)}`} />
                        <DetailRow label="Service Fee" value={`$${order.service_fee}`} />
                        <DetailRow label="Delivery Fee" value={`$${order.delivery_fee}`} />
                        <Separator className="my-2" />
                        <DetailRow label="Total" value={<span className="font-bold text-lg text-black">${order.total_amount}</span>} />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Payment & Status</h3>
                     <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                        <DetailRow label="Payment Method" value={order.payment_method} />
                        <DetailRow label="Payment Status" value={<Badge>{order.payment_status}</Badge>} />
                        <DetailRow label="Order Status" value={<Badge variant="secondary">{order.status}</Badge>} />
                     </div>
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 