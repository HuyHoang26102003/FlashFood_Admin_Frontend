"use client";

import { useEffect, useState, useRef } from "react";
import {
  Paperclip,
  Smile,
  Camera,
  Phone,
  Video,
  MoreVertical,
  Send,
  Search,
  X,
  Users,
  Settings,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Bot,
  User,
  PhoneCall,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCustomerCareStore } from "@/stores/customerCareStore";
import { useAdminStore } from "@/stores/adminStore";
import { createSocket } from "@/lib/socket";
import { formatDateToRelativeTime } from "@/utils/functions/formatRelativeTime";
import { useToast } from "@/hooks/use-toast";

// Support Chat Types
interface SupportSession {
  sessionId: string;
  userId: string;
  userType: string;
  chatMode: "bot" | "human";
  status: "active" | "waiting" | "assigned" | "ended";
  priority: "low" | "medium" | "high" | "urgent";
  category?: string;
  agentId?: string;
  startTime: string;
  lastActivity: string;
  slaDeadline?: string;
  transferHistory?: any[];
  customerProfile?: {
    id: string;
    name: string;
    email?: string;
    userType: string;
    avatar?: string;
  };
}

interface SupportMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderType:
    | "CUSTOMER_CARE_REPRESENTATIVE"
    | "CUSTOMER"
    | "DRIVER"
    | "RESTAURANT_OWNER"
    | "BOT"
    | "ADMIN";
  content: string;
  messageType: "text" | "image" | "voice" | "file";
  timestamp: string;
  metadata?: Record<string, any>;
  sender?: string;
  agentName?: string;
  options?: Array<{ text: string; value: string }>;
  quickReplies?: string[];
  cards?: Array<{
    title: string;
    description?: string;
    image?: string;
    actions?: Array<{ text: string; value: string }>;
  }>;
  formFields?: Array<{
    name: string;
    label: string;
    type: "text" | "number" | "email" | "select";
    required?: boolean;
    options?: string[];
  }>;
  followUpPrompt?: string;
  suggestedActions?: string[];
  confidence?: number;
  queueInfo?: {
    position: number;
    estimatedWaitTime: number;
  };
  isTemporary?: boolean;
}

interface AgentProfile {
  id: string;
  name: string;
  email: string;
  skills: string[];
  languages: string[];
  maxSessions: number;
  specializations: string[];
  tier: "tier1" | "tier2" | "tier3" | "supervisor";
}

interface AgentMetrics {
  status: "available" | "unavailable" | "busy";
  activeSessions: number;
  totalSessionsToday: number;
  averageResponseTime: number;
  customerSatisfactionRating: number;
}

