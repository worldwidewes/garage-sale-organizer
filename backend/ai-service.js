const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class AIService {
    constructor() {
        this.openai = null;
    }

    initialize(apiKey, model = 'gpt-4o') {
        this.openai = new OpenAI({
            apiKey: apiKey,
            timeout: 120000, // 2 minute timeout
            maxRetries: 2,   // Retry failed requests up to 2 times
        });
        this.model = model;
        console.log(`[AI] Service initialized with model: ${model}, timeout: 120s, retries: 2`);
    }

    isInitialized() {
        return this.openai !== null;
    }

    async analyzeImage(imagePath) {
        if (!this.isInitialized()) {
            throw new Error('AI service not initialized. Please configure your OpenAI API key.');
        }

        const startTime = Date.now();
        let requestTokens = 0;
        let responseTokens = 0;
        
        try {
            const filename = path.basename(imagePath);
            logger.ai.info(`Starting image analysis for: ${filename}`, {
                operation: 'image_analysis',
                filename,
                image_path: imagePath
            });
            
            // Read the image file and convert to base64
            const imageLoadStart = Date.now();
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = this.getMimeType(imagePath);
            const imageLoadTime = Date.now() - imageLoadStart;
            
            logger.ai.info(`Image loaded and encoded`, {
                operation: 'image_analysis',
                filename,
                load_time_ms: imageLoadTime,
                file_size_mb: (imageBuffer.length / 1024 / 1024).toFixed(2),
                mime_type: mimeType
            });

            const requestPayload = {
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `You are an expert at creating compelling listings for online marketplaces like Craigslist, Facebook Marketplace, and eBay. Analyze this garage sale item image and create a marketplace-ready listing in JSON format:

                                {
                                    "title": "Catchy, searchable title (include brand, model, key features)",
                                    "description": "Marketplace-style description that sells the item - highlight benefits, condition, and why someone should buy it. Write like you're trying to make a sale!",
                                    "category": "Category (e.g., Electronics, Furniture, Clothing, Books, Toys, Kitchen, Sports, etc.)",
                                    "estimated_price": "Estimated garage sale price in USD (number)",
                                    "condition": "Condition assessment (Excellent, Good, Fair, Poor)",
                                    "tags": ["array", "of", "searchable", "keywords", "buyers", "would", "search", "for"]
                                }
                                
                                Write the description like a successful marketplace seller would:
                                - Start with the item's appeal and benefits
                                - Mention condition honestly but positively
                                - Include dimensions/specs if visible
                                - End with a call to action
                                - Price to sell quickly at garage sale prices (much lower than retail)
                                - Make it sound like a great deal!`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500
            };

            // Log the API request
            logger.ai.request('image_analysis', this.model, requestPayload, {
                filename,
                image_size_mb: (imageBuffer.length / 1024 / 1024).toFixed(2)
            });

            const apiCallStart = Date.now();
            const response = await this.openai.chat.completions.create(requestPayload);
            const apiCallTime = Date.now() - apiCallStart;
            
            // Extract usage information
            if (response.usage) {
                requestTokens = response.usage.prompt_tokens || 0;
                responseTokens = response.usage.completion_tokens || 0;
                
                // Calculate estimated cost (approximate GPT-4o pricing)
                const estimatedCost = this.calculateCost(requestTokens, responseTokens, this.model);
                
                logger.ai.cost('image_analysis', response.usage, estimatedCost, {
                    filename,
                    model: response.model || this.model
                });
            }

            const content = response.choices[0].message.content;
            logger.ai.info(`API response received`, {
                operation: 'image_analysis',
                filename,
                api_call_time_ms: apiCallTime,
                response_length: content.length,
                model: response.model || this.model,
                response_preview: content.substring(0, 200)
            });
            
            // Try to parse JSON from the response
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);
                    const totalTime = Date.now() - startTime;
                    
                    // Log successful analysis
                    logger.ai.response('image_analysis', true, {
                        analysis,
                        timing: { total_ms: totalTime, api_call_ms: apiCallTime },
                        usage: { prompt_tokens: requestTokens, completion_tokens: responseTokens, total_tokens: requestTokens + responseTokens }
                    }, { filename });
                    
                    return {
                        success: true,
                        analysis: analysis,
                        timing: {
                            total_ms: totalTime,
                            api_call_ms: apiCallTime
                        },
                        usage: {
                            prompt_tokens: requestTokens,
                            completion_tokens: responseTokens,
                            total_tokens: requestTokens + responseTokens
                        }
                    };
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                const totalTime = Date.now() - startTime;
                
                // Log parsing error
                logger.ai.error(`JSON parsing failed for image analysis`, {
                    operation: 'image_analysis',
                    filename,
                    error: parseError.message,
                    total_time_ms: totalTime,
                    raw_response: content.substring(0, 500)
                });
                
                return {
                    success: false,
                    error: 'Could not parse AI response as JSON',
                    raw_response: content,
                    timing: {
                        total_ms: totalTime,
                        api_call_ms: apiCallTime
                    },
                    usage: {
                        prompt_tokens: requestTokens,
                        completion_tokens: responseTokens,
                        total_tokens: requestTokens + responseTokens
                    }
                };
            }

        } catch (error) {
            const totalTime = Date.now() - startTime;
            
            // Log the error comprehensively
            logger.ai.error(`Image analysis failed`, {
                operation: 'image_analysis',
                filename: path.basename(imagePath),
                error: error.message,
                error_type: error.constructor.name,
                error_code: error.code,
                error_status: error.status,
                total_time_ms: totalTime,
                stack_trace: error.stack
            });
            
            return {
                success: false,
                error: error.message,
                error_type: error.constructor.name,
                timing: {
                    total_ms: totalTime
                }
            };
        }
    }

    async generateDescription(title, category, additionalInfo = '') {
        if (!this.isInitialized()) {
            throw new Error('AI service not initialized. Please configure your OpenAI API key.');
        }

        const startTime = Date.now();
        let requestTokens = 0;
        let responseTokens = 0;

        try {
            logger.ai.info(`Starting description generation`, {
                operation: 'description_generation',
                title,
                category,
                additional_info: additionalInfo
            });
            
            const requestPayload = {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: "user",
                        content: `Write a compelling garage sale item description for:
                        Title: ${title}
                        Category: ${category}
                        Additional Info: ${additionalInfo}
                        
                        Make it appealing to garage sale shoppers, mention condition and any key features. Keep it concise but descriptive (2-3 sentences).`
                    }
                ],
                max_tokens: 200
            };

            // Log the API request
            logger.ai.request('description_generation', 'gpt-3.5-turbo', requestPayload, {
                title,
                category
            });

            const apiCallStart = Date.now();
            const response = await this.openai.chat.completions.create(requestPayload);
            const apiCallTime = Date.now() - apiCallStart;
            const totalTime = Date.now() - startTime;
            
            // Extract usage information and calculate cost
            if (response.usage) {
                requestTokens = response.usage.prompt_tokens || 0;
                responseTokens = response.usage.completion_tokens || 0;
                
                const estimatedCost = this.calculateCost(requestTokens, responseTokens, 'gpt-3.5-turbo');
                logger.ai.cost('description_generation', response.usage, estimatedCost, {
                    title,
                    category
                });
            }

            const description = response.choices[0].message.content.trim();
            
            // Log successful response
            logger.ai.response('description_generation', true, {
                description,
                timing: { total_ms: totalTime, api_call_ms: apiCallTime },
                usage: { prompt_tokens: requestTokens, completion_tokens: responseTokens, total_tokens: requestTokens + responseTokens }
            }, { title, category });

            return {
                success: true,
                description: description,
                timing: {
                    total_ms: totalTime,
                    api_call_ms: apiCallTime
                },
                usage: {
                    prompt_tokens: requestTokens,
                    completion_tokens: responseTokens,
                    total_tokens: requestTokens + responseTokens
                }
            };

        } catch (error) {
            const totalTime = Date.now() - startTime;
            
            // Log the error
            logger.ai.error(`Description generation failed`, {
                operation: 'description_generation',
                title,
                category,
                error: error.message,
                error_type: error.constructor.name,
                error_code: error.code,
                total_time_ms: totalTime,
                stack_trace: error.stack
            });
            
            return {
                success: false,
                error: error.message,
                error_type: error.constructor.name,
                timing: {
                    total_ms: totalTime
                }
            };
        }
    }

    calculateCost(promptTokens, completionTokens, model) {
        // Approximate pricing as of 2024 (prices may change)
        const pricing = {
            'gpt-4o': {
                input: 0.005 / 1000,    // $0.005 per 1K input tokens
                output: 0.015 / 1000    // $0.015 per 1K output tokens
            },
            'gpt-4': {
                input: 0.03 / 1000,     // $0.03 per 1K input tokens
                output: 0.06 / 1000     // $0.06 per 1K output tokens
            },
            'gpt-3.5-turbo': {
                input: 0.0005 / 1000,   // $0.0005 per 1K input tokens
                output: 0.0015 / 1000   // $0.0015 per 1K output tokens
            }
        };
        
        const modelPricing = pricing[model] || pricing['gpt-4o'];
        const inputCost = promptTokens * modelPricing.input;
        const outputCost = completionTokens * modelPricing.output;
        
        return {
            input_cost: inputCost,
            output_cost: outputCost,
            total_cost: inputCost + outputCost,
            currency: 'USD'
        };
    }

    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }
}

module.exports = AIService;