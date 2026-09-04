import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RichTextEditor from "../../components/RichTextEdiitor/RichTextEditor";
import styles from "./PostEditorPage.module.css";

type Post = {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  published: number | boolean;
  category_ids: number[];
  created_at?: string;
  updated_at?: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
};

type CategoryNode = Category & { children: CategoryNode[] };

// Build a tree from a flat category list
function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const c of categories) {
    map.set(c.id, { ...c, children: [] });
  }
  for (const c of categories) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// Flatten the tree into indented options for a <select>
function flattenCategoryTree(
  nodes: CategoryNode[],
  depth = 0
): { id: number; label: string }[] {
  const result: { id: number; label: string }[] = [];
  for (const node of nodes) {
    const indent = "\u00A0\u00A0".repeat(depth) + (depth > 0 ? "↳ " : "");
    result.push({ id: node.id, label: indent + node.name });
    result.push(...flattenCategoryTree(node.children, depth + 1));
  }
  return result;
}

export default function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [editing, setEditing] = useState<Post>({
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    cover_image: null,
    published: false,
    category_ids: [],
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParent, setNewCategoryParent] = useState<string>("");
  const [addingCategory, setAddingCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadPost(id!);
    }
  }, [id]);

  async function loadCategories() {
    const res = await fetch("/api/admin/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
    }
  }

  async function loadPost(postId: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/posts/${postId}`);
    if (res.ok) {
      const data = await res.json();
      setEditing({
        ...data,
        published: Boolean(data.published),
        category_ids: data.category_ids || [],
      });
    }
    setLoading(false);
  }

  async function savePost() {
    setSaving(true);
    setMessage("");

    const payload = {
      ...editing,
      published: editing.published ? 1 : 0,
    };

    try {
      let res;
      if (editing.id) {
        res = await fetch(`/api/admin/posts/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        if (created.id) {
          setEditing({ ...editing, id: created.id });
        }
      }

      if (res.ok) {
        setMessage("Saved successfully!");
      } else {
        setMessage("Error saving post.");
      }
    } catch {
      setMessage("Network error.");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage("Uploading image…");
    const url = await uploadImage(file);
    if (url) {
      setEditing({ ...editing, cover_image: url });
      setMessage("Image uploaded!");
    } else {
      setMessage("Upload failed.");
    }
    setTimeout(() => setMessage(""), 3000);
  }

  async function createCategory() {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCategoryName.trim(),
        parent_id: newCategoryParent ? parseInt(newCategoryParent) : null,
      }),
    });
    setAddingCategory(false);
    if (res.ok) {
      const created = await res.json();
      setNewCategoryName("");
      setNewCategoryParent("");
      await loadCategories();
      // Auto-select the newly created category
      setEditing({
        ...editing,
        category_ids: [...editing.category_ids, created.id],
      });
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || "Failed to create category.");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function toggleCategory(catId: number) {
    setEditing({
      ...editing,
      category_ids: editing.category_ids.includes(catId)
        ? editing.category_ids.filter((c) => c !== catId)
        : [...editing.category_ids, catId],
    });
  }

  if (loading) {
    return (
      <div className={styles.editorPage}>
        <div className={styles.loading}>Loading…</div>
      </div>
    );
  }

  const categoryOptions = flattenCategoryTree(buildCategoryTree(categories));

  return (
    <div className={styles.editorPage}>
      {/* Top bar */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            onClick={() => navigate("/admin")}
            className={styles.btnSecondary}
          >
            ← Back
          </button>
          <span
            className={`${styles.badge} ${
              editing.published ? styles.badgePublished : styles.badgeDraft
            }`}
          >
            {editing.published ? "Published" : "Draft"}
          </span>
        </div>
        <div className={styles.topbarRight}>
          {message && <span className={styles.message}>{message}</span>}
          <button
            onClick={() => setDrawerOpen(true)}
            className={styles.btnSecondary}
          >
            ⚙ Post Settings
          </button>
          <button
            onClick={savePost}
            disabled={saving}
            className={styles.btnPrimary}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* Full-width editor area */}
      <div className={styles.editorContent}>
        <input
          type="text"
          value={editing.title}
          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
          placeholder="Post title…"
          className={styles.titleInput}
        />
        <RichTextEditor
          value={editing.body}
          onChange={(html) => setEditing({ ...editing, body: html })}
        />
      </div>

      {/* Settings drawer */}
      {drawerOpen && (
        <>
          <div
            className={styles.drawerOverlay}
            onClick={() => setDrawerOpen(false)}
          />
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h2>Post Settings</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className={styles.drawerClose}
              >
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Slug */}
              <div className={styles.formGroup}>
                <label>Slug</label>
                <input
                  type="text"
                  value={editing.slug}
                  onChange={(e) =>
                    setEditing({ ...editing, slug: e.target.value })
                  }
                  placeholder="auto-generated-from-title"
                  className={styles.formInput}
                />
                <small>Leave empty to auto-generate from title</small>
              </div>

              {/* Excerpt */}
              <div className={styles.formGroup}>
                <label>Excerpt</label>
                <textarea
                  value={editing.excerpt}
                  onChange={(e) =>
                    setEditing({ ...editing, excerpt: e.target.value })
                  }
                  placeholder="Short summary shown in the post list"
                  className={styles.formTextarea}
                  rows={4}
                />
              </div>

              {/* Cover Image */}
              <div className={styles.formGroup}>
                <label>Cover Image</label>
                <div className={styles.coverUpload}>
                  {editing.cover_image && (
                    <img
                      src={editing.cover_image}
                      alt="Cover preview"
                      className={styles.coverPreview}
                    />
                  )}
                  <input
                    type="text"
                    value={editing.cover_image || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, cover_image: e.target.value })
                    }
                    placeholder="https://media.paulibaby.com/image.jpg"
                    className={styles.formInput}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCoverUpload}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`${styles.btnSecondary} ${styles.btnFull}`}
                  >
                    Upload Image
                  </button>
                </div>
              </div>

              {/* Category selector (multi-select) */}
              <div className={styles.formGroup}>
                <label>Categories</label>
                <div className={styles.categoryList}>
                  {categoryOptions.length === 0 && (
                    <small>No categories yet — create one below</small>
                  )}
                  {categoryOptions.map((opt) => (
                    <label key={opt.id} className={styles.categoryItem}>
                      <input
                        type="checkbox"
                        checked={editing.category_ids.includes(opt.id)}
                        onChange={() => toggleCategory(opt.id)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <small>Select one or more categories for this post</small>
              </div>

              {/* Inline category creator */}
              <div className={styles.formGroup}>
                <label>Add new category</label>
                <div className={styles.categoryAddRow}>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className={styles.formInput}
                  />
                  <select
                    value={newCategoryParent}
                    onChange={(e) => setNewCategoryParent(e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="">Top-level</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={createCategory}
                    disabled={addingCategory || !newCategoryName.trim()}
                    className={styles.btnSecondary}
                  >
                    {addingCategory ? "…" : "+ Add"}
                  </button>
                </div>
                <small>Nest under an existing category or leave as top-level</small>
              </div>

              {/* Published toggle */}
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={Boolean(editing.published)}
                    onChange={(e) =>
                      setEditing({ ...editing, published: e.target.checked })
                    }
                  />
                  Published
                </label>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                onClick={() => setDrawerOpen(false)}
                className={`${styles.btnPrimary} ${styles.btnFull}`}
              >
                Done
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
