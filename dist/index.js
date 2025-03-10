"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const scraper_1 = require("./services/scraper");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const scraperService = new scraper_1.NewsScraperService();
// Cache for storing articles
let articlesCache = [];
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
app.get('/api/news', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if we need to refresh the cache
        const now = Date.now();
        if (now - lastFetch > CACHE_DURATION || articlesCache.length === 0) {
            articlesCache = yield scraperService.scrapeAll();
            lastFetch = now;
        }
        // Filter by topic if provided
        const topic = req.query.topic;
        const articles = topic
            ? articlesCache.filter(article => article.topic === topic)
            : articlesCache;
        res.json(articles);
    }
    catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news articles' });
    }
}));
app.get('/api/topics', (req, res) => {
    const topics = Array.from(new Set(articlesCache.map(article => article.topic)));
    res.json(topics);
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
