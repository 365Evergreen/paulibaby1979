import { Node } from "@tiptap/core";

export interface AudioOptions {
  HTMLAttributes: Record<string, any>;
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
        (_src: string) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: "audio",
            attrs: { src: _src },
          });
        },
    } as any;
  },
});
