import { Node } from "@tiptap/core";

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export const YoutubeEmbed = Node.create({
  name: "youtube",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      videoId: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-youtube"),
        renderHTML: (attrs: Record<string, any>) => {
          if (!attrs.videoId) return {};
          return { "data-youtube": attrs.videoId };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-youtube]" }];
  },

  renderHTML({ node }: { node: any }) {
    const videoId = node.attrs.videoId;
    if (!videoId) return ["div", {}];

    return [
      "div",
      { "data-youtube": videoId, class: "youtube-embed" },
      [
        "iframe",
        {
          src: `https://www.youtube.com/embed/${videoId}`,
          width: "100%",
          height: "400",
          frameborder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
        },
      ],
    ];
  },

  addCommands() {
    return {
      setYoutubeVideo:
        (input: string) =>
        ({ commands }: { commands: any }) => {
          const videoId = extractYouTubeId(input);
          if (!videoId) return false;
          return commands.insertContent({
            type: "youtube",
            attrs: { videoId },
          });
        },
    } as any;
  },
});
