# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Install all dependencies for all projects
npm run install:all

# Development servers (runs all three simultaneously)
npm run dev                    # Start backend, frontend, and public site
npm run backend:dev           # Backend API only (port 3001)
npm run frontend:dev          # Admin interface only (port 3000) 
npm run public:dev            # Public website only (port 3002)

# Production builds
npm run build                 # Build all applications
npm run start                 # Start production server

# Individual project commands
cd backend && npm run dev     # Backend development
cd frontend && npm run build  # Frontend build
cd public-site && npm run build # Public site build
```

## Architecture Overview

This is a full-stack garage sale organizer with AI-powered item analysis:

### Three Main Applications
- **Backend** (`backend/`): Express.js API server with SQLite database
- **Frontend** (`frontend/`): React admin interface using Vite, TypeScript, Tailwind CSS
- **Public Site** (`public-site/`): React customer-facing website

### Key Backend Components
- `server.js`: Main Express server with API routes
- `database.js`: SQLite database operations and schema
- `ai-service.js`: OpenAI integration for image analysis
- Database: SQLite stored in `database/garage_sale.db`
- File uploads: Images stored in `uploads/images/`, thumbnails in `uploads/thumbnails/`

### Shared Resources
- `shared/types.ts`: TypeScript interfaces used across frontend and backend
- Common data models: Item, ItemImage, AIAnalysis, Settings

### API Structure
RESTful API with endpoints:
- `/api/items` - CRUD operations for items
- `/api/items/:id/images` - Image upload handling
- `/api/settings` - Configuration management
- `/api/categories` - Category listings

### Frontend Architecture
- React with TypeScript
- Tailwind CSS for styling
- React Query for state management
- React Router for navigation
- Custom hooks in `hooks/` directory
- Reusable components in `components/`
- Page components in `pages/`

### AI Integration
- OpenAI GPT-4o (updated from deprecated gpt-4-vision-preview)
- Generates titles, descriptions, categories, and price estimates
- Configurable via settings panel
- Upload progress tracking with separate upload/AI processing stages

## Environment Setup
- Requires Node.js 18+
- Optional OpenAI API key for AI features
- SQLite database auto-created on first run
- No additional database setup required

## File Structure Notes
- Upload directories are auto-created by backend
- Database schema initialized automatically
- All three applications can run independently but work together
- Public site is served by backend in production, separate dev server in development

## Common Issues & Fixes

### File Upload Timeouts
- Backend configured with 3-minute timeout for image uploads
- Frontend axios has 2-minute default timeout, 3-minute for image uploads
- AI processing can take time, especially for large images
- Server automatically increases request timeouts for `/images` routes

### Development Server Restart
If encountering issues, restart all servers:
```bash
pkill -f "node.*server.js" && pkill -f "vite"
npm run dev
```