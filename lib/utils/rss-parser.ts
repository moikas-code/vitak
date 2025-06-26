export interface BlogPost {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category?: string;
  author?: string;
}

export async function fetchBlogPosts(filterHealth: boolean = true): Promise<BlogPost[]> {
  try {
    const response = await fetch('https://blog.moikas.com/api/rss', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const text = await response.text();
    
    // Simple RSS parsing without external dependencies
    const posts: BlogPost[] = [];
    
    // Extract items from RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = text.matchAll(itemRegex);
    
    for (const match of matches) {
      const itemContent = match[1];
      
      // Extract fields
      const title = extractTag(itemContent, 'title');
      const description = extractTag(itemContent, 'description');
      const link = extractTag(itemContent, 'link');
      const pubDate = extractTag(itemContent, 'pubDate');
      const category = extractTag(itemContent, 'category');
      const author = extractTag(itemContent, 'dc:creator') || extractTag(itemContent, 'author');
      
      if (title && link) {
        posts.push({
          id: link, // Use link as unique ID
          title: decodeHtmlEntities(title),
          description: decodeHtmlEntities(description || ''),
          link,
          pubDate: pubDate || new Date().toISOString(),
          category,
          author,
        });
      }
    }
    
    // Filter for health-related articles if requested
    if (filterHealth) {
      const healthKeywords = [
        'health', 'vitamin', 'warfarin', 'nutrition', 'diet', 'medical',
        'wellness', 'fitness', 'vitaK', 'coumadin', 'anticoag', 'INR',
        'blood', 'heart', 'cardio', 'supplement', 'food', 'nutrient'
      ];
      
      return posts.filter(post => {
        const searchText = `${post.title} ${post.description} ${post.category || ''}`.toLowerCase();
        return healthKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
    }
    
    return posts;
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    
    // Return fallback data in case of error
    return [
      {
        id: '1',
        title: 'Welcome to VitaK Tracker Blog',
        description: 'Stay tuned for articles about vitamin K management and warfarin diet tips.',
        link: 'https://blog.moikas.com',
        pubDate: new Date().toISOString(),
      },
    ];
  }
}

function extractTag(content: string, tag: string): string {
  const regex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}>([\\s\\S]*?)<\/${tag}>`, 'i');
  const match = content.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  
  return text.replace(/&[a-zA-Z0-9#]+;/g, (match) => entities[match] || match);
}