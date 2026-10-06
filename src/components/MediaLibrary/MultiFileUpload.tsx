import { useState, useRef, useCallback } from "react";

interface UploadedFile {
  id: number;
  r2_key: string;
  filename: string;
  content_type: string;
  media_type: string;
  size_bytes: number;
  url: string;
  playlist: string;
  subject: string;
  presenter: string;
  group_id: string;
}

interface UploadResponse {
  group_id: string;
  files: UploadedFile[];
}

interface FileMeta {
  [filename: string]: {
    title?: string;
    presenter?: string;
    alt_text?: string;
    caption?: string;
    description?: string;
    tags?: string;
  };
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function MultiFileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [sharedMeta, setSharedMeta] = useState({
    playlist: "",
    subject: "",
    presenter: "",
    uploaded_by: "",
    tags: "",
    description: "",
  });

  const [fileOverrides, setFileOverrides] = useState<FileMeta>({});

  const handleFileSelect = useCallback((selected: FileList | null) => {
    if (!selected) return;
    const newFiles = Array.from(selected);
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
    setError("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    setFiles((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const classifyMediaType = (file: File) => {
    const ct = file.type.toLowerCase();
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (ct.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext)) return "image";
    if (ct.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(ext)) return "audio";
    if (ct.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
    if (ct.startsWith("text/") || ["pdf", "doc", "docx", "txt", "csv", "md"].includes(ext)) return "document";
    return "other";
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);
    setProgress(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`);

    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    if (sharedMeta.playlist) formData.append("playlist", sharedMeta.playlist);
    if (sharedMeta.subject) formData.append("subject", sharedMeta.subject);
    if (sharedMeta.presenter) formData.append("presenter", sharedMeta.presenter);
    if (sharedMeta.uploaded_by) formData.append("uploaded_by", sharedMeta.uploaded_by);
    if (sharedMeta.tags) formData.append("tags", sharedMeta.tags);
    if (sharedMeta.description) formData.append("description", sharedMeta.description);

    const overrides: FileMeta = {};
    let hasOverrides = false;
    for (const file of files) {
      const o = fileOverrides[file.name];
      if (o && (o.presenter || o.title || o.alt_text || o.caption || o.description || o.tags)) {
        overrides[file.name] = o;
        hasOverrides = true;
      }
    }
    if (hasOverrides) {
      formData.append("file_meta", JSON.stringify(overrides));
    }

    try {
      const resp = await fetch(`${API_BASE}/api/admin/media`, {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || `Upload failed (HTTP ${resp.status})`);
        return;
      }

      setResult(data);
      setProgress("");
      setFiles([]);
      setFileOverrides({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const updateOverride = (filename: string, field: string, value: string) => {
    setFileOverrides((prev) => ({
      ...prev,
      [filename]: { ...prev[filename], [field]: value },
    }));
  };

  return (
    <div className="multi-file-upload">
      <style>{`
        .multi-file-upload { max-width: 900px; margin: 0 auto; font-family: system-ui, sans-serif; }
        .upload-dropzone {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 2.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #f8fafc;
        }
        .upload-dropzone:hover { border-color: #6366f1; background: #f0f0ff; }
        .upload-dropzone.drag-over { border-color: #6366f1; background: #eef2ff; }
        .upload-dropzone p { margin: 0.5rem 0; color: #64748b; }
        .upload-dropzone .icon { font-size: 2.5rem; }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }
        .meta-grid label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #475569; }
        .meta-grid input, .meta-grid textarea {
          padding: 0.5rem 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 400;
        }
        .meta-grid input:focus, .meta-grid textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .file-list { margin: 1.5rem 0; }
        .file-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          background: #fff;
        }
        .file-item .file-info { flex: 1; }
        .file-item .file-name { font-weight: 600; font-size: 0.9rem; color: #1e293b; }
        .file-item .file-meta-text { font-size: 0.8rem; color: #64748b; margin-top: 0.15rem; }
        .file-item .badge {
          display: inline-block;
          padding: 0.1rem 0.5rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-right: 0.4rem;
        }
        .badge-audio { background: #ddd6fe; color: #5b21b6; }
        .badge-video { background: #fecaca; color: #991b1b; }
        .badge-image { background: #bbf7d0; color: #14532d; }
        .badge-document { background: #bfdbfe; color: #1e3a5f; }
        .badge-other { background: #e2e8f0; color: #475569; }
        .file-item .override-row {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .file-item .override-row input {
          padding: 0.3rem 0.5rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.8rem;
          flex: 1;
        }
        .btn {
          padding: 0.6rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.15s;
        }
        .btn-primary { background: #6366f1; color: white; }
        .btn-primary:hover { background: #4f46e5; }
        .btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: #64748b; }
        .btn-ghost:hover { color: #ef4444; }
        .btn-small { padding: 0.25rem 0.6rem; font-size: 0.75rem; }
        .upload-actions { display: flex; justify-content: space-between; align-items: center; margin: 1.5rem 0; }
        .result-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1.5rem 0;
        }
        .result-card h3 { margin: 0 0 0.5rem; color: #14532d; }
        .result-card .group-id { font-family: monospace; font-size: 0.8rem; color: #64748b; }
        .result-list { margin-top: 1rem; }
        .result-list-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-bottom: 1px solid #d1fae5;
          font-size: 0.85rem;
        }
        .error-msg {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          font-size: 0.9rem;
        }
        .progress-msg {
          color: #6366f1;
          font-weight: 600;
          margin: 1rem 0;
        }
        .section-title { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 1.5rem 0 0.5rem; }
        .reorder-btns { display: flex; flex-direction: column; gap: 0.15rem; }
      `}</style>

      <div
        className={`upload-dropzone ${dragOver ? "drag-over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="icon">📁</div>
        <p><strong>Click to browse</strong> or drag &amp; drop files here</p>
        <p>Supports multiple files — audio, video, images, documents (max 50MB each)</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <>
          <div className="section-title">Shared metadata (applies to all files)</div>
          <div className="meta-grid">
            <label>
              Playlist
              <input
                type="text"
                value={sharedMeta.playlist}
                onChange={(e) => setSharedMeta({ ...sharedMeta, playlist: e.target.value })}
                placeholder="e.g. Theology Q4 2026"
              />
            </label>
            <label>
              Subject
              <input
                type="text"
                value={sharedMeta.subject}
                onChange={(e) => setSharedMeta({ ...sharedMeta, subject: e.target.value })}
                placeholder="e.g. Pauline Epistles"
              />
            </label>
            <label>
              Presenter
              <input
                type="text"
                value={sharedMeta.presenter}
                onChange={(e) => setSharedMeta({ ...sharedMeta, presenter: e.target.value })}
                placeholder="e.g. Dr. Paul"
              />
            </label>
            <label>
              Uploaded by
              <input
                type="text"
                value={sharedMeta.uploaded_by}
                onChange={(e) => setSharedMeta({ ...sharedMeta, uploaded_by: e.target.value })}
                placeholder="e.g. admin"
              />
            </label>
            <label>
              Tags (comma-separated)
              <input
                type="text"
                value={sharedMeta.tags}
                onChange={(e) => setSharedMeta({ ...sharedMeta, tags: e.target.value })}
                placeholder="e.g. sermon, teaching"
              />
            </label>
            <label>
              Description
              <textarea
                value={sharedMeta.description}
                onChange={(e) => setSharedMeta({ ...sharedMeta, description: e.target.value })}
                placeholder="Shared description..."
                rows={1}
              />
            </label>
          </div>

          <div className="section-title">
            Files ({files.length}) — click a field to set per-file overrides
          </div>
          <div className="file-list">
            {files.map((file, index) => {
              const mt = classifyMediaType(file);
              const o = fileOverrides[file.name] || {};
              return (
                <div key={`${file.name}-${index}`} className="file-item">
                  <div className="reorder-btns">
                    <button className="btn btn-ghost btn-small" onClick={() => moveFile(index, "up")} disabled={index === 0}>▲</button>
                    <button className="btn btn-ghost btn-small" onClick={() => moveFile(index, "down")} disabled={index === files.length - 1}>▼</button>
                  </div>
                  <div className="file-info">
                    <div className="file-name">
                      <span className={`badge badge-${mt}`}>{mt}</span>
                      {file.name}
                    </div>
                    <div className="file-meta-text">{formatSize(file.size)}</div>
                    <div className="override-row">
                      <input
                        type="text"
                        placeholder="Override: title"
                        value={o.title || ""}
                        onChange={(e) => updateOverride(file.name, "title", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Override: presenter"
                        value={o.presenter || ""}
                        onChange={(e) => updateOverride(file.name, "presenter", e.target.value)}
                      />
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-small" onClick={() => removeFile(index)}>✕</button>
                </div>
              );
            })}
          </div>

          <div className="upload-actions">
            <button className="btn btn-ghost" onClick={() => { setFiles([]); setFileOverrides({}); }}>
              Clear all
            </button>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
            </button>
          </div>
        </>
      )}

      {progress && <div className="progress-msg">{progress}</div>}
      {error && <div className="error-msg">⚠ {error}</div>}

      {result && (
        <div className="result-card">
          <h3>✅ Uploaded {result.files.length} file{result.files.length > 1 ? "s" : ""}</h3>
          <div className="group-id">Group ID: {result.group_id}</div>
          <div className="result-list">
            {result.files.map((f) => (
              <div key={f.id} className="result-list-item">
                <span className={`badge badge-${f.media_type}`}>{f.media_type}</span>
                <strong>{f.filename}</strong>
                <span style={{ color: "#64748b" }}>
                  {f.playlist && ` · ${f.playlist}`}
                  {f.subject && ` · ${f.subject}`}
                  {f.presenter && ` · ${f.presenter}`}
                </span>
                <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", color: "#6366f1" }}>
                  View →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
