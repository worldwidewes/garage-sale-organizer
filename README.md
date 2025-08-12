# 🏠 Garage Sale Organizer

A comprehensive, AI-powered garage sale management application that helps you create, organize, and promote your garage sale with automatic image analysis and description generation.

## ✨ Features

### 🤖 AI-Powered Listing Creation
- Upload photos and let AI automatically generate titles, descriptions, categories, and price estimates
- Supports OpenAI GPT-4 Vision for accurate item analysis
- Smart pricing suggestions based on garage sale market expectations

### 📱 Dual Interface Design
- **Admin Interface**: Full-featured management dashboard for organizing your sale
- **Public Website**: Clean, mobile-responsive site for shoppers to preview items

### 🔍 Advanced Search & Organization
- Full-text search across item titles and descriptions
- Category-based filtering and browsing
- Price range filtering and multiple sort options
- Grid and list view modes for optimal browsing

### 🖼️ Professional Image Management
- Drag-and-drop image uploads with automatic thumbnail generation
- Support for multiple images per item
- Image optimization for fast loading

### ⚙️ Easy Configuration
- Simple settings panel for OpenAI API configuration
- Garage sale information management (date, location, contact info)
- No technical knowledge required

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone or download the project**
   ```bash
   cd garage-sale-organizer
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

   This starts all three components:
   - Backend API server: `http://localhost:3001`
   - Admin interface: `http://localhost:3000`
   - Public website: `http://localhost:3001` (served by backend)

### First-Time Setup

1. **Access the admin interface** at `http://localhost:3000`
2. **Configure your OpenAI API key** (Settings → AI Configuration)
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Recommended model: GPT-4 Vision Preview
3. **Set up your garage sale information** (Settings → Garage Sale Information)
4. **Start adding items!** Use the "Add Item" button to upload photos and create listings

## 📁 Project Structure

```
garage-sale-organizer/
├── backend/              # Express.js API server
│   ├── server.js        # Main server file
│   ├── database.js      # SQLite database operations
│   ├── ai-service.js    # OpenAI integration
│   └── package.json
├── frontend/            # React admin interface
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── services/    # API communication
│   └── package.json
├── public-site/         # React public website
│   ├── src/
│   │   ├── components/  # Public site components
│   │   ├── pages/       # Public pages
│   │   └── services/    # API communication
│   └── package.json
├── database/            # Database schema and migrations
├── uploads/             # Image storage
├── shared/              # Shared TypeScript types
└── package.json         # Root package configuration
```

## 🎯 Usage Guide

### Adding Items

1. **Click "Add Item"** in the admin interface
2. **Upload photos** using drag-and-drop
3. **Let AI analyze** your images (if configured)
4. **Review and edit** the auto-generated details
5. **Save your item** and it's immediately available on the public site

### Managing Your Sale

- **Dashboard**: Overview of your items, stats, and quick actions
- **Items Page**: Browse, search, and manage all your listings
- **Settings**: Configure AI, update sale information
- **Public Preview**: See exactly what shoppers will see

### Sharing Your Sale

- Share the public site URL with potential customers
- Perfect for posting on social media, Craigslist, or including on signs
- Mobile-responsive design works great on all devices

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory for production settings:

```env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
```

### Database

The application uses SQLite for simplicity and portability. The database file is automatically created in `database/garage_sale.db` on first run.

### File Storage

Images are stored locally in the `uploads/` directory:
- `uploads/images/` - Original uploaded images
- `uploads/thumbnails/` - Auto-generated thumbnails

## 🏗️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start all development servers
npm run backend:dev      # Start only the backend
npm run frontend:dev     # Start only the admin interface
npm run public:dev       # Start only the public site

# Production Build
npm run build            # Build all applications
npm run start            # Start production server

# Setup
npm run install:all      # Install all dependencies
```

### API Endpoints

The backend provides a RESTful API:

- `GET /api/items` - List items with optional filtering
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get item details
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/images` - Upload images
- `GET /api/settings` - Get configuration
- `PUT /api/settings` - Update configuration
- `GET /api/categories` - Get all categories

## 🔮 Roadmap

### Planned Features

- **Social Media Integration**: Auto-post to Facebook Marketplace, Craigslist
- **QR Code Generation**: Generate QR codes for easy access at your sale
- **Inventory Tracking**: Mark items as sold during the sale
- **Analytics**: Track views, popular categories, pricing insights
- **Export Options**: PDF catalogs, CSV inventory lists
- **Multi-Sale Support**: Manage multiple sales over time

### Future Enhancements

- **Barcode Scanning**: Quick item entry for books, electronics
- **Price Suggestions**: Historical data-based pricing recommendations
- **Customer Inquiries**: Built-in messaging system
- **Payment Integration**: Accept digital payments
- **Map Integration**: Show sale location with directions

## 🛠️ Troubleshooting

### Common Issues

**AI features not working?**
- Verify your OpenAI API key is correct in Settings
- Check that you have sufficient API credits
- Ensure you're using a supported model (GPT-4 Vision recommended)

**Images not displaying?**
- Check that the uploads directory has proper write permissions
- Verify images are under the 10MB size limit
- Ensure image formats are supported (JPEG, PNG, GIF, WebP)

**Can't access the admin interface?**
- Make sure the frontend development server is running on port 3000
- Check for any console errors in the browser
- Try refreshing the page or clearing browser cache

**Database errors?**
- Ensure the database directory is writable
- Try deleting `database/garage_sale.db` to recreate the database
- Check for any file permission issues

## 📄 License

MIT License - feel free to modify and distribute as needed.

## 🤝 Contributing

This project was designed to be easily extensible. Key areas for contribution:

- Additional AI providers (Google Vision, AWS Rekognition)
- More export formats and integrations
- UI/UX improvements
- Performance optimizations
- Additional language support

## 💡 Tips for Best Results

### Photography
- Use good lighting and clean backgrounds
- Take multiple angles for complex items
- Include size references when helpful
- Ensure images are clear and in focus

### Pricing
- Research similar items online for comparison
- Remember garage sale shoppers expect discounts
- Price items to move - you can always negotiate up
- Group similar small items together

### Organization
- Use clear, descriptive titles
- Add detailed condition notes
- Categorize items consistently
- Update descriptions based on AI suggestions

---

**Happy selling!** 🎉 Your garage sale just got a major upgrade with AI-powered organization and a professional online presence.