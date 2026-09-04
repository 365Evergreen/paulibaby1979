import { Node } from "@tiptap/core";

/**
 * Custom TipTap Audio extension.
 * Renders an <audio> element with controls.
 * Stored as <audio src="..." controls></audio> in HTML.
 */

export interface AudioOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audio: {
      /** Insert an audio element */
      setAudio: (src: string) => ReturnType;
    };
  }
}

export const Audio = Node.create<AudioOptions>({
  name: "audio",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("src"),
        renderHTML: (attrs: Record<string, any>) => {
          if (!attrs.src) return {};
          return { src: attrs.src };
        },
      },
      controls: {
        default: true,
        renderHTML: () => ({ controls: "controls" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "audio" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["audio", { ...HTMLAttributes, controls: "controls" }];
  },

  addCommands() {
    return {
      setAudio:
        (src: string) =>
          ({ commands }) =>
            commands.insertContent({
              type: "audio",
              attrs: { src },
            }),
    };
  },
});
