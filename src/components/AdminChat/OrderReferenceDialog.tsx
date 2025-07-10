import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orderService } from "@/services/order/orderService";
import { OrderReference } from "@/types/admin-chat";
import { Search, Package } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total_amount: string;
  created_at: number;
  customer: {
    first_name: string;
    last_name: string;
  };
  restaurant: {
    restaurant_name: string;
  };
  // Derived properties for easier access
  orderNumber?: string;
  customerName?: string;
  restaurantName?: string;
  totalAmount?: number;
}

interface OrderReferenceDialogProps {
  trigger: React.ReactNode;
  onOrderSelected: (orderRef: OrderReference) => void;
}

export default function OrderReferenceDialog({
  trigger,
  onOrderSelected,
}: OrderReferenceDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Order reference configuration
  const [issueDescription, setIssueDescription] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [orderStatus, setOrderStatus] = useState("");

  useEffect(() => {
    if (open) {
      loadOrders();
    }
  }, [open]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await orderService.findAllPaginated(20, 1);
      if (response.EC === 0) {
        // Transform the orders to include derived properties
        const transformedOrders = (response.data.items || []).map((order: {
          id: string;
          status: string;
          total_amount: string;
          created_at: number;
          customer?: { first_name?: string; last_name?: string };
          restaurant?: { restaurant_name?: string };
        }) => ({
          ...order,
          orderNumber: order.id.replace('FF_ORDER_', ''),
          customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
          restaurantName: order.restaurant?.restaurant_name || 'Unknown Restaurant',
          totalAmount: parseFloat(order.total_amount) || 0,
        }));
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setOrderStatus(order.status);
    // Reset fields for the new selection
    setIssueDescription("");
    setUrgencyLevel("medium");
  };

  const handleConfirm = () => {
    if (!selectedOrder) return;

    const orderReference: OrderReference = {
      orderId: selectedOrder.id,
      orderStatus: orderStatus || selectedOrder.status,
      customerName: selectedOrder.customerName || 'Unknown Customer',
      restaurantName: selectedOrder.restaurantName || 'Unknown Restaurant',
      totalAmount: selectedOrder.totalAmount || 0,
      issueDescription: issueDescription || undefined,
      urgencyLevel,
    };

    onOrderSelected(orderReference);
    setOpen(false);
    
    // Reset form
    setSelectedOrder(null);
    setIssueDescription("");
    setUrgencyLevel("medium");
    setOrderStatus("");
    setSearchQuery("");
  };

  const filteredOrders = orders.filter(
    (order) =>
      (order.orderNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.restaurantName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[1400px] h-[90%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reference Order</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-full">
          {/* Order List */}
          <div className="flex-1 flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOrders.map((order) => (
                    <Popover key={order.id}>
                      <PopoverTrigger asChild>
                        <Card
                          className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedOrder?.id === order.id
                              ? "bg-blue-50 border-blue-200"
                              : ""
                          }`}
                          onClick={() => handleOrderSelect(order)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Package className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium">
                                  #{order.orderNumber}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {order.customerName} • {order.restaurantName}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                ${order.totalAmount}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        <div className="space-y-4">
                          <h3 className="font-semibold">
                            Order Reference Details
                          </h3>

                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="orderStatus">Order Status</Label>
                              <Input
                                id="orderStatus"
                                value={orderStatus}
                                onChange={(e) => setOrderStatus(e.target.value)}
                                placeholder="Enter current status"
                              />
                            </div>

                            <div>
                              <Label htmlFor="urgencyLevel">
                                Urgency Level
                              </Label>
                              <Select
                                value={urgencyLevel}
                                onValueChange={(
                                  value:
                                    | "low"
                                    | "medium"
                                    | "high"
                                    | "critical"
                                ) => setUrgencyLevel(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">
                                    Medium
                                  </SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">
                                    Critical
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="issueDescription">
                                Issue Description
                              </Label>
                              <Textarea
                                id="issueDescription"
                                value={issueDescription}
                                onChange={(e) =>
                                  setIssueDescription(e.target.value)
                                }
                                placeholder="Describe the issue related to this order..."
                                rows={3}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={handleConfirm}
                              className="flex-1"
                            >
                              Add Reference
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 