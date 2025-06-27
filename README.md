# FlashFood Admin Dashboard

A comprehensive admin management system for FlashFood delivery platform with role-based access control, real-time analytics, and multi-user management capabilities.

## 🚀 Features

### 🔐 Role-Based Access Control (RBAC)

- **Super Admin**: Complete system oversight and user management
- **Finance Admin**: Financial operations, revenue analytics, and promotion management
- **Companion Admin**: Customer care, driver, and restaurant management

### 📊 Real-time Dashboard & Analytics

- **Live Statistics**: Real-time monitoring of key metrics
- **Revenue Analytics**: Net revenue tracking and financial insights
- **User Growth Metrics**: Customer acquisition and retention analytics
- **Order Statistics**: Order volume, status, and performance tracking
- **Balance Activity**: Transaction monitoring and financial flow analysis

### 👥 Comprehensive User Management

- **Customer Management**: Profile management, account status control, and activity monitoring
- **Driver Management**: Individual driver profiles, performance tracking, and account management
- **Restaurant Owner Management**: Restaurant operations and owner account oversight
- **Admin Management**: Role assignments and permission management

### 💬 Multi-Channel Communication

- **Integrated Chat System**: Real-time communication between customers, drivers, restaurants, and customer care
- **Customer Care Portal**: Inquiry management with escalation workflows
- **Notification System**: Real-time alerts and system notifications

### 📦 Business Operations Management

- **Order Management**: Complete order lifecycle tracking and management
- **Promotion Management**: Campaign creation, monitoring, and analytics
- **Service Fee Configuration**: Dynamic fee management and optimization
- **FAQ Management**: Knowledge base maintenance for customer support

### 💰 Financial Operations

- **Revenue Dashboard**: Comprehensive income and expense tracking
- **Transaction Monitoring**: Real-time balance activity and financial flows
- **Performance Metrics**: Financial KPIs and business intelligence

### ⚡ Real-time Capabilities

- **Live Data Updates**: Socket-based real-time data synchronization
- **Status Indicators**: Live system status and user activity monitoring
- **Instant Notifications**: Real-time alerts for critical events

## 🛠 Technical Stack

- **Framework**: Next.js 14 with TypeScript
- **UI Components**: Custom component library with Tailwind CSS
- **State Management**: Zustand stores for global state
- **Real-time Communication**: Socket.io integration
- **Charts & Analytics**: Custom chart components
- **API Integration**: Axios-based service layer

## 📁 Project Structure

\*\*1 DONE 3/3 (FINISHED generating avg satisfaction rate)
fix churn rate, promotion sold, average satisfaction rate (generate rating review)

\*\*2 DONE
generate customercare inquiries

\*\*3 DONE
ban acc (Driver, restaurant, customer, customer care)

\*\*4 DONE
escalte customercare inquiries to admin

\*\*5
chat cc - driver - customer - restaurant

\*\*6 DONE
implement admin, customercare details (first_name, last_name, avatar) global state => edit profile (/settings)

\*\*7 DONE
implement transaction fluctuation over period (income - outcome line chart)

\*\*8
fix UI bugs when assign permissions for admin
