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
- `ai-service.js`: Multi-provider AI service (OpenAI + Gemini) with cost tracking
- `logger.js`: Winston-based structured logging system with daily rotation
- Database: SQLite stored in `database/garage_sale.db`
- File uploads: Images stored in `uploads/images/`, thumbnails in `uploads/thumbnails/`
- Logs: Structured logs in `logs/` directory (ai, api, app, uploads, errors)

### Shared Resources
- `shared/types.ts`: TypeScript interfaces used across frontend and backend
- Common data models: Item, ItemImage, AIAnalysis, Settings

### API Structure
RESTful API with endpoints:
- `/api/items` - CRUD operations for items
- `/api/items/:id/images` - Image upload handling (supports `?skipAI=true` for upload-only)
- `/api/items/:id/analyze` - Batch AI analysis of uploaded images
- `/api/settings` - Configuration management
- `/api/categories` - Category listings
- `/api/ai/usage` - Real-time AI cost and token usage statistics
- `/api/ai/models` - Available AI models and current provider info
- `/api/ai/provider` - Get/update current AI provider and model

### Frontend Architecture
- React with TypeScript
- Tailwind CSS for styling
- React Query for state management
- React Router for navigation
- Custom hooks in `hooks/` directory
- Reusable components in `components/`
- Page components in `pages/`

### AI Integration
- **Multi-Provider Support**: OpenAI GPT-4o and Google Gemini with runtime switching
- **Upload-First Workflow**: Images uploaded separately from AI analysis for better UX
- **Two-Stage Process**: 
  1. Upload multiple images without AI processing (`uploadImageOnly`)
  2. Batch AI analysis with user confirmation (`analyzeAllImages`)
- Generates marketplace-style titles, descriptions, categories, and price estimates
- Configurable via settings panel with provider/model selection
- Real-time cost tracking and usage statistics display

#### AI Pricing Methodology
- **Current Implementation**: Prices based on AI's internal training data (knowledge cutoff)
- **Pricing Strategy**: Garage sale pricing (20-40% below typical market value)
- **Data Sources**: Training includes automotive pricing websites, marketplace listings, depreciation patterns
- **Limitation**: No real-time market data or current pricing lookup
- **Future Enhancement**: Plan to integrate web search or pricing APIs for real-time market validation

#### Logging and Debugging
- **Structured Backend Logging**: Winston with daily rotation, JSON format
- **Frontend Debug System**: Browser console commands `enableDebug()` / `disableDebug()`
- **Comprehensive Coverage**: API calls, upload progress, AI analysis, cost tracking
- **Log Categories**: ai, api, app, uploads, errors (separate files)
- **Cost Tracking**: Real-time session cost aggregation from log analysis

## Environment Setup
- Requires Node.js 18+
- Optional AI API keys: OpenAI and/or Google Gemini for AI features
- SQLite database auto-created on first run
- No additional database setup required
- Logs directory auto-created in project root

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

## Important Development Notes

### AI Provider Configuration
- The system supports both OpenAI and Gemini providers with runtime switching
- Gemini token usage is estimated (text length / 4) since API doesn't provide exact counts
- Cost tracking aggregates from structured logs in real-time
- Provider settings persist across sessions and affect all new AI operations

### Upload Workflow Architecture
- **Modern Flow**: Upload images first → User confirms → Batch AI analysis
- **Legacy Support**: Direct upload with immediate AI analysis still available
- Frontend components: `ImageUpload`, `PendingFilePreview`, `ImageGallery`
- Backend endpoints: `/images?skipAI=true` for upload-only, `/analyze` for batch processing

### Cost Tracking System
- Real-time session cost display in frontend (`APICostMeter` component)
- Backend aggregates costs from daily log files (`/api/ai/usage`)
- Supports both OpenAI (exact tokens) and Gemini (estimated tokens)
- Cost calculations include current model pricing for both providers
- do not attribute any commit messages to claude code