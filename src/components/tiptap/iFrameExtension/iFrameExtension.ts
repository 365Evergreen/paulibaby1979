import { Node, mergeAttributes } from '@tiptap/core'
import styles from './iFrameExtension.module.css'

export interface IframeOptions {
  allowFullscreen: boolean,
  HTMLAttributes: Record<string, any>,
}

// Helper function to extract a clean URL if an entire embed snippet is pasted
function extractIframeUrl(input: string): string {
  if (!input) return ''
  
  // If they pasted a full <iframe src="..."> code block, extract just the src value
  const match = input.match(/src=["']([^"']+)["']/)
  if (match && match[1]) {
    return match[1]
  }
  
  // Otherwise, assume they passed a normal URL string
  return input.trim()
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      /**
       * Insert an iframe
       */
      setIframe: (options: { src: string }) => ReturnType,
    }
  }
}

export const Iframe = Node.create<IframeOptions>({
  name: 'iframe',

  group: 'block',

  atom: true, 
  selectable: true,

  draggable: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: {
        frameborder: '0',
      },
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: '400',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, width, height } = node.attrs

    if (!src) {
      return [
        'div', 
        { class: styles.iframePlaceholder }, 
        ['span', {}, 'Empty Iframe Placeholder']
      ]
    }

    return [
      'div',
      { class: styles.iframeWrapper },
      [
        'iframe',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          src,
          width,
          height,
          class: styles.iframeEmbed,
          allowfullscreen: this.options.allowFullscreen ? 'true' : undefined,
        }),
      ],
    ]
  },

  addCommands() {
    return {
      setIframe: 
        (options) => 
        ({ commands }) => {
          if (!options.src) return false

          // Intercept the input and sanitize it before inserting it into the document node
          const cleanSrc = extractIframeUrl(options.src)

          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              src: cleanSrc
            },
          })
        },
    }
  },
})
