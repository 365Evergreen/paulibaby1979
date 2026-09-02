import { CommandProps, Node } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columnsLayout: {
      insertColumns: (count: number) => ReturnType
      addColumn: () => ReturnType
      removeColumn: () => ReturnType
    }
  }
}

// 1. Individual Column Node
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
        renderHTML: attributes => attributes.style ? { style: attributes.style } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    // Provide a solid baseline fallback style directly via inline HTML attributes
    const defaultStyles = 'border: 2px dashed #cbd5e1; padding: 1.25rem; border-radius: 0.375rem; background-color: #f8fafc; min-height: 80px; width: 100%; box-sizing: border-box;'
    const userStyles = HTMLAttributes.style || ''

    return [
      'div',
      {
        ...HTMLAttributes,
        'data-type': 'column',
        class: 'tiptap-column',
        style: `${defaultStyles} ${userStyles}`.trim()
      },
      0
    ]
  },
})

// 2. Parent Columns Wrapper Node
export const ColumnsLayout = Node.create({
  name: 'columnsLayout',
  group: 'block',
  content: 'column+',
  defining: true,
  allowGapCursor: true,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: element => {
          const val = element.getAttribute('data-columns')
          return val ? parseInt(val, 10) : 2
        },
        renderHTML: attributes => ({ 'data-columns': attributes.columns }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="columns-layout"]' }]
  },

  renderHTML({ node }) {
    const colCount = node.attrs.columns || 2
    // Force the CSS grid inline to guarantee side-by-side execution
    const inlineGrid = `display: grid !important; grid-template-columns: repeat(${colCount}, minmax(0, 1fr)) !important; gap: 1.5rem; margin: 1.5rem 0; width: 100%; box-sizing: border-box;`

    return [
      'div',
      {
        'data-type': 'columns-layout',
        'data-columns': colCount,
        class: `tiptap-columns cols-${colCount}`,
        style: inlineGrid
      },
      0,
    ]
  },

  addCommands() {
    return {
      insertColumns: (count: number = 2) => ({ dispatch, commands }: CommandProps) => {
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

      // ✅ Removed 'commands' to fix ts(6133)
      addColumn: () => ({ state, dispatch }: CommandProps) => {
        const { selection } = state
        let layoutPos = -1
        let layoutNode: any = null

        state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (node.type.name === 'columnsLayout') {
            layoutPos = pos
            layoutNode = node
            return false
          }
        })

        if (layoutPos === -1 || !layoutNode || !dispatch) return false

        const newCount = layoutNode.attrs.columns + 1
        const newColumn = this.editor.schema.nodes.column.create(
          null,
          [this.editor.schema.nodes.paragraph.create()]
        )

        const updatedContent: any[] = []
        layoutNode.forEach((child: any) => updatedContent.push(child))
        updatedContent.push(newColumn)

        const updatedLayout = this.editor.schema.nodes.columnsLayout.create(
          { columns: newCount },
          updatedContent
        )

        const tr = state.tr.replaceWith(layoutPos, layoutPos + layoutNode.nodeSize, updatedLayout)
        dispatch(tr)
        return true
      },

      // ✅ Removed 'commands' to fix ts(6133)
      removeColumn: () => ({ state, dispatch }: CommandProps) => {
        const { selection } = state
        let layoutPos = -1
        let layoutNode: any = null
        let columnPos = -1

        state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (node.type.name === 'columnsLayout') {
            layoutPos = pos
            layoutNode = node
          }
          if (node.type.name === 'column' && selection.from >= pos && selection.from <= pos + node.nodeSize) {
            columnPos = pos
          }
        })

        if (layoutPos === -1 || !layoutNode || columnPos === -1 || !dispatch) return false

        if (layoutNode.attrs.columns <= 1) {
          const tr = state.tr.delete(layoutPos, layoutPos + layoutNode.nodeSize)
          dispatch(tr)
          return true
        }

        const newCount = layoutNode.attrs.columns - 1
        const updatedContent: any[] = []

        layoutNode.forEach((child: any, offset: number) => {
          const actualChildPos = layoutPos + 1 + offset
          if (actualChildPos !== columnPos) {
            updatedContent.push(child)
          }
        })

        const updatedLayout = this.editor.schema.nodes.columnsLayout.create(
          { columns: newCount },
          updatedContent
        )

        const tr = state.tr.replaceWith(layoutPos, layoutPos + layoutNode.nodeSize, updatedLayout)
        dispatch(tr)
        return true
      }
    }

  }
})