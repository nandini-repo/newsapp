export interface Article {
  title: string;
  url: string;
  topic: string;
  summary: string;
  sentimentScore: number;
  source: string;
  keyEntities: {
    states: string[];
    people: string[];
  };
  publishedDate?: string;
  imageUrl?: string;
} 