import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Placeholder.configure({
        placeholder: "Start writing your post…",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        spellcheck: "true",
      },
    },
  });

  if (!editor) {
    return <div className="tiptap-loading">Loading editor…</div>;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } catch {
      // ignore
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isHeadingActive = (level: number) =>
    editor.isActive("heading", { level });

  return (
    <div className="tiptap-wrapper">
      <div className="tiptap-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`tiptap-btn ${editor.isActive("bold") ? "active" : ""}`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`tiptap-btn ${editor.isActive("italic") ? "active" : ""}`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`tiptap-btn ${editor.isActive("strike") ? "active" : ""}`}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <span className="tiptap-divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`tiptap-btn ${isHeadingActive(1) ? "active" : ""}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`tiptap-btn ${isHeadingActive(2) ? "active" : ""}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`tiptap-btn ${isHeadingActive(3) ? "active" : ""}`}
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`tiptap-btn ${editor.isActive("paragraph") ? "active" : ""}`}
          title="Paragraph"
        >
          ¶
        </button>

        <span className="tiptap-divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`tiptap-btn ${editor.isActive("bulletList") ? "active" : ""}`}
          title="Bullet list"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`tiptap-btn ${editor.isActive("orderedList") ? "active" : ""}`}
          title="Numbered list"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`tiptap-btn ${editor.isActive("blockquote") ? "active" : ""}`}
          title="Quote"
        >
          ❝
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`tiptap-btn ${editor.isActive("code") ? "active" : ""}`}
          title="Inline code"
        >
          {"</>"}
        </button>

        <span className="tiptap-divider" />

        <button
          type="button"
          onClick={setLink}
          className={`tiptap-btn ${editor.isActive("link") ? "active" : ""}`}
          title="Add link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={addImage}
          className="tiptap-btn"
          title="Insert image (uploads to R2)"
        >
          🖼️
        </button>

        <span className="tiptap-divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="tiptap-btn"
          title="Undo"
        >
          ↩
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="tiptap-btn"
          title="Redo"
        >
          ↪
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: "none" }}
      />

      <EditorContent editor={editor} />
    </div>
  );
}
