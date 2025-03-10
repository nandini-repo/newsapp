import axios from 'axios';
import cheerio from 'cheerio';
import Sentiment from 'sentiment';
import { Article } from '../types/article';

const sentiment = new Sentiment();

export class NewsScraperService {
  private static readonly SOURCES = {
    TOI: 'https://timesofindia.indiatimes.com',
    HINDU_SPORTS: 'https://www.thehindu.com/sport/',
    HT: 'https://www.hindustantimes.com'
  };

  private static readonly TOPICS = [
    'politics',
    'sports',
    'business',
    'entertainment',
    'technology',
    'agriculture',
    'health'
  ];

  private async fetchHTML(url: string): Promise<string> {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return '';
    }
  }

  private detectTopic(text: string): string {
    const lowercaseText = text.toLowerCase();
    for (const topic of NewsScraperService.TOPICS) {
      if (lowercaseText.includes(topic)) {
        return topic;
      }
    }
    return 'general';
  }

  private extractEntities(text: string): { states: string[]; people: string[] } {
    // This is a simple implementation. In a production environment,
    // you would want to use a proper NER (Named Entity Recognition) service
    const indianStates = [
      'Delhi', 'Mumbai', 'Karnataka', 'Kerala', 'Tamil Nadu',
      'Uttar Pradesh', 'Gujarat', 'Maharashtra', 'Bengal'
    ];
    
    const states = indianStates.filter(state => 
      text.toLowerCase().includes(state.toLowerCase())
    );
    
    // Simple regex to detect names (This is a basic implementation)
    const nameRegex = /[A-Z][a-z]+ [A-Z][a-z]+/g;
    const people = text.match(nameRegex) || [];

    return {
      states: Array.from(new Set(states)),
      people: Array.from(new Set(people))
    };
  }

  private async processArticle(url: string, title: string, source: string): Promise<Article> {
    const html = await this.fetchHTML(url);
    const $ = cheerio.load(html);
    
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
  }

  public async scrapeAll(): Promise<Article[]> {
    const articles: Article[] = [];

    try {
      // TOI Scraping
      const toiHtml = await this.fetchHTML(NewsScraperService.SOURCES.TOI);
      const toi$ = cheerio.load(toiHtml);
      const toiArticles = toi$('a[href*="/articleshow/"]').slice(0, 10);
      
      for (let i = 0; i < toiArticles.length; i++) {
        const element = toiArticles[i];
        const url = toi$(element).attr('href') || '';
        const title = toi$(element).text().trim();
        if (url && title) {
          const article = await this.processArticle(
            url.startsWith('http') ? url : `${NewsScraperService.SOURCES.TOI}${url}`,
            title,
            'Times of India'
          );
          articles.push(article);
        }
      }

      // Similar implementation for Hindu and HT...
      // (Abbreviated for brevity - would implement similar logic for other sources)

    } catch (error) {
      console.error('Error in scrapeAll:', error);
    }

    return articles;
  }
} 