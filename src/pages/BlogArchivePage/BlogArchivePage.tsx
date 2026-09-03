import { useEffect, useState } from "react";
import LatestPosts from "../../components/LatestPosts/LatestPosts";
import styles from "./BlogArchivePage.module.css";
import SearchBox, { BlogPost } from "../../components/SearchBox/SearchBox";

// Blog post type for this page
export interface BlogPostItem extends BlogPost {
  cover_image: string;
  url: string;
  slug: string;
  excerpt: string;
  date: string; // ISO date string
}

const BlogArchivePage: React.FC = () => {
  const [blogPosts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSelect = (post: BlogPost) => {
    alert(`Selected: ${post.title}`);
  };

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch posts");
        return r.json();
      })
      .then((data: BlogPostItem[]) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading posts…</div>;
  }

  return (
    <div className={styles.contentContainer}>
    <div className={styles.contentPageTitle}>  <h1>Blog archive</h1></div>

      {/* Search box for filtering posts */}
      <SearchBox posts={blogPosts} onSelect={handleSelect} />

      {/* Latest posts section */}
      <LatestPosts  />
    </div>
  );
};

export default BlogArchivePage;
