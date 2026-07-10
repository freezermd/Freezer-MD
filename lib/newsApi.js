// lib/newsApi.js
const config = require('../config');

class NewsAPI {
    constructor() {
        this.baseURL = 'https://newsapi.org/v2';
        this.apiKey = config.3cf44e2172724ffa912c56df48c93adc;
        this.cache = new Map();
        this.cacheTTL = 300000; // 5 minutes
        this.retryCount = 3;
        this.timeout = 10000;
        this.categoryMap = {
            'sports': 'sports',
            'business': 'business',
            'technology': 'technology',
            'entertainment': 'entertainment',
            'health': 'health',
            'science': 'science'
        };
        this.countryMap = {
            'us': 'us',
            'gb': 'gb',
            'ke': 'ke',
            'ng': 'ng',
            'za': 'za',
            'ca': 'ca',
            'au': 'au',
            'in': 'in',
            'de': 'de',
            'fr': 'fr',
            'it': 'it',
            'jp': 'jp',
            'br': 'br',
            'mx': 'mx',
            'ru': 'ru',
            'sa': 'sa',
            'ae': 'ae',
            'eg': 'eg'
        };
    }

    async fetch(endpoint, params = {}, retries = this.retryCount) {
        if (!this.apiKey || this.apiKey === '') {
            throw new Error('NEWS_API_KEY is not configured. Please add it to config.js');
        }

        const url = new URL(`${this.baseURL}${endpoint}`);
        url.searchParams.append('apiKey', this.apiKey);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });

        const cacheKey = url.toString();
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url.toString(), {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Freezer-MD/1.0'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || response.statusText || 'Unknown error';

                switch (response.status) {
                    case 401:
                        throw new Error('Invalid API key. Please check your NEWS_API_KEY');
                    case 403:
                        throw new Error('Access forbidden. Please check your API key permissions');
                    case 404:
                        throw new Error('Endpoint not found');
                    case 429:
                        throw new Error('Rate limit exceeded. Please try again later');
                    default:
                        throw new Error(`API Error (${response.status}): ${errorMessage}`);
                }
            }

            const data = await response.json();

            if (data.status === 'error') {
                throw new Error(data.message || 'API returned an error');
            }

            if (data.status === 'ok') {
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                return data;
            }

            throw new Error('Unexpected API response format');
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - News API took too long to respond');
            }

            if (retries > 0 && !error.message.includes('API key') && !error.message.includes('Rate limit')) {
                console.log(`Retrying news request... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 2000 * (this.retryCount - retries + 1)));
                return this.fetch(endpoint, params, retries - 1);
            }

            throw error;
        }
    }

    async getTopHeadlines(country = 'us', category = null, pageSize = 10) {
        const params = {
            country: this.countryMap[country] || 'us',
            pageSize: Math.min(pageSize, 100)
        };

        if (category && this.categoryMap[category]) {
            params.category = this.categoryMap[category];
        }

        const data = await this.fetch('/top-headlines', params);
        return data.articles || [];
    }

    async getCategory(category, country = 'us', pageSize = 10) {
        const validCategory = this.categoryMap[category];
        if (!validCategory) {
            throw new Error(`Invalid category. Available: ${Object.keys(this.categoryMap).join(', ')}`);
        }
        return this.getTopHeadlines(country, validCategory, pageSize);
    }

    async searchNews(query, pageSize = 10) {
        if (!query || query.trim().length === 0) {
            throw new Error('Search query is required');
        }

        const params = {
            q: query.trim(),
            pageSize: Math.min(pageSize, 100),
            language: 'en',
            sortBy: 'relevancy'
        };

        const data = await this.fetch('/everything', params);
        return data.articles || [];
    }

    async getSources(country = null, category = null) {
        const params = {};
        if (country && this.countryMap[country]) {
            params.country = this.countryMap[country];
        }
        if (category && this.categoryMap[category]) {
            params.category = this.categoryMap[category];
        }

        const data = await this.fetch('/top-headlines/sources', params);
        return data.sources || [];
    }

    async getNewsBySource(sourceId, pageSize = 10) {
        if (!sourceId) {
            throw new Error('Source ID is required');
        }

        const params = {
            sources: sourceId,
            pageSize: Math.min(pageSize, 100)
        };

        const data = await this.fetch('/top-headlines', params);
        return data.articles || [];
    }

    clearCache() {
        this.cache.clear();
        console.log('News API cache cleared');
    }

    getCacheSize() {
        return this.cache.size;
    }

    getAvailableCategories() {
        return Object.keys(this.categoryMap);
    }

    getAvailableCountries() {
        return Object.keys(this.countryMap);
    }

    formatArticle(article) {
        return {
            title: article.title || 'Untitled',
            description: article.description || '',
            source: article.source?.name || 'Unknown Source',
            author: article.author || 'Unknown Author',
            publishedAt: article.publishedAt || new Date().toISOString(),
            url: article.url || '#',
            urlToImage: article.urlToImage || null,
            content: article.content || ''
        };
    }

    formatArticles(articles) {
        return articles.map(article => this.formatArticle(article));
    }
}

module.exports = NewsAPI;
