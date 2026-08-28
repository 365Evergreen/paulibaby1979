import { useState, useEffect } from "react";
import styles from './LatestPosts.module.css'

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
};

export default function LatestPosts () {
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
    <section className={styles.section}>
            <main className="posts">
              <div className={styles.contentContainer}>Yo, cunt</div>
        {posts.length === 0 ? (
          <p className="empty">No posts yet. Check back soon!</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="post-card">
              {post.cover_image && (
                <a href={`/blog/${post.slug}`}>
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="post-cover"
                    loading="lazy"
                  />
                </a>
              )}
              <h2>
                <a href={`/blog/${post.slug}`} className="post-link">{post.title}</a>
              </h2>
              <time className="post-date">
                {new Date(post.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <p>{post.excerpt}</p>
              <a href={`/blog/${post.slug}`} className="read-more">Read more →</a>
            </article>
          ))
        )}
      </main>

   </section>
  );
}
