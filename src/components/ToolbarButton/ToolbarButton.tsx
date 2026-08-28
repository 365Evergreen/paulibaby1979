import type { ReactNode } from "react";

interface ToolbarButtonProps {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export default function ToolbarButton({
  title,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`
        toolbar-btn
        ${active ? "toolbar-btn-active" : ""}
      `}
    >
      {children}
    </button>
  );
}