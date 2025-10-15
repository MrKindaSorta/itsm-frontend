# ITSM Ticketing System - Frontend

A modern, professional ITSM ticketing system designed for small to medium businesses (10-200 users) with enterprise-grade features.

## Features

### Two Main Interfaces

#### User Portal
- Clean, simple interface for ticket submission and tracking
- Customizable branding (colors, logo, company name)
- Knowledge base access
- Profile management

#### Agent Backend
- Full-featured workspace for support staff
- Collapsible sidebar navigation
- Real-time updates and notifications
- Comprehensive ticket management

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS
- **UI Components:** Custom components built with Radix UI primitives
- **Routing:** React Router v6
- **State Management:** React Context (Auth & Theme)
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

## Demo Accounts

Use these credentials to test different user roles:

- **User:** user@demo.com / demo123
- **Agent:** agent@demo.com / demo123
- **Admin:** admin@demo.com / demo123

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── ui/           # Base UI components (Button, Card, Input, etc.)
│   ├── layout/       # Layout components (Portal & Agent)
│   ├── auth/         # Authentication components
│   ├── tickets/      # Ticket-related components
│   └── dashboard/    # Dashboard widgets
├── pages/            # Page components
│   ├── auth/         # Login, SignUp, ForgotPassword
│   ├── portal/       # User portal pages
│   └── agent/        # Agent backend pages
├── contexts/         # React contexts (Auth, Theme)
├── hooks/            # Custom hooks
├── types/            # TypeScript type definitions
├── lib/              # Utility functions
├── routes/           # Route configuration
└── services/         # API services (mock data for now)
```

## User Roles & Permissions

### Users (Standard)
- Create tickets
- View own tickets
- Comment on own tickets
- Edit profile

### Agents
- Work on tickets
- Mark as resolved
- View assigned/team tickets
- Cannot close tickets (customizable)

### Managers
- Everything Agents can do
- Assign tickets
- Adjust SLAs
- Close tickets
- Manage team assignments

### Admins
- Full system control
- User management
- System configuration
- Customize portal branding
- Manage all settings

## Features Implemented

### Core Features
- Authentication (Login, Sign Up, Forgot Password)
- User Portal Layout with navigation
- Agent Backend Layout with collapsible sidebar
- Dark/Light mode theme switching
- Responsive design (mobile, tablet, desktop)
- TypeScript type system with strict mode
- Route configuration with lazy loading

### Pages (Placeholder/MVP)
- Login & Sign Up
- Portal: Create Ticket, My Tickets, Ticket Detail, Profile, Knowledge Base
- Agent: Dashboard, Tickets, Ticket Detail, Users, Customize, Reports, Settings, Knowledge Base

## Color Scheme

### Status Colors
- New: Blue
- Open: Purple
- In Progress: Orange
- Waiting: Yellow
- Resolved: Green
- Closed: Gray

### Priority Colors
- Low: Blue
- Medium: Yellow
- High: Orange
- Urgent: Red

### SLA Indicators
- Green: >50% time remaining
- Yellow: 25-50% time remaining
- Red: <25% time remaining or breached

## Running the Application

```bash
# Start the development server
npm run dev

# Open your browser to http://localhost:5173

# Log in with one of the demo accounts:
# - User: user@demo.com / demo123 (redirects to /portal)
# - Agent: agent@demo.com / demo123 (redirects to /agent)
# - Admin: admin@demo.com / demo123 (redirects to /agent)
```

## License

Proprietary - All rights reserved
