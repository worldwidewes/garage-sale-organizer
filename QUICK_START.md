# Quick Start Guide

## Start All Services (Recommended)

```bash
npm run dev
```
This starts all three services simultaneously:
- Backend API (port 3001)
- Frontend Admin (port 3000) 
- Public Website (port 3002)

## Start Individual Services

### Backend Only
```bash
npm run backend:dev
```
- API server: http://localhost:3001/api
- Serves backend API endpoints

### Frontend Only
```bash
npm run frontend:dev
```
- Admin interface: http://localhost:3000
- Requires backend to be running

### Public Site Only
```bash
npm run public:dev
```
- Public website: http://localhost:3002
- Customer-facing site

## Useful URLs

- **Admin Interface**: http://localhost:3000
- **API Endpoints**: http://localhost:3001/api
- **Public Website**: http://localhost:3002

## Common Commands

```bash
# Install dependencies for all projects
npm run install:all

# Build all projects for production
npm run build

# Start production server
npm run start

# Restart if servers get stuck
pkill -f "node.*server.js" && pkill -f "vite"
npm run dev
```

## Troubleshooting

- **ECONNREFUSED errors**: Backend not running, start with `npm run backend:dev`
- **Port in use**: Kill existing processes or restart with commands above
- **Build issues**: Run `npm run install:all` to ensure dependencies are installed