import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock IndexedDB
import "fake-indexeddb/auto";

describe("RSS Parser", () => {
  // The rss-parser module uses fetch which we need to mock
  let fetchBlogPosts: typeof import("@/lib/utils/rss-parser").fetchBlogPosts;

  beforeEach(() => {
    vi.resetModules();
  });

  describe("extractTag (tested via fetchBlogPosts)", () => {
    it("should handle empty feed gracefully", async () => {
      // Dynamic import after mock setup
      const { fetchBlogPosts: fp } = await import("@/lib/utils/rss-parser");
      fetchBlogPosts = fp;

      // Mock fetch to return empty RSS
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title></channel></rss>`),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await fetchBlogPosts(false);
      expect(result).toEqual([]);
    });

    it("should parse valid RSS items", async () => {
      const { fetchBlogPosts: fp } = await import("@/lib/utils/rss-parser");
      fetchBlogPosts = fp;

      const rssContent = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Blog</title>
    <item>
      <title>Article 1</title>
      <link>https://example.com/1</link>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
      <description>Description 1</description>
    </item>
    <item>
      <title>Article 2</title>
      <link>https://example.com/2</link>
      <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
      <description>Description 2</description>
    </item>
  </channel>
</rss>`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(rssContent),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await fetchBlogPosts(false);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Article 1");
      expect(result[1].title).toBe("Article 2");
    });

    it("should filter health-related posts when filterHealth is true", async () => {
      const { fetchBlogPosts: fp } = await import("@/lib/utils/rss-parser");
      fetchBlogPosts = fp;

      const rssContent = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Blog</title>
    <item>
      <title>Vitamin K Benefits</title>
      <link>https://example.com/vitamin-k</link>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
      <description>Learn about vitamin K and your diet</description>
    </item>
    <item>
      <title>Tech News Today</title>
      <link>https://example.com/tech</link>
      <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
      <description>Latest in technology</description>
    </item>
  </channel>
</rss>`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(rssContent),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await fetchBlogPosts(true);
      expect(result.length).toBeLessThanOrEqual(1);
      // The Vitamin K article should match health keywords
      if (result.length > 0) {
        expect(result[0].title).toContain("Vitamin K");
      }
    });

    it("should handle fetch errors gracefully", async () => {
      const { fetchBlogPosts: fp } = await import("@/lib/utils/rss-parser");
      fetchBlogPosts = fp;

      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
      vi.stubGlobal("fetch", mockFetch);

      const result = await fetchBlogPosts(false);
      // Should return fallback data
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle non-200 responses", async () => {
      const { fetchBlogPosts: fp } = await import("@/lib/utils/rss-parser");
      fetchBlogPosts = fp;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server Error"),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await fetchBlogPosts(false);
      // Should throw or return fallback
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle CDATA sections in RSS", async () => {
      const { fetchBlogPosts: fp } = await import("@/lib/utils/rss-parser");
      fetchBlogPosts = fp;

      const rssContent = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Blog</title>
    <item>
      <title><![CDATA[Health &amp; Wellness Tips]]></title>
      <link>https://example.com/health</link>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
      <description><![CDATA[Learn about health topics]]></description>
    </item>
  </channel>
</rss>`;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(rssContent),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await fetchBlogPosts(false);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});