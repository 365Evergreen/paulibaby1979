import { useState, useEffect, useRef } from "react";
import RichTextEditor from '../../components/RichTextEditor'

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

type View = "list" | "edit";

export default function AdminPage() {
  const [view, setView] = useState<View>("list");
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function newPost() {
    setEditing({
      slug: "",
      title: "",
      excerpt: "",
      body: "",
      cover_image: null,
      published: false,
    });
    setView("edit");
  }

  function editPost(post: Post) {
    setEditing({ ...post, published: Boolean(post.published) });
    setView("edit");
  }

  async function savePost() {
    if (!editing) return;
    setSaving(true);
    setMessage("");

    const payload = {
      ...editing,
      published: editing.published ? 1 : 0,
    };

    try {
      let res;
      if (editing.id) {
        res = await fetch(`/api/admin/posts/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        if (created.id) {
          setEditing({ ...editing, id: created.id });
        }
      }

      if (res.ok) {
        setMessage("Saved successfully!");
        await loadPosts();
      } else {
        setMessage("Error saving post.");
      }
    } catch {
      setMessage("Network error.");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function deletePost(id: number) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    await loadPosts();
  }

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setMessage("Uploading image…");
    const url = await uploadImage(file);
    if (url) {
      setEditing({ ...editing, cover_image: url });
      setMessage("Image uploaded!");
    } else {
      setMessage("Upload failed.");
    }
    setTimeout(() => setMessage(""), 3000);
  }

  if (view === "list") {
    return (
      <div className="admin">
        <header className="admin-header">
          <h1>Blog Admin</h1>
          <div className="admin-actions">
            <a href="/" className="btn-secondary">View Blog</a>
            <button onClick={newPost} className="btn-primary">+ New Post</button>
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
                    <button onClick={() => editPost(post)} className="btn-small">Edit</button>
                    <button onClick={() => deletePost(post.id!)} className="btn-small btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (view === "edit" && editing) {
    return (
      <div className="admin">
        <header className="admin-header">
          <h1>{editing.id ? "Edit Post" : "New Post"}</h1>
          <div className="admin-actions">
            <button onClick={() => setView("list")} className="btn-secondary">← Back</button>
            <button onClick={savePost} disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </header>

        {message && <div className="admin-message">{message}</div>}

        <div className="admin-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="Post title"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Slug</label>
            <input
              type="text"
              value={editing.slug}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              placeholder="auto-generated-from-title"
              className="form-input"
            />
            <small>Leave empty to auto-generate from title</small>
          </div>

          <div className="form-group">
            <label>Excerpt</label>
            <textarea
              value={editing.excerpt}
              onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
              placeholder="Short summary shown in the post list"
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Cover Image</label>
            <div className="cover-upload">
              {editing.cover_image && (
                <img
                  src={editing.cover_image}
                  alt="Cover preview"
                  className="cover-preview"
                />
              )}
              <input
                type="text"
                value={editing.cover_image || ""}
                onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })}
                placeholder="https://media.paulibaby.com/image.jpg"
                className="form-input"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCoverUpload}
                accept="image/*"
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
              >
                Upload Image
              </button>
            </div>
          </div>
<RichTextEditor
    value={editing.body}
              onChange={(html) => setEditing({ ...editing, body: html })}
/>
          <div className="form-group">
            <label>Body (Markdown)</label>
            <textarea
              value={editing.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              placeholder="Write your post in Markdown…"
              className="form-textarea form-body"
              rows={15}
            />
          </div>

          <div className="form-group form-checkbox">
            <label>
              <input
                type="checkbox"
                checked={Boolean(editing.published)}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
              />
              Published
            </label>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
