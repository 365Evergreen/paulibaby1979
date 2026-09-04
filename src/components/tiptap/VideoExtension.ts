import { Node } from "@tiptap/core";

export interface VideoOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      /** Insert a video element */
      setVideo: (src: string) => ReturnType;
    };
  }
}

export const Video = Node.create<VideoOptions>({
  name: "video",
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
    return [{ tag: "video" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", { ...HTMLAttributes, controls: "controls" }];
  },

  addCommands() {
    return {
      setVideo:
        (src: string) =>
          ({ commands }) =>
            commands.insertContent({
              type: "video",
              attrs: { src },
            }),
    };
  },
});
