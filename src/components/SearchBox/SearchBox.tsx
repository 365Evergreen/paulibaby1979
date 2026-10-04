// SearchBox.tsx
import React, { useState, useMemo } from "react";
import styles from "./SearchBox.module.css"; // 1. Import CSS Module

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
}

interface SearchBoxProps {
  posts: BlogPost[];
  onSelect?: (post: BlogPost) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ posts, onSelect }) => {
  const [query, setQuery] = useState("");

  const filteredPosts = useMemo(() => {
    if (!query.trim()) return [];
    return posts.filter((p) =>
      p.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, posts]);

  return (
    <div className={styles.container}> {/* 2. Styled Container */}
      <input
        type="text"
        placeholder="Search..."
        value={query} // Added controlled value for best practice
        onChange={(e) => setQuery(e.target.value)}
        className={styles.inputField} // 3. Styled Input
      />
      {filteredPosts.length > 0 && ( // Conditional rendering prevents an empty border box
        <ul className={styles.dropdownList}> {/* 4. Styled List */}
          {filteredPosts.map((post) => (
            <li 
              key={post.id} 
              onClick={() => onSelect?.(post)}
              className={styles.listItem} // 5. Styled List Item
            >
              {post.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
