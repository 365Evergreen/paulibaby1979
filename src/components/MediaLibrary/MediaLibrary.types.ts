export interface MediaItem {
  id: number | null;
  r2_key: string;
  filename: string;
  content_type: string;
  url: string;
  size_bytes: number;
  width: number;
  height: number;
  alt_text: string;
  type: string;
  altText: string;
  caption: string;
  createdAt?: string;
  media_type: string;
  playlist: string;
  subject: string;
  presenter: string;
  group_id: string;
  created_at: string;
}

// Data structures transferred back and forth across the HTTP network boundary
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
