import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
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

type PostApiResponse = {
  id?: number;
  slug?: string;
  title?: string;
  excerpt?: string;
  body?: string;
  cover_image?: string | null;
  published?: boolean | number;
  created_at?: string;
  updated_at?: string;
};

type ErrorApiResponse = {
  error?: string;
  message?: string;
};

type UploadApiResponse = {
  key?: string;
  url?: string;
};

const EMPTY_POST: Post = {
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  cover_image: null,
  published: false,
};

const MESSAGE_TIMEOUT = 3000;

export default function PageEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageTimerRef = useRef<number | null>(null);

  const [editing, setEditing] = useState<Post>({
    ...EMPTY_POST,
  });
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const numericId = id ? Number(id) : undefined;
  const hasValidRouteId =
    numericId !== undefined &&
    Number.isInteger(numericId) &&
    numericId > 0;

  const isEditingExistingPost = editing.id !== undefined;

  useEffect(() => {
    return () => {
      if (messageTimerRef.current !== null) {
        window.clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function initialiseEditor() {
      if (!id) {
        setEditing({ ...EMPTY_POST });
        setLoading(false);
        return;
      }

      if (!hasValidRouteId) {
        setLoading(false);
        showMessage("Invalid post ID.", "error", false);
        return;
      }

      try {
        setLoading(true);
        setMessage("");

        const response = await fetch(
          `/api/admin/posts/${numericId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            await readApiError(
              response,
              response.status === 404
                ? "Post not found."
                : "Failed to load the post.",
            ),
          );
        }

        const data =
          (await response.json()) as PostApiResponse;

        if (typeof data.id !== "number") {
          throw new Error(
            "The API response does not contain a valid post ID.",
          );
        }

        setEditing(normalisePost(data));
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        showMessage(
          getErrorMessage(error, "Failed to load the post."),
          "error",
          false,
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void initialiseEditor();

    return () => {
      controller.abort();
    };
  }, [id, hasValidRouteId, numericId]);

  function showMessage(
    text: string,
    type: "success" | "error" | "info" = "info",
    autoClear = true,
  ) {
    if (messageTimerRef.current !== null) {
      window.clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }

    setMessage(text);
    setMessageType(type);

    if (autoClear) {
      messageTimerRef.current = window.setTimeout(() => {
        setMessage("");
        messageTimerRef.current = null;
      }, MESSAGE_TIMEOUT);
    }
  }

function updatePost<K extends keyof Post>(
  field: K,
  value: Post[K],
) {
  setEditing((current) => ({
    ...current,
    value,
  }));
}

  async function savePost() {
    if (saving || uploading) {
      return;
    }

    const title = editing.title.trim();

    if (!title) {
      showMessage("Enter a post title before saving.", "error");
      return;
    }

    const payload = {
      slug: editing.slug.trim(),
      title,
      excerpt: editing.excerpt.trim(),
      body: editing.body,
      cover_image: editing.cover_image?.trim() || null,
      published: editing.published ? 1 : 0,
    };

    const requestUrl = editing.id
      ? `/api/admin/posts/${editing.id}`
      : "/api/admin/posts";

    const requestMethod = editing.id ? "PUT" : "POST";

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Failed to save the post."),
        );
      }

      const data =
        (await response.json()) as PostApiResponse;

      if (typeof data.id !== "number") {
        throw new Error(
          "The post was saved, but the API did not return a valid post.",
        );
      }

      const savedPost = normalisePost(data);

      setEditing(savedPost);
      showMessage("Saved successfully.", "success");

      if (!editing.id) {
        navigate(`/post-editor/${savedPost.id}`, {
          replace: true,
        });
      }
    } catch (error) {
      showMessage(
        getErrorMessage(error, "Failed to save the post."),
        "error",
        false,
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(
    file: File,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "Failed to upload the image."),
      );
    }

    const data =
      (await response.json()) as UploadApiResponse;

    if (
      typeof data.url !== "string" ||
      data.url.trim().length === 0
    ) {
      throw new Error(
        "The upload API did not return an image URL.",
      );
    }

    return data.url;
  }

  async function handleCoverUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file || uploading) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showMessage("Choose a valid image file.", "error");
      input.value = "";
      return;
    }

    const maximumFileSize = 5 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      showMessage(
        "The selected image exceeds the 5 MB upload limit.",
        "error",
      );
      input.value = "";
      return;
    }

    try {
      setUploading(true);
      showMessage("Uploading image...", "info", false);

      const imageUrl = await uploadImage(file);

      updatePost("cover_image", imageUrl);
      showMessage("Image uploaded successfully.", "success");
    } catch (error) {
      showMessage(
        getErrorMessage(error, "Failed to upload the image."),
        "error",
        false,
      );
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  function removeCoverImage() {
    updatePost("cover_image", null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    showMessage("Cover image removed.", "info");
  }

  function goBack() {
    navigate("/admin");
  }

  if (loading) {
    return (
      <main
        className="editor-page"
        aria-busy="true"
        aria-label="Loading post"
      >
        <div className="editor-loading">Loading post...</div>
      </main>
    );
  }

  if (id && !hasValidRouteId) {
    return (
      <main className="editor-page">
        <header className="editor-topbar">
          <div className="editor-topbar-left">
            <button
              type="button"
              onClick={goBack}
              className="btn-secondary"
            >
              ← Back
            </button>
          </div>
        </header>

        <div
          className="editor-error"
          role="alert"
        >
          Invalid post ID.
        </div>
      </main>
    );
  }

  return (
    <main className="editor-page">
      <header className="editor-topbar">
        <div className="editor-topbar-left">
          <button
            type="button"
            onClick={goBack}
            className="btn-secondary"
            disabled={saving || uploading}
          >
            ← Back
          </button>

          <span className="editor-page-heading">
            {isEditingExistingPost ? "Edit Post" : "New Post"}
          </span>
        </div>

        <div className="editor-topbar-right">
          {message && (
            <span
              className={`editor-message editor-message-${messageType}`}
              role={messageType === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {message}
            </span>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn-secondary"
            disabled={saving || uploading}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
          >
            ⚙ Post Settings
          </button>

          <button
            type="button"
            onClick={() => void savePost()}
            disabled={saving || uploading}
            className="btn-primary"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <section className="editor-content">
        <label
          htmlFor="post-title"
          className="sr-only"
        >
          Post title
        </label>

        <input
          id="post-title"
          name="title"
          type="text"
          value={editing.title}
          onChange={(event) =>
            updatePost("title", event.target.value)
          }
          placeholder="Post title..."
          className="editor-title-input"
          autoComplete="off"
          autoFocus
        />

        <div className="editor-body">
          <RichTextEditor
            value={editing.body}
            onChange={(html: string) =>
              updatePost("body", html)
            }
          />
        </div>
      </section>

      {drawerOpen && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-settings-title"
          >
            <div className="drawer-header">
              <h2 id="post-settings-title">
                Post Settings
              </h2>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="drawer-close"
                aria-label="Close post settings"
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div className="form-group">
                <label htmlFor="post-slug">
                  Slug
                </label>

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
                  autoComplete="off"
                  aria-describedby="post-slug-help"
                />

                <small id="post-slug-help">
                  Leave empty to auto-generate from the title.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="post-excerpt">
                  Excerpt
                </label>

                <textarea
                  id="post-excerpt"
                  name="excerpt"
                  value={editing.excerpt}
                  onChange={(event) =>
                    updatePost("excerpt", event.target.value)
                  }
                  placeholder="Short summary shown in the post list"
                  className="form-textarea"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="post-cover-url">
                  Cover Image
                </label>

                <div className="cover-upload-vertical">
                  {editing.cover_image && (
                    <div className="cover-preview-container">
                      <img
                        src={editing.cover_image}
                        alt="Post cover preview"
                        className="cover-preview-large"
                      />

                      <button
                        type="button"
                        onClick={removeCoverImage}
                        className="btn-secondary btn-full"
                        disabled={saving || uploading}
                      >
                        Remove Image
                      </button>
                    </div>
                  )}

                  <input
                    id="post-cover-url"
                    name="coverImage"
                    type="url"
                    value={editing.cover_image ?? ""}
                    onChange={(event) =>
                      updatePost(
                        "cover_image",
                        event.target.value || null,
                      )
                    }
                    placeholder="https://media.paulibaby.com/image.jpg"
                    className="form-input"
                    autoComplete="url"
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void handleCoverUpload(event)
                    }
                    hidden
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="btn-secondary btn-full"
                    disabled={saving || uploading}
                  >
                    {uploading
                      ? "Uploading..."
                      : "Upload Image"}
                  </button>
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
                      updatePost(
                        "published",
                        event.target.checked,
                      )
                    }
                  />

                  <span>Published</span>
                </label>
              </div>

              {editing.created_at && (
                <div className="form-group post-metadata">
                  <span>Created</span>
                  <time dateTime={editing.created_at}>
                    {formatDate(editing.created_at)}
                  </time>
                </div>
              )}

              {editing.updated_at && (
                <div className="form-group post-metadata">
                  <span>Updated</span>
                  <time dateTime={editing.updated_at}>
                    {formatDate(editing.updated_at)}
                  </time>
                </div>
              )}
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="btn-primary btn-full"
              >
                Done
              </button>
            </div>
          </aside>
        </>
      )}
    </main>
  );
}

function normalisePost(data: PostApiResponse): Post {
  return {
    id: data.id,
    slug:
      typeof data.slug === "string"
        ? data.slug
        : "",
    title:
      typeof data.title === "string"
        ? data.title
        : "",
    excerpt:
      typeof data.excerpt === "string"
        ? data.excerpt
        : "",
    body:
      typeof data.body === "string"
        ? data.body
        : "",
    cover_image:
      typeof data.cover_image === "string"
        ? data.cover_image
        : null,
    published: Boolean(data.published),
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const contentType =
      response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data =
        (await response.json()) as ErrorApiResponse;

      return data.error || data.message || fallback;
    }

    const text = await response.text();
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}