export default function SupportChatPage() {
  // Core state
  const [socket, setSocket] = useState<ReturnType<typeof createSocket> | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");

  // Agent state
  const [isAgentRegistered, setIsAgentRegistered] = useState(false);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [isAgentAvailable, setIsAgentAvailable] = useState(false);

  // Support sessions state
  const [activeSessions, setActiveSessions] = useState<SupportSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SupportSession | null>(
    null
  );
  const [sessionMessages, setSessionMessages] = useState<SupportMessage[]>([]);
  const [waitingCustomers, setWaitingCustomers] = useState<SupportSession[]>(
    []
  );

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get current user and token
  const getAccessToken = () => {
    const adminStore = useAdminStore.getState();
    const customerCareStore = useCustomerCareStore.getState();

    if (adminStore.isAuthenticated && adminStore.user) {
      return adminStore.user.accessToken;
    }

    if (customerCareStore.isAuthenticated && customerCareStore.user) {
      return customerCareStore.user.accessToken;
    }

    return null;
  };

  const getCurrentUser = () => {
    const adminStore = useAdminStore.getState();
    const customerCareStore = useCustomerCareStore.getState();

    return adminStore.user || customerCareStore.user;
  };

  const currentUser = getCurrentUser();

  // Socket initialization and event handlers
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      console.error("No token provided, skipping socket connection");
      setIsLoading(false);
      return;
    }

    console.log("Initializing support chat socket...");
    const newSocket = createSocket(token);
    setSocket(newSocket);

    const handleConnect = () => {
      console.log("Support chat socket connected");
      console.log("Socket connected:", newSocket.connected);
      setIsConnected(true);
      setIsLoading(false);

      console.log("Current user:", currentUser);
      console.log("User logged_in_as:", currentUser?.logged_in_as);

      // Auto-register as agent if user is customer care or admin
      if (
        currentUser?.logged_in_as === "CUSTOMER_CARE_REPRESENTATIVE" ||
        currentUser?.logged_in_as === "SUPER_ADMIN" ||
        currentUser?.logged_in_as === "COMPANION_ADMIN" ||
        currentUser?.logged_in_as === "FINANCE_ADMIN"
      ) {
        console.log("User qualifies for agent registration, registering...");
        registerAsAgent(newSocket);
      } else {
        console.log("User does not qualify for agent registration");
      }
    };

    const handleDisconnect = () => {
      console.log("Support chat socket disconnected");
      setIsConnected(false);
    };

    const handleError = (error: any) => {
      console.error("Support chat socket error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to support chat service",
        variant: "destructive",
      });
    };

    // Support-specific event handlers
    const handleAgentRegistered = (data: any) => {
      console.log("Agent registered:", data);
      setIsAgentRegistered(true);

      // Set agent profile
      if (data.agent) {
        setAgentProfile(data.agent);
      } else {
        // Create a basic agent profile from the registration data
        setAgentProfile({
          id: currentUser?.id || "agent",
          name:
            `${currentUser?.first_name || ""} ${
              currentUser?.last_name || ""
            }`.trim() || "Agent",
          email: currentUser?.email || "",
          skills: ["general-support", "technical-support"],
          languages: ["en"],
          maxSessions: 5,
          specializations: ["customer-service"],
          tier: "tier1",
        });
      }

      toast({
        title: "Agent Registered",
        description: "You are now registered as a support agent",
      });
    };

    const handleAgentStatusChanged = (data: any) => {
      console.log("Agent status changed:", data);
      setIsAgentAvailable(data.status === "available");
      toast({
        title: "Status Updated",
        description: `You are now ${data.status}`,
      });
    };

    const handleNewCustomerAssigned = (data: any) => {
      console.log("New customer assigned:", data);

      // Create new session from assignment
      const newSession: SupportSession = {
        sessionId: data.sessionId,
        userId: data.customerId,
        userType: data.customerType,
        chatMode: "human",
        status: "assigned",
        priority: data.priority || "medium",
        category: data.category,
        agentId: currentUser?.id,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        customerProfile: {
          id: data.customerId,
          name: "Customer",
          userType: data.customerType,
        },
      };

      setActiveSessions((prev) => [...prev, newSession]);

      // Auto-select if no session is currently selected
      if (!selectedSession) {
        setSelectedSession(newSession);
      }

      toast({
        title: "New Customer Assigned",
        description: data.message || "A new customer has been assigned to you",
      });
    };

    const handleCustomerMessage = (data: any) => {
      console.log("Customer message received:", data);

      // Determine if the message is actually an image based on content
      const isCloudinaryImage =
        typeof data.message === "string" &&
        data.message.startsWith("https://res.cloudinary.com");

      const message: SupportMessage = {
        id: `msg-${Date.now()}`,
        sessionId: data.sessionId,
        senderId: data.customerId,
        senderType: data.customerType,
        content: data.message,
        // Override messageType to "image"
        messageType:
          data.messageType === "image" || isCloudinaryImage ? "image" : "text",
        timestamp: data.timestamp,
        metadata: data.metadata,
      };

      // Add message to current session if it matches
      if (selectedSession?.sessionId === data.sessionId) {
        setSessionMessages((prev) => [...prev, message]);
      }

      // Update last activity for the session
      setActiveSessions((prev) =>
        prev.map((session) =>
          session.sessionId === data.sessionId
            ? { ...session, lastActivity: data.timestamp }
            : session
        )
      );
    };

    const handleSupportChatStarted = (data: any) => {
      console.log("Support chat started:", data);
    };

    const handleQueueUpdate = (data: any) => {
      console.log("Queue update:", data);
      toast({
        title: "Queue Update",
        description: data.message,
      });
    };

    const handleAgentMessageSent = (data: any) => {
      console.log("Agent message sent confirmation:", data);

      // Remove temporary flag from the message
      setSessionMessages((prev) =>
        prev.map((msg) =>
          msg.sessionId === data.sessionId && msg.isTemporary
            ? { ...msg, isTemporary: false }
            : msg
        )
      );
    };

    // Set up event listeners
    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("error", handleError);
    newSocket.on("agentRegistered", handleAgentRegistered);
    newSocket.on("agentStatusChanged", handleAgentStatusChanged);
    newSocket.on("newCustomerAssigned", handleNewCustomerAssigned);
    newSocket.on("customerMessage", handleCustomerMessage);
    newSocket.on("supportChatStarted", handleSupportChatStarted);
    newSocket.on("queueUpdate", handleQueueUpdate);
    newSocket.on("agentMessageSent", handleAgentMessageSent);

    if (newSocket.connected) {
      handleConnect();
    }

    return () => {
      console.log("Cleaning up support chat socket...");
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("error", handleError);
      newSocket.off("agentRegistered", handleAgentRegistered);
      newSocket.off("agentStatusChanged", handleAgentStatusChanged);
      newSocket.off("newCustomerAssigned", handleNewCustomerAssigned);
      newSocket.off("customerMessage", handleCustomerMessage);
      newSocket.off("supportChatStarted", handleSupportChatStarted);
      newSocket.off("queueUpdate", handleQueueUpdate);
      newSocket.off("agentMessageSent", handleAgentMessageSent);
      newSocket.disconnect();
    };
  }, [currentUser, selectedSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionMessages]);

  // Agent registration
  const registerAsAgent = async (
    socketInstance?: ReturnType<typeof createSocket>
  ) => {
    const activeSocket = socketInstance || socket;

    if (!activeSocket || !currentUser) {
      console.log("Cannot register agent - missing socket or user:", {
        socket: !!activeSocket,
        currentUser: !!currentUser,
        socketState: !!socket,
        socketInstanceParam: !!socketInstance,
      });
      return;
    }

    try {
      console.log("Starting agent registration...");
      console.log("Socket connected:", activeSocket.connected);
      console.log("Socket ID:", activeSocket.id);

      // First, try to register without waiting for response to see if the event goes through
      activeSocket.emit("agentRegister", {
        skills: ["general-support", "technical-support"],
        languages: ["en"],
        maxSessions: 5,
        specializations: ["customer-service"],
        tier: "tier1",
      });

      console.log("Agent registration event emitted");

      // Set a temporary registered state to enable the toggle
      // This will be confirmed by the actual response
      setTimeout(() => {
        if (!isAgentRegistered) {
          console.log(
            "No registration response received, setting temporary registration"
          );
          setIsAgentRegistered(true);
          setAgentProfile({
            id: currentUser?.id || "agent",
            name:
              `${currentUser?.first_name || ""} ${
                currentUser?.last_name || ""
              }`.trim() || "Agent",
            email: currentUser?.email || "",
            skills: ["general-support", "technical-support"],
            languages: ["en"],
            maxSessions: 5,
            specializations: ["customer-service"],
            tier: "tier1",
          });
          toast({
            title: "Agent Registration",
            description: "Registered as support agent (local mode)",
          });
        }
      }, 3000);
    } catch (error) {
      console.error("Error registering as agent:", error);
      toast({
        title: "Registration Failed",
        description: "Failed to register as support agent",
        variant: "destructive",
      });
    }
  };

  // Toggle agent availability
  const toggleAgentAvailability = async () => {
    if (!socket) return;

    try {
      if (isAgentAvailable) {
        socket.emit("agentUnavailable", { reason: "Manual toggle" });
      } else {
        socket.emit("agentAvailable");
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast({
        title: "Status Update Failed",
        description: "Failed to update availability status",
        variant: "destructive",
      });
    }
  };

  // Send message to customer
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedSession) {
      console.log("Cannot send message - missing message or session:", {
        hasMessage: !!currentMessage.trim(),
        hasSession: !!selectedSession,
      });
      return;
    }

    if (!socket) {
      console.log("Cannot send message - socket not available");
      toast({
        title: "Connection Error",
        description: "Chat connection not available",
        variant: "destructive",
      });
      return;
    }

    if (!socket.connected) {
      console.log("Cannot send message - socket not connected");
      toast({
        title: "Connection Error",
        description: "Chat connection lost",
        variant: "destructive",
      });
      return;
    }

    const messageContent = currentMessage; // Store before clearing

    // Determine if the message is an image URL
    const isCloudinaryImage = messageContent.startsWith(
      "https://res.cloudinary.com"
    );
    const messageType = isCloudinaryImage ? "image" : "text";

    try {
      console.log("Sending agent message:", {
        sessionId: selectedSession.sessionId,
        message: messageContent,
        messageType,
        socketConnected: socket.connected,
      });

      const tempMessage: SupportMessage = {
        id: `temp-${Date.now()}`,
        sessionId: selectedSession.sessionId,
        senderId: currentUser?.id || "agent",
        senderType: "CUSTOMER_CARE_REPRESENTATIVE",
        content: messageContent,
        messageType,
        timestamp: new Date().toISOString(),
        isTemporary: true,
      };

      // Add message to UI immediately
      setSessionMessages((prev) => [...prev, tempMessage]);
      setCurrentMessage("");

      // Send via socket with proper error handling
      socket.emit("sendAgentMessage", {
        sessionId: selectedSession.sessionId,
        message: messageContent,
        messageType,
      });

      console.log("Agent message event emitted successfully");

      // Set a timeout to remove temp message if no confirmation received
      setTimeout(() => {
        setSessionMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id
              ? { ...msg, isTemporary: false } // Mark as sent even if no server confirmation
              : msg
          )
        );
      }, 5000);
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove the temporary message on error
      setSessionMessages((prev) =>
        prev.filter(
          (msg) => msg.id.startsWith("temp-") && msg.content === messageContent
        )
      );

      // Restore the message content
      setCurrentMessage(messageContent);

      toast({
        title: "Send Failed",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter sessions based on search and filters
  const filteredSessions = activeSessions.filter((session) => {
    const matchesSearch =
      !searchQuery ||
      session.customerProfile?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      session.sessionId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || session.category === selectedCategory;
    const matchesPriority =
      selectedPriority === "all" || session.priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case "waiting":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "assigned":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case "ended":
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to support chat...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">
            Failed to connect to support chat service
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Agent Status Panel */}
        <Card className="m-4 mb-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Agent Status</span>
              {isConnected ? (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  Connected
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-red-600 border-red-600"
                >
                  Disconnected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available</span>
                <Switch
                  checked={isAgentAvailable}
                  onCheckedChange={toggleAgentAvailability}
                  disabled={!isAgentRegistered}
                />
              </div>

              {agentMetrics && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Active: </span>
                    <span className="font-medium">
                      {agentMetrics.activeSessions}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Today: </span>
                    <span className="font-medium">
                      {agentMetrics.totalSessionsToday}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="px-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search sessions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedPriority}
              onValueChange={setSelectedPriority}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Sessions List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Active Sessions ({filteredSessions.length})
          </h3>

          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <Card
                key={session.sessionId}
                className={`cursor-pointer transition-colors ${
                  selectedSession?.sessionId === session.sessionId
                    ? "border-primary bg-primary/5"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={session.customerProfile?.avatar} />
                        <AvatarFallback className="text-xs">
                          {session.customerProfile?.name?.[0] || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {session.customerProfile?.name ||
                          `User ${session.userId.slice(-4)}`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(session.status)}
                      <div
                        className={`w-2 h-2 rounded-full ${getPriorityColor(
                          session.priority
                        )}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">
                      {session.userType.replace("_", " ")}
                    </span>
                    <span>
                      {formatDateToRelativeTime(session.lastActivity)}
                    </span>
                  </div>

                  {session.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {session.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredSessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active sessions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={selectedSession.customerProfile?.avatar} />
                  <AvatarFallback>
                    {selectedSession.customerProfile?.name?.[0] || "C"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">
                    {selectedSession.customerProfile?.name ||
                      `User ${selectedSession.userId.slice(-4)}`}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="capitalize">
                      {selectedSession.userType.replace("_", " ")}
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      {selectedSession.chatMode === "bot" ? (
                        <Bot className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      <span>
                        {selectedSession.chatMode === "bot"
                          ? "Bot Mode"
                          : "Human Mode"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge className={getPriorityColor(selectedSession.priority)}>
                  {selectedSession.priority}
                </Badge>
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {sessionMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderType === "CUSTOMER_CARE_REPRESENTATIVE"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.senderType !== "CUSTOMER_CARE_REPRESENTATIVE" && (
                      <Avatar className="mr-2 mt-1 h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {message.senderType === "BOT" ? "🤖" : "C"}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderType === "CUSTOMER_CARE_REPRESENTATIVE"
                          ? "bg-primary text-white"
                          : message.senderType === "BOT"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-white text-gray-900"
                      }`}
                    >
                      {message.messageType === "image" ||
                      (message.messageType === "text" &&
                        message.content.startsWith(
                          "https://res.cloudinary.com"
                        )) ? (
                        <div className="mb-1">
                          <img
                            src={message.content}
                            alt="Customer shared image"
                            className="max-w-full rounded-md max-h-64 object-contain"
                          />
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}

                      {message.options && (
                        <div className="mt-2 space-y-1">
                          {message.options.map((option, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                // Handle option click
                                setCurrentMessage(option.text);
                              }}
                            >
                              {option.text}
                            </Button>
                          ))}
                        </div>
                      )}

                      {message.queueInfo && (
                        <div className="mt-2 text-xs opacity-75">
                          Position: {message.queueInfo.position} | Wait:{" "}
                          {message.queueInfo.estimatedWaitTime}m
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs opacity-75">
                          {formatDateToRelativeTime(message.timestamp)}
                        </span>
                        {message.agentName && (
                          <span className="text-xs opacity-75">
                            {message.agentName}
                          </span>
                        )}
                        {message.isTemporary && (
                          <span className="text-xs opacity-75 text-yellow-300">
                            sending...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  className="bg-primary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to Support Chat
              </h3>
              <p className="text-gray-500 mb-4">
                {isAgentRegistered
                  ? isAgentAvailable
                    ? "You're available to receive customer support requests"
                    : "Set yourself as available to start receiving support requests"
                  : "Registering as support agent..."}
              </p>
              {isAgentRegistered && !isAgentAvailable && (
                <Button onClick={toggleAgentAvailability}>Set Available</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
