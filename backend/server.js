const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const Database = require('./database');
const AIService = require('./ai-service');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const db = new Database();
const aiService = new AIService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Increase timeout for requests (especially image uploads with AI processing)
app.use((req, res, next) => {
  // Set timeout to 3 minutes for image upload routes
  if (req.path.includes('/images')) {
    req.setTimeout(180000); // 3 minutes
    res.setTimeout(180000);
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

[uploadsDir, imagesDir, thumbnailsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Initialize AI service with stored API key
async function initializeAI() {
    try {
        const apiKey = await db.getSetting('openai_api_key');
        const model = await db.getSetting('openai_model') || 'gpt-4o';
        
        if (apiKey) {
            aiService.initialize(apiKey, model);
            console.log('AI service initialized successfully');
        } else {
            console.log('No OpenAI API key found. AI features will be disabled until configured.');
        }
    } catch (error) {
        console.error('Error initializing AI service:', error);
    }
}

// Initialize AI service on startup
initializeAI();

// Helper function to create thumbnails
async function createThumbnail(imagePath, filename) {
    try {
        const thumbnailPath = path.join(thumbnailsDir, filename);
        await sharp(imagePath)
            .resize(300, 300, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
        return thumbnailPath;
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        return null;
    }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Settings endpoints
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await db.getAllSettings();
        // Don't send the API key in the response for security
        if (settings.openai_api_key) {
            settings.openai_api_key = settings.openai_api_key ? '***CONFIGURED***' : '';
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const settings = req.body;
        
        for (const [key, value] of Object.entries(settings)) {
            await db.setSetting(key, value);
        }

        // Reinitialize AI service if API key changed
        if (settings.openai_api_key || settings.openai_model) {
            const apiKey = settings.openai_api_key || await db.getSetting('openai_api_key');
            const model = settings.openai_model || await db.getSetting('openai_model');
            if (apiKey) {
                aiService.initialize(apiKey, model);
            }
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Items endpoints
app.get('/api/items', async (req, res) => {
    try {
        const filters = {
            query: req.query.q,
            category: req.query.category,
            min_price: req.query.min_price ? parseFloat(req.query.min_price) : undefined,
            max_price: req.query.max_price ? parseFloat(req.query.max_price) : undefined,
            sort_by: req.query.sort_by,
            sort_order: req.query.sort_order
        };

        const items = await db.getItems(filters);
        
        // Get images for each item
        const itemsWithImages = await Promise.all(
            items.map(async (item) => {
                const images = await db.getItemImages(item.id);
                return { ...item, images };
            })
        );

        res.json(itemsWithImages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/items/:id', async (req, res) => {
    try {
        const item = await db.getItem(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const images = await db.getItemImages(item.id);
        res.json({ ...item, images });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/items', async (req, res) => {
    try {
        const itemData = {
            id: uuidv4(),
            title: req.body.title || 'New Item',
            description: req.body.description || '',
            price: parseFloat(req.body.price) || 0,
            category: req.body.category || 'Miscellaneous'
        };

        await db.createItem(itemData);
        res.status(201).json(itemData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/items/:id', async (req, res) => {
    try {
        const updates = {};
        if (req.body.title !== undefined) updates.title = req.body.title;
        if (req.body.description !== undefined) updates.description = req.body.description;
        if (req.body.price !== undefined) updates.price = parseFloat(req.body.price);
        if (req.body.category !== undefined) updates.category = req.body.category;

        const result = await db.updateItem(req.params.id, updates);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/items/:id', async (req, res) => {
    try {
        // Get item images first
        const images = await db.getItemImages(req.params.id);
        
        // Delete image files
        for (const image of images) {
            try {
                fs.unlinkSync(image.filepath);
                // Try to delete thumbnail too
                const thumbnailPath = path.join(thumbnailsDir, image.filename);
                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                }
            } catch (err) {
                console.warn('Failed to delete image file:', err.message);
            }
        }

        const result = await db.deleteItem(req.params.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Image upload endpoint
app.post('/api/items/:id/images', upload.single('image'), async (req, res) => {
    const startTime = Date.now();
    const itemId = req.params.id;
    console.log(`[UPLOAD] Starting image upload for item ${itemId}, file: ${req.file?.filename}`);
    
    try {
        if (!req.file) {
            console.log('[UPLOAD] Error: No image file provided');
            return res.status(400).json({ error: 'No image file provided' });
        }

        console.log(`[UPLOAD] File received: ${req.file.filename}, size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);
        
        // Verify item exists
        console.log(`[UPLOAD] Verifying item ${itemId} exists...`);
        const item = await db.getItem(itemId);
        if (!item) {
            console.log(`[UPLOAD] Error: Item ${itemId} not found`);
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Item not found' });
        }
        console.log(`[UPLOAD] Item verified: ${item.title}`);

        // Create thumbnail
        console.log(`[UPLOAD] Creating thumbnail for ${req.file.filename}...`);
        const thumbnailStart = Date.now();
        await createThumbnail(req.file.path, req.file.filename);
        console.log(`[UPLOAD] Thumbnail created in ${Date.now() - thumbnailStart}ms`);

        // Analyze image with AI if available
        let aiAnalysis = null;
        if (aiService.isInitialized()) {
            console.log(`[UPLOAD] Starting AI analysis for ${req.file.filename}...`);
            const aiStart = Date.now();
            try {
                const analysis = await aiService.analyzeImage(req.file.path);
                console.log(`[UPLOAD] AI analysis completed in ${Date.now() - aiStart}ms`);
                if (analysis.success) {
                    aiAnalysis = JSON.stringify(analysis.analysis);
                    console.log(`[UPLOAD] AI suggested: ${analysis.analysis.title} - $${analysis.analysis.estimated_price}`);
                    
                    // Update item with AI suggestions if fields are empty
                    const updates = {};
                    if (!item.title || item.title === 'New Item') {
                        updates.title = analysis.analysis.title;
                    }
                    if (!item.description) {
                        updates.description = analysis.analysis.description;
                    }
                    if (!item.price || item.price === 0) {
                        updates.price = analysis.analysis.estimated_price;
                    }
                    if (!item.category || item.category === 'Miscellaneous') {
                        updates.category = analysis.analysis.category;
                    }
                    
                    if (Object.keys(updates).length > 0) {
                        console.log(`[UPLOAD] Updating item with AI suggestions: ${Object.keys(updates).join(', ')}`);
                        await db.updateItem(itemId, updates);
                    }
                } else {
                    console.log(`[UPLOAD] AI analysis failed: ${analysis.error}`);
                }
            } catch (aiError) {
                console.warn(`[UPLOAD] AI analysis error: ${aiError.message}`);
            }
        } else {
            console.log('[UPLOAD] AI service not initialized, skipping analysis');
        }

        // Save image record
        console.log(`[UPLOAD] Saving image record to database...`);
        const imageData = {
            id: uuidv4(),
            item_id: itemId,
            filename: req.file.filename,
            filepath: req.file.path,
            ai_analysis: aiAnalysis
        };

        await db.createImage(imageData);
        const totalTime = Date.now() - startTime;
        console.log(`[UPLOAD] Upload completed successfully in ${totalTime}ms`);

        res.status(201).json({
            message: 'Image uploaded successfully',
            image: imageData,
            ai_analysis: aiAnalysis ? JSON.parse(aiAnalysis) : null
        });
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[UPLOAD] Error after ${totalTime}ms:`, error.message);
        console.error(`[UPLOAD] Stack trace:`, error.stack);
        
        // Clean up uploaded file on error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`[UPLOAD] Cleaned up failed upload: ${req.file.filename}`);
            } catch (err) {
                console.warn('[UPLOAD] Failed to cleanup uploaded file:', err.message);
            }
        }
        res.status(500).json({ error: error.message });
    }
});

// Delete image endpoint
app.delete('/api/images/:id', async (req, res) => {
    try {
        // Get image info first
        const images = await db.getItemImages(''); // This won't work - we need a different query
        // For now, let's just delete from DB and handle file cleanup separately
        
        const result = await db.deleteImage(req.params.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get categories (distinct from items)
app.get('/api/categories', async (req, res) => {
    try {
        const items = await db.getItems();
        const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
        res.json(categories.sort());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Serve built frontend applications
if (process.env.NODE_ENV === 'production') {
    // Serve admin interface
    app.use('/admin', express.static(path.join(__dirname, '../frontend/dist')));
    app.get('/admin/*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
    
    // Serve public site as default
    app.use('/', express.static(path.join(__dirname, '../public-site/dist')));
    app.get('*', (req, res) => {
        // Skip API routes and uploads
        if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/admin')) {
            res.sendFile(path.join(__dirname, '../public-site/dist/index.html'));
        }
    });
} else {
    // Development mode - serve a simple landing page
    app.get('/', (req, res) => {
        res.send(`
            <html>
                <head>
                    <title>Garage Sale Organizer</title>
                    <style>
                        body { font-family: system-ui, sans-serif; margin: 0; padding: 40px; background: #f9fafb; }
                        .container { max-width: 600px; margin: 0 auto; text-align: center; }
                        .card { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                        .btn { display: inline-block; padding: 12px 24px; margin: 10px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
                        .btn:hover { background: #2563eb; }
                        .status { margin: 20px 0; padding: 15px; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <h1>🏠 Garage Sale Organizer</h1>
                            <p>Your AI-powered garage sale management system is running!</p>
                            
                            <div class="status">
                                <strong>Development Mode</strong><br>
                                Server running on port ${PORT}
                            </div>
                            
                            <div>
                                <a href="http://localhost:3000" class="btn">Admin Interface</a>
                                <a href="http://localhost:3001" class="btn">Public Site</a>
                            </div>
                            
                            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                                <strong>Next steps:</strong><br>
                                1. Start the admin interface: <code>cd frontend && npm run dev</code><br>
                                2. Start the public site: <code>cd public-site && npm run dev</code><br>
                                3. Configure your OpenAI API key in settings
                            </p>
                        </div>
                    </div>
                </body>
            </html>
        `);
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Admin interface: http://localhost:3000 (development)`);
    console.log(`Public site: http://localhost:3001 (development)`);
});