import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from "react";

const API_BASE = ""; // same origin
const MEDIA_URL = "https://media.paulibaby.com";

interface MediaItem {
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
}

interface UploadFormState {
  altText: string;
  title: string;
  caption: string;
  description: string;
  tags: string;
}

const EMPTY_FORM: UploadFormState = {
  altText: "",
  title: "",
  caption: "",
  description: "",
  tags: "",
};

export default function AdminMedia(): JSX.Element {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<UploadFormState>({ ...EMPTY_FORM });

  useEffect(() => {
    void fetchMedia();
  }, []);

  async function fetchMedia(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/media`);
      const data: MediaItem[] = await res.json();
      setMedia(data);
    } catch (e) {
      console.error("Failed to load media", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (form.altText) formData.append("alt_text", form.altText);
      if (form.title) formData.append("title", form.title);
      if (form.caption) formData.append("caption", form.caption);
      if (form.description) formData.append("description", form.description);
      if (form.tags) formData.append("tags", form.tags);

      const res = await fetch(`${API_BASE}/api/admin/media`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err: { error?: string } = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const newMedia: MediaItem = await res.json();
      setMedia((prev) => [newMedia, ...prev]);
      setForm({ ...EMPTY_FORM });
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number): Promise<void> {
    if (!confirm("Delete this media file? This removes it from R2 and the database.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/media/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err: { error?: string } = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      setMedia((prev) => prev.filter((m) => m.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function handleSaveEdit(): Promise<void> {
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
        const err: { error?: string } = await res.json();
        throw new Error(err.error || "Update failed");
      }
      const updated: MediaItem = await res.json();
      setMedia((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditing(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    }
  }

  function copyUrl(url: string): void {
    void navigator.clipboard.writeText(url);
  }

  const filtered: MediaItem[] = media.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.filename?.toLowerCase().includes(q) ||
      m.title?.toLowerCase().includes(q) ||
      m.tags?.toLowerCase().includes(q) ||
      m.alt_text?.toLowerCase().includes(q)
    );
  });

  function updateForm(field: keyof UploadFormState, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEditing(field: keyof MediaItem, value: string): void {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Media Library
      </h1>

      {/* Upload section */}
      <div style={panelStyle}>
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
              value={form.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateForm("title", e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Alt text"
              value={form.altText}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateForm("altText", e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Caption"
              value={form.caption}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateForm("caption", e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Tags (comma-separated)"
              value={form.tags}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateForm("tags", e.target.value)}
              style={inputStyle}
            />
          </div>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateForm("description", e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <button type="submit" disabled={uploading} style={uploading ? btnDisabledStyle : btnPrimaryStyle}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Search */}
      <input
        placeholder="Search by filename, title, tags, or alt text..."
        value={search}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        style={{ ...inputStyle, marginBottom: "1.5rem", width: "100%" }}
      />

      {/* Media grid */}
      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No media found.</p>
      ) : (
        <div style={gridStyle}>
          {filtered.map((m: MediaItem) => (
            <div key={m.id} style={cardStyle}>
              <div style={thumbContainerStyle}>
                <img
                  src={`${MEDIA_URL}/${m.r2_key}`}
                  alt={m.alt_text || m.filename}
                  style={thumbImgStyle}
                />
              </div>
              <div style={{ padding: "0.75rem" }}>
                <p style={cardTitleStyle}>
                  {m.title || m.filename}
                </p>
                <p style={cardMetaStyle}>
                  {(m.size_bytes / 1024).toFixed(1)} KB · {m.content_type}
                </p>
                {m.tags && (
                  <p style={cardMetaStyle}>{m.tags}</p>
                )}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button onClick={() => copyUrl(`${MEDIA_URL}/${m.r2_key}`)} style={btnSmStyle}>
                    Copy URL
                  </button>
                  <button onClick={() => setEditing(m)} style={btnSmStyle}>
                    Edit
                  </button>
                  <button onClick={() => void handleDelete(m.id)} style={{ ...btnSmStyle, color: "#dc2626" }}>
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
        <div onClick={() => setEditing(null)} style={modalOverlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
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
                  value={editing.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateEditing("title", e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Alt text
                <input
                  value={editing.alt_text}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateEditing("alt_text", e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Caption
                <input
                  value={editing.caption}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateEditing("caption", e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Description
                <textarea
                  value={editing.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateEditing("description", e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>
              <label style={labelStyle}>
                Tags (comma-separated)
                <input
                  value={editing.tags}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateEditing("tags", e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={btnSmStyle}>
                Cancel
              </button>
              <button onClick={() => void handleSaveEdit()} style={btnSaveStyle}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Styles ----

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: "0.875rem",
  width: "100%",
  boxSizing: "border-box",
};

const btnSmStyle: React.CSSProperties = {
  padding: "0.35rem 0.75rem",
  fontSize: "0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: "0.6rem 1.5rem",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  justifySelf: "start",
};

const btnDisabledStyle: React.CSSProperties = {
  ...btnPrimaryStyle,
  background: "#9ca3af",
  cursor: "not-allowed",
};

const btnSaveStyle: React.CSSProperties = {
  ...btnSmStyle,
  background: "#2563eb",
  color: "#fff",
  border: "none",
};

const panelStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "1.5rem",
  marginBottom: "2rem",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "1rem",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  overflow: "hidden",
  background: "#fff",
};

const thumbContainerStyle: React.CSSProperties = {
  width: "100%",
  height: 140,
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const thumbImgStyle: React.CSSProperties = {
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  margin: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const cardMetaStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  color: "#6b7280",
  margin: "0.25rem 0",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.25rem",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "#374151",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: "2rem",
  maxWidth: 480,
  width: "90%",
  maxHeight: "80vh",
  overflowY: "auto",
};
