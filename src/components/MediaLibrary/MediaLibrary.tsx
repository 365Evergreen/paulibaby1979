import React, { useState, ChangeEvent } from 'react';
import './MediaLibrary.module.css';
import { MediaItem } from './MediaLibrary.types';

const INITIAL_MEDIA: MediaItem[] = [
  { id: '1', filename: 'sample-image.jpg', url: 'https://picsum.photos', size_bytes: 153600, content_type: 'image/jpeg', width: 300, height: 300, alt_text: 'A beautiful landscape', caption: '', r2_key: '', type: '', altText: '' },
  { id: '2', filename: 'sample-image.jpg', url: 'https://picsum.photos', size_bytes: 122880, content_type: 'image/jpeg', width: 300, height: 300, alt_text: '', caption: '', r2_key: '', type: '', altText: '' },
];

// Extend File interface temporarily to avoid TypeScript errors on non-standard properties
interface WebkitFile extends File {
  webkitRelativePath: string;
}

export default function MediaLibrary(): React.JSX.Element {
  const [mediaList, setMediaList] = useState<MediaItem[]>(INITIAL_MEDIA);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const handleFolderUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files) as WebkitFile[];
    
    const newItems: MediaItem[] = files.map((file, index) => {
      // Extract the path if it exists (e.g., "vacation/photos/beach.jpg")
      const relativePath = file.webkitRelativePath || '';
      
      return {
        id: `${Date.now()}-${index}`,
        filename: file.name,
        // Optional: Save relativePath to r2_key or a new folder attribute to preserve hierarchy in R2
        r2_key: relativePath, 
        url: URL.createObjectURL(file),
        size_bytes: file.size,
        content_type: file.type,
        width: 0,
        height: 0,
        alt_text: '',
        type: file.type || 'image',
        altText: '',
        caption: '',
      };
    });

    setMediaList((prev) => [...prev, ...newItems]);
  };

  const handleDelete = (id: string | number): void => {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const handleUpdateField = (id: string | number, field: keyof MediaItem, value: string): void => {
    setMediaList((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    setSelectedItem((prev) => (prev && prev.id === id ? { ...prev, [field]: value } : prev));
  };

  return (
    <div className="media-library-wrapper">
      <div className="media-main">
        <div className="media-toolbar">
          {/* Separate Folder Upload Button */}
          <label className="upload-btn">
            Upload Folder
            <input 
              type="file" 
              onChange={handleFolderUpload} 
              hidden 
              // React TS workaround syntax for directory input flags
              {...{ webkitdirectory: "", directory: "", multiple: true }} 
            />
          </label>
        </div>
        <div className="media-grid">
          {mediaList.map((item) => (
            <div key={item.id} className={`media-card ${selectedItem?.id === item.id ? 'selected' : ''}`} onClick={() => setSelectedItem(item)}>
              <div className="media-card-square">
                <img src={item.url} alt={item.altText || item.filename} loading="lazy" />
              </div>
              {/* Optional UI helper showing folder prefix */}
              {item.r2_key && item.r2_key.includes('/') && (
                <span className="folder-badge">
                  {item.r2_key.substring(0, item.r2_key.lastIndexOf('/'))}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {selectedItem && <MediaSidebar item={selectedItem} onDelete={handleDelete} onUpdateField={handleUpdateField} />}
    </div>
  );
}

interface SidebarProps {
  item: MediaItem;
  onDelete: (id: string | number) => void;
  onUpdateField: (id: string | number, field: keyof MediaItem, value: string) => void;
}

function MediaSidebar({ item, onDelete, onUpdateField }: SidebarProps): React.JSX.Element {
  return (
    <div className="media-sidebar">
      <h3>Attachment Details</h3>
      <div className="sidebar-preview-container">
        <img src={item.url} alt={item.filename} className="sidebar-preview" />
      </div>
      <div className="meta-info">
        <p><strong>File name:</strong> {item.filename}</p>
        {item.r2_key && <p><strong>Relative Path:</strong> {item.r2_key}</p>}
        <p><strong>File type:</strong> {item.content_type}</p>
        <p><strong>File size:</strong> {item.size_bytes} bytes</p>
      </div>
      <hr />
      <div className="meta-fields">
        <label>
          Alternative Text
          <input type="text" value={item.altText || ''} onChange={(e) => onUpdateField(item.id, 'altText', e.target.value)} />
        </label>
        <label>
          Caption
          <textarea value={item.caption || ''} onChange={(e) => onUpdateField(item.id, 'caption', e.target.value)} rows={3} />
        </label>
      </div>
      <button className="delete-btn" onClick={() => onDelete(item.id)}>
        Delete Permanently
      </button>
    </div>
  );
}
