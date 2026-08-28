interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card-grid">
      {post.cover_image && (
        <a href={`/blog/${post.slug}`} className="post-card-grid__image-link">
          <img
            src={post.cover_image}
            alt={post.title}
            className="post-card-grid__image"
            loading="lazy"
          />
        </a>
      )}
      <div className="post-card-grid__body">
        <time className="post-card-grid__date">
          {new Date(post.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>
        <h3 className="post-card-grid__title">
          <a href={`/blog/${post.slug}`}>{post.title}</a>
        </h3>
        <p className="post-card-grid__excerpt">{post.excerpt}</p>
        <a href={`/blog/${post.slug}`} className="post-card-grid__link">
          Read more →
        </a>
      </div>
    </article>
  );
}
