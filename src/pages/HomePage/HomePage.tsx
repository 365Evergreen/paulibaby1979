import { useState, useEffect } from "react";
import FeaturedPost from "../../components/FeaturedPost";
import PostGrid from "../../components/PostGrid";
import SectionHeader from "../../components/SectionHeader";
import NewsletterSignup from "../../components/NewsletterSignup";

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
};

export default function BlogList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data: Post[]) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading posts…</div>
      </div>
    );
  }

  const featured = posts[0];
  const recent = posts.slice(1, 7);
  const hasMultipleSections = posts.length > 1;

  return (
    <div className="homepage">
      <header className="homepage__hero">
        <div className="homepage__hero-content">
          <h1 className="homepage__hero-title">Paulibaby</h1>
          <p className="homepage__hero-tagline">
            Thoughts, stories, and ideas worth sharing.
          </p>
        </div>
      </header>

      {featured && (
        <section className="homepage__section">
          <SectionHeader
            title="Featured"
            subtitle="The latest from the blog"
          />
          <FeaturedPost post={featured} />
        </section>
      )}

      {hasMultipleSections && (
        <section className="homepage__section">
          <SectionHeader
            title="Recent Posts"
            subtitle="More articles to explore"
            action={{ label: "View all", href: "/blog" }}
          />
          <PostGrid posts={recent} columns={3} />
        </section>
      )}

      <section className="homepage__section">
        <NewsletterSignup />
      </section>

      <footer className="homepage__footer">
        <p>© 2026 Paulibaby. Powered by Cloudflare Workers + D1 + R2.</p>
        <a href="/admin" className="admin-link">Admin</a>
      </footer>
    </div>
  );
}
