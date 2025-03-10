import express from 'express';
import cors from 'cors';
import { NewsScraperService } from './services/scraper';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const scraperService = new NewsScraperService();

// Cache for storing articles
let articlesCache: any[] = [];
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

app.get('/api/news', async (req, res) => {
  try {
    // Check if we need to refresh the cache
    const now = Date.now();
    if (now - lastFetch > CACHE_DURATION || articlesCache.length === 0) {
      articlesCache = await scraperService.scrapeAll();
      lastFetch = now;
    }
    
    // Filter by topic if provided
    const topic = req.query.topic as string;
    const articles = topic
      ? articlesCache.filter(article => article.topic === topic)
      : articlesCache;
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news articles' });
  }
});

app.get('/api/topics', (req, res) => {
  const topics = Array.from(new Set(articlesCache.map(article => article.topic)));
  res.json(topics);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 