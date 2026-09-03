import React, { useState, useMemo } from "react";

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
    <div>
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul>
        {filteredPosts.map((post) => (
          <li key={post.id} onClick={() => onSelect?.(post)}>
            {post.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchBox;
