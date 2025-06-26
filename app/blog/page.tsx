import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { Calendar, Clock, ArrowRight, ExternalLink, Rss } from "lucide-react";
import { BreadcrumbLD } from "@/components/seo/json-ld";
import { fetchBlogPosts } from "@/lib/utils/rss-parser";

export const metadata: Metadata = {
  title: "Health Articles - VitaK Tracker & Moikas Blog",
  description: "Health-focused articles from Moikas Blog covering VitaK Tracker updates, vitamin K management, warfarin diet tips, and general wellness topics.",
  keywords: ["health blog", "vitamin k articles", "VitaK Tracker updates", "warfarin diet tips", "wellness articles", "Moikas health posts"],
  openGraph: {
    title: "Health Articles from Moikas Blog - VitaK Tracker Updates",
    description: "Stay informed with health-focused content and VitaK Tracker updates from Moikas Blog.",
    type: "website",
  },
};

export const revalidate = 3600; // Revalidate every hour

// Helper function to estimate read time
function estimateReadTime(text: string): string {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

export default async function BlogPage() {
  const blogPosts = await fetchBlogPosts();
  return (
    <>
      <BreadcrumbLD items={[
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" }
      ]} />
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                VitaK Tracker
              </Link>
              <Link href="/auth/sign-up">
                <Button>Start Tracking</Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">
                Health Articles from Moikas Blog
              </h1>
              <p className="text-xl text-gray-600">
                Health-focused content including VitaK Tracker updates and wellness tips
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Showing health-related articles from <a href="https://blog.moikas.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">blog.moikas.com</a>
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.length > 0 ? (
                blogPosts.slice(0, 9).map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        {post.category && (
                          <span className="text-sm text-primary font-medium">
                            {post.category}
                          </span>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {estimateReadTime(post.description)}
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4 line-clamp-3">
                        {post.description}
                      </CardDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(post.pubDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1"
                        >
                          Read More
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No health-related articles available at the moment.</p>
                  <p className="text-sm text-gray-400 mt-2">Check back later for VitaK Tracker updates and health content.</p>
                </div>
              )}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                Want to see all articles including non-health topics?
              </p>
              <a
                href="https://blog.moikas.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Button variant="outline">
                  Visit Moikas Blog
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            <Card className="mt-12 bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Stay Updated with Health Content</CardTitle>
                <CardDescription>
                  Get health articles and VitaK Tracker updates from Moikas Blog
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This page shows health-related articles from Moikas Blog, including 
                  VitaK Tracker updates, wellness tips, and nutrition information.
                </p>
                <div className="flex gap-4">
                  <a 
                    href="https://blog.moikas.com/api/rss" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                  >
                    <Rss className="h-4 w-4" />
                    RSS Feed
                  </a>
                  <a 
                    href="https://twitter.com/moikas_official" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    Follow on Twitter
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>

      {/* Article List Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Health Articles - Moikas Blog",
            "description": "Health-focused content from Moikas Blog including VitaK Tracker updates",
            "url": `${process.env.NEXT_PUBLIC_APP_URL || 'https://vitaktracker.com'}/blog`,
            "blogPost": blogPosts.slice(0, 9).map(post => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.description,
              "datePublished": post.pubDate,
              "url": post.link,
              "author": {
                "@type": "Organization",
                "name": post.author || "VitaK Tracker Team"
              },
              "publisher": {
                "@type": "Organization", 
                "name": "VitaK Tracker",
                "logo": {
                  "@type": "ImageObject",
                  "url": `${process.env.NEXT_PUBLIC_APP_URL}/icon-512x512.svg`
                }
              }
            }))
          })
        }}
      />
    </>
  );
}