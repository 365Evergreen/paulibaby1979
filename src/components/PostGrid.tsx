import PostCard from "./PostCard";

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
}

interface PostGridProps {
  posts: Post[];
  columns?: number;
}

export default function PostGrid({ posts, columns = 3 }: PostGridProps) {
  if (!posts || posts.length === 0) {
    return <p className="empty">No posts yet. Check back soon!</p>;
  }

  return (
    <div
      className="post-grid"
      style={{ "--grid-columns": columns } as React.CSSProperties}
    >
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
