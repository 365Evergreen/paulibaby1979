/**
 * R2 helper functions for the paulibaby1979 Worker.
 * The BUCKET binding is defined in wrangler.jsonc.
 */

export interface BlogAsset {
  key: string;
  size: number;
  uploaded: string;
}

export async function listObjects(bucket: R2Bucket, prefix = ""): Promise<BlogAsset[]> {
  const listed = await bucket.list({ prefix });
  return listed.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded.toISOString(),
  }));
}

export async function getObject(
  bucket: R2Bucket,
  key: string
): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

export async function putObject(
  bucket: R2Bucket,
  key: string,
  value: ReadableStream | ArrayBuffer | Blob | string,
  options?: R2PutOptions
): Promise<R2Object> {
  return bucket.put(key, value, options);
}

export async function deleteObject(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

export function guessContentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
    json: "application/json",
    md: "text/markdown",
    txt: "text/plain",
  };
  return types[ext] ?? "application/octet-stream";
}
