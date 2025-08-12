const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logs
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = '';
        if (Object.keys(meta).length > 0) {
            metaStr = ` ${JSON.stringify(meta, null, 2)}`;
        }
        return `${timestamp} [${level}] ${message}${metaStr}`;
    })
);

// Main application logger
const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        // Daily rotating file for all logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true
        }),
        
        // Error logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true
        })
    ]
});

// AI-specific logger for detailed AI operations
const aiLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new DailyRotateFile({
            filename: path.join(logsDir, 'ai-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '50m',
            maxFiles: '90d',
            zippedArchive: true
        })
    ]
});

// API request/response logger
const apiLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new DailyRotateFile({
            filename: path.join(logsDir, 'api-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true
        })
    ]
});

// Upload processing logger
const uploadLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new DailyRotateFile({
            filename: path.join(logsDir, 'uploads-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true
        })
    ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: consoleFormat }));
}

// Helper functions for structured logging
const loggers = {
    // Main application logger
    info: (message, meta = {}) => logger.info(message, meta),
    warn: (message, meta = {}) => logger.warn(message, meta),
    error: (message, meta = {}) => logger.error(message, meta),
    debug: (message, meta = {}) => logger.debug(message, meta),

    // AI operations logger
    ai: {
        info: (message, meta = {}) => {
            aiLogger.info(message, meta);
            // Also log to console in development for immediate visibility
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[AI] ${message}`, meta);
            }
        },
        error: (message, meta = {}) => {
            aiLogger.error(message, meta);
            if (process.env.NODE_ENV !== 'production') {
                console.error(`[AI] ${message}`, meta);
            }
        },
        
        // Log AI request with full details
        request: (operation, model, requestData, meta = {}) => {
            const logData = {
                operation,
                model,
                timestamp: new Date().toISOString(),
                request_data: {
                    max_tokens: requestData.max_tokens,
                    messages_count: requestData.messages?.length,
                    message_types: requestData.messages?.map(m => 
                        m.content?.map ? m.content.map(c => c.type) : 'text'
                    )
                },
                ...meta
            };
            aiLogger.info(`AI_REQUEST: ${operation}`, logData);
        },

        // Log AI response with usage and timing
        response: (operation, success, result, meta = {}) => {
            const logData = {
                operation,
                success,
                timestamp: new Date().toISOString(),
                timing: result.timing,
                usage: result.usage,
                result_preview: success ? {
                    title: result.analysis?.title,
                    price: result.analysis?.estimated_price,
                    category: result.analysis?.category
                } : {
                    error: result.error,
                    error_type: result.error_type
                },
                ...meta
            };
            aiLogger.info(`AI_RESPONSE: ${operation}`, logData);
        },

        // Log costs (helpful for tracking AI spending)
        cost: (operation, tokens, estimatedCost, meta = {}) => {
            const logData = {
                operation,
                tokens,
                estimated_cost_usd: estimatedCost,
                timestamp: new Date().toISOString(),
                ...meta
            };
            aiLogger.info(`AI_COST: ${operation}`, logData);
        }
    },

    // API request/response logger
    api: {
        request: (req, meta = {}) => {
            const logData = {
                method: req.method,
                url: req.url,
                path: req.path,
                query: req.query,
                headers: {
                    'user-agent': req.headers['user-agent'],
                    'content-type': req.headers['content-type'],
                    'content-length': req.headers['content-length']
                },
                ip: req.ip,
                timestamp: new Date().toISOString(),
                ...meta
            };
            apiLogger.info('API_REQUEST', logData);
        },

        response: (req, res, responseTime, meta = {}) => {
            const logData = {
                method: req.method,
                url: req.url,
                status_code: res.statusCode,
                response_time_ms: responseTime,
                content_length: res.get('content-length'),
                timestamp: new Date().toISOString(),
                ...meta
            };
            apiLogger.info('API_RESPONSE', logData);
        },

        error: (req, error, meta = {}) => {
            const logData = {
                method: req.method,
                url: req.url,
                error_message: error.message,
                error_stack: error.stack,
                timestamp: new Date().toISOString(),
                ...meta
            };
            apiLogger.error('API_ERROR', logData);
        }
    },

    // Upload processing logger
    upload: {
        start: (filename, fileSize, itemId, meta = {}) => {
            const logData = {
                filename,
                file_size_bytes: fileSize,
                file_size_mb: (fileSize / 1024 / 1024).toFixed(2),
                item_id: itemId,
                timestamp: new Date().toISOString(),
                ...meta
            };
            uploadLogger.info('UPLOAD_START', logData);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[UPLOAD] Starting upload: ${filename} (${logData.file_size_mb}MB)`);
            }
        },

        step: (step, filename, duration, meta = {}) => {
            const logData = {
                step,
                filename,
                duration_ms: duration,
                timestamp: new Date().toISOString(),
                ...meta
            };
            uploadLogger.info('UPLOAD_STEP', logData);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[UPLOAD] ${step}: ${filename} (${duration}ms)`);
            }
        },

        complete: (filename, totalDuration, aiAnalysis, meta = {}) => {
            const logData = {
                filename,
                total_duration_ms: totalDuration,
                ai_analysis_success: aiAnalysis?.success || false,
                ai_suggestions: aiAnalysis?.analysis ? {
                    title: aiAnalysis.analysis.title,
                    price: aiAnalysis.analysis.estimated_price,
                    category: aiAnalysis.analysis.category
                } : null,
                timestamp: new Date().toISOString(),
                ...meta
            };
            uploadLogger.info('UPLOAD_COMPLETE', logData);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[UPLOAD] Complete: ${filename} (${totalDuration}ms)`);
            }
        },

        error: (filename, error, duration, meta = {}) => {
            const logData = {
                filename,
                error_message: error.message,
                error_stack: error.stack,
                duration_ms: duration,
                timestamp: new Date().toISOString(),
                ...meta
            };
            uploadLogger.error('UPLOAD_ERROR', logData);
            if (process.env.NODE_ENV !== 'production') {
                console.error(`[UPLOAD] Error: ${filename} - ${error.message}`);
            }
        }
    }
};

module.exports = loggers;