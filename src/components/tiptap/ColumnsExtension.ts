import { Node } from '@tiptap/core'

// 1. Individual Column Node (With Style Support)
export const Column = Node.create({
  name: 'column',
  group: 'block',
  content: 'block+', 
  defining: true,

  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          if (!attributes.style) return {}
          return { style: attributes.style }
        },
      },
      // Optional: Add specific attributes if you prefer parsing raw options rather than inline string styles
      borderColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-color'),
        renderHTML: attributes => attributes.borderColor ? { 'data-border-color': attributes.borderColor } : {},
      },
      backgroundColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-background-color'),
        renderHTML: attributes => attributes.backgroundColor ? { 'data-background-color': attributes.backgroundColor } : {},
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'column', class: 'tiptap-column', ...HTMLAttributes }, 0]
  },
})

// 2. Parent Columns Wrapper Node
export const ColumnsLayout = Node.create({
  name: 'columnsLayout',
  group: 'block',
  content: 'column+', 
  defining: true,
  // Ensure that hitting enter or formatting text behaves naturally inside layout containers
  allowGapCursor: true,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: element => element.getAttribute('data-columns'),
        renderHTML: attributes => ({ 'data-columns': attributes.columns }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="columns-layout"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 
        'data-type': 'columns-layout', 
        class: `tiptap-columns cols-${HTMLAttributes.columns}`, 
        ...HTMLAttributes 
      },
      0,
    ]
  },

  addCommands() {
    return {
      insertColumns: (count: number = 2) => ({ dispatch, commands }) => {
        if (!dispatch) return true

        const columns = Array.from({ length: count }, () => 
          this.editor.schema.nodes.column.create(
            null, 
            [this.editor.schema.nodes.paragraph.create()]
          )
        )

        const columnsLayoutNode = this.editor.schema.nodes.columnsLayout.create(
          { columns: count }, 
          columns
        )
        
        return commands.insertContent(columnsLayoutNode.toJSON())
      },
      // Command helper to update the selected column's visual design parameters
      updateColumnStyle: (styles: { backgroundColor?: string, borderColor?: string, borderStyle?: string, padding?: string }) => ({ commands }) => {
        const styleString = Object.entries(styles)
          .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
          .join(' ')
        
        return commands.updateAttributes('column', { 
          style: styleString,
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor
        })
      }
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columnsLayout: {
      insertColumns: (count: number) => ReturnType
      updateColumnStyle: (styles: { backgroundColor?: string, borderColor?: string, borderStyle?: string, padding?: string }) => ReturnType
    }
  }
}
