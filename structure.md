# WireGuard Dashboard Project Structure

## Overview
The project is a monorepo containing both the frontend and backend code for the WireGuard VPN dashboard.

## Repository Structure
```
wg-dashboard/
├── wg-dashboard-frontend/    # Next.js frontend application
└── wg-dashboard-backend/     # Express.js backend application
```

## Frontend Structure (wg-dashboard-frontend)
```
wg-dashboard-frontend/
├── public/                   # Static assets
├── src/
│   ├── app/                  # Next.js App Router components
│   │   ├── api/              # API routes for frontend
│   │   │   └── servers/      # Server-related API endpoints
│   │   │       └── [id]/     # Dynamic routes for specific servers
│   │   │           └── status/  # Server status endpoint
│   │   ├── page.tsx          # Main dashboard page
│   │   └── layout.tsx        # Root layout component
│   ├── components/           # React components
│   │   ├── ServerList.tsx    # Component to display list of servers
│   │   ├── ServerStatus.tsx  # Component to display server status
│   │   └── ui/               # UI components (possibly using shadcn/ui)
│   ├── lib/                  # Utility functions and libraries
│   │   ├── serverApi.ts      # API functions for server communication
│   │   └── types.ts          # TypeScript type definitions
│   └── styles/               # CSS styles (if not using Tailwind exclusively)
├── .env.local                # Environment variables (not in repo)
├── next.config.js            # Next.js configuration
├── package.json              # Frontend dependencies
└── tsconfig.json             # TypeScript configuration
```

## Backend Structure (wg-dashboard-backend)
```
wg-dashboard-backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   └── serverStatus.ts   # Server status controllers
│   ├── middleware/           # Express middleware
│   │   └── auth.ts           # Authentication middleware
│   ├── routes/               # API routes
│   │   └── servers.ts        # Server-related endpoints
│   ├── services/             # Business logic
│   │   └── serverConfig.ts   # Server configuration service
│   ├── utils/                # Utility functions
│   │   ├── ssh.ts            # SSH connection utilities
│   │   └── wireguard.ts      # WireGuard-specific utilities
│   ├── config/               # Configuration files
│   │   └── servers.json      # Server configuration
│   ├── app.ts                # Express application setup
│   └── index.ts              # Entry point
├── keys/                     # SSH keys (not in repo)
│   └── id_rsa                # Private key for SSH
├── ecosystem.config.js       # PM2 configuration
├── package.json              # Backend dependencies
└── tsconfig.json             # TypeScript configuration
```

## Server Architecture
```
                           HTTPS
                             ↓
     +---------------------+ 443 +---------------------+
     |                     |     |                     |
     |     Vercel Host     +---->+    DigitalOcean     |
     |    (Next.js App)    |     |    (Express API)    |
     |                     |     |                     |
     +---------------------+     +----------+----------+
                                            |
                                            | SSH
                                            ↓
                                 +----------+----------+
                                 |                     |
                                 |   WireGuard Server  |
                                 |                     |
                                 +---------------------+
```

## Authentication Flow
1. Frontend uses API key stored in environment variables
2. Backend validates API key through Bearer token authentication
3. Backend uses SSH keys to authenticate with WireGuard server

## API Endpoints

### Frontend API (Next.js)
- `GET /api/health` - Check backend health
- `GET /api/servers` - List all servers
- `GET /api/servers/[id]/status` - Get status for specific server

### Backend API (Express)
- `GET /health` - Health check endpoint
- `GET /api/servers` - List all servers
- `GET /api/servers/:serverId/status` - Get server status

## Environment Variables

### Frontend (.env.local on Vercel)
- `NEXT_PUBLIC_MANAGEMENT_BACKEND_URL` - URL of the backend API
- `MANAGEMENT_BACKEND_API_KEY` - API key for backend authentication

### Backend (set via PM2 ecosystem.config.js)
- `PORT` - Port to run the Express server on
- `API_SECRET_KEY` - Secret key for API authentication
- `SSH_PRIVATE_KEY_PATH` - Path to the SSH private key file

## Deployment Details

### Frontend (Vercel)
- Deployed from GitHub repository
- Environment variables configured in Vercel dashboard
- Configured to build from monorepo subdirectory

### Backend (DigitalOcean)
- Deployed on Ubuntu VPS
- Nginx configured as reverse proxy with SSL
- PM2 used for process management
- Environment variables set through ecosystem.config.js 