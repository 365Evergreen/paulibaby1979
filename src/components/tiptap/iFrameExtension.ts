import { Node, mergeAttributes } from '@tiptap/core'

export interface IframeOptions {
  allowFullscreen: boolean,
  HTMLAttributes: Record<string, any>,
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

  atom: true, // Prevents users from typing inside the iframe HTML structure

  draggable: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: {
        class: 'tiptap-iframe',
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
      return ['div', { class: 'iframe-missing' }]
    }

    // Merges global options, node-level attributes, and the strict required properties
    return [
      'div',
      { class: 'iframe-wrapper' },
      [
        'iframe',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          src,
          width,
          height,
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

          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})
