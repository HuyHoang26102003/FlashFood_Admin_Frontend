"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Bot,
  MessageSquare,
  Zap,
  List,
  X,
  BookOpen,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Enum_BotActionCode } from "@/constants/api_rules";
import { ResponseType } from "@/hooks/useAdminChatSocket";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { useMemo } from "react";

interface ChatbotOption {
  id: number;
  text: string;
  next_id?: number;
}

interface BotResponse {
  id?: number;
  keyword: string;
  response_type: ResponseType;
  response_text: string;
  options?: ChatbotOption[];
  parent_id?: number;
  action_code?: Enum_BotActionCode;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SearchResponse {
  EC: number;
  EM: string;
  data: {
    data: BotResponse[];
    total: number;
    message: string;
  };
}

interface BotTrainingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  editingResponse?: BotResponse | null;
  mode?: "add" | "update";
}

const BotTrainingDialog: React.FC<BotTrainingDialogProps> = ({
  isOpen,
  onClose,
  token,
  editingResponse,
  mode = "add",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BotResponse[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<BotResponse | null>(
    null
  );
  const [showSearchResults, setShowSearchResults] = useState(true);
  const [formData, setFormData] = useState<BotResponse>({
    keyword: "",
    response_type: ResponseType.TEXT,
    response_text: "",
    options: [],
    parent_id: undefined,
    action_code: undefined,
    is_active: true,
  });

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      setTimeout(() => {
        if (searchQuery.trim() && token && mode === "update") {
          performSearch(searchQuery.trim());
        } else {
          setSearchResults([]);
        }
      }, 500),
    [searchQuery, token, mode]
  );

  useEffect(() => {
    return () => clearTimeout(debouncedSearch);
  }, [debouncedSearch]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await axiosInstance.get<SearchResponse>(
        `${API_ENDPOINTS.ADMIN_BOT}/responses`,
        {
          params: {
            search: query,
          },
        }
      );

      if (response.data.EC === 0) {
        setSearchResults(response.data.data.data);
      } else {
        setSearchResults([]);
        toast({
          title: "Search Error",
          description: response.data.EM || "Failed to search responses",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      toast({
        title: "Search Error",
        description: "Failed to perform search",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectResponse = (response: BotResponse) => {
    setSelectedResponse(response);
    setFormData({
      ...response,
      options: response.options || [],
    });
    setShowSearchResults(false);
  };

  // Reset form when dialog opens/closes or editingResponse changes
  useEffect(() => {
    if (editingResponse) {
      setFormData({ ...editingResponse });
      setSelectedResponse(editingResponse);
      setShowSearchResults(false);
    } else {
      setFormData({
        keyword: "",
        response_type: ResponseType.TEXT,
        response_text: "",
        options: [],
        parent_id: undefined,
        action_code: undefined,
        is_active: true,
      });
      setSelectedResponse(null);
      setShowSearchResults(mode === "update");
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [editingResponse, isOpen, mode]);

  const handleInputChange = (field: keyof BotResponse, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addOption = () => {
    const newOption: ChatbotOption = {
      id: Date.now(),
      text: "",
      next_id: undefined,
    };
    setFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), newOption],
    }));
  };

  const updateOption = (
    index: number,
    field: keyof ChatbotOption,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options?.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
  };

  const removeOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    console.log("chek click me");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "No access token available",
        variant: "destructive",
      });
      return;
    }

    if (!formData.keyword.trim() || !formData.response_text.trim()) {
      toast({
        title: "Validation Error",
        description: "Keyword and response text are required",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.response_type === ResponseType.OPTIONS &&
      (!formData.options || formData.options.length === 0)
    ) {
      toast({
        title: "Validation Error",
        description: "Options are required for OPTIONS response type",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        keyword: formData.keyword.trim(),
        response_type: formData.response_type,
        response_text: formData.response_text.trim(),
        ...(formData.options &&
          formData.options.length > 0 && { options: formData.options }),
        ...(formData.parent_id && { parent_id: formData.parent_id }),
        ...(formData.action_code && { action_code: formData.action_code }),
        is_active: formData.is_active,
      };

      const isUpdate = Boolean(editingResponse?.id || selectedResponse?.id);
      const responseId = editingResponse?.id || selectedResponse?.id;

      let response;
      if (isUpdate && responseId) {
        response = await axiosInstance.patch(
          `${API_ENDPOINTS.ADMIN_BOT}/responses/${responseId}`,
          payload
        );
      } else {
        response = await axiosInstance.post(
          `${API_ENDPOINTS.ADMIN_BOT}/responses`,
          payload
        );
      }

      if (response.data.EC !== 0) {
        throw new Error(
          response.data.EM ||
            `Failed to ${isUpdate ? "update" : "create"} bot response`
        );
      }

      toast({
        title: "Success",
        description: `Bot response ${
          isUpdate ? "updated" : "created"
        } successfully`,
        variant: "default",
      });

      onClose();
    } catch (error) {
      console.error("Error saving bot response:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save bot response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getResponseTypeIcon = (type: ResponseType) => {
    switch (type) {
      case ResponseType.TEXT:
        return <MessageSquare className="w-4 h-4" />;
      case ResponseType.OPTIONS:
        return <List className="w-4 h-4" />;
      case ResponseType.GUIDE:
        return <BookOpen className="w-4 h-4" />;
      case ResponseType.ACTION:
        return <Zap className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:min-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <span>
              {editingResponse ? "Edit Bot Response" : "Train New Bot Response"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {editingResponse
              ? "Update an existing bot response for the admin assistant"
              : "Create a new response for the admin assistant chatbot"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Interface (for Update mode) */}
          {mode === "update" && showSearchResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <span>Search Existing Responses</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">
                    Search by keyword or response text
                  </Label>
                  <Input
                    id="search"
                    placeholder="Search for responses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-gray-600">
                      Searching...
                    </span>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => selectResponse(result)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {result.response_type}
                              </Badge>
                              {result.action_code && (
                                <Badge variant="secondary" className="text-xs">
                                  {result.action_code}
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  result.is_active ? "default" : "destructive"
                                }
                                className="text-xs"
                              >
                                {result.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm">
                              {result.keyword}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {result.response_text}
                            </p>
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {result.id}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && !isSearching && searchResults.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No responses found matching "{searchQuery}"
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Selected Response Info */}
          {mode === "update" && selectedResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Editing Response (ID: {selectedResponse.id})</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSearchResults(true);
                      setSelectedResponse(null);
                      setFormData({
                        keyword: "",
                        response_type: ResponseType.TEXT,
                        response_text: "",
                        options: [],
                        parent_id: undefined,
                        action_code: undefined,
                        is_active: true,
                      });
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Change Selection
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>
          )}

          {/* Basic Information */}
          {(mode === "add" || (mode === "update" && selectedResponse)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyword">Keyword/Trigger</Label>
                  <Input
                    id="keyword"
                    placeholder="e.g., 'total revenue', 'order status'"
                    value={formData.keyword}
                    onChange={(e) =>
                      handleInputChange("keyword", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response_type">Response Type</Label>
                  <Select
                    value={formData.response_type}
                    onValueChange={(value) =>
                      handleInputChange("response_type", value as ResponseType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select response type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ResponseType.TEXT}>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Text Response</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={ResponseType.OPTIONS}>
                        <div className="flex items-center space-x-2">
                          <List className="w-4 h-4" />
                          <span>Options Response</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={ResponseType.GUIDE}>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4" />
                          <span>Guide Response</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={ResponseType.ACTION}>
                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4" />
                          <span>Action Response</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response_text">Response Text</Label>
                  <Textarea
                    id="response_text"
                    placeholder="Enter the bot's response message..."
                    value={formData.response_text}
                    onChange={(e) =>
                      handleInputChange("response_text", e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Code (for ACTION type) */}
          {(mode === "add" || (mode === "update" && selectedResponse)) &&
            formData.response_type === ResponseType.ACTION && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Action Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="action_code">Action Code</Label>
                    <Select
                      value={formData.action_code}
                      onValueChange={(value) =>
                        handleInputChange(
                          "action_code",
                          value as Enum_BotActionCode
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action code" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Enum_BotActionCode).map((code) => (
                          <SelectItem key={code} value={code}>
                            {code
                              .replace(/_/g, " ")
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Options (for OPTIONS type) */}
          {(mode === "add" || (mode === "update" && selectedResponse)) &&
            formData.response_type === ResponseType.OPTIONS && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <List className="w-4 h-4" />
                    <span>Response Options</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.options?.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2 p-3 border rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Option text"
                          value={option.text}
                          onChange={(e) =>
                            updateOption(index, "text", e.target.value)
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Next ID (optional)"
                          value={option.next_id || ""}
                          onChange={(e) =>
                            updateOption(
                              index,
                              "next_id",
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Additional Settings */}
          {(mode === "add" || (mode === "update" && selectedResponse)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_id">Parent ID (optional)</Label>
                  <Input
                    id="parent_id"
                    type="number"
                    placeholder="Parent response ID"
                    value={formData.parent_id || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "parent_id",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_active", checked)
                    }
                  />
                  <Label htmlFor="is_active">Active Response</Label>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Badge variant="outline" className="flex items-center space-x-1">
            {getResponseTypeIcon(formData.response_type)}
            <span>{formData.response_type}</span>
          </Badge>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingResponse ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingResponse ? "Update Response" : "Create Response"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BotTrainingDialog;
