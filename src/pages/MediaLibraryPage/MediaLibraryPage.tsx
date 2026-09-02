import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import styles from "./MediaLibraryPage.module.css";
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
type Layout = "grid" | "table";
type SortKey = "created_at" | "content_type";
type SortDir = "asc" | "desc";

const MEDIA_URL = "https://media.paulibaby.com";

/** Cloudflare Image Resizing via URL — serves a real thumbnail-sized image
 *  instead of downloading the full-size file. Requires the zone to be
 *  proxied (orange-cloud) with Image Resizing enabled. */
function thumbUrl(r2Key: string, width: number, height: number): string {
  return `${MEDIA_URL}/cdn-cgi/image/width=${width},height=${height},fit=cover/${r2Key}`;
}

export default function AdminMedia() {
  const [view, setView] = useState<View>("list");
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Media | null>(null);
  const [message, setMessage] = useState("");
  const [layout, setLayout] = useState<Layout>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showUpload, setShowUpload] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Upload form state
  const [altText, setAltText] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

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

  function showMessage(msg: string, duration = 3000) {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  }

  async function uploadFile(file: File) {
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
      setAltText("");
      setTitle("");
      setCaption("");
      setDescription("");
      setTags("");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      showMessage("Uploaded successfully!");
    } catch (e) {
      showMessage(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = selectedFile || fileRef.current?.files?.[0];
    if (!file) return;
    await uploadFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
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
    showMessage("URL copied to clipboard!", 2000);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortedFiltered = useMemo(() => {
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

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortKey === "content_type") {
        cmp = a.content_type.localeCompare(b.content_type);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [media, search, sortKey, sortDir]);

  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatSize = useCallback((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // --- Upload modal ---
  const uploadModal = showUpload && (
    <div className="drawer-overlay" onClick={() => setShowUpload(false)}>
      <div
        className="media-upload-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <h2>Add Media</h2>
          <button onClick={() => setShowUpload(false)} className="drawer-close">✕</button>
        </div>

        <div className="drawer-body">
          {/* Drag & drop zone */}
          <div
            className={`media-dropzone ${dragging ? "media-dropzone--active" : ""}`}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onClick={() => fileRef.current?.click()}
          >
            {selectedFile ? (
              <div className="media-dropzone__selected">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="media-dropzone__preview"
                />
                <p className="media-dropzone__filename">{selectedFile.name}</p>
                <p className="media-dropzone__filesize">{formatSize(selectedFile.size)}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="btn-small"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="media-dropzone__empty">
                <div className="media-dropzone__icon">📁</div>
                <p className="media-dropzone__text">
                  Drag &amp; drop an image here, or <span className="media-dropzone__link">browse</span>
                </p>
                <p className="media-dropzone__hint">PNG, JPG, WebP, GIF — max 10MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>

          {/* Metadata fields */}
          {selectedFile && (
            <form onSubmit={handleUpload} className="media-upload-form">
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
                <label>Caption</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Short caption"
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
              <button type="submit" disabled={uploading} className="btn-primary btn-full">
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  // --- List view ---
  if (view === "list") {
    return (
      <div className={styles.contentContainer}>
        <header className={styles.adminHeader}>
          <h1>Media library</h1>
          <div className={styles.adminActions}>
            <a href="/admin" className={styles.btnSecondary}>← Posts</a>
            <button onClick={() => setShowUpload(true)} className={styles.btnPrimary}>
              + Add Media
            </button>
          </div>
        </header>

        {message && <div className={styles.adminMessage}>{message}</div>}

        {/* Toolbar: search + view toggle */}
        <div className={styles.mediaToolbar}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename, title, tags, or alt text…"
            className={`${styles.formInput} ${styles.mediaToolbar__search}`}
          />
          <div className={styles.mediaToolbar__toggle}>
            <button
              onClick={() => setLayout("grid")}
              className={`media-toolbar__btn ${layout === "grid" ? "media-toolbar__btn--active" : ""}`}
              title="Grid view"
            >
              ▦
            </button>
            <button
              onClick={() => setLayout("table")}
              className={`media-toolbar__btn ${layout === "table" ? "media-toolbar__btn--active" : ""}`}
              title="Table view"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading">Loading…</div>
        ) : sortedFiltered.length === 0 ? (
          <div className="empty">No media found. Click "Add Media" to upload your first image!</div>
        ) : layout === "grid" ? (
          /* --- Grid view --- */
          <div className={styles.mediaGrid}>
            {sortedFiltered.map((m) => (
              <div key={m.id} className={styles.mediaCard}>
                <div className={styles.mediaCard__thumb}>
                  <img
                    src={thumbUrl(m.r2_key, 400, 160)}
                    alt={m.alt_text || m.filename}
                    loading="lazy"
                  />
                </div>
                <div className={styles.mediaCard__body}>
                  <p className={styles.mediaCard__title}>{m.title || m.filename}</p>
                  <p className={styles.mediaCard__meta}>
                    {formatSize(m.size_bytes)} · {m.content_type}
                  </p>
                  <p className={styles.mediaCard__meta}>{formatDate(m.created_at)}</p>
                  {m.tags && <p className={styles.mediaCard__tags}>{m.tags}</p>}
                  <div className={styles.mediaCard__actions}>
                    <button onClick={() => copyUrl(`${MEDIA_URL}/${m.r2_key}`)} className={styles.btnSmall}>
                      Copy URL
                    </button>
                    <button onClick={() => { setEditing(m); setView("edit"); }} className={styles.btnSmall}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(m.id)} className={styles.btnSmall} style={{ backgroundColor: "var(--danger)" }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- Table view --- */
          <table className="admin-table media-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Thumb</th>
                <th>Title / Filename</th>
                <th>Content Type</th>
                <th>Size</th>
                <th
                  onClick={() => toggleSort("created_at")}
                  className="media-table__sort"
                >
                  Uploaded {sortKey === "created_at" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <img
                      src={thumbUrl(m.r2_key, 88, 88)}
                      alt={m.alt_text || m.filename}
                      className="media-table__thumb"
                      loading="lazy"
                    />
                  </td>
                  <td>
                    <div className="media-table__name">{m.title || m.filename}</div>
                    {m.alt_text && <div className="media-table__alt">{m.alt_text}</div>}
                  </td>
                  <td>
                    <span
                      onClick={() => toggleSort("content_type")}
                      className="media-table__sort media-table__type"
                    >
                      {m.content_type}
                      {sortKey === "content_type" && (sortDir === "asc" ? " ↑" : " ↓")}
                    </span>
                  </td>
                  <td>{formatSize(m.size_bytes)}</td>
                  <td>{formatDate(m.created_at)}</td>
                  <td>
                    <button onClick={() => copyUrl(`${MEDIA_URL}/${m.r2_key}`)} className="btn-small">
                      Copy
                    </button>
                    <button onClick={() => { setEditing(m); setView("edit"); }} className="btn-small">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="btn-small btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {uploadModal}
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
            src={thumbUrl(editing.r2_key, 800, 300)}
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
