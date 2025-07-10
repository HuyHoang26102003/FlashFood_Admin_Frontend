"use client";

import React from "react";
import ChatbotBox from "./ChatbotBox";
import { useAdminStore } from "@/stores/adminStore";

const ChatbotWrapper: React.FC = () => {
  const { user, isAuthenticated } = useAdminStore();

  // Only render chatbot if user is authenticated and has access token
  if (!isAuthenticated || !user?.accessToken) {
    return null;
  }

  return <ChatbotBox token={user.accessToken} />;
};

export default ChatbotWrapper;
