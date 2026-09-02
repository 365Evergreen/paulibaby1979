export interface MediaItem {
    id: number | string;
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
}

// Data structures transferred back and forth across the HTTP network boundary
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
