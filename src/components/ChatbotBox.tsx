"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useAdminChatSocket,
  ChatMessage,
  OptionItem,
  ResponseType,
  OrderData,
  CustomerData,
  MessageContent,
} from "@/hooks/useAdminChatSocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  HelpCircle,
  ChevronRight,
  Bot,
  User,
  X,
  MessageCircle,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  Users,
  Search,
  MapPin,
  UserCheck,
} from "lucide-react";
import { Enum_BotActionCode } from "@/constants/api_rules";
import BotTrainingDialog from "./BotTrainingDialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

interface ChatbotBoxProps {
  token: string | null;
}

const ChatbotBox: React.FC<ChatbotBoxProps> = ({ token }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [trainingMode, setTrainingMode] = useState<"add" | "update">("add");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    messages,
    sendMessage,
    sendNextStep,
    sendGetHelp,
  } = useAdminChatSocket(token);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && isConnected) {
      sendMessage(inputMessage.trim());
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOptionClick = (option: OptionItem) => {
    if (isConnected) {
      sendMessage(option.text);
    }
  };

  const isOrderData = (content: MessageContent): content is OrderData => {
    return (
      typeof content === "object" && 
      content !== null && 
      !Array.isArray(content) &&
      'id' in content && 
      'status' in content
    );
  };

  const isCustomerData = (content: MessageContent): content is CustomerData => {
    return (
      typeof content === "object" && 
      content !== null && 
      !Array.isArray(content) &&
      'customers' in content && 
      Array.isArray((content as Record<string, unknown>).customers)
    );
  };

  const renderCustomersList = (data: CustomerData) => {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-purple-800">Registered Customers</h3>
        </div>
        
        <div className="bg-white/80 rounded-lg p-3 border border-purple-100 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              Total Customers
            </span>
            <span className="text-2xl font-bold text-purple-700">
              {data.customers.length || data.count || data.customerCount || 0}
            </span>
          </div>
          {data.message && (
            <div className="mt-2 text-xs text-purple-600">
              {data.message}
            </div>
          )}
        </div>
        
        {data.customers && data.customers.length > 0 && (
          <ScrollArea className="h-[180px] bg-white/60 rounded-lg border border-purple-100 p-2">
            <div className="space-y-2">
              {data.customers.map((customer, index) => (
                <div 
                  key={customer.id || index} 
                  className="p-2 border-b border-purple-50 last:border-0"
                >
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-purple-100 rounded-full">
                      <User className="w-3 h-3 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{customer.name || "Unknown"}</p>
                      {customer.phone && customer.phone !== "N/A" && (
                        <p className="text-xs text-gray-500">{customer.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };

  const renderMessageContent = (message: ChatMessage) => {
    // Handle options type
    if (
      message.type === ResponseType.OPTIONS &&
      Array.isArray(message.content)
    ) {
      return (
        <div className="space-y-2">
          {message.content.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-3 whitespace-normal"
              onClick={() => handleOptionClick(option)}
            >
              <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
              {option.text}
            </Button>
          ))}
        </div>
      );
    }

    // Handle guide type
    if (message.type === ResponseType.GUIDE) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-blue-800 text-sm">
              {typeof message.content === "string" 
                ? message.content 
                : JSON.stringify(message.content)}
            </span>
          </div>
        </div>
      );
    }

    // Handle generic object response (not properly typed)
    if (typeof message.content === "object" && message.content !== null && !Array.isArray(message.content)) {
      // Check if it's a customer data object
      if (isCustomerData(message.content)) {
        return renderCustomersList(message.content);
      }
      
      // Check if it's an order object with id, status, details
      if (isOrderData(message.content)) {
        return (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Search className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-indigo-800">Order Details</h3>
            </div>

            <div className="space-y-3">
              <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                <div>
                  <div>
                    <span className="text-gray-500">Order ID:</span>
                    <p className="font-semibold text-indigo-700">
                      #{message.content.id}
                    </p>
                  </div>
                  <div className="my-2 ">
                    <span className="text-gray-500">Status:</span>
                    <p className="font-semibold text-primary-700 capitalize">
                      {message.content.status || "N/A"}
                    </p>
                  </div>
                  {message.content.details && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Details:</span>
                      <p className="font-semibold">
                        {message.content.details}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      // Fallback for other object types
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-800">
            {Object.entries(message.content).map(([key, value]) => (
              <div key={key} className="mb-1">
                <span className="font-medium">{key}: </span>
                <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Handle action result type
    if (message.type === ResponseType.ACTION_RESULT) {
      switch (message.action_code) {
        case Enum_BotActionCode.GET_GROSS_REVENUE_TODAY:
          console.log("Revenue data received:", message.content);
          // Directly render a styled revenue card
          if (typeof message.content === "object" && 
              message.content !== null && 
              !Array.isArray(message.content)) {
            
            // Extract data with fallbacks
            const content = message.content as Record<string, unknown>;
            const revenue = typeof content.revenue === 'number' ? content.revenue : 
               (typeof content.revenue === 'string' ? parseFloat(content.revenue) : 0);
            const orderCount = typeof content.orderCount === 'number' ? content.orderCount : 
                  (typeof content.orderCount === 'string' ? parseInt(content.orderCount) : 0);
            const date = content.date ? String(content.date) : '';
            const msg = content.message ? String(content.message) : '';
            
            // Format currency
            const formattedRevenue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(revenue);
            
            // Calculate percentage for progress bar
            const goalPercentage = Math.min(Math.round((revenue / 1000) * 100), 100);
            
            return (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-emerald-800">Revenue Summary</h3>
                  </div>
                  {date && (
                    <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200">
                      {date}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Main Revenue Display */}
                  <div className="bg-white rounded-lg p-4 border border-emerald-100 shadow-sm">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                      <div className="flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-emerald-600 mr-1" />
                        <span className="text-3xl font-bold text-emerald-700">
                          {formattedRevenue}
                        </span>
                      </div>
                      {msg && (
                        <p className="text-xs text-emerald-600 mt-2">{msg}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-emerald-100 shadow-sm">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <ShoppingCart className="w-4 h-4 text-blue-600 mr-1" />
                          <p className="text-xs text-gray-500">Orders</p>
                        </div>
                        <p className="text-xl font-bold text-gray-800">{orderCount}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-emerald-100 shadow-sm">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Avg. Order Value</p>
                        <p className="text-xl font-bold text-gray-800">
                          {orderCount > 0
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(revenue / orderCount)
                            : "$0.00"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white rounded-lg p-3 border border-emerald-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Daily Goal</span>
                      <span className="text-xs font-medium text-emerald-700">
                        {goalPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full" 
                        style={{ width: `${goalPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-gray-400">Target: $1,000</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          
          // Fallback for other formats
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-gray-800 text-sm">
                {typeof message.content === "object"
                  ? JSON.stringify(message.content, null, 2)
                  : String(message.content)}
              </span>
            </div>
          );

        case Enum_BotActionCode.GET_CUSTOMERS_REGISTERED_TODAY:
          if (isCustomerData(message.content)) {
            return renderCustomersList(message.content);
          } else if (typeof message.content === "object" && message.content !== null) {
            // Handle the simple count response
            return (
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-purple-800">New Customers</h3>
                </div>
                <div className="bg-white/80 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Registered Today
                    </span>
                    <span className="text-2xl font-bold text-purple-700">
                      {(() => {
                        if (typeof message.content === "object" && message.content !== null) {
                          if (Array.isArray(message.content)) {
                            return "0";
                          }
                          
                          const content = message.content as Record<string, unknown>;
                          if ('count' in content && typeof content.count === 'number') {
                            return content.count;
                          }
                          if ('customerCount' in content && typeof content.customerCount === 'number') {
                            return content.customerCount;
                          }
                          return "0";
                        }
                        return String(message.content);
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          return null;

        case Enum_BotActionCode.GET_TOTAL_ORDERS_TODAY:
          return (
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-800">Orders Today</h3>
              </div>
              <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Total Orders
                  </span>
                  <span className="text-2xl font-bold text-blue-700">
                    {(() => {
                      if (typeof message.content === "object" && message.content !== null) {
                        if (Array.isArray(message.content)) {
                          return "0";
                        }
                        
                        const content = message.content as Record<string, unknown>;
                        if ('count' in content && typeof content.count === 'number') {
                          return content.count;
                        }
                        if ('orderCount' in content && typeof content.orderCount === 'number') {
                          return content.orderCount;
                        }
                        return "0";
                      }
                      return String(message.content);
                    })()}
                  </span>
                </div>
              </div>
            </div>
          );

        case Enum_BotActionCode.GET_PENDING_ORDERS:
          return (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold text-orange-800">
                  Pending Orders
                </h3>
              </div>
              <div className="bg-white/80 rounded-lg p-3 border border-orange-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Awaiting Processing
                  </span>
                  <span className="text-2xl font-bold text-orange-700">
                    {(() => {
                      if (typeof message.content === "object" && message.content !== null) {
                        if (Array.isArray(message.content)) {
                          return "0";
                        }
                        
                        const content = message.content as Record<string, unknown>;
                        if ('count' in content && typeof content.count === 'number') {
                          return content.count;
                        }
                        if ('pendingCount' in content && typeof content.pendingCount === 'number') {
                          return content.pendingCount;
                        }
                        return "0";
                      }
                      return String(message.content);
                    })()}
                  </span>
                </div>
              </div>
              {(() => {
                if (typeof message.content === "object" && 
                    message.content !== null && 
                    !Array.isArray(message.content)) {
                  const content = message.content as Record<string, unknown>;
                  if ('message' in content && typeof content.message === 'string') {
                    return (
                      <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                        {content.message}
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          );

        case Enum_BotActionCode.FIND_ORDER_BY_ID:
          if (isOrderData(message.content)) {
            return (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Search className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-indigo-800">Order Details</h3>
                </div>

                <div className="space-y-3">
                  <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Order ID:</span>
                        <p className="font-semibold text-indigo-700">
                          #{message.content.id}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-semibold capitalize">
                          {message.content.status || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Customer:</span>
                        <p className="font-semibold">
                          {message.content.customer_name ||
                            message.content.customer_id ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <p className="font-semibold text-green-600">
                          {message.content.total_amount
                            ? formatCurrency(message.content.total_amount)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {message.content.restaurant_name && (
                    <div className="bg-white/60 rounded-lg p-2 border border-indigo-100">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium">
                          {message.content.restaurant_name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          } else {
            return (
              <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                <span className="text-sm text-gray-600">
                  {typeof message.content === "string"
                    ? message.content
                    : "Order information not available"}
                </span>
              </div>
            );
          }

        default:
          // Fallback for other action results
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-gray-800 text-sm">
                {typeof message.content === "object"
                  ? JSON.stringify(message.content, null, 2)
                  : String(message.content)}
              </span>
            </div>
          );
      }
    }

    // Default text rendering
    return <span className="text-sm">
      {typeof message.content === "string" 
        ? message.content 
        : JSON.stringify(message.content)}
    </span>;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
        {!isConnected && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 text-xs"
          >
            Offline
          </Badge>
        )}
        {isConnected && (
          <Badge
            variant="default"
            className="absolute -top-2 -right-2 text-xs bg-green-500"
          >
            Online
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 h-[480px] flex flex-col shadow-xl border-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span className="font-medium">Admin Assistant</span>
            <Badge
              variant={isConnected ? "default" : "destructive"}
              className={`text-xs ${isConnected ? "bg-green-500" : ""}`}
            >
              {isConnected ? "Online" : "Offline"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 text-white hover:bg-blue-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm">
              Welcome! Type a message or click &quot;Get Help&quot; to start.
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`${
                  message.isUser ? "max-w-[75%] order-2" : "max-w-[95%] order-1"
                }`}
              >
                <div
                  className={`rounded-lg p-3 ${
                    message.isUser
                      ? "bg-blue-600 text-white"
                      : "bg-white border shadow-sm"
                  }`}
                >
                  {!message.isUser && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-gray-600">
                        Assistant
                      </span>
                    </div>
                  )}
                  {renderMessageContent(message)}
                </div>
                <div
                  className={`text-xs text-gray-500 mt-1 ${
                    message.isUser ? "text-right" : "text-left"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>

              {message.isUser && (
                <div className="flex items-end order-1 mr-2">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input and Actions */}
        <div className="border-t p-4 bg-white space-y-3">
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={sendGetHelp}
              disabled={!isConnected}
              className="flex-1"
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Get Help
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={sendNextStep}
              disabled={!isConnected}
              className="flex-1"
            >
              <ChevronRight className="w-4 h-4 mr-1" />
              Next Step
            </Button>

            <Popover
            // open={isTrainingDialogOpen}
            // onOpenChange={(open) => setIsTrainingDialogOpen(open)}
            >
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  // onClick={() => setIsTrainingDialogOpen(true)}
                  className=" cursor-pointer transition-colors"
                >
                  <Bot className="w-4 h-4 mr-1" />
                  Train
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-48 border-none bg-info shadow-none p-2"
                align="end"
                side="left"
                sideOffset={5}
              >
                <Button
                  onClick={() => {
                    setTrainingMode("add");
                    setIsTrainingDialogOpen(true);
                  }}
                  variant="outline"
                  className="w-full mb-1"
                >
                  Add
                </Button>
                <Button
                  onClick={() => {
                    setTrainingMode("update");
                    setIsTrainingDialogOpen(true);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Update
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected ? "Type your message..." : "Connecting..."
              }
              disabled={!isConnected}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !isConnected}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Training Dialog */}
      <BotTrainingDialog
        isOpen={isTrainingDialogOpen}
        onClose={() => setIsTrainingDialogOpen(false)}
        token={token}
        mode={trainingMode}
      />
    </div>
  );
};

export default ChatbotBox;
