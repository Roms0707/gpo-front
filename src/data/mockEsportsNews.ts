export interface EsportsNewsItem {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  source: string;
  category: 'tournament' | 'update' | 'team' | 'community';
}

export const mockEsportsNews: EsportsNewsItem[] = [
  {
    id: 'news-1',
    title: 'World Championship Finals Break Viewership Records',
    excerpt: 'The grand finals reached over 4 million concurrent viewers, making it the most-watched esports event of the year. Teams from 12 countries competed for the $2M prize pool.',
    imageUrl: 'https://images.pexels.com/photos/7915357/pexels-photo-7915357.jpeg?auto=compress&cs=tinysrgb&w=600',
    date: '2025-12-14',
    source: 'Esports Weekly',
    category: 'tournament',
  },
  {
    id: 'news-2',
    title: 'New Ranked Season Brings Major Balance Changes',
    excerpt: 'Developers announce sweeping changes to the competitive meta, including adjustments to top-tier characters and new ranked rewards for the upcoming season.',
    imageUrl: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=600',
    date: '2025-12-13',
    source: 'Game Updates',
    category: 'update',
  },
  {
    id: 'news-3',
    title: 'Rising Stars: Top Amateur Players to Watch in 2025',
    excerpt: 'Our analysts highlight the most promising up-and-coming talents making waves in the competitive scene. These players are expected to join pro teams soon.',
    imageUrl: 'https://images.pexels.com/photos/7862545/pexels-photo-7862545.jpeg?auto=compress&cs=tinysrgb&w=600',
    date: '2025-12-12',
    source: 'Pro Gaming Insider',
    category: 'community',
  },
  {
    id: 'news-4',
    title: 'Major Esports Org Announces African Expansion',
    excerpt: 'One of the largest esports organizations is launching dedicated African rosters and regional tournaments to tap into the growing gaming market across the continent.',
    imageUrl: 'https://images.pexels.com/photos/7915306/pexels-photo-7915306.jpeg?auto=compress&cs=tinysrgb&w=600',
    date: '2025-12-11',
    source: 'Esports Business',
    category: 'team',
  },
  {
    id: 'news-5',
    title: 'Community Tournament Series Returns with $500K Prize Pool',
    excerpt: 'The beloved community-driven tournament series announces its return with the biggest prize pool yet, open qualifiers starting next month.',
    imageUrl: 'https://images.pexels.com/photos/9072388/pexels-photo-9072388.jpeg?auto=compress&cs=tinysrgb&w=600',
    date: '2025-12-10',
    source: 'Arena News',
    category: 'tournament',
  },
];

export const getNewsByCategory = (category?: EsportsNewsItem['category']): EsportsNewsItem[] => {
  if (!category) return mockEsportsNews;
  return mockEsportsNews.filter(news => news.category === category);
};

export const getLatestNews = (count: number = 3): EsportsNewsItem[] => {
  return mockEsportsNews.slice(0, count);
};
