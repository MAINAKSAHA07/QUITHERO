# Quit Hero Admin Dashboard (Backoffice)

This is the administrative dashboard for Quit Hero, built with React, TypeScript, and Vite.

## Features

- **User Management**: View, search, filter, and manage all registered users
- **Content Management**: Manage programs, days, steps, articles, quotes, and media
- **Support & Engagement**: Handle support tickets, flagged cravings, and journal entries
- **Analytics & Reports**: Comprehensive analytics dashboards and custom reports
- **Achievements**: Manage achievements and view unlock logs
- **Settings**: Configure app settings, notification templates, admin users, roles, and permissions

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Tables**: TanStack Table (React Table v8)
- **Charts**: Recharts + D3.js
- **Forms**: React Hook Form + Zod validation
- **Backend**: PocketBase (shared with main app)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PocketBase running (see main project README)

### Installation

1. Install dependencies:
```bash
cd backoffice
npm install
```

2. Create a `.env` file (optional, defaults to `http://localhost:8095`):
```env
VITE_POCKETBASE_URL=http://localhost:8095
```

3. Start the development server:
```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:5176`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
backoffice/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout components (TopNav, Sidebar, Layout)
│   │   ├── common/           # Shared components (MetricCard, ActivityFeed, etc.)
│   │   ├── charts/           # Chart components
│   │   ├── forms/            # Form components
│   │   └── tables/           # Table components
│   ├── pages/
│   │   ├── dashboard/        # Dashboard page
│   │   ├── users/            # User management pages
│   │   ├── content/          # Content management pages
│   │   ├── support/          # Support pages
│   │   ├── analytics/        # Analytics pages
│   │   ├── achievements/     # Achievement pages
│   │   ├── settings/         # Settings pages
│   │   └── auth/             # Authentication pages
│   ├── context/              # React contexts (AdminAuthContext)
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Library configurations (PocketBase)
│   ├── services/             # API service functions
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Authentication

The admin dashboard uses PocketBase for authentication. Admin users should have a `role` field in the `users` collection with one of these values:
- `admin` or `super_admin`: Full access
- `content_manager`: Content management access
- `support_agent`: Support and user view access
- `analyst`: Analytics and reports access

## Port Configuration

- **Main App**: Port 5175 (configured in root `vite.config.ts`)
- **Admin Dashboard**: Port 5176 (configured in `backoffice/vite.config.ts`)

Both apps can run simultaneously on different ports.

## Development

### Running Both Apps

To run both the main app and admin dashboard simultaneously:

**Terminal 1** (Main App):
```bash
npm run dev
```

**Terminal 2** (Admin Dashboard):
```bash
cd backoffice
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Notes

- The admin dashboard connects to the same PocketBase instance as the main app
- All admin operations require proper authentication and role-based permissions
- Some features are marked as "coming soon" and can be expanded based on requirements

## Future Enhancements

- Complete implementation of all placeholder pages
- Advanced analytics with D3.js visualizations
- Real-time notifications via WebSocket
- Bulk operations for users and content
- Advanced filtering and search capabilities
- Export functionality (CSV, PDF, Excel)
- Audit logging for all admin actions




