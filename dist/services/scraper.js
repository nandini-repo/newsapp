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
exports.NewsScraperService = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const sentiment_1 = __importDefault(require("sentiment"));
const sentiment = new sentiment_1.default();
class NewsScraperService {
    fetchHTML(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield axios_1.default.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                return data;
            }
            catch (error) {
                console.error(`Error fetching ${url}:`, error);
                return '';
            }
        });
    }
    detectTopic(text) {
        const lowercaseText = text.toLowerCase();
        for (const topic of NewsScraperService.TOPICS) {
            if (lowercaseText.includes(topic)) {
                return topic;
            }
        }
        return 'general';
    }
    extractEntities(text) {
        // This is a simple implementation. In a production environment,
        // you would want to use a proper NER (Named Entity Recognition) service
        const indianStates = [
            'Delhi', 'Mumbai', 'Karnataka', 'Kerala', 'Tamil Nadu',
            'Uttar Pradesh', 'Gujarat', 'Maharashtra', 'Bengal'
        ];
        const states = indianStates.filter(state => text.toLowerCase().includes(state.toLowerCase()));
        // Simple regex to detect names (This is a basic implementation)
        const nameRegex = /[A-Z][a-z]+ [A-Z][a-z]+/g;
        const people = text.match(nameRegex) || [];
        return {
            states: Array.from(new Set(states)),
            people: Array.from(new Set(people))
        };
    }
    processArticle(url, title, source) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = yield this.fetchHTML(url);
            const $ = cheerio_1.default.load(html);
            // Extract text from paragraphs
            const paragraphs = $('p').map((_, el) => $(el).text()).get();
            const fullText = paragraphs.join(' ').substring(0, 1000); // Get first 1000 chars for analysis
            // Generate summary (first 150 words)
            const summary = fullText.split(' ').slice(0, 150).join(' ');
            // Analyze sentiment
            const sentimentResult = sentiment.analyze(fullText);
            // Detect topic
            const topic = this.detectTopic(title + ' ' + fullText);
            // Extract entities
            const entities = this.extractEntities(fullText);
            return {
                title,
                url,
                topic,
                summary,
                sentimentScore: sentimentResult.score,
                source,
                keyEntities: entities,
                publishedDate: new Date().toISOString(),
                imageUrl: $('meta[property="og:image"]').attr('content')
            };
        });
    }
    scrapeAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const articles = [];
            try {
                // TOI Scraping
                const toiHtml = yield this.fetchHTML(NewsScraperService.SOURCES.TOI);
                const toi$ = cheerio_1.default.load(toiHtml);
                const toiArticles = toi$('a[href*="/articleshow/"]').slice(0, 10);
                for (let i = 0; i < toiArticles.length; i++) {
                    const element = toiArticles[i];
                    const url = toi$(element).attr('href') || '';
                    const title = toi$(element).text().trim();
                    if (url && title) {
                        const article = yield this.processArticle(url.startsWith('http') ? url : `${NewsScraperService.SOURCES.TOI}${url}`, title, 'Times of India');
                        articles.push(article);
                    }
                }
                // Similar implementation for Hindu and HT...
                // (Abbreviated for brevity - would implement similar logic for other sources)
            }
            catch (error) {
                console.error('Error in scrapeAll:', error);
            }
            return articles;
        });
    }
}
exports.NewsScraperService = NewsScraperService;
NewsScraperService.SOURCES = {
    TOI: 'https://timesofindia.indiatimes.com',
    HINDU_SPORTS: 'https://www.thehindu.com/sport/',
    HT: 'https://www.hindustantimes.com'
};
NewsScraperService.TOPICS = [
    'politics',
    'sports',
    'business',
    'entertainment',
    'technology',
    'agriculture',
    'health'
];
