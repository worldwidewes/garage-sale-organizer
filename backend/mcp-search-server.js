const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('./logger');

class SearchMCPServer {
    constructor() {
        this.tools = [
            {
                name: 'web_search',
                description: 'Search the web for information about products, prices, and market data',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search query for web search' },
                        site: { 
                            type: 'string', 
                            description: 'Optional site to search within (e.g., ebay.com, amazon.com)',
                            enum: ['', 'ebay.com', 'amazon.com', 'craigslist.org']
                        }
                    },
                    required: ['query']
                }
            },
            {
                name: 'ebay_completed_listings',
                description: 'Search eBay completed/sold listings to get actual market pricing data',
                inputSchema: {
                    type: 'object',
                    properties: {
                        item_name: { type: 'string', description: 'Name or description of the item to search for' },
                        brand: { type: 'string', description: 'Brand name if known' },
                        model: { type: 'string', description: 'Model number or name if known' },
                        condition: { 
                            type: 'string', 
                            description: 'Item condition',
                            enum: ['new', 'used', 'refurbished', 'parts']
                        }
                    },
                    required: ['item_name']
                }
            },
            {
                name: 'price_comparison',
                description: 'Compare prices across multiple marketplaces for an item',
                inputSchema: {
                    type: 'object',
                    properties: {
                        item_name: { type: 'string', description: 'Name or description of the item' },
                        include_sites: {
                            type: 'array',
                            items: { type: 'string', enum: ['ebay', 'amazon', 'craigslist', 'facebook'] },
                            description: 'Sites to include in price comparison'
                        }
                    },
                    required: ['item_name']
                }
            }
        ];
    }

    async callTool(toolName, args) {
        try {
            switch (toolName) {
                case 'web_search':
                    return await this.handleWebSearch(args);
                case 'ebay_completed_listings':
                    return await this.handleEbayCompletedListings(args);
                case 'price_comparison':
                    return await this.handlePriceComparison(args);
                default:
                    throw new Error(`Unknown tool: ${toolName}`);
            }
        } catch (error) {
            logger.ai.error(`MCP tool error: ${toolName}`, {
                operation: 'mcp_tool_call',
                tool: toolName,
                error: error.message,
                args
            });
            
            return {
                error: error.message,
                success: false
            };
        }
    }

    async handleWebSearch(args) {
        const { query, site } = args;
        
        logger.ai.info(`Performing web search`, {
            operation: 'web_search',
            query,
            site: site || 'general'
        });

        try {
            // Use DuckDuckGo instant answer API for general searches
            const searchQuery = site ? `site:${site} ${query}` : query;
            const response = await axios.get('https://api.duckduckgo.com/', {
                params: {
                    q: searchQuery,
                    format: 'json',
                    no_redirect: '1',
                    no_html: '1',
                    skip_disambig: '1'
                },
                timeout: 10000
            });

            const results = {
                query: searchQuery,
                abstract: response.data.Abstract || '',
                abstract_source: response.data.AbstractSource || '',
                abstract_url: response.data.AbstractURL || '',
                instant_answer: response.data.Answer || '',
                related_topics: response.data.RelatedTopics?.slice(0, 5).map(topic => ({
                    text: topic.Text || '',
                    url: topic.FirstURL || ''
                })) || []
            };

            logger.ai.info(`Web search completed`, {
                operation: 'web_search',
                query,
                results_count: results.related_topics.length,
                has_instant_answer: !!results.instant_answer
            });

            return {
                success: true,
                data: results
            };

        } catch (error) {
            logger.ai.error(`Web search failed`, {
                operation: 'web_search',
                query,
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    async handleEbayCompletedListings(args) {
        const { item_name, brand, model, condition } = args;
        
        // Build search query
        let searchQuery = item_name;
        if (brand) searchQuery = `${brand} ${searchQuery}`;
        if (model) searchQuery = `${searchQuery} ${model}`;
        
        logger.ai.info(`Searching eBay completed listings`, {
            operation: 'ebay_completed_search',
            item_name,
            brand,
            model,
            condition,
            search_query: searchQuery
        });

        try {
            // eBay completed listings search URL
            const ebayUrl = 'https://www.ebay.com/sch/i.html';
            const params = {
                '_nkw': searchQuery,
                '_sacat': '0',
                'LH_Sold': '1',  // Sold listings
                'LH_Complete': '1',  // Completed listings
                '_sop': '13'  // Sort by time: newly listed
            };

            if (condition) {
                // Map condition to eBay condition codes
                const conditionMap = {
                    'new': '1000',
                    'used': '3000',
                    'refurbished': '2500',
                    'parts': '7000'
                };
                if (conditionMap[condition]) {
                    params['LH_ItemCondition'] = conditionMap[condition];
                }
            }

            const response = await axios.get(ebayUrl, {
                params,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const listings = [];

            // Parse eBay search results
            $('.s-item').each((index, element) => {
                if (index >= 10) return false; // Limit to 10 results

                const $item = $(element);
                const title = $item.find('.s-item__title').text().trim();
                const priceText = $item.find('.s-item__price').text().trim();
                const shippingText = $item.find('.s-item__shipping').text().trim();
                const soldDate = $item.find('.s-item__time-left').text().trim();
                const link = $item.find('.s-item__link').attr('href');

                // Extract price
                const priceMatch = priceText.match(/\$(\d+\.?\d*)/);
                const price = priceMatch ? parseFloat(priceMatch[1]) : null;

                if (title && price && title !== 'Shop on eBay') {
                    listings.push({
                        title,
                        price,
                        price_text: priceText,
                        shipping: shippingText,
                        sold_date: soldDate,
                        url: link
                    });
                }
            });

            // Calculate price statistics
            const prices = listings.map(l => l.price).filter(p => p > 0);
            const priceStats = prices.length > 0 ? {
                min: Math.min(...prices),
                max: Math.max(...prices),
                average: prices.reduce((a, b) => a + b, 0) / prices.length,
                median: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] || 0,
                count: prices.length
            } : null;

            const results = {
                search_query: searchQuery,
                condition: condition || 'any',
                listings: listings.slice(0, 8), // Top 8 results
                price_statistics: priceStats,
                garage_sale_recommendation: priceStats ? {
                    suggested_price: Math.round(priceStats.average * 0.3), // 30% of average sold price
                    price_range: {
                        low: Math.round(priceStats.average * 0.2),
                        high: Math.round(priceStats.average * 0.4)
                    }
                } : null
            };

            logger.ai.info(`eBay completed listings search completed`, {
                operation: 'ebay_completed_search',
                search_query: searchQuery,
                listings_found: listings.length,
                price_range: priceStats ? `$${priceStats.min}-$${priceStats.max}` : 'none'
            });

            return {
                success: true,
                data: results
            };

        } catch (error) {
            logger.ai.error(`eBay search failed`, {
                operation: 'ebay_completed_search',
                search_query: searchQuery,
                error: error.message
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: `eBay completed listings search failed: ${error.message}`
                    }
                ]
            };
        }
    }

    async handlePriceComparison(args) {
        const { item_name, include_sites = ['ebay'] } = args;
        
        logger.ai.info(`Starting price comparison`, {
            operation: 'price_comparison',
            item_name,
            include_sites
        });

        const results = {
            item_name,
            sites_searched: include_sites,
            price_data: {}
        };

        // Search each requested site
        for (const site of include_sites) {
            try {
                switch (site) {
                    case 'ebay':
                        const ebayResults = await this.handleEbayCompletedListings({ item_name });
                        const ebayData = JSON.parse(ebayResults.content[0].text);
                        results.price_data.ebay = {
                            source: 'eBay completed listings',
                            price_statistics: ebayData.price_statistics,
                            sample_size: ebayData.listings?.length || 0
                        };
                        break;
                    
                    // Add other marketplaces here
                    default:
                        results.price_data[site] = {
                            source: site,
                            error: `${site} search not yet implemented`
                        };
                }
            } catch (error) {
                results.price_data[site] = {
                    source: site,
                    error: error.message
                };
            }
        }

        // Generate overall recommendation
        const validPrices = Object.values(results.price_data)
            .filter(data => data.price_statistics)
            .map(data => data.price_statistics.average);

        if (validPrices.length > 0) {
            const overallAverage = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
            results.overall_recommendation = {
                market_value_estimate: Math.round(overallAverage),
                garage_sale_price_range: {
                    low: Math.round(overallAverage * 0.15),
                    suggested: Math.round(overallAverage * 0.25),
                    high: Math.round(overallAverage * 0.35)
                }
            };
        }

        logger.ai.info(`Price comparison completed`, {
            operation: 'price_comparison',
            item_name,
            sites_with_data: Object.keys(results.price_data).filter(site => 
                results.price_data[site].price_statistics
            ).length
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2)
                }
            ]
        };
    }

}

module.exports = SearchMCPServer;