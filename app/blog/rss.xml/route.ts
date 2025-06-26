import { NextResponse } from 'next/server';

const blogPosts = [
  {
    title: "Understanding Vitamin K and Warfarin Interaction",
    description: "Learn the science behind why vitamin K affects warfarin and how to maintain stable INR levels through consistent intake.",
    link: "https://blog.moikas.com/vitamin-k-warfarin-interaction",
    pubDate: new Date("2024-01-15").toUTCString(),
    guid: "vitamin-k-warfarin-interaction",
  },
  {
    title: "Top 20 Low Vitamin K Foods for Your Diet",
    description: "Discover delicious foods that are naturally low in vitamin K, perfect for maintaining your warfarin therapy.",
    link: "https://blog.moikas.com/low-vitamin-k-foods",
    pubDate: new Date("2024-01-10").toUTCString(),
    guid: "low-vitamin-k-foods",
  },
  {
    title: "VitaK Tracker Update: New Features for 2024",
    description: "We've added meal presets, improved portion tracking, and enhanced our food database. See what's new!",
    link: "https://blog.moikas.com/vitak-tracker-2024-update",
    pubDate: new Date("2024-01-05").toUTCString(),
    guid: "vitak-tracker-2024-update",
  },
  {
    title: "Creating a Balanced Warfarin Diet Plan",
    description: "Step-by-step guide to creating a sustainable diet plan that keeps your vitamin K intake consistent.",
    link: "https://blog.moikas.com/warfarin-diet-plan",
    pubDate: new Date("2023-12-28").toUTCString(),
    guid: "warfarin-diet-plan",
  },
];

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vitaktracker.com';
  
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VitaK Tracker Blog</title>
    <description>Expert articles on managing vitamin K intake while on warfarin therapy</description>
    <link>${baseUrl}/blog</link>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    ${blogPosts.map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <description>${escapeXml(post.description)}</description>
      <link>${post.link}</link>
      <guid isPermaLink="false">${post.guid}</guid>
      <pubDate>${post.pubDate}</pubDate>
    </item>`).join('')}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}