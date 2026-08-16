import { Node } from "@tiptap/core";

export interface VideoOptions {
  HTMLAttributes: Record<string, any>;
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
        (_src: string) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: "video",
            attrs: { src: _src },
          });
        },
    } as any;
  },
});
