import { Node } from '@tiptap/core'
import styles from './Callout.module.css'

export type CalloutType = 'info' | 'warning' | 'success' | 'error'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /**
       * Insert a callout notice container
       */
      insertCallout: (attributes?: { type: CalloutType }) => ReturnType
    }
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  // content: 'block+' lets users nest paragraphs, headings, or lists inside the callout
  content: 'block+', 
  defining: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-callout-type') || 'info',
        renderHTML: attributes => ({ 'data-callout-type': attributes.type }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ]
  },

  renderHTML({ node }) {
    const type: CalloutType = node.attrs.type || 'info'
    
    // Dynamically fetch the matching class layout variant from our CSS Module
    let typeClass = styles.info
    if (type === 'warning') typeClass = styles.warning
    if (type === 'success') typeClass = styles.success
    if (type === 'error') typeClass = styles.error

    return [
      'div', 
      { 
        'data-type': 'callout', 
        class: `${styles.calloutContainer} ${typeClass}` 
      }, 
      0
    ]
  },

  addCommands() {
    return {
      insertCallout:
        (attributes = { type: 'info' }) =>
        ({ editor }) => {
          const defaultParagraph = editor.schema.nodes.paragraph.createAndFill()
          if (!defaultParagraph) return false

          const calloutNode = this.type.create(attributes, defaultParagraph)
          return editor.chain().insertContent(calloutNode.toJSON()).run()
        },
    }
  },
})
