interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
}

export default function FeaturedPost({ post }: { post: Post }) {
  if (!post) return null;

  return (
    <a href={`/blog/${post.slug}`} className="featured-post">
      {post.cover_image && (
        <div className="featured-post__image-wrap">
          <img
            src={post.cover_image}
            alt={post.title}
            className="featured-post__image"
            loading="eager"
          />
          <div className="featured-post__overlay" />
        </div>
      )}
      <div className="featured-post__content">
        <span className="featured-post__badge">Featured</span>
        <h2 className="featured-post__title">{post.title}</h2>
        <p className="featured-post__excerpt">{post.excerpt}</p>
        <div className="featured-post__meta">
          <time>
            {new Date(post.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span className="featured-post__read">Read article →</span>
        </div>
      </div>
    </a>
  );
}
