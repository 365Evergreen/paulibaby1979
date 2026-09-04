import { Node } from '@tiptap/core'
import styles from './Columns.module.css'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      /**
       * Insert a column layout wrapper
       */
      insertColumns: (count: number) => ReturnType,
    }
  }
}

export const Columns = Node.create({
  name: 'columns',

  group: 'block',

  content: 'column+',

  selectable: true,

  draggable: false,

  addAttributes() {
    return {
      count: {
        default: 2,
        parseHTML: element => element.getAttribute('data-count'),
        renderHTML: attributes => ({ 'data-count': attributes.count }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="columns"]`,
      },
    ]
  },

  renderHTML({ node }) {
    const count = node.attrs.count || 2
    const layoutClass = count === 3 ? styles.layoutThreeCols : styles.layoutTwoCols

    return ['div', { 'data-type': 'columns', class: `${styles.columnsContainer} ${layoutClass}` }, 0]
  },

  addCommands() {
    return {
      insertColumns: 
        (count = 2) => 
        ({ editor }) => {
          // Programmatically create the nested tree structures
          const columnNodes = Array.from({ length: count }, () => {
            const defaultParagraph = editor.schema.nodes.paragraph.createAndFill()
            return editor.schema.nodes.column.createAndFill({}, defaultParagraph)
          }).filter(Boolean)

          const columnsWrapper = this.type.create({ count }, columnNodes as any)
          
          editor.chain().insertContent(columnsWrapper.toJSON()).run()
          return true
        },
    }
  },
})
