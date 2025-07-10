"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useAdminChatSocket,
  ChatMessage,
  OptionItem,
  ResponseType,
  RevenueData,
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
  Calendar,
  TrendingUp,
  Clock,
  Users,
  Search,
  MapPin,
} from "lucide-react";
import { Enum_BotActionCode } from "@/constants/api_rules";
import BotTrainingDialog from "./BotTrainingDialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
    clearMessages,
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

  const renderMessageContent = (message: ChatMessage) => {
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

    if (message.type === ResponseType.GUIDE) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-blue-800 text-sm">
              {message.content as string}
            </span>
          </div>
        </div>
      );
    }

    if (message.type === ResponseType.ACTION_RESULT) {
      switch (message.action_code) {
        case Enum_BotActionCode.GET_GROSS_REVENUE_TODAY:
          return <RevenueCard data={message.content as RevenueData} />;

        case Enum_BotActionCode.GET_TOTAL_ORDERS_TODAY:
          const orderData = message.content as any;
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
                    {typeof orderData === "object"
                      ? orderData.count || orderData.orderCount
                      : orderData}
                  </span>
                </div>
              </div>
            </div>
          );

        case Enum_BotActionCode.GET_CUSTOMERS_REGISTERED_TODAY:
          const customerData = message.content as any;
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
                    {typeof customerData === "object"
                      ? customerData.count || customerData.customerCount
                      : customerData}
                  </span>
                </div>
              </div>
            </div>
          );

        case Enum_BotActionCode.GET_PENDING_ORDERS:
          const pendingData = message.content as any;
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
                    {typeof pendingData === "object"
                      ? pendingData.count || pendingData.pendingCount
                      : pendingData}
                  </span>
                </div>
              </div>
              {typeof pendingData === "object" && pendingData.message && (
                <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  {pendingData.message}
                </div>
              )}
            </div>
          );

        case Enum_BotActionCode.FIND_ORDER_BY_ID:
          const orderInfo = message.content as any;
          return (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Search className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-indigo-800">Order Details</h3>
              </div>

              {typeof orderInfo === "object" && orderInfo.id ? (
                <div className="space-y-3">
                  <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Order ID:</span>
                        <p className="font-semibold text-indigo-700">
                          #{orderInfo.id}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-semibold capitalize">
                          {orderInfo.status || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Customer:</span>
                        <p className="font-semibold">
                          {orderInfo.customer_name ||
                            orderInfo.customer_id ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <p className="font-semibold text-green-600">
                          {orderInfo.total_amount
                            ? formatCurrency(orderInfo.total_amount)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {orderInfo.restaurant_name && (
                    <div className="bg-white/60 rounded-lg p-2 border border-indigo-100">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium">
                          {orderInfo.restaurant_name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                  <span className="text-sm text-gray-600">
                    {typeof orderInfo === "string"
                      ? orderInfo
                      : "Order information not available"}
                  </span>
                </div>
              )}
            </div>
          );

        default:
          // Fallback for other action results
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-gray-800 text-sm">
                {typeof message.content === "object"
                  ? JSON.stringify(message.content, null, 2)
                  : (message.content as string)}
              </span>
            </div>
          );
      }
    }

    return <span className="text-sm">{message.content as string}</span>;
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

  const RevenueCard: React.FC<{ data: RevenueData }> = ({ data }) => (
    <div className="bg-gradient-to-br  from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <TrendingUp className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="font-semibold text-green-800">Revenue Summary</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Main Revenue Display */}
        <div className="bg-white/80 rounded-lg p-3 border border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Total Revenue
              </span>
            </div>
            <span className="text-2xl font-bold text-green-700">
              {formatCurrency(data.revenue)}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/60 rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Orders</p>
                <p className="font-semibold text-gray-800">{data.orderCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-semibold text-gray-800 text-xs">
                  {data.date}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white/60 rounded-lg p-2 border border-green-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Avg. Order Value</span>
            <span className="font-medium text-gray-800">
              {data.orderCount > 0
                ? formatCurrency(data.revenue / data.orderCount)
                : "$0.00"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

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
              Welcome! Type a message or click "Get Help" to start.
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
