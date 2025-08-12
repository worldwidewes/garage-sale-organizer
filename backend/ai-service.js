const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

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
            console.log(`[AI] Starting image analysis for: ${path.basename(imagePath)}`);
            
            // Read the image file and convert to base64
            const imageLoadStart = Date.now();
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = this.getMimeType(imagePath);
            console.log(`[AI] Image loaded and encoded in ${Date.now() - imageLoadStart}ms, size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`);

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

            console.log(`[AI] Making OpenAI API request - Model: ${this.model}, Max tokens: 500`);
            const apiCallStart = Date.now();
            
            const response = await this.openai.chat.completions.create(requestPayload);
            
            const apiCallTime = Date.now() - apiCallStart;
            
            // Extract usage information
            if (response.usage) {
                requestTokens = response.usage.prompt_tokens || 0;
                responseTokens = response.usage.completion_tokens || 0;
                console.log(`[AI] API call completed in ${apiCallTime}ms`);
                console.log(`[AI] Token usage - Prompt: ${requestTokens}, Completion: ${responseTokens}, Total: ${response.usage.total_tokens}`);
                console.log(`[AI] Model: ${response.model || this.model}`);
            } else {
                console.log(`[AI] API call completed in ${apiCallTime}ms (no usage data available)`);
            }

            const content = response.choices[0].message.content;
            console.log(`[AI] Response length: ${content.length} characters`);
            console.log(`[AI] Raw response: ${content.substring(0, 200)}...`);
            
            // Try to parse JSON from the response
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);
                    const totalTime = Date.now() - startTime;
                    console.log(`[AI] Analysis successful in ${totalTime}ms - Title: "${analysis.title}", Price: $${analysis.estimated_price}`);
                    
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
                console.error(`[AI] JSON parsing failed after ${totalTime}ms:`, parseError.message);
                console.error(`[AI] Raw response that failed to parse:`, content);
                
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
            console.error(`[AI] Analysis failed after ${totalTime}ms:`, error.message);
            console.error(`[AI] Error type:`, error.constructor.name);
            console.error(`[AI] Error details:`, error);
            
            // Check for specific OpenAI errors
            if (error.code) {
                console.error(`[AI] OpenAI error code: ${error.code}`);
            }
            if (error.type) {
                console.error(`[AI] OpenAI error type: ${error.type}`);
            }
            
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
            console.log(`[AI] Generating description for: "${title}" (${category})`);
            
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

            console.log(`[AI] Making OpenAI API request - Model: gpt-3.5-turbo, Max tokens: 200`);
            const apiCallStart = Date.now();
            
            const response = await this.openai.chat.completions.create(requestPayload);
            
            const apiCallTime = Date.now() - apiCallStart;
            const totalTime = Date.now() - startTime;
            
            // Extract usage information
            if (response.usage) {
                requestTokens = response.usage.prompt_tokens || 0;
                responseTokens = response.usage.completion_tokens || 0;
                console.log(`[AI] Description generated in ${totalTime}ms (API: ${apiCallTime}ms)`);
                console.log(`[AI] Token usage - Prompt: ${requestTokens}, Completion: ${responseTokens}, Total: ${response.usage.total_tokens}`);
            } else {
                console.log(`[AI] Description generated in ${totalTime}ms (API: ${apiCallTime}ms, no usage data)`);
            }

            const description = response.choices[0].message.content.trim();
            console.log(`[AI] Generated description (${description.length} chars): "${description.substring(0, 100)}..."`);

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
            console.error(`[AI] Description generation failed after ${totalTime}ms:`, error.message);
            console.error(`[AI] Error type:`, error.constructor.name);
            console.error(`[AI] Error details:`, error);
            
            // Check for specific OpenAI errors
            if (error.code) {
                console.error(`[AI] OpenAI error code: ${error.code}`);
            }
            if (error.type) {
                console.error(`[AI] OpenAI error type: ${error.type}`);
            }
            
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