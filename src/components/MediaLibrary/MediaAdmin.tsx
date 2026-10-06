import { useState } from "react";
import MultiFileUpload from "./MultiFileUpload";
import MediaLibrary from "./MediaLibrary";

export default function MediaAdmin() {
  const [tab, setTab] = useState<"upload" | "library">("upload");

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid #e2e8f0" }}>
        <button
          onClick={() => setTab("upload")}
          style={{
            padding: "0.6rem 1.5rem",
            border: "none",
            background: tab === "upload" ? "#6366f1" : "transparent",
            color: tab === "upload" ? "white" : "#475569",
            fontWeight: 600,
            cursor: "pointer",
            borderRadius: "8px 8px 0 0",
            fontSize: "0.9rem",
          }}
        >
          Upload
        </button>
        <button
          onClick={() => setTab("library")}
          style={{
            padding: "0.6rem 1.5rem",
            border: "none",
            background: tab === "library" ? "#6366f1" : "transparent",
            color: tab === "library" ? "white" : "#475569",
            fontWeight: 600,
            cursor: "pointer",
            borderRadius: "8px 8px 0 0",
            fontSize: "0.9rem",
          }}
        >
          Library
        </button>
      </div>

      {tab === "upload" ? <MultiFileUpload /> : <MediaLibrary />}
    </div>
  );
}
