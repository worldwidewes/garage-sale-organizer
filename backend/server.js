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
const logger = require('./logger');

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

// API Request/Response logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Log the incoming request
    logger.api.request(req, {
        body_size: req.headers['content-length'] || 0,
        user_agent: req.headers['user-agent']
    });
    
    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        // Log the response
        logger.api.response(req, res, responseTime, {
            response_size: chunk ? Buffer.byteLength(chunk, encoding) : 0
        });
        
        originalEnd.call(res, chunk, encoding);
    };
    
    next();
});

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
    
    try {
        if (!req.file) {
            logger.upload.error('no_file', 'No image file provided', Date.now() - startTime, {
                item_id: itemId
            });
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Log upload start
        logger.upload.start(req.file.filename, req.file.size, itemId, {
            original_name: req.file.originalname,
            mime_type: req.file.mimetype
        });
        
        // Verify item exists
        const itemVerifyStart = Date.now();
        const item = await db.getItem(itemId);
        if (!item) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            logger.upload.error(req.file.filename, new Error('Item not found'), Date.now() - startTime, {
                item_id: itemId,
                verification_time_ms: Date.now() - itemVerifyStart
            });
            return res.status(404).json({ error: 'Item not found' });
        }
        
        logger.upload.step('item_verification', req.file.filename, Date.now() - itemVerifyStart, {
            item_id: itemId,
            item_title: item.title
        });

        // Create thumbnail
        const thumbnailStart = Date.now();
        await createThumbnail(req.file.path, req.file.filename);
        logger.upload.step('thumbnail_creation', req.file.filename, Date.now() - thumbnailStart);

        // Analyze image with AI if available
        let aiAnalysis = null;
        let aiResult = null;
        
        if (aiService.isInitialized()) {
            const aiStart = Date.now();
            try {
                aiResult = await aiService.analyzeImage(req.file.path);
                const aiTime = Date.now() - aiStart;
                
                logger.upload.step('ai_analysis', req.file.filename, aiTime, {
                    ai_success: aiResult.success,
                    tokens_used: aiResult.usage?.total_tokens,
                    estimated_cost: aiResult.usage ? aiService.calculateCost(
                        aiResult.usage.prompt_tokens, 
                        aiResult.usage.completion_tokens, 
                        aiService.model
                    ).total_cost : null
                });
                
                if (aiResult.success) {
                    aiAnalysis = JSON.stringify({
                        ...aiResult.analysis,
                        timing: aiResult.timing,
                        usage: aiResult.usage
                    });
                    
                    // Update item with AI suggestions if fields are empty
                    const updates = {};
                    if (!item.title || item.title === 'New Item') {
                        updates.title = aiResult.analysis.title;
                    }
                    if (!item.description) {
                        updates.description = aiResult.analysis.description;
                    }
                    if (!item.price || item.price === 0) {
                        updates.price = aiResult.analysis.estimated_price;
                    }
                    if (!item.category || item.category === 'Miscellaneous') {
                        updates.category = aiResult.analysis.category;
                    }
                    
                    if (Object.keys(updates).length > 0) {
                        const updateStart = Date.now();
                        await db.updateItem(itemId, updates);
                        logger.upload.step('item_update', req.file.filename, Date.now() - updateStart, {
                            updated_fields: Object.keys(updates),
                            ai_suggestions: {
                                title: aiResult.analysis.title,
                                price: aiResult.analysis.estimated_price,
                                category: aiResult.analysis.category
                            }
                        });
                    }
                } else {
                    // Store the error information for debugging
                    aiAnalysis = JSON.stringify({
                        error: aiResult.error,
                        error_type: aiResult.error_type,
                        raw_response: aiResult.raw_response,
                        timing: aiResult.timing,
                        usage: aiResult.usage
                    });
                }
            } catch (aiError) {
                const aiTime = Date.now() - aiStart;
                logger.upload.step('ai_analysis', req.file.filename, aiTime, {
                    ai_success: false,
                    error: aiError.message,
                    error_type: aiError.constructor.name
                });
                
                // Store the exception information
                aiAnalysis = JSON.stringify({
                    error: aiError.message,
                    error_type: aiError.constructor.name,
                    timing: { total_ms: aiTime }
                });
            }
        } else {
            logger.upload.step('ai_analysis_skipped', req.file.filename, 0, {
                reason: 'AI service not initialized'
            });
        }

        // Save image record
        const saveStart = Date.now();
        const imageData = {
            id: uuidv4(),
            item_id: itemId,
            filename: req.file.filename,
            filepath: req.file.path,
            ai_analysis: aiAnalysis
        };

        await db.createImage(imageData);
        logger.upload.step('database_save', req.file.filename, Date.now() - saveStart);
        
        const totalTime = Date.now() - startTime;
        
        // Log successful completion
        logger.upload.complete(req.file.filename, totalTime, aiResult, {
            item_id: itemId,
            image_id: imageData.id,
            final_file_path: req.file.path
        });

        res.status(201).json({
            message: 'Image uploaded successfully',
            image: imageData,
            ai_analysis: aiAnalysis ? JSON.parse(aiAnalysis) : null
        });
    } catch (error) {
        const totalTime = Date.now() - startTime;
        
        // Log the error
        logger.upload.error(req.file?.filename || 'unknown', error, totalTime, {
            item_id: itemId,
            file_path: req.file?.path,
            error_stack: error.stack
        });
        
        // Clean up uploaded file on error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                logger.error('Failed to cleanup uploaded file', {
                    filename: req.file.filename,
                    cleanup_error: err.message
                });
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

