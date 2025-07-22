// This function is called when the user clicks the 'Send' button.
const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !socketRef.current) return;
  
    setIsSendingMessage(true);
    try {
      // 1. The client constructs a detailed payload object.
      const payload = {
        roomId: selectedRoom.id,
        content: newMessage.trim(),
        messageType: orderReference ? MessageType.ORDER_REFERENCE : MessageType.TEXT,
        
        // 2. It includes an array of user IDs for anyone @-mentioned.
        taggedUsers:
          taggedUsers.length > 0
            ? taggedUsers.map((user) => user.id)
            : undefined,
            
        // 3. It includes the ID of the message being replied to, if any.
        replyToMessageId: replyToMessage?.id,
        
        // 4. It includes the full order reference object if one was attached.
        orderReference: orderReference || undefined,
      };
  
      // 5. The payload is sent to the server via the 'sendMessage' event.
      await adminChatSocket.sendMessage(socketRef.current, payload);
      
      // Clear the input fields after the message is sent.
      setNewMessage("");
      setTaggedUsers([]);
      setReplyToMessage(null);
      setOrderReference(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };