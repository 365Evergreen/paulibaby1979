import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from './AdminPage.module.css'


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
    <div className={styles.adminPage}>
      {/* ✅ Open the wrapper section */}
      <section className={styles.contentContainer}>

        <div className={styles.adminHeader}>
          <h1>Blog admin</h1>
          {/* ✅ FIXED: Swapped hardcoded strings out for your CSS module classes */}
          <div className={styles.adminHeaderButtons}>

       
            <button className={styles.homeButton} onClick={() => navigate("/")}>Back to site</button>
            <button className={styles.newPostButton} onClick={() => navigate("/post-editor")}>New post</button>
            <button className={styles.mediaLibraryButton} onClick={() => navigate("/media-library")}>Media library</button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="empty">No posts yet. Create your first post!</div>
        ) : (
          <div className={styles.adminTableContainer}>
            <table className={styles.adminTable}>
              <thead>
                <tr className={styles.adminTableHeader}>
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
                    {/* ✅ The action column container wrapper */}
                    <td className={styles.adminTableActionsColumn}>
                      <div className={styles.adminTableActions}>
                        <button onClick={() => navigate(`/post-editor/${post.id}`)} className={styles.editPostButton}>
                          Edit
                        </button>
                        <button onClick={() => deletePost(post.id!)} className={styles.deletePostButton}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </section> {/* ✅ FIXED: Closed section cleanly at the very bottom of your layout */}
    </div>
  )
};
