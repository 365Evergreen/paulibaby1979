import { useEffect, useState, useMemo } from "react";
import LatestPosts from "../../components/LatestPosts/LatestPosts";
import styles from "./MusicPage.module.css";
import SearchBox, { BlogPost } from "../../components/SearchBox/SearchBox";

// Blog post type for this page
export interface BlogPostItem extends BlogPost {
  cover_image: string;
  url: string;
  slug: string;
  excerpt: string;
  date: string; // ISO date string
  category: string; // Added for filtering
}

const MusicPage: React.FC = () => {
  const [blogPosts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

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

  // Extract unique categories
  const categories = useMemo(() => {
    const unique = Array.from(new Set(blogPosts.map((p) => p.category)));
    return ["All", ...unique];
  }, [blogPosts]);

  // Filter posts by category
  const filteredPosts = useMemo(() => {
    if (selectedCategory === "All") return blogPosts;
    return blogPosts.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, blogPosts]);

  if (loading) {
    return <p>Loading posts…</p>;
  }

  return (
      <div className={styles.contentContainer}>
      <div className={styles.contentPageTitle}>  <h1>Music archive</h1></div>
         {/* Category Filter */}
      <div className={styles.filterBar}>
        <label htmlFor="category">Filter by Category: </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Search Box */}
      <SearchBox posts={filteredPosts} onSelect={handleSelect} />

      {/* Latest Posts */}
      <LatestPosts  />
    </div>
  );
};

export default MusicPage;

