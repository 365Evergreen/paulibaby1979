import { Node } from '@tiptap/core'
import styles from './Columns.module.css'

export const Column = Node.create({
  name: 'column',

  content: 'block+',

  defining: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      width: {
        default: '100%',
        parseHTML: element => element.style.width,
        renderHTML: attributes => {
          if (!attributes.width) return {}
          return { style: `width: ${attributes.width}` }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="column"]`,
      },
    ]
  },

  renderHTML() {
    return ['div', { 'data-type': 'column', class: styles.column }, 0]
  },
})
