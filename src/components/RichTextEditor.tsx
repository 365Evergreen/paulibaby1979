import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  EditorContent,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import ImageResize from "tiptap-extension-resize-image";

import { Audio } from "./tiptap/AudioExtension";
import { Video } from "./tiptap/VideoExtension";
import { YoutubeEmbed } from "./tiptap/YoutubeExtension";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

type UploadResponse = {
  url?: string;
  error?: string;
  message?: string;
};

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState<
    "image" | "audio" | "video" | null
  >(null);

  const [uploadError, setUploadError] = useState("");

  const editor = useEditor({
    extensions: [
      /*
       * In the installed Tiptap version, StarterKit includes Link and
       * Dropcursor. Disable both here so they are not registered twice.
       *
       * Link is added explicitly below because this editor configures it.
       * Dropcursor is not required explicitly.
       */
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        dropcursor: false,
      }),

      /*
       * ImageResize is itself an image extension.
       * Do not also register @tiptap/extension-image because both use
       * the "image" extension name.
       */
      ImageResize.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "resizable-image",
        },
      }),

      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),

      Placeholder.configure({
        placeholder: "Start writing your post…",
      }),

      Audio,
      Video,
      YoutubeEmbed,
    ],

    content: value ?? "",

    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },

    editorProps: {
      attributes: {
        class: "tiptap-editor",
        spellcheck: "true",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Post body",
      },
    },

    immediatelyRender: false,
  });

  /*
   * Update the editor if PageEditorPage loads a post after Tiptap has
   * already initialised.
   *
   * emitUpdate=false prevents this synchronisation from calling
   * onChange and creating an update loop.
   */
  useEffect(() => {
    if (!editor) {
      return;
    }

    const incomingContent = value ?? "";

    if (editor.getHTML() !== incomingContent) {
      editor.commands.setContent(incomingContent, {
        emitUpdate: false,
      });
    }
  }, [editor, value]);

  async function uploadToR2(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    let data: UploadResponse = {};

    try {
      data = (await response.json()) as UploadResponse;
    } catch {
      // A non-JSON error response is handled below.
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `Upload failed with status ${response.status}.`,
      );
    }

    if (
      typeof data.url !== "string" ||
      data.url.trim().length === 0
    ) {
      throw new Error(
        "The upload API did not return a valid media URL.",
      );
    }

    return data.url.trim();
  }

  async function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file || !editor) {
      input.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a valid image file.");
      input.value = "";
      return;
    }

    try {
      setUploading("image");
      setUploadError("");

      const url = await uploadToR2(file);

      editor
        .chain()
        .focus()
        .setImage({
          src: url,
          alt: file.name,
          title: file.name,
        })
        .run();
    } catch (error) {
      setUploadError(getErrorMessage(error, "Image upload failed."));
    } finally {
      setUploading(null);
      input.value = "";
    }
  }

  async function handleAudioUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file || !editor) {
      input.value = "";
      return;
    }

    if (!file.type.startsWith("audio/")) {
      setUploadError("Please choose a valid audio file.");
      input.value = "";
      return;
    }

    try {
      setUploading("audio");
      setUploadError("");

      const url = await uploadToR2(file);

     ( editor
        .chain()
        .focus() as any)
        .setAudio(url)
        .run();
    } catch (error) {
      setUploadError(getErrorMessage(error, "Audio upload failed."));
    } finally {
      setUploading(null);
      input.value = "";
    }
  }

  async function handleVideoUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file || !editor) {
      input.value = "";
      return;
    }

    if (!file.type.startsWith("video/")) {
      setUploadError("Please choose a valid video file.");
      input.value = "";
      return;
    }

    try {
      setUploading("video");
      setUploadError("");

      const url = await uploadToR2(file);

      (editor
        .chain()
        .focus() as any)
        .setVideo(url)
        .run();
    } catch (error) {
      setUploadError(getErrorMessage(error, "Video upload failed."));
    } finally {
      setUploading(null);
      input.value = "";
    }
  }

  function setLink() {
    if (!editor) {
      return;
    }

    const previousUrl =
      String(editor.getAttributes("link").href ?? "");

    const enteredUrl = window.prompt(
      "Enter URL:",
      previousUrl,
    );

    if (enteredUrl === null) {
      return;
    }

    const url = enteredUrl.trim();

    if (!url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .unsetLink()
        .run();

      return;
    }

    if (!isAllowedLink(url)) {
      setUploadError(
        "Enter an http, https, mailto or relative URL.",
      );
      return;
    }

    setUploadError("");

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  function addImage() {
    imageInputRef.current?.click();
  }

  function addAudio() {
    audioInputRef.current?.click();
  }

  function addVideo() {
    videoInputRef.current?.click();
  }

  function addYoutube() {
    if (!editor) {
      return;
    }

    const input = window.prompt(
      "Enter a YouTube URL or video ID:",
    );

    const value = input?.trim();

    if (!value) {
      return;
    }

    (editor
      .chain()
      .focus() as any)
      .setYoutubeVideo(value)
      .run();
  }

  if (!editor) {
    return (
      <div
        className="tiptap-loading"
        aria-live="polite"
      >
        Loading editor…
      </div>
    );
  }

  const controlsDisabled = uploading !== null;

  return (
    <div className="tiptap-wrapper">
      <div
        className="tiptap-toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
          className={buttonClass(editor.isActive("bold"))}
          aria-pressed={editor.isActive("bold")}
          title="Bold"
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
          className={buttonClass(editor.isActive("italic"))}
          aria-pressed={editor.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleStrike().run()
          }
          className={buttonClass(editor.isActive("strike"))}
          aria-pressed={editor.isActive("strike")}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <span
          className="tiptap-divider"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 1 })
              .run()
          }
          className={buttonClass(
            editor.isActive("heading", { level: 1 }),
          )}
          aria-pressed={editor.isActive("heading", {
            level: 1,
          })}
          title="Heading 1"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 2 })
              .run()
          }
          className={buttonClass(
            editor.isActive("heading", { level: 2 }),
          )}
          aria-pressed={editor.isActive("heading", {
            level: 2,
          })}
          title="Heading 2"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 3 })
              .run()
          }
          className={buttonClass(
            editor.isActive("heading", { level: 3 }),
          )}
          aria-pressed={editor.isActive("heading", {
            level: 3,
          })}
          title="Heading 3"
        >
          H3
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().setParagraph().run()
          }
          className={buttonClass(editor.isActive("paragraph"))}
          aria-pressed={editor.isActive("paragraph")}
          title="Paragraph"
        >
          ¶
        </button>

        <span
          className="tiptap-divider"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          className={buttonClass(editor.isActive("bulletList"))}
          aria-pressed={editor.isActive("bulletList")}
          title="Bullet list"
        >
          • List
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          className={buttonClass(editor.isActive("orderedList"))}
          aria-pressed={editor.isActive("orderedList")}
          title="Numbered list"
        >
          1. List
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          className={buttonClass(editor.isActive("blockquote"))}
          aria-pressed={editor.isActive("blockquote")}
          title="Quote"
        >
          ❝
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleCode().run()
          }
          className={buttonClass(editor.isActive("code"))}
          aria-pressed={editor.isActive("code")}
          title="Inline code"
        >
          {"</>"}
        </button>

        <span
          className="tiptap-divider"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={setLink}
          className={buttonClass(editor.isActive("link"))}
          aria-pressed={editor.isActive("link")}
          title="Add or edit link"
        >
          🔗
        </button>

        <button
          type="button"
          onClick={addImage}
          className="tiptap-btn"
          title="Insert image"
          disabled={controlsDisabled}
        >
          {uploading === "image" ? "…" : "🖼️"}
        </button>

        <button
          type="button"
          onClick={addAudio}
          className="tiptap-btn"
          title="Insert audio"
          disabled={controlsDisabled}
        >
          {uploading === "audio" ? "…" : "🎵"}
        </button>

        <button
          type="button"
          onClick={addVideo}
          className="tiptap-btn"
          title="Insert video"
          disabled={controlsDisabled}
        >
          {uploading === "video" ? "…" : "🎬"}
        </button>

        <button
          type="button"
          onClick={addYoutube}
          className="tiptap-btn"
          title="Embed YouTube video"
          disabled={controlsDisabled}
        >
          ▶
        </button>

        <span
          className="tiptap-divider"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().undo().run()
          }
          className="tiptap-btn"
          title="Undo"
          disabled={!editor.can().chain().focus().undo().run()}
        >
          ↩
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().redo().run()
          }
          className="tiptap-btn"
          title="Redo"
          disabled={!editor.can().chain().focus().redo().run()}
        >
          ↪
        </button>
      </div>

      {uploadError && (
        <div
          className="tiptap-error"
          role="alert"
        >
          {uploadError}
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        onChange={(event) => void handleImageUpload(event)}
        accept="image/*"
        hidden
      />

      <input
        ref={audioInputRef}
        type="file"
        onChange={(event) => void handleAudioUpload(event)}
        accept="audio/*"
        hidden
      />

      <input
        ref={videoInputRef}
        type="file"
        onChange={(event) => void handleVideoUpload(event)}
        accept="video/*"
        hidden
      />

      <EditorContent editor={editor} />
    </div>
  );
}

function buttonClass(active: boolean): string {
  return active
    ? "tiptap-btn active"
    : "tiptap-btn";
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

function isAllowedLink(value: string): boolean {
  return (
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("mailto:") ||
    value.startsWith("/") ||
    value.startsWith("#")
  );
}