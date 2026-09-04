import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import styles from './MediaLibraryPage.module.css'

type MediaType = "audio" | "document" | "image" | "video" | "other";

type MediaItem = {
  id: number | null;
  r2_key: string;
  filename: string;
  content_type: string;
  media_type: MediaType;
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
  url: string;
};

type Layout = "grid" | "table";
type SortKey = "created_at" | "content_type" | "size_bytes";
type SortDir = "asc" | "desc";

const MEDIA_URL = "https://media.paulibaby.com";

const FILTER_PILLS: { label: string; value: MediaType | "all"; icon: string }[] = [
  { label: "All", value: "all", icon: "✦" },
  { label: "Image", value: "image", icon: "🖼" },
  { label: "Video", value: "video", icon: "🎬" },
  { label: "Audio", value: "audio", icon: "🎵" },
  { label: "Document", value: "document", icon: "📄" },
];

/** Full-size public URL for an R2 object. */
function fullUrl(r2Key: string): string {
  return `${MEDIA_URL}/${r2Key}`;
}

/** Cloudflare Image Resizing via URL — serves a real thumbnail-sized image
 *  instead of downloading the full-size file. Requires the zone to be
 *  proxied (orange-cloud) with Image Resizing enabled.
 *  If Image Resizing is not enabled, the <img> onError handler falls back
 *  to the full-size URL. */
function thumbUrl(r2Key: string, width: number, height: number): string {
  return `${MEDIA_URL}/cdn-cgi/image/width=${width},height=${height},fit=cover/${r2Key}`;
}

/** Fallback handler: if the Image Resizing URL fails (feature not enabled,
 *  zone not proxied, etc.), swap the src to the full-size object URL. */
function handleImgError(e: React.SyntheticEvent<HTMLImageElement>, r2Key: string) {
  const img = e.currentTarget;
  const fallback = fullUrl(r2Key);
  if (img.src !== fallback) {
    img.src = fallback;
  }
}

/** Render a preview tile for non-image media types. */
function MediaPreview({ item, size }: { item: MediaItem; size: "card" | "thumb" }) {
  const iconSize = size === "card" ? "3rem" : "1.5rem";
  const fontSize = size === "card" ? "0.85rem" : "0.7rem";

  if (item.media_type === "image") {
    const w = size === "card" ? 400 : 88;
    const h = size === "card" ? 160 : 88;
    return (
      <img
        src={thumbUrl(item.r2_key, w, h)}
        alt={item.alt_text || item.filename}
        loading="lazy"
        onError={(e) => handleImgError(e, item.r2_key)}
        style={size === "card" ? { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" } : { width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
      />
    );
  }

  const icons: Record<MediaType, string> = {
    audio: "🎵",
    video: "🎬",
    document: "📄",
    image: "🖼",
    other: "📦",
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.25rem",
      width: "100%",
      height: "100%",
      color: "var(--text-muted)",
    }}>
      <span style={{ fontSize: iconSize }}>{icons[item.media_type]}</span>
      {size === "card" && (
        <span style={{ fontSize, textTransform: "capitalize" }}>{item.media_type}</span>
      )}
    </div>
  );
}

