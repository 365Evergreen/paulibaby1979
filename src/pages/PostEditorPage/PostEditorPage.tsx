import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import RichTextEditor from "../../components/RichTextEditor";

type Post = {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  published: boolean;
  created_at?: string;
  updated_at?: string;
};

type PostApiResponse = Omit<Post, "published"> & {
  published: boolean | number;
};

type UploadApiResponse = {
  url: string;
};

const emptyPost: Post = {
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  cover_image: null,
  published: false,
};

export default function PostEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<Post>(emptyPost);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const postId = id ? Number(id) : undefined;
  const isEditing = postId !== undefined;

  useEffect(() => {
    const controller = new AbortController();

    async function loadPost() {
      setMessage("");
      setError("");

      if (!id) {
        setEditing(emptyPost);
        setLoading(false);
        return;
      }

      if (!Number.isInteger(postId) || postId! <= 0) {
        setError("The post ID is invalid.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(`/api/admin/posts/${postId}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Post not found.");
          }

          throw new Error(
            await getResponseError(response, "Failed to load the post.")
          );
        }

        const post = (await response.json()) as PostApiResponse;

        setEditing({
          id: post.id,
          slug: post.slug ?? "",
          title: post.title ?? "",
          excerpt: post.excerpt ?? "",
          body: post.body ?? "",
          cover_image: post.cover_image ?? null,
          published: Boolean(post.published),
          created_at: post.created_at,
          updated_at: post.updated_at,
        });
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        setError(getErrorMessage(caughtError, "Failed to load the post."));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadPost();

    return () => {
      controller.abort();
    };
  }, [id, postId]);

  function updatePost<K extends keyof Post>(field: K, value: Post[K]) {
    setEditing((current) => ({
      ...current,
      value,
    }));
  }

  async function savePost(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    setMessage("");
    setError("");

    const title = editing.title.trim();
    const slug = editing.slug.trim();

    if (!title) {
      setError("Enter a title before saving.");
      return;
    }

    if (isEditing && editing.id === undefined) {
      setError("The loaded post does not have an ID.");
      return;
    }

    const payload = {
      slug,
      title,
      excerpt: editing.excerpt.trim(),
      body: editing.body,
      cover_image: editing.cover_image?.trim() || null,
      published: editing.published,
    };

    const targetId = editing.id ?? postId;
    const url = isEditing
      ? `/api/admin/posts/${targetId}`
      : "/api/admin/posts";
    const method = isEditing ? "PUT" : "POST";

    try {
      setSaving(true);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Failed to save the post.")
        );
      }

      /*
       * This expects POST and PUT to return the saved post as JSON.
       * For example:
       * {
       *   "id": 12,
       *   "title": "...",
       *   "published": 1
       * }
       */
      const savedPost = (await response.json()) as PostApiResponse;

      if (savedPost.id === undefined) {
        throw new Error("The server saved the post but did not return its ID.");
      }

      setEditing({
        id: savedPost.id,
        slug: savedPost.slug ?? payload.slug,
        title: savedPost.title ?? payload.title,
        excerpt: savedPost.excerpt ?? payload.excerpt,
        body: savedPost.body ?? payload.body,
        cover_image: savedPost.cover_image ?? payload.cover_image,
        published: Boolean(savedPost.published),
        created_at: savedPost.created_at,
        updated_at: savedPost.updated_at,
      });

      setMessage("Post saved successfully.");

      if (!isEditing) {
        navigate(`/post-editor/${savedPost.id}`, {
          replace: true,
        });
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Failed to save the post."));
    } finally {
      setSaving(false);
    }
  }

  async function handleCoverUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Choose a valid image file.");
      input.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Failed to upload the image.")
        );
      }

      const result = (await response.json()) as UploadApiResponse;

      if (!result.url) {
        throw new Error("The upload response did not include an image URL.");
      }

      updatePost("cover_image", result.url);
      setMessage("Cover image uploaded successfully.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Failed to upload the image."));
    } finally {
      setUploading(false);

      // Allows the same file to be selected again if an upload fails.
      input.value = "";
    }
  }

  function removeCoverImage() {
    updatePost("cover_image", null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function goBack() {
    navigate("/admin");
  }

  if (loading) {
    return (
      <main className="admin" aria-busy="true">
        <div className="loading">Loading post…</div>
      </main>
    );
  }

  if (id && (!Number.isInteger(postId) || postId! <= 0)) {
    return (
      <main className="admin">
        <header className="admin-header">
          <h1>Invalid Post</h1>

          <div className="admin-actions">
            <button
              type="button"
              onClick={goBack}
              className="btn-secondary"
            >
              ← Back
            </button>
          </div>
        </header>

        <div className="admin-message admin-message-error" role="alert">
          The post ID is invalid.
        </div>
      </main>
    );
  }

  return (
    <main className="admin">
      <form onSubmit={savePost}>
        <header className="admin-header">
          <h1>{isEditing ? "Edit Post" : "New Post"}</h1>

          <div className="admin-actions">
            <button
              type="button"
              onClick={goBack}
              className="btn-secondary"
              disabled={saving || uploading}
            >
              ← Back
            </button>

            <button
              type="submit"
              disabled={saving || uploading}
              className="btn-primary"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </header>

        {message && (
          <div
            className="admin-message admin-message-success"
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="admin-message admin-message-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="admin-form">
          <div className="form-group">
            <label htmlFor="post-title">Title</label>

            <input
              id="post-title"
              name="title"
              type="text"
              value={editing.title}
              onChange={(event) =>
                updatePost("title", event.target.value)
              }
              placeholder="Post title"
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-slug">Slug</label>

            <input
              id="post-slug"
              name="slug"
              type="text"
              value={editing.slug}
              onChange={(event) =>
                updatePost("slug", event.target.value)
              }
              placeholder="auto-generated-from-title"
              className="form-input"
            />

            <small id="post-slug-help">
              Leave empty to auto-generate from the title.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="post-excerpt">Excerpt</label>

            <textarea
              id="post-excerpt"
              name="excerpt"
              value={editing.excerpt}
              onChange={(event) =>
                updatePost("excerpt", event.target.value)
              }
              placeholder="Short summary shown in the post list"
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-cover-image">Cover Image</label>

            <div className="cover-upload">
              {editing.cover_image && (
                <div className="cover-preview-container">
                  <img
                    src={editing.cover_image}
                    alt="Current post cover preview"
                    className="cover-preview"
                  />

                  <button
                    type="button"
                    onClick={removeCoverImage}
                    className="btn-secondary"
                    disabled={saving || uploading}
                  >
                    Remove Image
                  </button>
                </div>
              )}

              <input
                id="post-cover-image"
                name="coverImage"
                type="url"
                value={editing.cover_image ?? ""}
                onChange={(event) =>
                  updatePost(
                    "cover_image",
                    event.target.value || null
                  )
                }
                placeholder="https://media.paulibaby.com/image.jpg"
                className="form-input"
              />

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleCoverUpload}
                accept="image/*"
                hidden
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                disabled={saving || uploading}
              >
                {uploading ? "Uploading…" : "Upload Image"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label id="post-body-label">Body</label>

            <div aria-labelledby="post-body-label">
              <RichTextEditor
                value={editing.body}
                onChange={(html) => updatePost("body", html)}
              />
            </div>
          </div>

          <div className="form-group form-checkbox">
            <label htmlFor="post-published">
              <input
                id="post-published"
                name="published"
                type="checkbox"
                checked={editing.published}
                onChange={(event) =>
                  updatePost("published", event.target.checked)
                }
              />
              Published
            </label>
          </div>

          <div className="admin-actions admin-form-actions">
            <button
              type="button"
              onClick={goBack}
              className="btn-secondary"
              disabled={saving || uploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || uploading}
              className="btn-primary"
            >
              {saving ? "Saving…" : "Save Post"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

async function getResponseError(
  response: Response,
  fallback: string
): Promise<string> {
  const contentType = response.headers.get("content-type");

  try {
    if (contentType?.includes("application/json")) {
      const body = (await response.json()) as {
        error?: string;
        message?: string;
      };

      return body.message || body.error || fallback;
    }

    const text = await response.text();
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}