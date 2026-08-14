import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  created_at: string;
};

function renderMarkdown(md: string): string {
  let html = md;
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  html = html.replace(/(<\/ul>)\s*(<ul>)/g, '$1$2');
  html = html
    .split(/\n\n+/)
    .map((block) => {
      if (block.match(/^<(h[1-3]|ul)/)) return block;
      return `<p>${block.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
  return html;
}

export default function SinglePostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading…</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="app">
        <div className="loading">Post not found.</div>
        <div className="back-link">
          <Link to="/">← Back to blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <article className="post-full">
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="post-cover-full"
          />
        )}
        <h1>{post.title}</h1>
        <time className="post-date">
          {new Date(post.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
        />
      </article>

      <div className="back-link">
        <Link to="/">← Back to blog</Link>
      </div>
    </div>
  );
}
