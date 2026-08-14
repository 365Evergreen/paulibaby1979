import { useState, useEffect } from "react";

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
      .then((data) => {
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

  return (
    <div className="app">
      <header className="header">
        <h1>Paulibaby</h1>
        <p className="tagline">Thoughts, stories, and more.</p>
      </header>

      <main className="posts">
        {posts.length === 0 ? (
          <p className="empty">No posts yet. Check back soon!</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="post-card">
              {post.cover_image && (
                <a href={`/post/${post.slug}`}>
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="post-cover"
                    loading="lazy"
                  />
                </a>
              )}
              <h2>
                <a href={`/post/${post.slug}`} className="post-link">{post.title}</a>
              </h2>
              <time className="post-date">
                {new Date(post.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <p>{post.excerpt}</p>
              <a href={`/post/${post.slug}`} className="read-more">Read more →</a>
            </article>
          ))
        )}
      </main>

      <footer className="footer">
        <p>© 2026 Paulibaby. Powered by Cloudflare Workers + D1 + R2.</p>
        <a href="/admin" className="admin-link">Admin</a>
      </footer>
    </div>
  );
}
