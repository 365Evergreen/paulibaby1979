import { useState, useRef, useEffect } from "react";

const API_BASE = ""; // same origin
const MEDIA_URL = "https://media.paulibaby.com";

export default function AdminMedia() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const fileRef = useRef(null);

  // Upload form state
  const [altText, setAltText] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/media`);
      const data = await res.json();
      setMedia(data);
    } catch (e) {
      console.error("Failed to load media", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (altText) formData.append("alt_text", altText);
      if (title) formData.append("title", title);
      if (caption) formData.append("caption", caption);
      if (description) formData.append("description", description);
      if (tags) formData.append("tags", tags);

      const res = await fetch(`${API_BASE}/api/admin/media`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
 const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const newMedia = await res.json();
      setMedia((prev) => [newMedia, ...prev]);
      // Reset form
      setAltText("");
      setTitle("");
      setCaption("");
      setDescription("");
      setTags("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this media file? This removes it from R2 and the database.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/media/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      setMedia((prev) => prev.filter((m) => m.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/media/${editing.id}`, {
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
      const updated = await res.json();
      setMedia((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditing(null);
    } catch (e) {
      alert(e.message);
    }
  }

  function copyUrl(url) {
    navigator.clipboard.writeText(url);
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

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Media Library
      </h1>

      {/* Upload section */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
          Upload New Media
        </h2>
        <form onSubmit={handleUpload} style={{ display: "grid", gap: "0.75rem" }}>
          <div>
            <input ref={fileRef} type="file" accept="image/*" required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Alt text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={inputStyle}
            />
          </div>
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: "0.6rem 1.5rem",
              background: uploading ? "#9ca3af" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: uploading ? "not-allowed" : "pointer",
              fontWeight: 600,
              justifySelf: "start",
            }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Search */}
      <input
        placeholder="Search by filename, title, tags, or alt text..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...inputStyle, marginBottom: "1.5rem", width: "100%" }}
      />

      {/* Media grid */}
      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No media found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {filtered.map((m) => (
            <div
              key={m.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 140,
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={`${MEDIA_URL}/${m.r2_key}`}
                  alt={m.alt_text || m.filename}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              </div>
              <div style={{ padding: "0.75rem" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.title || m.filename}
                </p>
                <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: "0.25rem 0" }}>
                  {(m.size_bytes / 1024).toFixed(1)} KB · {m.content_type}
                </p>
                {m.tags && (
                  <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: "0.25rem 0" }}>
                    {m.tags}
                  </p>
                )}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button onClick={() => copyUrl(`${MEDIA_URL}/${m.r2_key}`)} style={btnSmStyle}>
                    Copy URL
                  </button>
                  <button onClick={() => setEditing(m)} style={btnSmStyle}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    style={{ ...btnSmStyle, color: "#dc2626" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "2rem",
              maxWidth: 480,
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
              Edit Media
            </h3>
            <img
              src={`${MEDIA_URL}/${editing.r2_key}`}
              alt={editing.alt_text}
              style={{ width: "100%", maxHeight: 200, objectFit: "contain", marginBottom: "1rem", borderRadius: 6 }}
            />
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <label style={labelStyle}>
                Title
                <input
                  value={editing.title || ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Alt text
                <input
                  value={editing.alt_text || ""}
                  onChange={(e) => setEditing({ ...editing, alt_text: e.target.value })}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Caption
                <input
                  value={editing.caption || ""}
                  onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Description
                <textarea
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>
              <label style={labelStyle}>
                Tags (comma-separated)
                <input
                  value={editing.tags || ""}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
                  style={inputStyle}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={btnSmStyle}>
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{ ...btnSmStyle, background: "#2563eb", color: "#fff", border: "none" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: "0.875rem",
  width: "100%",
  boxSizing: "border-box",
};

const btnSmStyle = {
  padding: "0.35rem 0.75rem",
 fontSize: "0.75rem",
 border: "1px solid #d1d5db",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
};

const labelStyle = {
  display: "grid",
  gap: "0.25rem",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "#374151",
};
