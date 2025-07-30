# Admin FlashFood Web Frontend

This is the admin dashboard for the FlashFood application, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### Dashboard & Analytics

- Real-time dashboard with live updates via WebSocket
- User growth analytics and charts
- Order statistics and revenue tracking
- Entity notifications and status indicators

### User Management

- Customer management with CRUD operations
- Driver management and tracking
- Restaurant owner administration
- Customer care representative management

### Support Chat System (NEW)

A comprehensive real-time support chat system that replaces the previous order chat functionality. This system is designed for customer care agents and admins to handle customer support requests efficiently.

#### Key Features:

**Agent Management:**

- ✅ Agent registration with skills, languages, and specializations
- ✅ Real-time availability status (Available/Unavailable/Busy)
- ✅ Automatic session assignment based on agent availability and skills
- ✅ Multi-tier support system (Tier 1, Tier 2, Tier 3, Supervisor)
- ✅ Agent metrics and performance tracking

**Support Sessions:**

- ✅ Real-time customer support sessions
- ✅ Bot-to-human escalation workflow
- ✅ Priority-based queue management (Low, Medium, High, Urgent)
- ✅ Category-based session routing (Technical, Billing, General)
- ✅ Session transfer and escalation capabilities
- ✅ SLA monitoring and violation alerts

**Messaging System:**

- ✅ Real-time messaging between agents and customers
- ✅ Support for text, images, voice, and file attachments
- ✅ Chatbot integration with smart responses
- ✅ Quick reply options and suggested actions
- ✅ Message history and session persistence

**Queue Management:**

- ✅ Customer waiting queue with position tracking
- ✅ Estimated wait time calculations
- ✅ Priority-based queue sorting
- ✅ Automatic agent assignment algorithms

#### Architecture:

The support chat system integrates with the `fchatgateway-backend.ts` WebSocket gateway using the `/chat` namespace. It includes:

1. **Frontend Components:**

   - `src/app/chats/page.tsx` - Main support chat interface
   - `src/lib/socket.ts` - Socket communication utilities
   - `src/types/chat.ts` - TypeScript type definitions

2. **Backend Integration:**

   - WebSocket events for real-time communication
   - Agent registration and status management
   - Support session lifecycle management
   - Message routing and delivery

3. **Key Socket Events:**
   - `agentRegister` - Register as a support agent
   - `agentAvailable/agentUnavailable` - Set availability status
   - `newCustomerAssigned` - Receive new customer assignments
   - `sendAgentMessage` - Send messages to customers
   - `customerMessage` - Receive messages from customers
   - `sessionTransferred` - Handle session transfers
   - `sessionEscalated` - Handle session escalations

#### Usage for Customer Care Agents:

1. **Getting Started:**

   - Navigate to `/chats` in the admin dashboard
   - The system automatically registers you as an agent upon connection
   - Set your status to "Available" to start receiving customer requests

2. **Handling Sessions:**

   - View active sessions in the sidebar with priority indicators
   - Click on a session to start chatting with the customer
   - Use the message input to send responses
   - Monitor session status and priority levels

3. **Session Management:**

   - Transfer sessions to other agents when needed
   - Escalate complex issues to higher tiers
   - End sessions with resolution notes and satisfaction ratings

4. **Agent Dashboard:**
   - Monitor your availability status
   - View real-time metrics (active sessions, daily totals)
   - Filter sessions by category and priority
   - Search through active sessions

#### Technical Implementation:

**Socket Connection:**

```typescript
// Automatic connection and agent registration
const socket = createSocket(token);
socket.emit("agentRegister", {
  skills: ["general-support", "technical-support"],
  languages: ["en"],
  maxSessions: 5,
  specializations: ["customer-service"],
  tier: "tier1",
});
```

**Message Handling:**

```typescript
// Send message to customer
socket.emit("sendAgentMessage", {
  sessionId: session.sessionId,
  message: "How can I help you today?",
  messageType: "text",
});

// Receive customer messages
socket.on("customerMessage", (data) => {
  // Handle incoming customer message
  console.log("Customer message:", data.message);
});
```

**Session Management:**

```typescript
// Handle new customer assignment
socket.on("newCustomerAssigned", (data) => {
  const newSession = {
    sessionId: data.sessionId,
    customerId: data.customerId,
    priority: data.priority,
    category: data.category,
  };
  // Add to active sessions
});
```

#### Configuration:

The support chat system requires:

- Valid authentication token (Admin or Customer Care)
- WebSocket connection to the fchatgateway
- Proper role-based access control (CUSTOMER_CARE_REPRESENTATIVE or ADMIN)

#### Benefits:

1. **Improved Customer Experience:**

   - Faster response times with real-time messaging
   - Intelligent bot-to-human escalation
   - Priority-based queue management

2. **Enhanced Agent Productivity:**

   - Streamlined interface for handling multiple sessions
   - Automatic session assignment based on skills
   - Performance metrics and tracking

3. **Better Management Oversight:**
   - Real-time metrics and analytics
   - SLA monitoring and compliance
   - Session transfer and escalation tracking

### Order Management

- Real-time order tracking and status updates
- Order statistics and analytics
- Order details and customer information

### Content Management

- Promotions and marketing campaigns
- FAQ management and organization
- Notification management system

### Settings & Configuration

- System settings and preferences
- User role management and permissions
- Application configuration options

## Technology Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI primitives
- **State Management:** Zustand
- **Real-time Communication:** Socket.IO
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── chats/             # Support chat system
│   ├── customers/         # Customer management
│   ├── drivers/           # Driver management
│   ├── orders/            # Order management
│   ├── settings/          # Application settings
│   └── ...
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── AdminChat/        # Admin chat components
│   ├── Chart/            # Chart components
│   └── ...
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── socket.ts         # Socket.IO utilities
│   ├── axios.ts          # HTTP client configuration
│   └── utils.ts          # General utilities
├── services/             # API service functions
├── stores/               # Zustand state stores
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Key Features Implementation

### Real-time Updates

The application uses Socket.IO for real-time updates across multiple features:

- Dashboard notifications
- Support chat messaging
- Order status updates
- System alerts

### Role-Based Access Control

Different user roles have different permissions:

- **Super Admin:** Full system access
- **Finance Admin:** Financial data and promotions
- **Companion Admin:** User management and FAQs
- **Customer Care:** Support chat and inquiries

### Data Management

- Efficient state management with Zustand
- Real-time data synchronization
- Optimistic updates for better UX
- Error handling and retry mechanisms

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing naming conventions
- Add proper type definitions
- Include JSDoc comments for complex functions

### Component Structure

- Use functional components with hooks
- Implement proper error boundaries
- Add loading states for async operations
- Include accessibility attributes

### State Management

- Use Zustand for global state
- Keep component state local when possible
- Implement proper cleanup in useEffect

## Troubleshooting

### Common Issues

1. **Socket Connection Issues:**

   - Check if the backend server is running
   - Verify the socket URL in environment variables
   - Ensure proper authentication tokens

2. **Build Errors:**

   - Clear node_modules and reinstall dependencies
   - Check for TypeScript errors
   - Verify all required environment variables

3. **Support Chat Not Working:**
   - Ensure user has proper role (CUSTOMER_CARE_REPRESENTATIVE or ADMIN)
   - Check WebSocket connection status
   - Verify fchatgateway backend is running

## License

This project is proprietary software for FlashFood internal use only.
