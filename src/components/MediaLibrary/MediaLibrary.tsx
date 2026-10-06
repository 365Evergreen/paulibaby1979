import { useState, useEffect, useCallback } from "react";

interface MediaItem {
  id: number | null;
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
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    playlist: "",
    subject: "",
    presenter: "",
    media_type: "",
  });
  const [activeFilter, setActiveFilter] = useState({
    playlist: "",
    subject: "",
    presenter: "",
    media_type: "",
  });

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeFilter.playlist) params.set("playlist", activeFilter.playlist);
    if (activeFilter.subject) params.set("subject", activeFilter.subject);
    if (activeFilter.presenter) params.set("presenter", activeFilter.presenter);
    if (activeFilter.media_type) params.set("media_type", activeFilter.media_type);

    const query = params.toString();
    const resp = await fetch(`${API_BASE}/api/admin/media${query ? `?${query}` : ""}`);
    const data = await resp.json();
    setItems(data);
    setLoading(false);
  }, [activeFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const applyFilters = () => {
    setActiveFilter(filters);
  };

  const clearFilters = () => {
    setFilters({ playlist: "", subject: "", presenter: "", media_type: "" });
    setActiveFilter({ playlist: "", subject: "", presenter: "", media_type: "" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Delete this media file?`)) return;
    await fetch(`${API_BASE}/api/admin/media/${id}`, { method: "DELETE" });
    fetchMedia();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const grouped: { [groupId: string]: MediaItem[] } = {};
  const ungrouped: MediaItem[] = [];
  for (const item of items) {
    if (item.group_id) {
      if (!grouped[item.group_id]) grouped[item.group_id] = [];
      grouped[item.group_id].push(item);
    } else {
      ungrouped.push(item);
    }
  }

  return (
    <div className="media-library">
      <style>{`
        .media-library { max-width: 1000px; margin: 0 auto; font-family: system-ui, sans-serif; }
        .filter-bar {
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
        }
        .filter-bar label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; font-weight: 600; color: #475569; }
        .filter-bar input, .filter-bar select {
          padding: 0.4rem 0.6rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 400;
          min-width: 140px;
        }
        .filter-actions { display: flex; gap: 0.5rem; }
        .btn { padding: 0.5rem 1rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; }
        .btn-primary { background: #6366f1; color: white; }
        .btn-primary:hover { background: #4f46e5; }
        .btn-ghost { background: transparent; color: #64748b; border: 1px solid #cbd5e1; }
        .btn-ghost:hover { background: #f1f5f9; }
        .group-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
          background: #fff;
        }
        .group-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .group-header h3 { margin: 0; font-size: 0.95rem; color: #1e293b; }
        .group-header .group-meta { font-size: 0.8rem; color: #64748b; }
        .badge {
          display: inline-block;
          padding: 0.1rem 0.5rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge-audio { background: #ddd6fe; color: #5b21b6; }
        .badge-video { background: #fecaca; color: #991b1b; }
        .badge-image { background: #bbf7d0; color: #14532d; }
        .badge-document { background: #bfdbfe; color: #1e3a5f; }
        .badge-other { background: #e2e8f0; color: #475569; }
        .media-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .media-row:last-child { border-bottom: none; }
        .media-row .name { font-weight: 600; font-size: 0.85rem; color: #1e293b; }
        .media-row .meta { font-size: 0.75rem; color: #64748b; }
        .media-row .actions { margin-left: auto; display: flex; gap: 0.5rem; }
        .media-row .actions a { color: #6366f1; text-decoration: none; font-size: 0.8rem; }
        .media-row .actions button { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem; }
        .loading { text-align: center; padding: 2rem; color: #64748b; }
        .empty { text-align: center; padding: 2rem; color: #94a3b8; }
      `}</style>

      <div className="filter-bar">
        <label>
          Playlist
          <input
            type="text"
            value={filters.playlist}
            onChange={(e) => setFilters({ ...filters, playlist: e.target.value })}
            placeholder="Filter by playlist..."
          />
        </label>
        <label>
          Subject
          <input
            type="text"
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            placeholder="Filter by subject..."
          />
        </label>
        <label>
          Presenter
          <input
            type="text"
            value={filters.presenter}
            onChange={(e) => setFilters({ ...filters, presenter: e.target.value })}
            placeholder="Filter by presenter..."
          />
        </label>
        <label>
          Media type
          <select
            value={filters.media_type}
            onChange={(e) => setFilters({ ...filters, media_type: e.target.value })}
          >
            <option value="">All types</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="document">Document</option>
            <option value="other">Other</option>
          </select>
        </label>
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={applyFilters}>Apply</button>
          <button className="btn btn-ghost" onClick={clearFilters}>Clear</button>
        </div>
      </div>

      {loading && <div className="loading">Loading media...</div>}
      {!loading && items.length === 0 && <div className="empty">No media found.</div>}

      {!loading && Object.entries(grouped).map(([groupId, groupItems]) => (
        <div key={groupId} className="group-card">
          <div className="group-header">
            <h3>{groupItems[0].playlist || "Untitled playlist"}</h3>
            <span className="group-meta">
              {groupItems[0].subject && ` · ${groupItems[0].subject}`}
              {groupItems[0].presenter && ` · ${groupItems[0].presenter}`}
              {` · ${groupItems.length} files`}
            </span>
          </div>
          {groupItems.map((item) => (
            <div key={item.id} className="media-row">
              <span className={`badge badge-${item.media_type}`}>{item.media_type}</span>
              <div>
                <div className="name">{item.filename}</div>
                <div className="meta">
                  {formatSize(item.size_bytes)}
                  {item.presenter && ` · ${item.presenter}`}
                  {` · ${new Date(item.created_at).toLocaleDateString()}`}
                </div>
              </div>
              <div className="actions">
                <a href={item.url} target="_blank" rel="noopener noreferrer">View</a>
                {item.id && <button onClick={() => handleDelete(item.id!)}>Delete</button>}
              </div>
            </div>
          ))}
        </div>
      ))}

      {!loading && ungrouped.length > 0 && (
        <div className="group-card">
          <div className="group-header">
            <h3>Other files</h3>
            <span className="group-meta">{ungrouped.length} files</span>
          </div>
          {ungrouped.map((item) => (
            <div key={item.id} className="media-row">
              <span className={`badge badge-${item.media_type}`}>{item.media_type}</span>
              <div>
                <div className="name">{item.filename}</div>
                <div className="meta">
                  {formatSize(item.size_bytes)}
                  {` · ${new Date(item.created_at).toLocaleDateString()}`}
                </div>
              </div>
              <div className="actions">
                <a href={item.url} target="_blank" rel="noopener noreferrer">View</a>
                {item.id && <button onClick={() => handleDelete(item.id!)}>Delete</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
