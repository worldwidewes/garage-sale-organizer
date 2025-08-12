const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class AIService {
    constructor() {
        this.openai = null;
    }

    initialize(apiKey, model = 'gpt-4o') {
        this.openai = new OpenAI({
            apiKey: apiKey
        });
        this.model = model;
    }

    isInitialized() {
        return this.openai !== null;
    }

    async analyzeImage(imagePath) {
        if (!this.isInitialized()) {
            throw new Error('AI service not initialized. Please configure your OpenAI API key.');
        }

        try {
            // Read the image file and convert to base64
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = this.getMimeType(imagePath);

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this garage sale item image and provide the following information in JSON format:
                                {
                                    "title": "Brief, descriptive title for the item",
                                    "description": "Detailed description including condition, features, and any notable details",
                                    "category": "Category (e.g., Electronics, Furniture, Clothing, Books, Toys, Kitchen, Sports, etc.)",
                                    "estimated_price": "Estimated garage sale price in USD (number)",
                                    "condition": "Condition assessment (Excellent, Good, Fair, Poor)",
                                    "tags": ["array", "of", "relevant", "keywords"]
                                }
                                
                                Focus on garage sale pricing - items should be priced to sell, typically much lower than retail. Consider the condition and desirability for garage sale shoppers.`
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
            });

            const content = response.choices[0].message.content;
            
            // Try to parse JSON from the response
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);
                    return {
                        success: true,
                        analysis: analysis
                    };
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                // Fallback: return the raw content if JSON parsing fails
                return {
                    success: false,
                    error: 'Could not parse AI response as JSON',
                    raw_response: content
                };
            }

        } catch (error) {
            console.error('AI analysis error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async generateDescription(title, category, additionalInfo = '') {
        if (!this.isInitialized()) {
            throw new Error('AI service not initialized. Please configure your OpenAI API key.');
        }

        try {
            const response = await this.openai.chat.completions.create({
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
            });

            return {
                success: true,
                description: response.choices[0].message.content.trim()
            };

        } catch (error) {
            console.error('Description generation error:', error);
            return {
                success: false,
                error: error.message
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