const SearchMCPServer = require('./mcp-search-server');
const logger = require('./logger');

class MCPClient {
    constructor() {
        this.searchServer = null;
        this.isReady = false;
    }

    async initialize() {
        try {
            logger.ai.info('Initializing MCP search client', {
                operation: 'mcp_client_init'
            });

            // Create the search server instance directly
            this.searchServer = new SearchMCPServer();
            this.isReady = true;

            logger.ai.info('MCP search client initialized successfully', {
                operation: 'mcp_client_init'
            });

        } catch (error) {
            logger.ai.error('Failed to initialize MCP client', {
                operation: 'mcp_client_init',
                error: error.message
            });
            throw error;
        }
    }

    async callTool(toolName, args) {
        if (!this.isReady || !this.searchServer) {
            throw new Error('MCP client not initialized');
        }

        return await this.searchServer.callTool(toolName, args);
    }

    async searchWeb(query, site = null) {
        logger.ai.info('Performing web search via MCP', {
            operation: 'mcp_web_search',
            query,
            site
        });

        try {
            const result = await this.callTool('web_search', { query, site });
            return result;
        } catch (error) {
            logger.ai.error('MCP web search failed', {
                operation: 'mcp_web_search',
                query,
                error: error.message
            });
            throw error;
        }
    }

    async searchEbayCompleted(itemName, brand = null, model = null, condition = null) {
        logger.ai.info('Searching eBay completed listings via MCP', {
            operation: 'mcp_ebay_search',
            item_name: itemName,
            brand,
            model,
            condition
        });

        try {
            const result = await this.callTool('ebay_completed_listings', { 
                item_name: itemName, 
                brand, 
                model, 
                condition 
            });

            return result;
        } catch (error) {
            logger.ai.error('MCP eBay search failed', {
                operation: 'mcp_ebay_search',
                item_name: itemName,
                error: error.message
            });
            throw error;
        }
    }

    async comparePrices(itemName, includeSites = ['ebay']) {
        logger.ai.info('Comparing prices via MCP', {
            operation: 'mcp_price_comparison',
            item_name: itemName,
            include_sites: includeSites
        });

        try {
            const result = await this.callTool('price_comparison', { 
                item_name: itemName, 
                include_sites: includeSites 
            });

            return result;
        } catch (error) {
            logger.ai.error('MCP price comparison failed', {
                operation: 'mcp_price_comparison',
                item_name: itemName,
                error: error.message
            });
            throw error;
        }
    }

    async shutdown() {
        if (this.searchServer) {
            logger.ai.info('Shutting down MCP client', {
                operation: 'mcp_client_shutdown'
            });
            
            this.searchServer = null;
            this.isReady = false;
        }
    }
}

module.exports = MCPClient;