// Get AI models and usage statistics
app.get('/api/ai/models', async (req, res) => {
    try {
        // Available models with their details
        const availableModels = [
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: 'Most capable multimodal model, best for complex analysis',
                pricing: {
                    input: 0.005,
                    output: 0.015,
                    currency: 'USD',
                    per: 1000
                },
                capabilities: ['text', 'image', 'analysis'],
                recommended: true
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                description: 'Faster and more affordable, good for simple tasks',
                pricing: {
                    input: 0.00015,
                    output: 0.0006,
                    currency: 'USD',
                    per: 1000
                },
                capabilities: ['text', 'image', 'analysis'],
                recommended: false
            },
            {
                id: 'gpt-4',
                name: 'GPT-4',
                description: 'Previous generation, high quality but slower',
                pricing: {
                    input: 0.03,
                    output: 0.06,
                    currency: 'USD',
                    per: 1000
                },
                capabilities: ['text', 'image', 'analysis'],
                recommended: false
            },
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                description: 'Fast and economical, text only',
                pricing: {
                    input: 0.0005,
                    output: 0.0015,
                    currency: 'USD',
                    per: 1000
                },
                capabilities: ['text'],
                recommended: false
            }
        ];

        const currentModel = await db.getSetting('openai_model') || 'gpt-4o';
        
        res.json({
            available_models: availableModels,
            current_model: currentModel,
            ai_initialized: aiService.isInitialized()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get AI usage statistics for current session
app.get('/api/ai/usage', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Read AI log files for today and yesterday (to handle timezone issues)
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const aiLogPaths = [
            path.join(__dirname, '../logs', `ai-${today}.log`),
            path.join(__dirname, '../logs', `ai-${yesterday}.log`)
        ];
        
        let sessionStats = {
            total_cost: 0,
            total_tokens: 0,
            total_requests: 0,
            operations: {
                image_analysis: { count: 0, cost: 0, tokens: 0 },
                description_generation: { count: 0, cost: 0, tokens: 0 }
            },
            session_start: new Date().toISOString()
        };

        let sessionStartTime = null;
        
        // Read from all available log files
        for (const aiLogPath of aiLogPaths) {
            if (fs.existsSync(aiLogPath)) {
                console.log(`Reading AI log: ${aiLogPath}`);
                const logContent = fs.readFileSync(aiLogPath, 'utf8');
                const lines = logContent.trim().split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    try {
                        const logEntry = JSON.parse(line);
                        
                        // Track session start time (first entry)
                        if (!sessionStartTime) {
                            sessionStartTime = logEntry.timestamp;
                        }
                        
                        // Count costs
                        if (logEntry.message?.startsWith('AI_COST:')) {
                            const operation = logEntry.operation;
                            const cost = logEntry.estimated_cost_usd?.total_cost || 0;
                            const tokens = logEntry.tokens?.total_tokens || 0;
                            
                            console.log(`Found cost entry: ${cost}, tokens: ${tokens}, operation: ${operation}`);
                            
                            sessionStats.total_cost += cost;
                            sessionStats.total_tokens += tokens;
                            sessionStats.total_requests += 1;
                            
                            if (sessionStats.operations[operation]) {
                                sessionStats.operations[operation].count += 1;
                                sessionStats.operations[operation].cost += cost;
                                sessionStats.operations[operation].tokens += tokens;
                            } else {
                                // Handle cases where the operation is not pre-defined
                                sessionStats.operations[operation] = { count: 1, cost: cost, tokens: tokens };
                            }
                        }
                    } catch (parseError) {
                        // Skip invalid JSON lines
                        console.warn('Failed to parse log line:', parseError.message);
                        continue;
                    }
                }
            }
        }
        
        if (sessionStartTime) {
            sessionStats.session_start = sessionStartTime;
        }

        res.json(sessionStats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update AI model
app.put('/api/ai/model', async (req, res) => {
    try {
        const { model } = req.body;
        
        if (!model) {
            return res.status(400).json({ error: 'Model is required' });
        }
        
        // Validate model
        const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'];
        if (!validModels.includes(model)) {
            return res.status(400).json({ error: 'Invalid model specified' });
        }
        
        await db.setSetting('openai_model', model);
        
        // Reinitialize AI service with new model
        const apiKey = await db.getSetting('openai_api_key');
        if (apiKey) {
            aiService.initialize(apiKey, model);
        }
        
        logger.info('AI model updated', {
            old_model: aiService.model,
            new_model: model,
            timestamp: new Date().toISOString()
        });
        
        res.json({ message: 'Model updated successfully', model });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            logger.api.error(req, error, { error_type: 'multer_file_too_large' });
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    
    // Log all server errors
    logger.api.error(req, error, {
        error_type: 'server_error',
        stack_trace: error.stack
    });
    
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