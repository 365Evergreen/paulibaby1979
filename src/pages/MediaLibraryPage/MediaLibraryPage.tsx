import { useState, useEffect, useRef } from "react";

type Media = {
  id: number;
  r2_key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  title: string;
  caption: string;
  description: string;
  tags: string;
  uploaded_by: string;
  source_url: string;
  thumbnail_key: string;
  created_at: string;
  updated_at: string;
};

type View = "list" | "edit";

const MEDIA_URL = "https://media.paulibaby.com";

export default function AdminMedia() {
  const [view, setView] = useState<View>("list");
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Media | null>(null);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [altText, setAltText] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data: Media[] = await res.json();
      setMedia(data);
    } catch {
      console.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (altText) formData.append("alt_text", altText);
      if (title) formData.append("title", title);
      if (caption) formData.append("caption", caption);
      if (description) formData.append("description", description);
      if (tags) formData.append("tags", tags);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const newMedia: Media = await res.json();
      setMedia((prev) => [newMedia, ...prev]);
      // Reset form
      setAltText("");
      setTitle("");
      setCaption("");
      setDescription("");
      setTags("");
      if (fileRef.current) fileRef.current.value = "";
      setMessage("Uploaded successfully!");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this media file? This removes it from R2 and the database.")) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      setMedia((prev) => prev.filter((m) => m.id !== id));
      if (editing?.id === id) setView("list");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    try {
      const res = await fetch(`/api/admin/media/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alt_text: editing.alt_text,
          title: editing.title,
          caption: editing.caption,
          description: editing.description,
          tags: editing.tags,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      const updated: Media = await res.json();
      setMedia((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setView("list");
      setEditing(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setMessage("URL copied to clipboard!");
    setTimeout(() => setMessage(""), 2000);
  }

  const filtered = media.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.filename?.toLowerCase().includes(q) ||
      m.title?.toLowerCase().includes(q) ||
      m.tags?.toLowerCase().includes(q) ||
      m.alt_text?.toLowerCase().includes(q)
    );
  });

  // --- List view ---
  if (view === "list") {
    return (
      <div className="admin">
        <header className="admin-header">
          <h1>Media Library</h1>
          <div className="admin-actions">
            <a href="/admin" className="btn-secondary">← Posts</a>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-primary"
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "+ Upload"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ display: "none" }}
            />
          </div>
        </header>

        {message && <div className="admin-message">{message}</div>}

        {/* Quick upload panel */}
        <div className="admin-form" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem" }}>
            Upload New Media
          </h2>
          <form onSubmit={handleUpload} className="admin-form" style={{ padding: 0, border: "none", background: "none" }}>
            <div className="form-group">
              <label>File</label>
              <input ref={fileRef} type="file" accept="image/*" required style={{ fontSize: "0.9rem" }} />
            </div>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Display title"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Alt text</label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Accessibility description"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma, separated, tags"
                className="form-input"
              />
            </div>
            <button type="submit" disabled={uploading} className="btn-primary">
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </form>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename, title, tags, or alt text…"
          className="form-input"
          style={{ marginBottom: "1.5rem" }}
        />

        {/* Media grid */}
        {loading ? (
          <div className="loading">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No media found. Upload your first image!</div>
        ) : (
          <div className="media-grid">
            {filtered.map((m) => (
              <div key={m.id} className="media-card">
                <div className="media-card__thumb">
                  <img
                    src={`${MEDIA_URL}/${m.r2_key}`}
                    alt={m.alt_text || m.filename}
                    loading="lazy"
                  />
                </div>
                <div className="media-card__body">
                  <p className="media-card__title">{m.title || m.filename}</p>
                  <p className="media-card__meta">
                    {(m.size_bytes / 1024).toFixed(1)} KB · {m.content_type}
                  </p>
                  {m.tags && <p className="media-card__tags">{m.tags}</p>}
                  <div className="media-card__actions">
                    <button
                      onClick={() => copyUrl(`${MEDIA_URL}/${m.r2_key}`)}
                      className="btn-small"
                    >
                      Copy URL
                    </button>
                    <button
                      onClick={() => { setEditing(m); setView("edit"); }}
                      className="btn-small"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="btn-small btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Edit view ---
  if (view === "edit" && editing) {
    return (
      <div className="editor-page">
        <header className="editor-topbar">
          <div className="editor-topbar-left">
            <button onClick={() => setView("list")} className="btn-secondary">← Back</button>
            <span className="badge badge-published">Media</span>
          </div>
          <div className="editor-topbar-right">
            {message && <span className="editor-message">{message}</span>}
            <button onClick={handleSaveEdit} className="btn-primary">
              Save
            </button>
          </div>
        </header>

        <div className="editor-content">
          <img
            src={`${MEDIA_URL}/${editing.r2_key}`}
            alt={editing.alt_text}
            style={{ width: "100%", maxHeight: 300, objectFit: "contain", borderRadius: 8, marginBottom: "1.5rem" }}
          />

          <div className="admin-form">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Alt text</label>
              <input
                type="text"
                value={editing.alt_text}
                onChange={(e) => setEditing({ ...editing, alt_text: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Caption</label>
              <input
                type="text"
                value={editing.caption}
                onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={4}
                className="form-textarea"
              />
            </div>
            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                value={editing.tags}
                onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
                placeholder="comma, separated, tags"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>File URL</label>
              <input
                type="text"
                value={`${MEDIA_URL}/${editing.r2_key}`}
                readOnly
                className="form-input"
              />
              <button
                onClick={() => copyUrl(`${MEDIA_URL}/${editing.r2_key}`)}
                className="btn-secondary"
                style={{ marginTop: "0.5rem" }}
              >
                Copy URL
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
