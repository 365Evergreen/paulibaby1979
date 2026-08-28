import { useState, useEffect } from "react";

type Post = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  coverImage?: string;
  body?: string;
};

async function loadPosts(): Promise<Post[]> {
  try {
    const response = await fetch("/content/posts/index.json");
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback to bundled posts
  }

  return [
    {
      id: "welcome",
      title: "Welcome to my blog",
      excerpt: "This is the first post on my new blog powered by Cloudflare Workers.",
      date: "2026-08-14",
      coverImage: "https://media.paulibaby.com/welcome.jpg",
    },
    {
      id: "why-i-moved",
      title: "Why I moved to Cloudflare",
      excerpt: "Speed, simplicity, and edge computing — here's why I made the switch.",
      date: "2026-08-13",
      coverImage: "https://media.paulibaby.com/cloudflare.jpg",
    },
  ];
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    });
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
        <h1>Paulibaby is a cunt</h1>
        <p className="tagline">Thoughts, stories, and more.</p>
      </header>

      <main className="posts">
        {posts.map((post) => (
          <article key={post.id} className="post-card">
            {post.coverImage && (
              <img
                src={post.coverImage}
                alt={post.title}
                className="post-cover"
                loading="lazy"
              />
            )}
            <h2>{post.title}</h2>
            <time className="post-date">{post.date}</time>
            <p>{post.excerpt}</p>
            <a href="#" className="read-more">Read more →</a>
          </article>
        ))}
      </main>

      <footer className="footer">
        <p>© 2026 Paulibaby. Powered by Cloudflare Workers + R2 + TinaCMS.</p>
      </footer>
    </div>
  );
}