export default function AdminMedia() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<MediaType | "all">("all");
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
      const res = await fetch("/api/admin/media-library");
      const data: MediaItem[] = await res.json();
      setMedia(data);
    } catch {
      console.error("Failed to load media library");
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

      // Reset form
      setAltText("");
      setTitle("");
      setCaption("");
      setDescription("");
      setTags("");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      showMessage("Uploaded successfully!");
      // Reload to pick up the new file with merged metadata
      await loadMedia();
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

  async function handleDelete(r2Key: string) {
    if (!confirm("Delete this file? This removes it from R2 and the database.")) return;
    try {
      const res = await fetch("/api/admin/media-library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r2_key: r2Key }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      setMedia((prev) => prev.filter((m) => m.r2_key !== r2Key));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
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

  function clearFilters() {
    setActiveFilter("all");
    setSearch("");
  }

  // Count items per media type for pill badges
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: media.length, image: 0, video: 0, audio: 0, document: 0, other: 0 };
    for (const m of media) {
      counts[m.media_type] = (counts[m.media_type] || 0) + 1;
    }
    return counts;
  }, [media]);

  const hasActiveFilters = activeFilter !== "all" || search.trim() !== "";

  const sortedFiltered = useMemo(() => {
    const filtered = media.filter((m) => {
      // Media type filter
      if (activeFilter !== "all" && m.media_type !== activeFilter) return false;
      // Search filter
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
      } else if (sortKey === "size_bytes") {
        cmp = a.size_bytes - b.size_bytes;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [media, search, activeFilter, sortKey, sortDir]);

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
    <div className={styles.drawerOverlay} onClick={() => setShowUpload(false)}>
      <div
        className={styles.mediaUploadModal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.drawerHeader}>
          <h2>Add Media</h2>
          <button onClick={() => setShowUpload(false)} className="drawer-close">✕</button>
        </div>

        <div className={styles.drawerBody}>
          {/* Drag & drop zone */}
          <div
            className={`mediaDropzone ${dragging} ? styles.mediaDropzone--active : ""`}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onClick={() => fileRef.current?.click()}
          >
            {selectedFile ? (
              <div className={styles.mediaDropzone__selected}>
                {selectedFile.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className={styles.mediaDropzone__preview}
                  />
                ) : (
                  <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                    {selectedFile.type.startsWith("audio/") ? "🎵" :
                     selectedFile.type.startsWith("video/") ? "🎬" : "📄"}
                  </div>
                )}
                <p className="mediaDropzone__filename">{selectedFile.name}</p>
                <p className="mediaDropzone__filesize">{formatSize(selectedFile.size)}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="btn-small"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className={styles.mediaDropzone__empty}>
                <div className={styles.mediaDropzone__icon}>📁</div>
                <p className={styles.mediaDropzone__text}>
                  Drag &amp; drop a file here, or <span className={styles.mediaDropzone__link}>browse</span>
                </p>
                <p className="mediaDropzone__hint">Images, audio, video, documents — max 50MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>

          {/* Metadata fields */}
          {selectedFile && (
            <form onSubmit={handleUpload} className={styles.mediaUploadForm}>
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
                  placeholder="Accessibility description (for images)"
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

  return (
    <div className={styles.admin}>
      <header className={styles.adminHeader}>
        <h1>Media Library</h1>
        <div className={styles.adminActions}>
          <a href="/admin" className={styles.mediaToolbar__btn}>← Posts</a>
          <button onClick={() => setShowUpload(true)} className="btn-primary">
            + Add Media
          </button>
        </div>
      </header>

      {message && <div className="admin-message">{message}</div>}

      {/* Filter pills */}
      <div className="media-filters">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setActiveFilter(pill.value)}
            className={`media-pill ${activeFilter === pill.value ? styles.mediaPill__active: ""}`}
          >
            <span className={styles.mediaPill__icon}>{pill.icon}</span>
            {pill.label}
            <span className={styles.mediaPill__count}>
              {filterCounts[pill.value] ?? 0}
            </span>
          </button>
        ))}
        {hasActiveFilters && (
          <button onClick={clearFilters} className={styles.mediaPill__clear}>
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* Toolbar: search + view toggle */}
      <div className={styles.mediaToolbar}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename, title, tags, or alt text…"
          className="form-input media-toolbar__search"
        />
        <div className="media-toolbar__toggle">
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
        <div className="empty">
          {hasActiveFilters
            ? "No media matches your filters. Try clearing them."
            : 'No media found. Click "Add Media" to upload your first file!'}
        </div>
      ) : layout === "grid" ? (
        /* --- Grid view --- */
        <div className={styles.mediaGrid}>
          {sortedFiltered.map((m) => (
            <div key={m.r2_key} className={styles.mediaCard}>
              <div className="media-card__thumb">
                <MediaPreview item={m} size="card" />
              </div>
              <div className="media-card__body">
                <p className="media-card__title">{m.title || m.filename}</p>
                <p className="media-card__meta">
                  {formatSize(m.size_bytes)} · {m.content_type}
                </p>
                <p className="media-card__meta">{formatDate(m.created_at)}</p>
                {m.tags && <p className="media-card__tags">{m.tags}</p>}
                <div className="media-card__actions">
                  <button onClick={() => copyUrl(m.url)} className="btn-small">
                    Copy URL
                  </button>
                  <button onClick={() => handleDelete(m.r2_key)} className="btn-small btn-danger">
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
              <th style={{ width: 60 }}>Preview</th>
              <th>Title / Filename</th>
              <th>Type</th>
              <th
                onClick={() => toggleSort("content_type")}
                className="media-table__sort"
              >
                Content Type {sortKey === "content_type" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => toggleSort("size_bytes")}
                className="media-table__sort"
              >
                Size {sortKey === "size_bytes" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
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
              <tr key={m.r2_key}>
                <td>
                  <MediaPreview item={m} size="thumb" />
                </td>
                <td>
                  <div className="media-table__name">{m.title || m.filename}</div>
                  {m.alt_text && <div className="media-table__alt">{m.alt_text}</div>}
                </td>
                <td>
                  <span className="media-type-badge" data-type={m.media_type}>
                    {m.media_type}
                  </span>
                </td>
                <td>{m.content_type}</td>
                <td>{formatSize(m.size_bytes)}</td>
                <td>{formatDate(m.created_at)}</td>
                <td>
                  <button onClick={() => copyUrl(m.url)} className="btn-small">
                    Copy
                  </button>
                  <button onClick={() => handleDelete(m.r2_key)} className="btn-small btn-danger">
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
