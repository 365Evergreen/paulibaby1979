import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


type Post = {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  published: number | boolean;
  created_at?: string;
  updated_at?: string;
};



export default function AdminPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    const res = await fetch("/api/admin/posts");
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }


  async function deletePost(id: number) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    await loadPosts();
  }







  return (
    <div className="admin">
      <header className="admin-header">
        <h1>Blog admin</h1>
        <div className="admin-actions">
          <a href="/" className="btn-secondary">View Blog</a>
          <button onClick={() => navigate("/post-editor")}>
            New post
          </button>
        </div>
      </header>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="empty">No posts yet. Create your first post!</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title || "(untitled)"}</td>
                <td>
                  <span className={`badge ${post.published ? "badge-published" : "badge-draft"}`}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td>
                  {post.created_at
                    ? new Date(post.created_at).toLocaleDateString()
                    : "—"}
                </td>
                <td>
                  <button onClick={() => navigate(`/post-editor/${post.id}`)}>
                    Edit
                  </button>
                  <button onClick={() => deletePost(post.id!)} className="btn-small btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );


  return null;
}