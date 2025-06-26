import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { Calendar, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { BreadcrumbLD } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "VitaK Tracker Blog - Warfarin Diet Tips & Vitamin K Management",
  description: "Expert articles on managing vitamin K intake while on warfarin. Learn about INR stability, diet tips, food guides, and the latest updates to VitaK Tracker.",
  keywords: ["warfarin blog", "vitamin k articles", "INR management tips", "anticoagulation diet blog", "blood thinner resources"],
  openGraph: {
    title: "VitaK Tracker Blog - Expert Warfarin Diet Guidance",
    description: "Stay informed with the latest tips on vitamin K management and warfarin diet strategies.",
    type: "website",
  },
};

// This would typically fetch from your blog API
// For now, we'll use static data as an example
const blogPosts = [
  {
    id: 1,
    title: "Understanding Vitamin K and Warfarin Interaction",
    excerpt: "Learn the science behind why vitamin K affects warfarin and how to maintain stable INR levels through consistent intake.",
    date: "2024-01-15",
    readTime: "5 min",
    category: "Education",
    url: "https://blog.moikas.com/vitamin-k-warfarin-interaction",
  },
  {
    id: 2,
    title: "Top 20 Low Vitamin K Foods for Your Diet",
    excerpt: "Discover delicious foods that are naturally low in vitamin K, perfect for maintaining your warfarin therapy.",
    date: "2024-01-10",
    readTime: "8 min",
    category: "Food Lists",
    url: "https://blog.moikas.com/low-vitamin-k-foods",
  },
  {
    id: 3,
    title: "VitaK Tracker Update: New Features for 2024",
    excerpt: "We've added meal presets, improved portion tracking, and enhanced our food database. See what's new!",
    date: "2024-01-05",
    readTime: "3 min",
    category: "Updates",
    url: "https://blog.moikas.com/vitak-tracker-2024-update",
  },
  {
    id: 4,
    title: "Creating a Balanced Warfarin Diet Plan",
    excerpt: "Step-by-step guide to creating a sustainable diet plan that keeps your vitamin K intake consistent.",
    date: "2023-12-28",
    readTime: "10 min",
    category: "Meal Planning",
    url: "https://blog.moikas.com/warfarin-diet-plan",
  },
];

export default function BlogPage() {
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
                VitaK Tracker Blog
              </h1>
              <p className="text-xl text-gray-600">
                Expert guidance on managing vitamin K intake while on warfarin therapy
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-primary font-medium">
                        {post.category}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle className="line-clamp-2">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4 line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(post.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <a
                        href={post.url}
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
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                Want to see more articles about warfarin diet management?
              </p>
              <a
                href="https://blog.moikas.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Button variant="outline">
                  Visit Our Full Blog
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            <Card className="mt-12 bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Stay Updated</CardTitle>
                <CardDescription>
                  Get the latest tips on vitamin K management and app updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Follow our blog for weekly articles on warfarin diet strategies, 
                  new food discoveries, and VitaK Tracker feature announcements.
                </p>
                <div className="flex gap-4">
                  <a href="/blog/rss.xml" className="text-primary hover:text-primary/80 text-sm font-medium">
                    RSS Feed
                  </a>
                  <a 
                    href="https://twitter.com/vitaktracker" 
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
            "name": "VitaK Tracker Blog",
            "description": "Expert articles on managing vitamin K intake while on warfarin",
            "url": `${process.env.NEXT_PUBLIC_APP_URL || 'https://vitaktracker.com'}/blog`,
            "blogPost": blogPosts.map(post => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.excerpt,
              "datePublished": post.date,
              "url": post.url,
              "author": {
                "@type": "Organization",
                "name": "VitaK Tracker Team"
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